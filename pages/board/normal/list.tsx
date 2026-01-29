import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { getCookie } from 'cookies-next';
import api from '@/utils/axios/axios';
import { dateFormatter } from '@/utils/common';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef, GridApi, GridReadyEvent, ICellRendererParams, IDatasource, IGetRowsParams } from 'ag-grid-community';

interface BoardData {
  boardNo: number;
  boardDivNm: string | null;
  boardDetailDivCd: string | null;
  boardDetailDivNm: string | null;
  title: string | null;
  content?: string | null;
  viewYn: string | null;
  readCnt: number | null;
  regDt: string | null;
  udtDt: string | null;
}

interface CommonCode {
  grpCd: string;
  cd: string;
  cdNm: string;
  dispOrd: number;
}

interface BoardListResponse {
  list: BoardData[];
  totalCount: number;
  page: number;
  pageSize: number;
}

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

const BoardList = () => {
  const [detailDivList, setDetailDivList] = useState<CommonCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [selectedBoard, setSelectedBoard] = useState<BoardData | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [editForm, setEditForm] = useState<{ boardNo: number | null; boardDetailDivCd: string; title: string; content: string }>({
    boardNo: null,
    boardDetailDivCd: '',
    title: '',
    content: '',
  });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [searchParams, setSearchParams] = useState<Record<string, any>>({});
  const gridApiRef = useRef<GridReadyEvent<BoardData>['api'] | null>(null);
  // 게시글 본문 편집 에디터 옵션을 정의합니다.
  const quillModules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        [{ color: [] }, { background: [] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['code-block'],
        ['image'],
        ['link'],
        ['clean'],
      ],
    }),
    []
  );
  // 게시글 본문 편집에서 사용할 포맷 목록을 정의합니다.
  const quillFormats = useMemo(
    () => ([
      'header',
      'color',
      'background',
      'bold',
      'italic',
      'underline',
      'strike',
      'list',
      'bullet',
      'code-block',
      'image',
      'link',
    ]),
    []
  );

  // 기본 에디터 설정을 사용합니다.

  // 로그인 사용자 번호를 쿠키에서 조회합니다.
  const resolveLoginUsrNo = useCallback(() => {
    const cookieValue = getCookie('usrNo', { path: '/' });
    if (typeof cookieValue === 'string' && cookieValue.trim() !== '') {
      const parsed = Number(cookieValue);
      return Number.isNaN(parsed) ? null : parsed;
    }
    return null;
  }, []);

  const fetchBoardDetailDivList = useCallback(async () => {
    try {
      const response = await api.get('/api/admin/common/code', {
        params: { grpCd: 'BOARD_DETAIL_DIV' },
      });
      setDetailDivList(response.data || []);
    } catch (e) {
      console.error('게시판 상세 구분 코드를 불러오는 데 실패했습니다.');
      alert('게시판 상세 구분 코드를 불러오는 데 실패했습니다.');
    }
  }, []);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const nextParams = Object.fromEntries(formData.entries());
    setSearchParams(nextParams);
  };

  useEffect(() => {
    fetchBoardDetailDivList();
  }, [fetchBoardDetailDivList]);

  useEffect(() => {
    // 팝업 열림 상태에 따라 바디 스크롤을 제어합니다.
    if (isDetailModalOpen || isEditModalOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
    document.body.style.overflow = '';
  }, [isDetailModalOpen, isEditModalOpen]);

  // 게시글 상세 정보를 조회합니다.
  const fetchBoardDetail = useCallback(async (boardNo: number) => {
    setDetailLoading(true);
    setDetailError(null);
    try {
      const response = await api.get('/api/admin/board/detail', { params: { boardNo } });
      setSelectedBoard(response.data || null);
    } catch (e) {
      console.error('게시글 상세를 불러오는 데 실패했습니다.');
      setDetailError('게시글 상세를 불러오는 데 실패했습니다.');
    } finally {
      setDetailLoading(false);
    }
  }, []);

  // 게시글 상세 팝업을 닫습니다.
  const handleCloseDetail = () => {
    setIsDetailModalOpen(false);
    setSelectedBoard(null);
    setDetailError(null);
    setIsEditModalOpen(false);
    setEditError(null);
  };

  // 게시글 상세 팝업을 엽니다.
  const handleOpenDetail = useCallback((boardNo: number) => {
    setIsDetailModalOpen(true);
    setSelectedBoard(null);
    fetchBoardDetail(boardNo);
  }, [fetchBoardDetail]);

  // 게시글 수정 팝업을 엽니다.
  const handleOpenEdit = () => {
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
  };

  // 게시글 등록 팝업을 엽니다.
  const handleOpenCreate = () => {
    setIsCreateMode(true);
    setEditForm({
      boardNo: null,
      boardDetailDivCd: '',
      title: '',
      content: '',
    });
    setEditError(null);
    setIsEditModalOpen(true);
  };

  // 게시글 수정 팝업을 닫습니다.
  const handleCloseEdit = () => {
    setIsEditModalOpen(false);
    setEditError(null);
  };

  // 게시글 수정 입력값을 변경합니다.
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 게시글 등록/수정 내용을 저장합니다.
  const handleSubmitEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isCreateMode && !editForm.boardNo) {
      return;
    }
    const usrNo = resolveLoginUsrNo();
    if (!usrNo) {
      setEditError('로그인 사용자 정보를 확인할 수 없습니다.');
      return;
    }
    setEditSaving(true);
    setEditError(null);
    try {
      const apiUrl = isCreateMode ? '/api/admin/board/create' : '/api/admin/board/update';
      await api.post(apiUrl, {
        boardNo: editForm.boardNo,
        boardDetailDivCd: editForm.boardDetailDivCd,
        title: editForm.title,
        content: editForm.content,
        regNo: isCreateMode ? usrNo : undefined,
        udtNo: usrNo,
      });
      if (isCreateMode) {
        refreshGridPreserveState();
        setIsEditModalOpen(false);
        alert('게시글이 등록되었습니다.');
      } else if (editForm.boardNo) {
        await fetchBoardDetail(editForm.boardNo);
        refreshGridPreserveState();
        setIsEditModalOpen(false);
        alert('게시글이 수정되었습니다.');
      }
    } catch (e) {
      const message = isCreateMode ? '게시글 등록을 실패했습니다.' : '게시글 수정을 실패했습니다.';
      console.error(message);
      setEditError(message);
    } finally {
      setEditSaving(false);
    }
  };

  // 게시글을 삭제 처리합니다.
  const handleDeleteBoard = async (boardNo?: number | null) => {
    if (!boardNo) {
      return;
    }
    const usrNo = resolveLoginUsrNo();
    if (!usrNo) {
      alert('로그인 사용자 정보를 확인할 수 없습니다.');
      return;
    }
    if (!confirm('게시글을 삭제하시겠습니까?')) {
      return;
    }
    try {
      await api.post('/api/admin/board/delete', {
        boardNo,
        udtNo: usrNo,
      });
      if (selectedBoard?.boardNo === boardNo) {
        handleCloseDetail();
      }
      refreshGridPreserveState();
      alert('게시글이 삭제되었습니다.');
    } catch (e) {
      console.error('게시글 삭제를 실패했습니다.');
      alert('게시글 삭제를 실패했습니다.');
    }
  };

  // 게시글 목록 그리드 컬럼을 정의합니다.
  const columnDefs = useMemo<ColDef<BoardData>[]>(() => [
    { headerName: '번호', field: 'boardNo', width: 90 },
    {
      headerName: '게시판 상세 구분',
      field: 'boardDetailDivNm',
      width: 160,
      valueGetter: (params) => params.data?.boardDetailDivNm || params.data?.boardDetailDivCd,
    },
    {
      headerName: '타이틀',
      field: 'title',
      flex: 1,
      minWidth: 240,
      cellClass: 'text-start',
      cellRenderer: (params: ICellRendererParams<BoardData>) => (
        <button
          type="button"
          className="btn p-0 text-decoration-none fw-bold"
          onClick={() => params.data?.boardNo && handleOpenDetail(params.data.boardNo)}
        >
          {params.data?.title || '제목 없음'}
        </button>
      ),
    },
    {
      headerName: '등록일',
      field: 'regDt',
      width: 160,
      valueFormatter: (params) => dateFormatter({ value: params.value } as any),
    },
    {
      headerName: '수정일',
      field: 'udtDt',
      width: 160,
      valueFormatter: (params) => dateFormatter({ value: params.value } as any),
    },
    {
      headerName: '삭제',
      width: 90,
      cellRenderer: (params: ICellRendererParams<BoardData>) => (
        <button
          type="button"
          className="btn btn-danger btn-sm"
          onClick={() => handleDeleteBoard(params.data?.boardNo)}
        >
          삭제
        </button>
      ),
    },
  ], [handleOpenDetail, handleDeleteBoard]);

  // 그리드 기본 컬럼 속성을 정의합니다.
  const defaultColDef = useMemo<ColDef>(() => ({
    resizable: true,
    sortable: false,
    cellClass: 'text-center',
  }), []);

  // 게시판 목록 그리드 데이터소스를 생성합니다.
  const createDataSource = useCallback((): IDatasource => ({
    getRows: async (params: IGetRowsParams) => {
      const pageSize = 20;
      const startRow = params.startRow ?? 0;
      const page = Math.floor(startRow / pageSize) + 1;

      setLoading(true);
      try {
        const response = await api.get('/api/admin/board/list', {
          params: {
            ...searchParams,
            page,
          },
        });
        const data = (response.data || {}) as BoardListResponse;
        params.successCallback(data.list || [], data.totalCount || 0);
      } catch (e) {
        console.error('게시판 목록을 불러오는 데 실패했습니다.');
        params.failCallback();
      } finally {
        setLoading(false);
      }
    },
  }), [searchParams]);

  // 그리드 데이터소스를 안전하게 설정합니다.
  const applyDatasource = useCallback((api: GridApi<BoardData>, datasource: IDatasource) => {
    if (typeof (api as any).setGridOption === 'function') {
      (api as any).setGridOption('datasource', datasource);
      return;
    }
    if (typeof (api as any).setDatasource === 'function') {
      (api as any).setDatasource(datasource);
    }
  }, []);

  // 그리드 현재 페이지와 스크롤 위치를 유지한 채로 데이터를 다시 조회합니다.
  const refreshGridPreserveState = useCallback(() => {
    const api = gridApiRef.current;
    if (!api) {
      return;
    }
    const currentPage = typeof api.paginationGetCurrentPage === 'function' ? api.paginationGetCurrentPage() : 0;
    const firstRow = typeof api.getFirstDisplayedRowIndex === 'function'
      ? api.getFirstDisplayedRowIndex()
      : (typeof api.getFirstDisplayedRow === 'function' ? api.getFirstDisplayedRow() : 0);
    const windowScrollTop = typeof window !== 'undefined' ? window.scrollY : 0;

    const restorePosition = () => {
      if (typeof api.paginationGetTotalPages === 'function' && typeof api.paginationGoToPage === 'function') {
        const totalPages = api.paginationGetTotalPages();
        const targetPage = Math.min(currentPage, Math.max(totalPages - 1, 0));
        api.paginationGoToPage(targetPage);
      }
      if (typeof api.ensureIndexVisible === 'function') {
        api.ensureIndexVisible(firstRow, 'top');
      }
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: windowScrollTop });
      }
      api.removeEventListener('modelUpdated', restorePosition);
    };

    api.addEventListener('modelUpdated', restorePosition);
    if (typeof (api as any).refreshInfiniteCache === 'function') {
      (api as any).refreshInfiniteCache();
      return;
    }
    applyDatasource(api, createDataSource());
  }, [applyDatasource, createDataSource]);

  // 게시판 목록 그리드를 초기화합니다.
  const handleGridReady = useCallback((event: GridReadyEvent<BoardData>) => {
    gridApiRef.current = event.api;
    applyDatasource(event.api, createDataSource());
  }, [applyDatasource, createDataSource]);

  useEffect(() => {
    if (!gridApiRef.current) {
      return;
    }
    applyDatasource(gridApiRef.current, createDataSource());
  }, [applyDatasource, createDataSource]);

  return (
    <>
      <div className="page-header">
        <h3 className="page-title"> 게시판 관리 </h3>
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><a href="#">게시판</a></li>
            <li className="breadcrumb-item active" aria-current="page">목록</li>
          </ol>
        </nav>
      </div>

      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card">
            <div className="card-body">
              <form ref={formRef} onSubmit={handleSearch} className="forms-sample">
                <div className="row">
                  <div className="col-md-3">
                    <div className="form-group">
                      <label>게시판 상세 구분</label>
                      <select name="boardDetailDivCd" defaultValue="" className="form-select btn-outline-secondary">
                        <option value="">전체</option>
                        {detailDivList.map((code) => (
                          <option key={code.cd} value={code.cd}>{code.cdNm}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="col-md-9">
                    <div className="form-group">
                      <label>타이틀</label>
                      <input
                        type="text"
                        name="title"
                        className="form-control"
                        placeholder="타이틀을 입력하세요"
                      />
                    </div>
                  </div>
                </div>
                <div className="d-flex justify-content-center gap-2">
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? '검색중...' : '검색'}
                  </button>
                  <button type="reset" className="btn btn-dark">
                    초기화
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-12 grid-margin stretch-card">
          <div className="card">
            <div className="card-body">
              <div className="ag-theme-alpine-dark header-center" style={{ width: '100%' }}>
                <AgGridReact<BoardData>
                  columnDefs={columnDefs}
                  defaultColDef={defaultColDef}
                  domLayout="autoHeight"
                  overlayNoRowsTemplate="데이터가 없습니다."
                  rowModelType="infinite"
                  cacheBlockSize={20}
                  pagination
                  paginationPageSize={20}
                  getRowId={(params) => String(params.data?.boardNo ?? '')}
                  onGridReady={handleGridReady}
                />
              </div>
              <div className="d-flex justify-content-end mt-3">
                <button type="button" className="btn btn-primary" onClick={handleOpenCreate}>
                  등록
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isDetailModalOpen && (
        <>
          <div
            className="modal fade show"
            style={{
              display: 'flex',
              position: 'fixed',
              inset: 0,
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1050,
            }}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-dialog modal-lg" style={{ margin: 0, maxWidth: '90vw', width: '100%', maxHeight: '90vh' }}>
              <div className="modal-content" style={{ height: '90vh', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div className="modal-header position-relative">
                  <h2 className="modal-title w-100 text-center">
                    {selectedBoard?.title || '게시글 상세'}
                  </h2>
                  <button type="button" className="btn p-0 position-absolute end-0 me-3" aria-label="닫기" onClick={handleCloseDetail}>
                    <i className="fa fa-window-close" aria-hidden="true"></i>
                  </button>
                </div>
                <div className="modal-body" style={{ overflowY: 'auto', flex: 1 }}>
                  {detailLoading && <div>게시글을 불러오는 중입니다.</div>}
                  {!detailLoading && detailError && <div className="text-danger">{detailError}</div>}
                  {!detailLoading && !detailError && !selectedBoard && <div>조회된 게시글이 없습니다.</div>}
                  {!detailLoading && !detailError && selectedBoard && (
                    <div>
                      <div className="w-100 fw-bold">
                        <div className="row w-100">
                          <div className="col-md-10 text-end">구분</div>
                          <div className="col-md-2 text-start text-primary">{selectedBoard.boardDetailDivNm || selectedBoard.boardDetailDivCd || '-'}</div>
                        </div>
                        <div className="row w-100 text-end">
                          <div className="col-md-10 text-end">등록일</div>
                          <div className="col-md-2 text-start text-primary">{dateFormatter({ value: selectedBoard?.regDt } as any)}</div>
                        </div>
                        <div className="row w-100 text-end">
                          <div className="col-md-10 text-end">수정일</div>
                          <div className="col-md-2 text-start text-primary">{dateFormatter({ value: selectedBoard?.udtDt } as any)}</div>
                        </div>
                      </div>
                      <div className="mb-3">
                        <div className="text-break">
                          {selectedBoard.content ? (
                            // 게시글 내용은 HTML로 렌더링합니다.
                            <div dangerouslySetInnerHTML={{ __html: selectedBoard.content }} />
                          ) : (
                            '내용이 없습니다.'
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleOpenEdit}
                    disabled={!selectedBoard}
                  >
                    수정
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={handleCloseDetail}>
                    닫기
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div
            className="modal-backdrop fade show"
            style={{ position: 'fixed', inset: 0, zIndex: 1040 }}
            onClick={handleCloseDetail}
          ></div>
        </>
      )}

      {isEditModalOpen && (
        <>
          <div
            className="modal fade show"
            style={{
              display: 'flex',
              position: 'fixed',
              inset: 0,
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1060,
            }}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-dialog modal-lg" style={{ margin: 0, maxWidth: '90vw', width: '100%', maxHeight: '90vh' }}>
              <div className="modal-content" style={{ height: '90vh', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div className="modal-header position-relative">
                  <h2 className="modal-title w-100 text-center">{isCreateMode ? '게시글 등록' : '게시글 수정'}</h2>
                  <button type="button" className="btn p-0 position-absolute end-0 me-3" aria-label="닫기" onClick={handleCloseEdit}>
                    <i className="fa fa-window-close" aria-hidden="true"></i>
                  </button>
                </div>
                <form className="modal-body" style={{ overflowY: 'auto', flex: 1 }} onSubmit={handleSubmitEdit}>
                  {editError && <div className="text-danger mb-3">{editError}</div>}
                  <div className="form-group mb-3">
                    <label>게시판 상세 구분</label>
                    <select
                      name="boardDetailDivCd"
                      className="form-select"
                      value={editForm.boardDetailDivCd}
                      onChange={handleEditChange}
                    >
                      <option value="">선택</option>
                      {detailDivList.map((code) => (
                        <option key={code.cd} value={code.cd}>{code.cdNm}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group mb-3">
                    <label>타이틀</label>
                    <input
                      type="text"
                      name="title"
                      className="form-control"
                      value={editForm.title}
                      onChange={handleEditChange}
                    />
                  </div>
                  <div className="form-group mb-3">
                    <label>본문</label>
                    <ReactQuill
                      theme="snow"
                      className="board-editor"
                      value={editForm.content}
                      onChange={(value) => setEditForm((prev) => ({ ...prev, content: value }))}
                      modules={quillModules}
                      formats={quillFormats}
                    />
                  </div>
                  <div className="modal-footer">
                    <button type="submit" className="btn btn-primary" disabled={editSaving}>
                      {editSaving ? '저장중...' : '저장'}
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={handleCloseEdit}>
                      닫기
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div
            className="modal-backdrop fade show"
            style={{ position: 'fixed', inset: 0, zIndex: 1055 }}
            onClick={handleCloseEdit}
          ></div>
        </>
      )}
    </>
  );
};

export default BoardList;
