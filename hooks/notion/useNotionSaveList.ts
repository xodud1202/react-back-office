import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  GridApi,
  GridReadyEvent,
  IDatasource,
  IGetRowsParams,
  RowDragEndEvent,
  SelectionChangedEvent,
} from 'ag-grid-community';
import { requireLoginUsrNo } from '@/utils/auth';
import useBodyScrollLock from '@/hooks/common/useBodyScrollLock';
import { extractApiErrorMessage } from '@/utils/api/error';
import { notifyError, notifySuccess } from '@/utils/ui/feedback';
import {
  fetchNotionCategoryListApi,
  fetchNotionSaveListApi,
  saveNotionCategorySortApi,
} from '@/services/notionApi';
import type {
  NotionCategoryOption,
  NotionCategorySortRow,
  NotionListResponse,
  NotionListRow,
  NotionSearchForm,
} from '@/components/notion/types';

/**
 * Notion 저장 목록 관리 화면 로직을 관리합니다.
 * @returns Notion 저장 목록 상태/이벤트입니다.
 */
const useNotionSaveList = () => {
  const [loading, setLoading] = useState(false);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [searchForm, setSearchForm] = useState<NotionSearchForm>({
    categoryId: '',
    createDtStart: '',
    createDtEnd: '',
    title: '',
  });
  const [searchParams, setSearchParams] = useState<NotionSearchForm>({
    categoryId: '',
    createDtStart: '',
    createDtEnd: '',
    title: '',
  });
  const [categoryOptions, setCategoryOptions] = useState<NotionCategoryOption[]>([]);
  const [isSortModalOpen, setIsSortModalOpen] = useState(false);
  const [sortRows, setSortRows] = useState<NotionCategorySortRow[]>([]);
  const [selectedSortRowId, setSelectedSortRowId] = useState<string>('');
  const [sortSaving, setSortSaving] = useState(false);
  const gridApiRef = useRef<GridApi<NotionListRow> | null>(null);
  const sortGridApiRef = useRef<GridApi<NotionCategorySortRow> | null>(null);

  // 순서 변경 팝업 열림 상태에 따라 body 스크롤을 제어합니다.
  useBodyScrollLock(isSortModalOpen);

  // 카테고리 옵션을 조회하고 선택값을 유지합니다.
  const fetchCategoryOptions = useCallback(async (preferredCategoryId?: string) => {
    setCategoryLoading(true);
    try {
      const options = await fetchNotionCategoryListApi() as NotionCategoryOption[];
      setCategoryOptions(options);

      // 기존 선택값 또는 지정된 값을 옵션 목록과 비교해 유지합니다.
      const targetCategoryId = preferredCategoryId ?? searchForm.categoryId;
      const hasTarget = options.some((item) => item.categoryId === targetCategoryId);
      const nextCategoryId = hasTarget ? targetCategoryId : '';

      setSearchForm((prev) => ({ ...prev, categoryId: nextCategoryId }));
      setSearchParams((prev) => ({ ...prev, categoryId: nextCategoryId }));
    } catch (error) {
      console.error('Notion 카테고리 목록 조회에 실패했습니다.', error);
      notifyError('Notion 카테고리 목록 조회에 실패했습니다.');
    } finally {
      setCategoryLoading(false);
    }
  }, [searchForm.categoryId]);

  // 카테고리 순서 팝업 목록을 조회합니다.
  const fetchSortRows = useCallback(async () => {
    try {
      const options = await fetchNotionCategoryListApi() as NotionCategoryOption[];
      const rows: NotionCategorySortRow[] = (options || []).map((item, index) => ({
        rowId: item.categoryId,
        categoryId: item.categoryId,
        categoryNm: item.categoryNm,
        color: item.color,
        sortSeq: item.sortSeq ?? index + 1,
      }));
      setSortRows(rows.map((item, index) => ({ ...item, sortSeq: index + 1 })));
      setSelectedSortRowId('');
    } catch (error) {
      console.error('Notion 카테고리 정렬 목록 조회에 실패했습니다.', error);
      notifyError('Notion 카테고리 정렬 목록 조회에 실패했습니다.');
    }
  }, []);

  // 목록 데이터소스를 생성합니다.
  const createDatasource = useCallback((): IDatasource => ({
    getRows: async (params: IGetRowsParams) => {
      const pageSize = 20;
      const startRow = params.startRow ?? 0;
      const page = Math.floor(startRow / pageSize) + 1;

      setLoading(true);
      try {
        const data = await fetchNotionSaveListApi({
          ...searchParams,
          page,
        }) as NotionListResponse;
        params.successCallback(data.list || [], data.totalCount || 0);
      } catch (error) {
        const message = extractApiErrorMessage(error, 'Notion 저장 목록 조회에 실패했습니다.');
        console.error(message, error);
        notifyError(message);
        params.failCallback();
      } finally {
        setLoading(false);
      }
    },
  }), [searchParams]);

  // 그리드 데이터소스를 안전하게 설정합니다.
  const applyDatasource = useCallback((apiInstance: GridApi<NotionListRow>, datasource: IDatasource) => {
    if (typeof (apiInstance as any).setGridOption === 'function') {
      (apiInstance as any).setGridOption('datasource', datasource);
      return;
    }
    if (typeof (apiInstance as any).setDatasource === 'function') {
      (apiInstance as any).setDatasource(datasource);
    }
  }, []);

  // 목록 그리드 초기화 시 데이터소스를 연결합니다.
  const handleGridReady = useCallback((event: GridReadyEvent<NotionListRow>) => {
    gridApiRef.current = event.api;
    applyDatasource(event.api, createDatasource());
  }, [applyDatasource, createDatasource]);

  // 팝업 정렬 그리드 준비 완료 시 API를 저장합니다.
  const handleSortGridReady = useCallback((event: GridReadyEvent<NotionCategorySortRow>) => {
    sortGridApiRef.current = event.api;
  }, []);

  // 정렬 목록을 현재 순서 기준으로 재정렬합니다.
  const normalizeSortRows = useCallback((rows: NotionCategorySortRow[]) => {
    return rows.map((row, index) => ({
      ...row,
      sortSeq: index + 1,
    }));
  }, []);

  // 검색 폼 입력값을 변경합니다.
  const handleSearchFormChange = useCallback((event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setSearchForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  // 검색 버튼 클릭 시 조회 조건을 적용합니다.
  const handleSearch = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearchParams({ ...searchForm });
  }, [searchForm]);

  // 검색 조건을 초기화합니다.
  const handleReset = useCallback(() => {
    const resetForm: NotionSearchForm = {
      categoryId: '',
      createDtStart: '',
      createDtEnd: '',
      title: '',
    };
    setSearchForm(resetForm);
    setSearchParams(resetForm);
  }, []);

  // 팝업 정렬 그리드 선택 상태를 반영합니다.
  const handleSortSelectionChanged = useCallback((event: SelectionChangedEvent<NotionCategorySortRow>) => {
    const selectedRows = event.api.getSelectedRows();
    if (!selectedRows || selectedRows.length === 0) {
      setSelectedSortRowId('');
      return;
    }
    setSelectedSortRowId(selectedRows[0].rowId);
  }, []);

  // 드래그 정렬 종료 후 순서를 재계산합니다.
  const handleSortRowDragEnd = useCallback((event: RowDragEndEvent<NotionCategorySortRow>) => {
    const apiInstance = event.api;
    const rowCount = apiInstance.getDisplayedRowCount();
    const nextRows: NotionCategorySortRow[] = [];
    for (let index = 0; index < rowCount; index += 1) {
      const node = apiInstance.getDisplayedRowAtIndex(index);
      if (node?.data) {
        nextRows.push({ ...node.data });
      }
    }
    setSortRows(normalizeSortRows(nextRows));
  }, [normalizeSortRows]);

  // 선택된 카테고리를 위/아래로 이동합니다.
  const moveSelectedSortRow = useCallback((direction: 'up' | 'down') => {
    if (!selectedSortRowId) {
      return;
    }

    setSortRows((prevRows) => {
      const currentIndex = prevRows.findIndex((row) => row.rowId === selectedSortRowId);
      if (currentIndex < 0) {
        return prevRows;
      }

      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= prevRows.length) {
        return prevRows;
      }

      const nextRows = [...prevRows];
      const currentRow = nextRows[currentIndex];
      nextRows[currentIndex] = nextRows[targetIndex];
      nextRows[targetIndex] = currentRow;
      return normalizeSortRows(nextRows);
    });
  }, [normalizeSortRows, selectedSortRowId]);

  // 순서 변경 팝업을 엽니다.
  const handleOpenSortModal = useCallback(async () => {
    await fetchSortRows();
    setIsSortModalOpen(true);
  }, [fetchSortRows]);

  // 순서 변경 팝업을 닫습니다.
  const handleCloseSortModal = useCallback(() => {
    setIsSortModalOpen(false);
    setSelectedSortRowId('');
  }, []);

  // 변경된 카테고리 순서를 저장합니다.
  const handleSaveSort = useCallback(async () => {
    if (sortRows.length === 0) {
      notifyError('저장할 카테고리 데이터가 없습니다.');
      return;
    }
    const usrNo = requireLoginUsrNo();
    if (!usrNo) {
      return;
    }

    setSortSaving(true);
    try {
      await saveNotionCategorySortApi({
        rows: sortRows.map((item) => ({ categoryId: item.categoryId })),
        udtNo: usrNo,
      });
      const selectedCategoryId = searchForm.categoryId;
      await fetchCategoryOptions(selectedCategoryId);
      setIsSortModalOpen(false);
      notifySuccess('카테고리 순서가 저장되었습니다.');
    } catch (error) {
      const message = extractApiErrorMessage(error, '카테고리 순서 저장에 실패했습니다.');
      console.error(message, error);
      notifyError(message);
    } finally {
      setSortSaving(false);
    }
  }, [fetchCategoryOptions, searchForm.categoryId, sortRows]);

  // 검색조건 변경 시 목록을 다시 조회합니다.
  useEffect(() => {
    if (!gridApiRef.current) {
      return;
    }
    applyDatasource(gridApiRef.current, createDatasource());
  }, [applyDatasource, createDatasource]);

  // 최초 진입 시 카테고리 옵션을 조회합니다.
  useEffect(() => {
    fetchCategoryOptions();
  }, [fetchCategoryOptions]);

  return {
    loading,
    categoryLoading,
    searchForm,
    categoryOptions,
    isSortModalOpen,
    sortRows,
    sortSaving,
    handleSearchFormChange,
    handleSearch,
    handleReset,
    handleOpenSortModal,
    handleCloseSortModal,
    handleSaveSort,
    handleGridReady,
    handleSortGridReady,
    handleSortSelectionChanged,
    handleSortRowDragEnd,
    moveSelectedSortRow,
  };
};

export default useNotionSaveList;
