import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  CellValueChangedEvent,
  GridApi,
  GridReadyEvent,
  RowDragEndEvent,
  SelectionChangedEvent,
} from 'ag-grid-community';
import { requireLoginUsrNo } from '@/utils/auth';
import { extractApiErrorMessage } from '@/utils/api/error';
import { confirmAction, notifyError, notifySuccess } from '@/utils/ui/feedback';
import type { NewsCategoryRow, NewsPressRow } from '@/components/news/rss/types';
import {
  deleteNewsRssCategoryApi,
  deleteNewsRssPressApi,
  fetchNewsRssCategoryListApi,
  fetchNewsRssPressListApi,
  saveNewsRssCategoryApi,
  saveNewsRssPressApi,
} from '@/services/newsRssApi';
import {
  mapCategoryRowsFromApi,
  mapPressRowsFromApi,
  normalizeCategoryRows,
  normalizePressRows,
  validateCategoryRows,
  validatePressRows,
} from '@/utils/news/rssMappers';

/**
 * 뉴스 RSS 관리 화면 로직을 관리합니다.
 * @returns 뉴스 RSS 관리 화면 상태/이벤트입니다.
 */
const useNewsRssManage = () => {
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

  // 언론사 목록을 조회합니다.
  const fetchPressList = useCallback(async () => {
    setPressLoading(true);
    try {
      const list = await fetchNewsRssPressListApi();
      const normalizedRows = normalizePressRows(mapPressRowsFromApi(list));
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
      setSelectedPressRowIds([]);
    } catch (error) {
      console.error('언론사 목록 조회에 실패했습니다.', error);
      notifyError('언론사 목록 조회에 실패했습니다.');
    } finally {
      setPressLoading(false);
    }
  }, []);

  // 선택 언론사의 카테고리 목록을 조회합니다.
  const fetchCategoryList = useCallback(async (pressNo: number | null) => {
    if (!pressNo) {
      setCategoryRows([]);
      return;
    }
    setCategoryLoading(true);
    try {
      const list = await fetchNewsRssCategoryListApi(pressNo);
      const normalizedRows = normalizeCategoryRows(mapCategoryRowsFromApi(list, pressNo));
      setCategoryRows(normalizedRows);
      setSelectedCategoryRowIds([]);
    } catch (error) {
      console.error('카테고리 목록 조회에 실패했습니다.', error);
      notifyError('카테고리 목록 조회에 실패했습니다.');
    } finally {
      setCategoryLoading(false);
    }
  }, []);

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
  }, []);

  // 카테고리 신규 행을 추가합니다.
  const handleAddCategoryRow = useCallback(() => {
    if (!selectedPressNo) {
      notifyError('언론사를 먼저 선택해주세요.');
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
  }, [selectedPressNo]);

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
    const gridApi = event.api;
    const rowCount = gridApi.getDisplayedRowCount();
    const nextRows: NewsPressRow[] = [];
    for (let index = 0; index < rowCount; index += 1) {
      const node = gridApi.getDisplayedRowAtIndex(index);
      if (node?.data) {
        nextRows.push({ ...node.data });
      }
    }
    setPressRows(normalizePressRows(nextRows));
  }, []);

  // 카테고리 드래그 정렬 종료 시 목록 순서를 반영합니다.
  const handleCategoryRowDragEnd = useCallback((event: RowDragEndEvent<NewsCategoryRow>) => {
    const gridApi = event.api;
    const rowCount = gridApi.getDisplayedRowCount();
    const nextRows: NewsCategoryRow[] = [];
    for (let index = 0; index < rowCount; index += 1) {
      const node = gridApi.getDisplayedRowAtIndex(index);
      if (node?.data) {
        nextRows.push({ ...node.data });
      }
    }
    setCategoryRows(normalizeCategoryRows(nextRows));
  }, []);

  // 언론사 목록을 저장합니다.
  const handleSavePressRows = useCallback(async () => {
    if (pressRows.length === 0) {
      notifyError('저장할 언론사가 없습니다.');
      return;
    }
    const validationMessage = validatePressRows(pressRows);
    if (validationMessage) {
      notifyError(validationMessage);
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
      const result = await saveNewsRssPressApi(payload);
      if (result >= 0) {
        notifySuccess('언론사 정보가 저장되었습니다.');
        await fetchPressList();
      }
    } catch (error) {
      const message = extractApiErrorMessage(error, '언론사 저장에 실패했습니다.');
      console.error(message, error);
      notifyError(message);
    } finally {
      setPressSaving(false);
    }
  }, [fetchPressList, pressRows]);

  // 카테고리 목록을 저장합니다.
  const handleSaveCategoryRows = useCallback(async () => {
    if (!selectedPressNo) {
      notifyError('언론사를 먼저 선택해주세요.');
      return;
    }
    if (categoryRows.length === 0) {
      notifyError('저장할 카테고리가 없습니다.');
      return;
    }
    const validationMessage = validateCategoryRows(categoryRows);
    if (validationMessage) {
      notifyError(validationMessage);
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
      const result = await saveNewsRssCategoryApi(payload);
      if (result >= 0) {
        notifySuccess('카테고리 정보가 저장되었습니다.');
        await fetchCategoryList(selectedPressNo);
      }
    } catch (error) {
      const message = extractApiErrorMessage(error, '카테고리 저장에 실패했습니다.');
      console.error(message, error);
      notifyError(message);
    } finally {
      setCategorySaving(false);
    }
  }, [categoryRows, fetchCategoryList, selectedPressNo]);

  // 선택된 언론사를 삭제합니다.
  const handleDeletePressRows = useCallback(async () => {
    if (selectedPressRowIds.length === 0) {
      notifyError('삭제할 언론사를 선택해주세요.');
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

    const isConfirmed = confirmAction('선택한 언론사를 삭제하시겠습니까?');
    if (!isConfirmed) {
      return;
    }

    try {
      if (savedPressNoList.length > 0) {
        await deleteNewsRssPressApi({
          pressNoList: savedPressNoList,
          udtNo: usrNo,
        });
      }
      notifySuccess('언론사가 삭제되었습니다.');
      await fetchPressList();
    } catch (error) {
      const message = extractApiErrorMessage(error, '언론사 삭제에 실패했습니다.');
      console.error(message, error);
      notifyError(message);
    }
  }, [fetchPressList, pressRows, selectedPressRowIds]);

  // 선택된 카테고리를 삭제합니다.
  const handleDeleteCategoryRows = useCallback(async () => {
    if (!selectedPressNo) {
      notifyError('언론사를 먼저 선택해주세요.');
      return;
    }
    if (selectedCategoryRowIds.length === 0) {
      notifyError('삭제할 카테고리를 선택해주세요.');
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

    const isConfirmed = confirmAction('선택한 카테고리를 삭제하시겠습니까?');
    if (!isConfirmed) {
      return;
    }

    try {
      if (categoryCdList.length > 0) {
        await deleteNewsRssCategoryApi({
          pressNo: selectedPressNo,
          categoryCdList,
          udtNo: usrNo,
        });
      }
      notifySuccess('카테고리가 삭제되었습니다.');
      await fetchCategoryList(selectedPressNo);
    } catch (error) {
      const message = extractApiErrorMessage(error, '카테고리 삭제에 실패했습니다.');
      console.error(message, error);
      notifyError(message);
    }
  }, [categoryRows, fetchCategoryList, selectedCategoryRowIds, selectedPressNo]);

  // 최초 진입 시 언론사 목록을 조회합니다.
  useEffect(() => {
    fetchPressList();
  }, [fetchPressList]);

  // 선택 언론사가 변경되면 카테고리 목록을 조회합니다.
  useEffect(() => {
    fetchCategoryList(selectedPressNo);
  }, [fetchCategoryList, selectedPressNo]);

  return {
    pressRows,
    categoryRows,
    selectedPressNo,
    pressLoading,
    categoryLoading,
    pressSaving,
    categorySaving,
    handlePressGridReady,
    handleCategoryGridReady,
    handlePressSelectionChanged,
    handleCategorySelectionChanged,
    handleAddPressRow,
    handleAddCategoryRow,
    handlePressCellValueChanged,
    handleCategoryCellValueChanged,
    handlePressRowDragEnd,
    handleCategoryRowDragEnd,
    handleSavePressRows,
    handleSaveCategoryRows,
    handleDeletePressRows,
    handleDeleteCategoryRows,
  };
};

export default useNewsRssManage;
