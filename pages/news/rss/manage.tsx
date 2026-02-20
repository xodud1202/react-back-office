import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import type {
  CellValueChangedEvent,
  ColDef,
  GridApi,
  GridReadyEvent,
  RowDragEndEvent,
  SelectionChangedEvent,
} from 'ag-grid-community';
import api from '@/utils/axios/axios';
import { requireLoginUsrNo } from '@/utils/auth';

interface NewsPressRow {
  rowId: string;
  pressNo: number | null;
  pressNm: string;
  useYn: 'Y' | 'N';
  sortSeq: number;
}

interface NewsCategoryRow {
  rowId: string;
  pressNo: number | null;
  categoryCd: string;
  categoryNm: string;
  useYn: 'Y' | 'N';
  sortSeq: number;
  sourceNm: string;
  rssUrl: string;
}

// 뉴스 RSS 관리 화면을 렌더링합니다.
const NewsRssManagePage = () => {
  const [pressRows, setPressRows] = useState<NewsPressRow[]>([]);
  const [categoryRows, setCategoryRows] = useState<NewsCategoryRow[]>([]);
  const [selectedPressNo, setSelectedPressNo] = useState<number | null>(null);
  const [pressLoading, setPressLoading] = useState(false);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [pressSaving, setPressSaving] = useState(false);
  const [categorySaving, setCategorySaving] = useState(false);
  const [selectedPressRowIds, setSelectedPressRowIds] = useState<string[]>([]);
  const [selectedCategoryRowIds, setSelectedCategoryRowIds] = useState<string[]>([]);
  const pressGridApiRef = useRef<GridApi<NewsPressRow> | null>(null);
  const categoryGridApiRef = useRef<GridApi<NewsCategoryRow> | null>(null);

  // 빈값이면 null을 반환하도록 문자열을 정리합니다.
  const trimToNull = useCallback((value: string | null | undefined) => {
    if (value == null) {
      return null;
    }
    const trimmedValue = value.trim();
    return trimmedValue ? trimmedValue : null;
  }, []);

  // 언론사 목록을 순서 기준으로 재정렬하고 sortSeq를 재계산합니다.
  const normalizePressRows = useCallback((rows: NewsPressRow[]) => {
    return rows.map((row, index) => ({
      ...row,
      sortSeq: index + 1,
    }));
  }, []);

  // 카테고리 목록을 순서 기준으로 재정렬하고 sortSeq를 재계산합니다.
  const normalizeCategoryRows = useCallback((rows: NewsCategoryRow[]) => {
    return rows.map((row, index) => ({
      ...row,
      sortSeq: index + 1,
    }));
  }, []);

  // 언론사 목록을 조회합니다.
  const fetchPressList = useCallback(async () => {
    setPressLoading(true);
    try {
      const response = await api.get('/api/admin/news/rss/manage/press/list');
      const rows: NewsPressRow[] = (response.data || []).map((item: any, index: number) => ({
        rowId: `press-${item.pressNo}`,
        pressNo: item.pressNo ?? null,
        pressNm: item.pressNm ?? '',
        useYn: item.useYn === 'N' ? 'N' : 'Y',
        sortSeq: item.sortSeq ?? index + 1,
      }));
      const normalizedRows = normalizePressRows(rows);
      setPressRows(normalizedRows);
      // 선택 언론사가 없거나 삭제된 경우 첫 행을 기본 선택합니다.
      setSelectedPressNo((prevSelectedPressNo) => {
        if (normalizedRows.length === 0) {
          return null;
        }
        if (normalizedRows.some((row) => row.pressNo === prevSelectedPressNo)) {
          return prevSelectedPressNo;
        }
        return normalizedRows[0].pressNo;
      });
    } catch (error) {
      console.error('언론사 목록 조회에 실패했습니다.', error);
      alert('언론사 목록 조회에 실패했습니다.');
    } finally {
      setPressLoading(false);
    }
  }, [normalizePressRows]);

  // 선택 언론사의 카테고리 목록을 조회합니다.
  const fetchCategoryList = useCallback(async (pressNo: number | null) => {
    if (!pressNo) {
      setCategoryRows([]);
      return;
    }
    setCategoryLoading(true);
    try {
      const response = await api.get('/api/admin/news/rss/manage/category/list', {
        params: { pressNo },
      });
      const rows: NewsCategoryRow[] = (response.data || []).map((item: any, index: number) => ({
        rowId: `category-${item.pressNo}-${item.categoryCd}`,
        pressNo: item.pressNo ?? pressNo,
        categoryCd: item.categoryCd ?? '',
        categoryNm: item.categoryNm ?? '',
        useYn: item.useYn === 'N' ? 'N' : 'Y',
        sortSeq: item.sortSeq ?? index + 1,
        sourceNm: item.sourceNm ?? '',
        rssUrl: item.rssUrl ?? '',
      }));
      setCategoryRows(normalizeCategoryRows(rows));
    } catch (error) {
      console.error('카테고리 목록 조회에 실패했습니다.', error);
      alert('카테고리 목록 조회에 실패했습니다.');
    } finally {
      setCategoryLoading(false);
    }
  }, [normalizeCategoryRows]);

  // 최초 진입 시 언론사 목록을 조회합니다.
  useEffect(() => {
    fetchPressList();
  }, [fetchPressList]);

  // 선택 언론사가 변경되면 카테고리 목록을 조회합니다.
  useEffect(() => {
    fetchCategoryList(selectedPressNo);
  }, [fetchCategoryList, selectedPressNo]);

  // 언론사 목록 그리드 준비 완료 시 API를 저장합니다.
  const handlePressGridReady = useCallback((event: GridReadyEvent<NewsPressRow>) => {
    pressGridApiRef.current = event.api;
  }, []);

  // 카테고리 목록 그리드 준비 완료 시 API를 저장합니다.
  const handleCategoryGridReady = useCallback((event: GridReadyEvent<NewsCategoryRow>) => {
    categoryGridApiRef.current = event.api;
  }, []);

  // 언론사 선택 변경을 반영합니다.
  const handlePressSelectionChanged = useCallback((event: SelectionChangedEvent<NewsPressRow>) => {
    const selectedRows = event.api.getSelectedRows() || [];
    setSelectedPressRowIds(selectedRows.map((row) => row.rowId));
    // 선택 행이 1건이면 카테고리 조회 대상 언론사로 반영합니다.
    if (selectedRows.length === 1) {
      setSelectedPressNo(selectedRows[0].pressNo);
    }
  }, []);

  // 카테고리 선택 변경을 반영합니다.
  const handleCategorySelectionChanged = useCallback((event: SelectionChangedEvent<NewsCategoryRow>) => {
    const selectedRows = event.api.getSelectedRows() || [];
    setSelectedCategoryRowIds(selectedRows.map((row) => row.rowId));
  }, []);

  // 언론사 신규 행을 추가합니다.
  const handleAddPressRow = useCallback(() => {
    setPressRows((prevRows) => {
      const nextRows = [...prevRows, {
        rowId: `press-new-${Date.now()}`,
        pressNo: null,
        pressNm: '',
        useYn: 'Y' as const,
        sortSeq: prevRows.length + 1,
      }];
      return normalizePressRows(nextRows);
    });
  }, [normalizePressRows]);

  // 카테고리 신규 행을 추가합니다.
  const handleAddCategoryRow = useCallback(() => {
    if (!selectedPressNo) {
      alert('언론사를 먼저 선택해주세요.');
      return;
    }
    setCategoryRows((prevRows) => {
      const nextRows = [...prevRows, {
        rowId: `category-new-${Date.now()}`,
        pressNo: selectedPressNo,
        categoryCd: '',
        categoryNm: '',
        useYn: 'Y' as const,
        sortSeq: prevRows.length + 1,
        sourceNm: '',
        rssUrl: '',
      }];
      return normalizeCategoryRows(nextRows);
    });
  }, [normalizeCategoryRows, selectedPressNo]);

  // 언론사 그리드 셀 편집값을 반영합니다.
  const handlePressCellValueChanged = useCallback((event: CellValueChangedEvent<NewsPressRow>) => {
    const changedRow = event.data;
    setPressRows((prevRows) => prevRows.map((row) => {
      if (row.rowId !== changedRow.rowId) {
        return row;
      }
      return {
        ...row,
        pressNm: changedRow.pressNm ?? '',
        useYn: changedRow.useYn === 'N' ? 'N' : 'Y',
      };
    }));
  }, []);

  // 카테고리 그리드 셀 편집값을 반영합니다.
  const handleCategoryCellValueChanged = useCallback((event: CellValueChangedEvent<NewsCategoryRow>) => {
    const changedRow = event.data;
    setCategoryRows((prevRows) => prevRows.map((row) => {
      if (row.rowId !== changedRow.rowId) {
        return row;
      }
      return {
        ...row,
        categoryCd: (changedRow.categoryCd ?? '').trim(),
        categoryNm: changedRow.categoryNm ?? '',
        useYn: changedRow.useYn === 'N' ? 'N' : 'Y',
        sourceNm: changedRow.sourceNm ?? '',
        rssUrl: changedRow.rssUrl ?? '',
      };
    }));
  }, []);

  // 언론사 드래그 정렬 종료 시 목록 순서를 반영합니다.
  const handlePressRowDragEnd = useCallback((event: RowDragEndEvent<NewsPressRow>) => {
    const api = event.api;
    const rowCount = api.getDisplayedRowCount();
    const nextRows: NewsPressRow[] = [];
    for (let index = 0; index < rowCount; index += 1) {
      const node = api.getDisplayedRowAtIndex(index);
      if (node?.data) {
        nextRows.push({ ...node.data });
      }
    }
    setPressRows(normalizePressRows(nextRows));
  }, [normalizePressRows]);

  // 카테고리 드래그 정렬 종료 시 목록 순서를 반영합니다.
  const handleCategoryRowDragEnd = useCallback((event: RowDragEndEvent<NewsCategoryRow>) => {
    const api = event.api;
    const rowCount = api.getDisplayedRowCount();
    const nextRows: NewsCategoryRow[] = [];
    for (let index = 0; index < rowCount; index += 1) {
      const node = api.getDisplayedRowAtIndex(index);
      if (node?.data) {
        nextRows.push({ ...node.data });
      }
    }
    setCategoryRows(normalizeCategoryRows(nextRows));
  }, [normalizeCategoryRows]);

  // 언론사 저장 요청을 검증합니다.
  const validatePressRows = useCallback(() => {
    for (const row of pressRows) {
      const pressNm = trimToNull(row.pressNm);
      if (!pressNm) {
        return '언론사명을 입력해주세요.';
      }
      if (pressNm.length > 100) {
        return '언론사명은 100자 이내로 입력해주세요.';
      }
      if (row.useYn !== 'Y' && row.useYn !== 'N') {
        return '언론사 사용여부를 확인해주세요.';
      }
    }
    return null;
  }, [pressRows, trimToNull]);

  // 카테고리 저장 요청을 검증합니다.
  const validateCategoryRows = useCallback(() => {
    for (const row of categoryRows) {
      const categoryCd = trimToNull(row.categoryCd);
      const categoryNm = trimToNull(row.categoryNm);
      const sourceNm = trimToNull(row.sourceNm);
      const rssUrl = trimToNull(row.rssUrl);
      if (!categoryCd) {
        return '카테고리코드를 입력해주세요.';
      }
      if (categoryCd.length > 50) {
        return '카테고리코드는 50자 이내로 입력해주세요.';
      }
      if (!categoryNm) {
        return '카테고리명을 입력해주세요.';
      }
      if (categoryNm.length > 100) {
        return '카테고리명은 100자 이내로 입력해주세요.';
      }
      if (!sourceNm) {
        return '소스명을 입력해주세요.';
      }
      if (sourceNm.length > 150) {
        return '소스명은 150자 이내로 입력해주세요.';
      }
      if (!rssUrl) {
        return 'RSS URL을 입력해주세요.';
      }
      if (rssUrl.length > 150) {
        return 'RSS URL은 150자 이내로 입력해주세요.';
      }
      if (row.useYn !== 'Y' && row.useYn !== 'N') {
        return '카테고리 사용여부를 확인해주세요.';
      }
    }
    return null;
  }, [categoryRows, trimToNull]);

  // 언론사 목록을 저장합니다.
  const handleSavePressRows = useCallback(async () => {
    if (pressRows.length === 0) {
      alert('저장할 언론사가 없습니다.');
      return;
    }
    const validationMessage = validatePressRows();
    if (validationMessage) {
      alert(validationMessage);
      return;
    }
    const usrNo = requireLoginUsrNo();
    if (!usrNo) {
      return;
    }
    setPressSaving(true);
    try {
      const payload = {
        rows: normalizePressRows(pressRows).map((row) => ({
          pressNo: row.pressNo,
          pressNm: row.pressNm.trim(),
          useYn: row.useYn,
          sortSeq: row.sortSeq,
        })),
        regNo: usrNo,
        udtNo: usrNo,
      };
      const response = await api.post('/api/admin/news/rss/manage/press/save', payload);
      if (response.data >= 0) {
        alert('언론사 정보가 저장되었습니다.');
        await fetchPressList();
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || '언론사 저장에 실패했습니다.';
      console.error('언론사 저장에 실패했습니다.', error);
      alert(message);
    } finally {
      setPressSaving(false);
    }
  }, [fetchPressList, normalizePressRows, pressRows, validatePressRows]);

  // 카테고리 목록을 저장합니다.
  const handleSaveCategoryRows = useCallback(async () => {
    if (!selectedPressNo) {
      alert('언론사를 먼저 선택해주세요.');
      return;
    }
    if (categoryRows.length === 0) {
      alert('저장할 카테고리가 없습니다.');
      return;
    }
    const validationMessage = validateCategoryRows();
    if (validationMessage) {
      alert(validationMessage);
      return;
    }
    const usrNo = requireLoginUsrNo();
    if (!usrNo) {
      return;
    }
    setCategorySaving(true);
    try {
      const payload = {
        pressNo: selectedPressNo,
        rows: normalizeCategoryRows(categoryRows).map((row) => ({
          categoryCd: row.categoryCd.trim(),
          categoryNm: row.categoryNm.trim(),
          useYn: row.useYn,
          sortSeq: row.sortSeq,
          sourceNm: row.sourceNm.trim(),
          rssUrl: row.rssUrl.trim(),
        })),
        regNo: usrNo,
        udtNo: usrNo,
      };
      const response = await api.post('/api/admin/news/rss/manage/category/save', payload);
      if (response.data >= 0) {
        alert('카테고리 정보가 저장되었습니다.');
        await fetchCategoryList(selectedPressNo);
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || '카테고리 저장에 실패했습니다.';
      console.error('카테고리 저장에 실패했습니다.', error);
      alert(message);
    } finally {
      setCategorySaving(false);
    }
  }, [categoryRows, fetchCategoryList, normalizeCategoryRows, selectedPressNo, validateCategoryRows]);

  // 선택된 언론사를 삭제합니다.
  const handleDeletePressRows = useCallback(async () => {
    if (selectedPressRowIds.length === 0) {
      alert('삭제할 언론사를 선택해주세요.');
      return;
    }
    const usrNo = requireLoginUsrNo();
    if (!usrNo) {
      return;
    }
    const selectedRows = pressRows.filter((row) => selectedPressRowIds.includes(row.rowId));
    const savedPressNoList = selectedRows
      .map((row) => row.pressNo)
      .filter((pressNo): pressNo is number => Boolean(pressNo));

    const ok = confirm('선택한 언론사를 삭제하시겠습니까?');
    if (!ok) {
      return;
    }

    try {
      if (savedPressNoList.length > 0) {
        await api.post('/api/admin/news/rss/manage/press/delete', {
          pressNoList: savedPressNoList,
          udtNo: usrNo,
        });
      }
      alert('언론사가 삭제되었습니다.');
      await fetchPressList();
    } catch (error: any) {
      const message = error?.response?.data?.message || '언론사 삭제에 실패했습니다.';
      console.error('언론사 삭제에 실패했습니다.', error);
      alert(message);
    }
  }, [fetchPressList, pressRows, selectedPressRowIds]);

  // 선택된 카테고리를 삭제합니다.
  const handleDeleteCategoryRows = useCallback(async () => {
    if (!selectedPressNo) {
      alert('언론사를 먼저 선택해주세요.');
      return;
    }
    if (selectedCategoryRowIds.length === 0) {
      alert('삭제할 카테고리를 선택해주세요.');
      return;
    }
    const usrNo = requireLoginUsrNo();
    if (!usrNo) {
      return;
    }
    const selectedRows = categoryRows.filter((row) => selectedCategoryRowIds.includes(row.rowId));
    const categoryCdList = selectedRows
      .map((row) => row.categoryCd?.trim())
      .filter((categoryCd): categoryCd is string => Boolean(categoryCd));

    const ok = confirm('선택한 카테고리를 삭제하시겠습니까?');
    if (!ok) {
      return;
    }

    try {
      if (categoryCdList.length > 0) {
        await api.post('/api/admin/news/rss/manage/category/delete', {
          pressNo: selectedPressNo,
          categoryCdList,
          udtNo: usrNo,
        });
      }
      alert('카테고리가 삭제되었습니다.');
      await fetchCategoryList(selectedPressNo);
    } catch (error: any) {
      const message = error?.response?.data?.message || '카테고리 삭제에 실패했습니다.';
      console.error('카테고리 삭제에 실패했습니다.', error);
      alert(message);
    }
  }, [categoryRows, fetchCategoryList, selectedCategoryRowIds, selectedPressNo]);

  // 언론사 그리드 컬럼을 정의합니다.
  const pressColumnDefs = useMemo<ColDef<NewsPressRow>[]>(() => ([
    {
      checkboxSelection: true,
      headerCheckboxSelection: true,
      width: 60,
    },
    {
      headerName: '이동',
      width: 60,
      rowDrag: true,
    },
    {
      headerName: '언론사명',
      field: 'pressNm',
      flex: 1,
      editable: true,
      cellClass: 'text-start',
      width: 100,
    },
    {
      headerName: '사용여부',
      field: 'useYn',
      width: 85,
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: ['Y', 'N'],
      },
    },
    {
      headerName: '순서',
      field: 'sortSeq',
      width: 70,
    },
  ]), []);

  // 카테고리 그리드 컬럼을 정의합니다.
  const categoryColumnDefs = useMemo<ColDef<NewsCategoryRow>[]>(() => ([
    {
      checkboxSelection: true,
      headerCheckboxSelection: true,
      width: 60,
    },
    {
      headerName: '이동',
      width: 60,
      rowDrag: true,
    },
    {
      headerName: '카테고리코드',
      field: 'categoryCd',
      width: 150,
      editable: (params) => params.data?.rowId.startsWith('category-new-') ?? false,
      cellClass: 'text-start',
    },
    {
      headerName: '카테고리명',
      field: 'categoryNm',
      width: 180,
      editable: true,
      cellClass: 'text-start',
    },
    {
      headerName: '사용여부',
      field: 'useYn',
      width: 100,
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: ['Y', 'N'],
      },
    },
    {
      headerName: '소스명',
      field: 'sourceNm',
      width: 180,
      editable: true,
      cellClass: 'text-start',
    },
    {
      headerName: 'RSS URL',
      field: 'rssUrl',
      width: 500,
      editable: true,
      cellClass: 'text-start',
    },
    {
      headerName: '순서',
      field: 'sortSeq',
      width: 90,
    },
  ]), []);

  // ag-grid 기본 컬럼 옵션을 정의합니다.
  const defaultColDef = useMemo<ColDef>(() => ({
    resizable: true,
    sortable: false,
    cellClass: 'text-center',
  }), []);

  return (
    <>
      <div className="page-header">
        <h3 className="page-title">뉴스 RSS 관리</h3>
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><a href="#">뉴스</a></li>
            <li className="breadcrumb-item active" aria-current="page">RSS 관리</li>
          </ol>
        </nav>
      </div>

      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="d-flex gap-3" style={{ width: '100%' }}>
            <div style={{ flex: '0 0 30%', maxWidth: '30%' }}>
              <div className="card">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h5 className="mb-0">언론사 목록</h5>
                    <div className="d-flex gap-2">
                      <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleAddPressRow}>추가</button>
                      <button type="button" className="btn btn-primary btn-sm" onClick={handleSavePressRows} disabled={pressSaving}>
                        {pressSaving ? '저장중...' : '저장'}
                      </button>
                      <button type="button" className="btn btn-danger btn-sm" onClick={handleDeletePressRows}>삭제</button>
                    </div>
                  </div>
                  {pressLoading && <div className="text-muted small mb-2">조회 중...</div>}
                  <div className="ag-theme-alpine-dark header-center" style={{ width: '100%', height: '560px' }}>
                    <AgGridReact<NewsPressRow>
                      rowData={pressRows}
                      columnDefs={pressColumnDefs}
                      defaultColDef={defaultColDef}
                      rowSelection="multiple"
                      rowDragManaged
                      animateRows
                      overlayNoRowsTemplate="데이터가 없습니다."
                      getRowId={(params) => params.data.rowId}
                      onGridReady={handlePressGridReady}
                      onSelectionChanged={handlePressSelectionChanged}
                      onCellValueChanged={handlePressCellValueChanged}
                      onRowDragEnd={handlePressRowDragEnd}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div style={{ flex: '0 0 70%', maxWidth: '70%' }}>
              <div className="card">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h5 className="mb-0">카테고리 목록</h5>
                    <div className="d-flex gap-2">
                      <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleAddCategoryRow}>추가</button>
                      <button type="button" className="btn btn-primary btn-sm" onClick={handleSaveCategoryRows} disabled={categorySaving}>
                        {categorySaving ? '저장중...' : '저장'}
                      </button>
                      <button type="button" className="btn btn-danger btn-sm" onClick={handleDeleteCategoryRows}>삭제</button>
                    </div>
                  </div>
                  {categoryLoading && <div className="text-muted small mb-2">조회 중...</div>}
                  <div className="ag-theme-alpine-dark header-center" style={{ width: '100%', height: '560px' }}>
                    <AgGridReact<NewsCategoryRow>
                      rowData={categoryRows}
                      columnDefs={categoryColumnDefs}
                      defaultColDef={defaultColDef}
                      rowSelection="multiple"
                      rowDragManaged
                      animateRows
                      overlayNoRowsTemplate={selectedPressNo ? '데이터가 없습니다.' : '언론사를 선택해주세요.'}
                      getRowId={(params) => params.data.rowId}
                      onGridReady={handleCategoryGridReady}
                      onSelectionChanged={handleCategorySelectionChanged}
                      onCellValueChanged={handleCategoryCellValueChanged}
                      onRowDragEnd={handleCategoryRowDragEnd}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NewsRssManagePage;
