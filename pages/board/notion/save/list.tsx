import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import type {
  ColDef,
  GridApi,
  GridReadyEvent,
  ICellRendererParams,
  IDatasource,
  IGetRowsParams,
  RowDragEndEvent,
  SelectionChangedEvent,
} from 'ag-grid-community';
import api from '@/utils/axios/axios';
import { requireLoginUsrNo } from '@/utils/auth';

interface NotionListRow {
  id: string;
  categoryId: string | null;
  categoryNm: string | null;
  title: string | null;
  notes: string | null;
  url: string | null;
  notionUrl: string | null;
  createDt: string | null;
}

interface NotionListResponse {
  list: NotionListRow[];
  totalCount: number;
  page: number;
  pageSize: number;
}

interface NotionCategoryOption {
  categoryId: string;
  categoryNm: string;
  color: string | null;
  sortSeq: number;
  regDt: string | null;
}

interface NotionCategorySortRow {
  rowId: string;
  categoryId: string;
  categoryNm: string;
  color: string | null;
  sortSeq: number;
}

interface NotionSearchForm {
  categoryId: string;
  createDtStart: string;
  createDtEnd: string;
  title: string;
}

// 관리자 Notion 저장 목록 화면을 렌더링합니다.
const NotionSaveListPage = () => {
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

  // 카테고리 옵션을 조회하고 선택값을 유지합니다.
  const fetchCategoryOptions = useCallback(async (preferredCategoryId?: string) => {
    setCategoryLoading(true);
    try {
      const response = await api.get('/api/admin/notion/category/list');
      const options: NotionCategoryOption[] = response.data || [];
      setCategoryOptions(options);

      // 기존 선택값 또는 지정된 값을 옵션 목록과 비교해 유지합니다.
      const targetCategoryId = preferredCategoryId ?? searchForm.categoryId;
      const hasTarget = options.some((item) => item.categoryId === targetCategoryId);
      const nextCategoryId = hasTarget ? targetCategoryId : '';

      setSearchForm((prev) => ({ ...prev, categoryId: nextCategoryId }));
      setSearchParams((prev) => ({ ...prev, categoryId: nextCategoryId }));
    } catch (error) {
      console.error('Notion 카테고리 목록 조회에 실패했습니다.', error);
      alert('Notion 카테고리 목록 조회에 실패했습니다.');
    } finally {
      setCategoryLoading(false);
    }
  }, [searchForm.categoryId]);

  // 카테고리 순서 팝업 목록을 조회합니다.
  const fetchSortRows = useCallback(async () => {
    try {
      const response = await api.get('/api/admin/notion/category/list');
      const rows: NotionCategorySortRow[] = (response.data || []).map((item: NotionCategoryOption, index: number) => ({
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
      alert('Notion 카테고리 정렬 목록 조회에 실패했습니다.');
    }
  }, []);

  // 입력된 URL을 새 탭으로 엽니다.
  const openUrlInNewTab = useCallback((url?: string | null) => {
    const targetUrl = (url || '').trim();
    if (!targetUrl) {
      return;
    }
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
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

  // 목록 그리드 컬럼을 정의합니다.
  const columnDefs = useMemo<ColDef<NotionListRow>[]>(() => ([
    {
      headerName: '카테고리',
      field: 'categoryNm',
      width: 120,
      valueGetter: (params) => params.data?.categoryNm || '-',
    },
    {
      headerName: '타이틀',
      field: 'title',
      minWidth: 400,
      flex: 1,
      cellClass: 'text-start',
      valueGetter: (params) => params.data?.title || '',
    },
    {
      headerName: '본문',
      field: 'notes',
      minWidth: 100,
      flex: 2,
      cellClass: 'text-start',
      valueGetter: (params) => params.data?.notes || '',
    },
    {
      headerName: 'URL',
      field: 'url',
      width: 250,
      cellClass: 'text-start',
      cellStyle: { display: 'flex', alignItems: 'center' },
      cellRenderer: (params: ICellRendererParams<NotionListRow>) => {
        const url = params.data?.url || '';
        if (!url) {
          return <span>-</span>;
        }
        return (
          <button
            type="button"
            className="btn p-0 text-decoration-underline text-start"
            style={{ display: 'block', width: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
            title={url}
            onClick={() => openUrlInNewTab(url)}
          >
            {url}
          </button>
        );
      },
    },
    {
      headerName: 'NOTION URL',
      field: 'notionUrl',
      width: 250,
      cellClass: 'text-start',
      cellStyle: { display: 'flex', alignItems: 'center' },
      cellRenderer: (params: ICellRendererParams<NotionListRow>) => {
        const url = params.data?.notionUrl || '';
        if (!url) {
          return <span>-</span>;
        }
        return (
          <button
            type="button"
            className="btn p-0 text-decoration-underline text-start"
            style={{ display: 'block', width: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
            title={url}
            onClick={() => openUrlInNewTab(url)}
          >
            {url}
          </button>
        );
      },
    },
    {
      headerName: '등록일시',
      field: 'createDt',
      width: 180,
      valueGetter: (params) => params.data?.createDt || '',
    },
  ]), [openUrlInNewTab]);

  // 팝업 정렬 그리드 컬럼을 정의합니다.
  const sortColumnDefs = useMemo<ColDef<NotionCategorySortRow>[]>(() => ([
    {
      headerName: '이동',
      width: 70,
      rowDrag: true,
    },
    {
      headerName: '카테고리명',
      field: 'categoryNm',
      flex: 1,
      minWidth: 220,
      cellClass: 'text-start',
    },
  ]), []);

  // ag-grid 공통 컬럼 옵션을 정의합니다.
  const defaultColDef = useMemo<ColDef>(() => ({
    resizable: true,
    sortable: false,
    editable: false,
    cellClass: 'text-center',
  }), []);

  // 목록 데이터소스를 생성합니다.
  const createDatasource = useCallback((): IDatasource => ({
    getRows: async (params: IGetRowsParams) => {
      const pageSize = 20;
      const startRow = params.startRow ?? 0;
      const page = Math.floor(startRow / pageSize) + 1;

      setLoading(true);
      try {
        const response = await api.get('/api/admin/notion/save/list', {
          params: {
            ...searchParams,
            page,
          },
        });
        const data = (response.data || {}) as NotionListResponse;
        params.successCallback(data.list || [], data.totalCount || 0);
      } catch (error: any) {
        console.error('Notion 저장 목록 조회에 실패했습니다.', error);
        const message = error?.response?.data?.message || 'Notion 저장 목록 조회에 실패했습니다.';
        alert(message);
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
      alert('저장할 카테고리 데이터가 없습니다.');
      return;
    }
    const usrNo = requireLoginUsrNo();
    if (!usrNo) {
      return;
    }

    setSortSaving(true);
    try {
      await api.post('/api/admin/notion/category/sort/save', {
        rows: sortRows.map((item) => ({ categoryId: item.categoryId })),
        udtNo: usrNo,
      });
      const selectedCategoryId = searchForm.categoryId;
      await fetchCategoryOptions(selectedCategoryId);
      setIsSortModalOpen(false);
      alert('카테고리 순서가 저장되었습니다.');
    } catch (error: any) {
      console.error('카테고리 순서 저장에 실패했습니다.', error);
      const message = error?.response?.data?.message || '카테고리 순서 저장에 실패했습니다.';
      alert(message);
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

  // 팝업 열림 상태에 따라 바디 스크롤을 제어합니다.
  useEffect(() => {
    if (isSortModalOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
    document.body.style.overflow = '';
  }, [isSortModalOpen]);

  return (
    <>
      <div className="page-header">
        <h3 className="page-title"> Notion 저장 게시글 관리 </h3>
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><a href="#">게시판</a></li>
            <li className="breadcrumb-item active" aria-current="page">Notion 저장 목록</li>
          </ol>
        </nav>
      </div>

      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card">
            <div className="card-body">
              <form className="forms-sample" onSubmit={handleSearch}>
                <div className="row">
                  <div className="col-md-3">
                    <div className="form-group">
                      <label>카테고리</label>
                      <div className="d-flex gap-2">
                        <select
                          name="categoryId"
                          value={searchForm.categoryId}
                          className="form-select btn-outline-secondary"
                          onChange={handleSearchFormChange}
                          disabled={categoryLoading}
                        >
                          <option value="">전체</option>
                          {categoryOptions.map((item) => (
                            <option key={item.categoryId} value={item.categoryId}>{item.categoryNm}</option>
                          ))}
                        </select>
                        <button type="button" className="btn btn-outline-primary" onClick={handleOpenSortModal}>
                          순서 변경
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-2">
                    <div className="form-group">
                      <label>등록일시 시작</label>
                      <input
                        type="date"
                        name="createDtStart"
                        className="form-control"
                        value={searchForm.createDtStart}
                        onChange={handleSearchFormChange}
                      />
                    </div>
                  </div>
                  <div className="col-md-2">
                    <div className="form-group">
                      <label>등록일시 종료</label>
                      <input
                        type="date"
                        name="createDtEnd"
                        className="form-control"
                        value={searchForm.createDtEnd}
                        onChange={handleSearchFormChange}
                      />
                    </div>
                  </div>
                  <div className="col-md-5">
                    <div className="form-group">
                      <label>타이틀</label>
                      <input
                        type="text"
                        name="title"
                        className="form-control"
                        placeholder="타이틀을 입력하세요"
                        value={searchForm.title}
                        onChange={handleSearchFormChange}
                      />
                    </div>
                  </div>
                </div>
                <div className="d-flex justify-content-center gap-2">
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? '검색중...' : '검색'}
                  </button>
                  <button type="button" className="btn btn-dark" onClick={handleReset}>
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
                <AgGridReact<NotionListRow>
                  columnDefs={columnDefs}
                  defaultColDef={defaultColDef}
                  domLayout="autoHeight"
                  overlayNoRowsTemplate="데이터가 없습니다."
                  rowModelType="infinite"
                  cacheBlockSize={20}
                  pagination
                  paginationPageSize={20}
                  getRowId={(params) => String(params.data?.id ?? '')}
                  onGridReady={handleGridReady}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {isSortModalOpen && (
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
            <div className="modal-dialog" style={{ margin: 0, width: '370px', maxWidth: '92vw' }}>
              <div className="modal-content" style={{ maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div className="modal-body" style={{ overflowY: 'auto', flex: 1 }}>
                  <div className="ag-theme-alpine-dark header-center" style={{ width: '100%', height: '360px' }}>
                    <AgGridReact<NotionCategorySortRow>
                      rowData={sortRows}
                      columnDefs={sortColumnDefs}
                      defaultColDef={defaultColDef}
                      rowSelection="single"
                      rowDragManaged
                      animateRows
                      overlayNoRowsTemplate="데이터가 없습니다."
                      getRowId={(params) => params.data.rowId}
                      onGridReady={handleSortGridReady}
                      onSelectionChanged={handleSortSelectionChanged}
                      onRowDragEnd={handleSortRowDragEnd}
                    />
                  </div>
                  <div>
                    <button type="button" className="btn btn-light" onClick={() => moveSelectedSortRow('up')}>
                      <i className="mdi mdi-arrow-up-bold me-1" aria-hidden="true"></i>
                      위로
                    </button>
                    <button type="button" className="btn btn-light m-2" onClick={() => moveSelectedSortRow('down')}>
                      <i className="mdi mdi-arrow-down-bold me-1" aria-hidden="true"></i>
                      아래로
                    </button>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-primary" disabled={sortSaving} onClick={handleSaveSort}>
                    {sortSaving ? '저장중...' : '저장'}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={handleCloseSortModal}>
                    닫기
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div
            className="modal-backdrop fade show"
            style={{ position: 'fixed', inset: 0, zIndex: 1055 }}
            onClick={handleCloseSortModal}
          ></div>
        </>
      )}
    </>
  );
};

export default NotionSaveListPage;
