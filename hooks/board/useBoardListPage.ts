import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { GridApi, GridReadyEvent, IDatasource, IGetRowsParams } from 'ag-grid-community';
import { requireLoginUsrNo } from '@/utils/auth';
import useQuillImageUpload from '@/hooks/useQuillImageUpload';
import useBodyScrollLock from '@/hooks/common/useBodyScrollLock';
import { extractApiErrorMessage } from '@/utils/api/error';
import { confirmAction, notifyError, notifySuccess } from '@/utils/ui/feedback';
import type { BoardData, BoardEditForm, BoardListResponse, CommonCode } from '@/components/board/types';
import {
  deleteBoardApi,
  fetchBoardDetailApi,
  fetchBoardDetailDivListApi,
  fetchBoardListApi,
  saveBoardApi,
} from '@/services/boardApi';

/**
 * 게시판 관리 페이지 로직을 관리합니다.
 * @returns 게시판 관리 페이지 상태/이벤트입니다.
 */
const useBoardListPage = () => {
  const [detailDivList, setDetailDivList] = useState<CommonCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [selectedBoard, setSelectedBoard] = useState<BoardData | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [editForm, setEditForm] = useState<BoardEditForm>({
    boardNo: null,
    boardDetailDivCd: '',
    title: '',
    content: '',
  });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useState<Record<string, any>>({});
  const gridApiRef = useRef<GridReadyEvent<BoardData>['api'] | null>(null);

  // 팝업 열림 상태를 기준으로 body 스크롤을 제어합니다.
  useBodyScrollLock(isDetailModalOpen || isEditModalOpen);

  // 게시글 본문 편집 에디터 옵션을 정의합니다.
  const quillToolbarOptions = useMemo(
    () => ([
      [{ header: [1, 2, 3, false] }],
      [{ color: [] }, { background: [] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ align: [] }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['code-block'],
      ['image'],
      ['link'],
      ['clean'],
    ]),
    []
  );
  // 게시글 본문 편집에서 사용할 포맷 목록을 정의합니다.
  const quillFormatsOptions = useMemo(
    () => ([
      'header',
      'color',
      'background',
      'bold',
      'italic',
      'underline',
      'strike',
      'align',
      'list',
      'bullet',
      'code-block',
      'image',
      'link',
    ]),
    []
  );

  // 에디터 이미지 업로드 및 붙여넣기 처리를 공통 훅으로 연결합니다.
  const {
    quillRef,
    quillModules,
    quillFormats,
    handleEditorChange,
  } = useQuillImageUpload({
    toolbarOptions: quillToolbarOptions,
    formats: quillFormatsOptions,
    onChange: (value) => setEditForm((prev) => ({ ...prev, content: value })),
  });

  // 게시판 상세 구분 공통코드를 조회합니다.
  const fetchBoardDetailDivList = useCallback(async () => {
    try {
      const nextDetailDivList = await fetchBoardDetailDivListApi();
      setDetailDivList(nextDetailDivList);
    } catch (error) {
      console.error('게시판 상세 구분 코드를 불러오는 데 실패했습니다.', error);
      notifyError('게시판 상세 구분 코드를 불러오는 데 실패했습니다.');
    }
  }, []);

  // 게시글 상세 정보를 조회합니다.
  const fetchBoardDetail = useCallback(async (boardNo: number) => {
    setDetailLoading(true);
    setDetailError(null);
    try {
      const boardDetail = await fetchBoardDetailApi(boardNo);
      setSelectedBoard(boardDetail);
    } catch (error) {
      console.error('게시글 상세를 불러오는 데 실패했습니다.', error);
      setDetailError('게시글 상세를 불러오는 데 실패했습니다.');
    } finally {
      setDetailLoading(false);
    }
  }, []);

  // 그리드 데이터소스를 안전하게 설정합니다.
  const applyDatasource = useCallback((gridApi: GridApi<BoardData>, datasource: IDatasource) => {
    if (typeof (gridApi as any).setGridOption === 'function') {
      (gridApi as any).setGridOption('datasource', datasource);
      return;
    }
    if (typeof (gridApi as any).setDatasource === 'function') {
      (gridApi as any).setDatasource(datasource);
    }
  }, []);

  // 게시판 목록 그리드 데이터소스를 생성합니다.
  const createDataSource = useCallback((): IDatasource => ({
    getRows: async (params: IGetRowsParams) => {
      const pageSize = 20;
      const startRow = params.startRow ?? 0;
      const page = Math.floor(startRow / pageSize) + 1;

      setLoading(true);
      try {
        const data = await fetchBoardListApi({
          ...searchParams,
          page,
        }) as BoardListResponse;
        params.successCallback(data.list || [], data.totalCount || 0);
      } catch (error) {
        console.error('게시판 목록을 불러오는 데 실패했습니다.', error);
        params.failCallback();
      } finally {
        setLoading(false);
      }
    },
  }), [searchParams]);

  // 현재 페이지/스크롤 위치를 보존한 채 목록을 새로 조회합니다.
  const refreshGridPreserveState = useCallback(() => {
    const gridApi = gridApiRef.current;
    if (!gridApi) {
      return;
    }
    const currentPage = typeof gridApi.paginationGetCurrentPage === 'function' ? gridApi.paginationGetCurrentPage() : 0;
    const firstRow = typeof gridApi.getFirstDisplayedRowIndex === 'function'
      ? gridApi.getFirstDisplayedRowIndex()
      : (typeof gridApi.getFirstDisplayedRow === 'function' ? gridApi.getFirstDisplayedRow() : 0);
    const windowScrollTop = typeof window !== 'undefined' ? window.scrollY : 0;

    // 그리드 모델 갱신 이후 기존 페이지/스크롤 위치를 복원합니다.
    const restorePosition = () => {
      if (typeof gridApi.paginationGetTotalPages === 'function' && typeof gridApi.paginationGoToPage === 'function') {
        const totalPages = gridApi.paginationGetTotalPages();
        const targetPage = Math.min(currentPage, Math.max(totalPages - 1, 0));
        gridApi.paginationGoToPage(targetPage);
      }
      if (typeof gridApi.ensureIndexVisible === 'function') {
        gridApi.ensureIndexVisible(firstRow, 'top');
      }
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: windowScrollTop });
      }
      gridApi.removeEventListener('modelUpdated', restorePosition);
    };

    gridApi.addEventListener('modelUpdated', restorePosition);
    if (typeof (gridApi as any).refreshInfiniteCache === 'function') {
      (gridApi as any).refreshInfiniteCache();
      return;
    }
    applyDatasource(gridApi, createDataSource());
  }, [applyDatasource, createDataSource]);

  // 게시글 상세 팝업을 닫고 관련 상태를 초기화합니다.
  const handleCloseDetail = useCallback(() => {
    setIsDetailModalOpen(false);
    setSelectedBoard(null);
    setDetailError(null);
    setIsEditModalOpen(false);
    setEditError(null);
  }, []);

  // 게시글 상세 팝업을 엽니다.
  const handleOpenDetail = useCallback((boardNo: number) => {
    setIsDetailModalOpen(true);
    setSelectedBoard(null);
    fetchBoardDetail(boardNo);
  }, [fetchBoardDetail]);

  // 게시글 수정 팝업을 열고 기존 데이터를 폼에 채웁니다.
  const handleOpenEdit = useCallback(() => {
    if (!selectedBoard) {
      return;
    }
    setIsCreateMode(false);
    setEditForm({
      boardNo: selectedBoard.boardNo,
      boardDetailDivCd: selectedBoard.boardDetailDivCd || '',
      title: selectedBoard.title || '',
      content: selectedBoard.content || '',
    });
    setEditError(null);
    setIsEditModalOpen(true);
  }, [selectedBoard]);

  // 게시글 등록 팝업을 열고 폼을 초기화합니다.
  const handleOpenCreate = useCallback(() => {
    setIsCreateMode(true);
    setEditForm({
      boardNo: null,
      boardDetailDivCd: '',
      title: '',
      content: '',
    });
    setEditError(null);
    setIsEditModalOpen(true);
  }, []);

  // 게시글 수정 팝업을 닫습니다.
  const handleCloseEdit = useCallback(() => {
    setIsEditModalOpen(false);
    setEditError(null);
  }, []);

  // 게시글 수정 입력값을 변경합니다.
  const handleEditChange = useCallback((event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  // 검색 폼 제출 시 조회 파라미터를 갱신합니다.
  const handleSearch = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const nextParams = Object.fromEntries(formData.entries());
    setSearchParams(nextParams);
  }, []);

  // 검색 조건을 초기화하고 전체 목록을 재조회합니다.
  const handleSearchReset = useCallback(() => {
    setSearchParams({});
  }, []);

  // 게시글 등록/수정 저장을 처리합니다.
  const handleSubmitEdit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isCreateMode && !editForm.boardNo) {
      return;
    }
    const usrNo = requireLoginUsrNo((message) => setEditError(message));
    if (!usrNo) {
      return;
    }
    setEditSaving(true);
    setEditError(null);
    try {
      await saveBoardApi(editForm, isCreateMode, usrNo);
      if (isCreateMode) {
        refreshGridPreserveState();
        setIsEditModalOpen(false);
        notifySuccess('게시글이 등록되었습니다.');
      } else if (editForm.boardNo) {
        await fetchBoardDetail(editForm.boardNo);
        refreshGridPreserveState();
        setIsEditModalOpen(false);
        notifySuccess('게시글이 수정되었습니다.');
      }
    } catch (error) {
      const fallbackMessage = isCreateMode ? '게시글 등록을 실패했습니다.' : '게시글 수정을 실패했습니다.';
      const message = extractApiErrorMessage(error, fallbackMessage);
      console.error(message, error);
      setEditError(message);
    } finally {
      setEditSaving(false);
    }
  }, [editForm, fetchBoardDetail, isCreateMode, refreshGridPreserveState]);

  // 게시글 삭제를 처리합니다.
  const handleDeleteBoard = useCallback(async (boardNo?: number | null) => {
    if (!boardNo) {
      return;
    }
    const usrNo = requireLoginUsrNo();
    if (!usrNo) {
      return;
    }
    const isConfirmed = confirmAction('게시글을 삭제하시겠습니까?');
    if (!isConfirmed) {
      return;
    }
    try {
      await deleteBoardApi(boardNo, usrNo);
      if (selectedBoard?.boardNo === boardNo) {
        handleCloseDetail();
      }
      refreshGridPreserveState();
      notifySuccess('게시글이 삭제되었습니다.');
    } catch (error) {
      const message = extractApiErrorMessage(error, '게시글 삭제를 실패했습니다.');
      console.error(message, error);
      notifyError(message);
    }
  }, [handleCloseDetail, refreshGridPreserveState, selectedBoard?.boardNo]);

  // 게시판 목록 그리드를 초기화합니다.
  const handleGridReady = useCallback((event: GridReadyEvent<BoardData>) => {
    gridApiRef.current = event.api;
    applyDatasource(event.api, createDataSource());
  }, [applyDatasource, createDataSource]);

  // 초기 로딩 시 상세 구분 코드를 조회합니다.
  useEffect(() => {
    fetchBoardDetailDivList();
  }, [fetchBoardDetailDivList]);

  // 검색 파라미터 변경 시 그리드를 갱신합니다.
  useEffect(() => {
    if (!gridApiRef.current) {
      return;
    }
    applyDatasource(gridApiRef.current, createDataSource());
  }, [applyDatasource, createDataSource]);

  return {
    detailDivList,
    loading,
    detailLoading,
    detailError,
    selectedBoard,
    isDetailModalOpen,
    isEditModalOpen,
    isCreateMode,
    editForm,
    editSaving,
    editError,
    quillRef,
    quillModules,
    quillFormats,
    handleEditorChange,
    handleSearch,
    handleSearchReset,
    handleGridReady,
    handleOpenDetail,
    handleCloseDetail,
    handleOpenEdit,
    handleOpenCreate,
    handleCloseEdit,
    handleEditChange,
    handleSubmitEdit,
    handleDeleteBoard,
  };
};

export default useBoardListPage;
