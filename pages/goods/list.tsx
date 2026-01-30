import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import api from '@/utils/axios/axios';
import { dateFormatter } from '@/utils/common';
import type { ColDef, GridApi, GridReadyEvent, IDatasource, IGetRowsParams, ICellRendererParams, RowDragEndEvent, CellValueChangedEvent, CellEditingStoppedEvent, CellFocusedEvent } from 'ag-grid-community';
import { getCookie } from 'cookies-next';
import GoodsSearchForm from '@/components/goods/GoodsSearchForm';
import GoodsListGrid from '@/components/goods/GoodsListGrid';
import GoodsEditModal from '@/components/goods/GoodsEditModal';
import type { CategoryOption, CategoryRow, CommonCode, GoodsCategoryApi, GoodsData, GoodsDetail, GoodsListResponse, GoodsMerch, GoodsSizeApi, GoodsSizeRow } from '@/components/goods/types';
import { formatNumber, normalizeNumberInput, parseNumber } from '@/components/goods/utils';

const GoodsList = () => {
  // 공통코드 및 상태값 목록을 저장합니다.
  const [goodsStatList, setGoodsStatList] = useState<CommonCode[]>([]);
  const [goodsDivList, setGoodsDivList] = useState<CommonCode[]>([]);
  const [goodsMerchList, setGoodsMerchList] = useState<GoodsMerch[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [goodsSizeLoading, setGoodsSizeLoading] = useState(false);
  const [goodsSizeRows, setGoodsSizeRows] = useState<GoodsSizeRow[]>([]);
  const [categoryLevel1Options, setCategoryLevel1Options] = useState<CategoryOption[]>([]);
  const [categoryRows, setCategoryRows] = useState<CategoryRow[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [selectedGoodsId, setSelectedGoodsId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<GoodsDetail | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [searchParams, setSearchParams] = useState<Record<string, any>>({});
  const gridApiRef = useRef<GridReadyEvent<GoodsData>['api'] | null>(null);
  const sizeRowSeqRef = useRef(0);

  // 로그인 사용자 번호를 쿠키에서 조회합니다.
  const resolveLoginUsrNo = useCallback(() => {
    const cookieValue = getCookie('usrNo', { path: '/' });
    if (typeof cookieValue === 'string' && cookieValue.trim() !== '') {
      const parsed = Number(cookieValue);
      return Number.isNaN(parsed) ? null : parsed;
    }
    return null;
  }, []);

  // 상품 상태 공통코드를 조회합니다.
  const fetchGoodsStatList = useCallback(async () => {
    try {
      const response = await api.get('/api/admin/common/code', {
        params: { grpCd: 'GOODS_STAT' },
      });
      setGoodsStatList(response.data || []);
    } catch (e) {
      console.error('상품 상태 코드를 불러오는 데 실패했습니다.');
      alert('상품 상태 코드를 불러오는 데 실패했습니다.');
    }
  }, []);

  // 상품 분류 공통코드를 조회합니다.
  const fetchGoodsDivList = useCallback(async () => {
    try {
      const response = await api.get('/api/admin/common/code', {
        params: { grpCd: 'GOODS_DIV' },
      });
      setGoodsDivList(response.data || []);
    } catch (e) {
      console.error('상품 분류 코드를 불러오는 데 실패했습니다.');
      alert('상품 분류 코드를 불러오는 데 실패했습니다.');
    }
  }, []);

  // 상품 분류 목록을 조회합니다.
  const fetchGoodsMerchList = useCallback(async () => {
    try {
      const response = await api.get('/api/admin/goods/merch/list');
      setGoodsMerchList(response.data || []);
    } catch (e) {
      console.error('상품 분류 목록을 불러오는 데 실패했습니다.');
      alert('상품 분류 목록을 불러오는 데 실패했습니다.');
    }
  }, []);

  // 검색 폼 제출 시 조회 파라미터를 갱신합니다.
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const nextParams = Object.fromEntries(formData.entries());
    setSearchParams(nextParams);
  };

  // 검색 초기화 시 조회 파라미터를 초기화합니다.
  const handleReset = () => {
    setSearchParams({});
  };

  // 상품 사이즈 행을 추가합니다.
  const handleAddGoodsSizeRow = useCallback(() => {
    if (!selectedGoodsId) {
      alert('상품코드를 확인해주세요.');
      return;
    }
    const maxDispOrd = goodsSizeRows.reduce((max, row) => {
      const value = typeof row.dispOrd === 'number' ? row.dispOrd : Number(row.dispOrd);
      if (Number.isNaN(value)) {
        return max;
      }
      return Math.max(max, value);
    }, 0);
    const nextRow: GoodsSizeRow = {
      rowKey: `NEW-${Date.now()}-${sizeRowSeqRef.current++}`,
      goodsId: selectedGoodsId,
      sizeId: '',
      originSizeId: '',
      stockQty: 0,
      addAmt: 0,
      erpSyncYn: 'Y',
      erpSizeCd: '',
      dispOrd: maxDispOrd + 1,
      delYn: 'N',
      isNew: true,
    };
    setGoodsSizeRows((prev) => [...prev, nextRow]);
  }, [goodsSizeRows, selectedGoodsId]);

  // 상품 사이즈 목록을 조회합니다.
  const fetchGoodsSizeList = useCallback(async (goodsId: string) => {
    setGoodsSizeLoading(true);
    try {
      const response = await api.get('/api/admin/goods/size/list', { params: { goodsId } });
      const rows = (response.data || []).map((item: GoodsSizeApi) => ({
        rowKey: `${item.goodsId}-${item.sizeId}`,
        goodsId: item.goodsId,
        sizeId: item.sizeId,
        originSizeId: item.sizeId,
        stockQty: item.stockQty ?? 0,
        addAmt: item.addAmt ?? 0,
        erpSyncYn: item.erpSyncYn || 'Y',
        erpSizeCd: item.erpSizeCd || '',
        dispOrd: item.dispOrd ?? 0,
        delYn: item.delYn || 'N',
        isNew: false,
      }));
      setGoodsSizeRows(rows);
    } catch (e) {
      console.error('상품 사이즈 목록을 불러오는 데 실패했습니다.');
      alert('상품 사이즈 목록을 불러오는 데 실패했습니다.');
    } finally {
      setGoodsSizeLoading(false);
    }
  }, []);

  // 수정 팝업을 열고 대상 상품을 지정합니다.
  const openEditModal = useCallback((goodsId: string) => {
    setSelectedGoodsId(goodsId);
    setEditForm(null);
    setIsEditModalOpen(true);
  }, []);

  // 수정 팝업을 닫고 상태를 초기화합니다.
  const closeEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setSelectedGoodsId(null);
    setEditForm(null);
    setGoodsSizeRows([]);
    setCategoryRows([]);
  }, []);

  // 상품 상세 정보를 조회합니다.
  const fetchGoodsDetail = useCallback(async (goodsId: string) => {
    setEditLoading(true);
    try {
      const response = await api.get('/api/admin/goods/detail', {
        params: { goodsId },
      });
      setEditForm(response.data || null);
    } catch (e) {
      console.error('상품 상세 정보를 불러오는 데 실패했습니다.');
      alert('상품 상세 정보를 불러오는 데 실패했습니다.');
      closeEditModal();
    } finally {
      setEditLoading(false);
    }
  }, [closeEditModal]);

  // 카테고리 목록을 조회합니다.
  const fetchCategoryList = useCallback(async (categoryLevel: number, parentCategoryId?: string) => {
    const response = await api.get('/api/admin/category/list', {
      params: {
        categoryLevel,
        parentCategoryId,
      },
    });
    return (response.data || []) as CategoryOption[];
  }, []);

  // 상품 카테고리 목록을 조회합니다.
  const fetchGoodsCategoryList = useCallback(async (goodsId: string) => {
    setCategoryLoading(true);
    try {
      const response = await api.get('/api/admin/goods/category/list', { params: { goodsId } });
      const data = (response.data || []) as GoodsCategoryApi[];
      if (data.length === 0) {
        setCategoryRows([]);
        return;
      }
      const rows = await Promise.all(data.map(async (item) => {
        const level1Id = item.level1Id ?? '';
        const level2Id = item.level2Id ?? '';
        const level3Id = item.level3Id ?? '';
        const level2Options = level1Id ? await fetchCategoryList(2, level1Id) : [];
        const level2Disabled = level2Options.length === 0;
        const normalizedLevel2Id = level2Disabled ? '' : level2Id;
        const level3Options = normalizedLevel2Id ? await fetchCategoryList(3, normalizedLevel2Id) : [];
        const level3Disabled = level3Options.length === 0;
        const normalizedLevel3Id = level3Disabled ? '' : level3Id;
        return {
          rowKey: `${item.categoryId}-${item.dispOrd}`,
          level1Id,
          level2Id: normalizedLevel2Id,
          level3Id: normalizedLevel3Id,
          level2Options,
          level3Options,
          level2Disabled,
          level3Disabled,
          originCategoryId: item.categoryId,
        } as CategoryRow;
      }));
      setCategoryRows(rows);
    } catch (e) {
      console.error('카테고리 목록을 불러오는 데 실패했습니다.');
      alert('카테고리 목록을 불러오는 데 실패했습니다.');
    } finally {
      setCategoryLoading(false);
    }
  }, [fetchCategoryList]);

  // 카테고리 행을 추가합니다.
  const handleAddCategoryRow = useCallback(() => {
    setCategoryRows((prev) => ([
      ...prev,
      {
        rowKey: `CAT-${Date.now()}-${prev.length}`,
        level1Id: '',
        level2Id: '',
        level3Id: '',
        level2Options: [],
        level3Options: [],
        level2Disabled: true,
        level3Disabled: true,
        originCategoryId: '',
      },
    ]));
  }, []);

  // 1차 카테고리를 변경합니다.
  const handleCategoryLevel1Change = useCallback(async (rowKey: string, value: string) => {
    try {
      const level2Options = value ? await fetchCategoryList(2, value) : [];
      const level2Disabled = level2Options.length === 0;
      setCategoryRows((prev) => prev.map((row) => {
        if (row.rowKey !== rowKey) {
          return row;
        }
        return {
          ...row,
          level1Id: value,
          level2Id: '',
          level3Id: '',
          level2Options,
          level3Options: [],
          level2Disabled,
          level3Disabled: true,
        };
      }));
    } catch (e) {
      console.error('하위 카테고리 조회에 실패했습니다.');
      alert('하위 카테고리 조회에 실패했습니다.');
    }
  }, [fetchCategoryList]);

  // 2차 카테고리를 변경합니다.
  const handleCategoryLevel2Change = useCallback(async (rowKey: string, value: string) => {
    try {
      const level3Options = value ? await fetchCategoryList(3, value) : [];
      const level3Disabled = level3Options.length === 0;
      setCategoryRows((prev) => prev.map((row) => {
        if (row.rowKey !== rowKey) {
          return row;
        }
        return {
          ...row,
          level2Id: value,
          level3Id: '',
          level3Options,
          level3Disabled,
        };
      }));
    } catch (e) {
      console.error('하위 카테고리 조회에 실패했습니다.');
      alert('하위 카테고리 조회에 실패했습니다.');
    }
  }, [fetchCategoryList]);

  // 3차 카테고리를 변경합니다.
  const handleCategoryLevel3Change = useCallback((rowKey: string, value: string) => {
    setCategoryRows((prev) => prev.map((row) => (row.rowKey === rowKey ? { ...row, level3Id: value } : row)));
  }, []);

  // 카테고리 행을 저장합니다.
  const handleSaveCategoryRow = useCallback(async (rowKey: string) => {
    const row = categoryRows.find((item) => item.rowKey === rowKey);
    if (!row) {
      return;
    }
    if (!row.level1Id) {
      alert('카테고리를 선택해주세요.');
      return;
    }
    if (row.level2Options.length > 0 && !row.level2Id) {
      alert('카테고리를 선택해주세요.');
      return;
    }
    if (row.level3Options.length > 0 && !row.level3Id) {
      alert('카테고리를 선택해주세요.');
      return;
    }
    const categoryId = row.level3Id || row.level2Id || row.level1Id;
    if (!categoryId) {
      alert('카테고리를 선택해주세요.');
      return;
    }
    const loginUsrNo = resolveLoginUsrNo();
    if (!loginUsrNo) {
      alert('로그인 정보를 확인할 수 없습니다.');
      return;
    }
    try {
      await api.post('/api/admin/goods/category/save', {
        goodsId: selectedGoodsId,
        categoryId,
        originCategoryId: row.originCategoryId || null,
        dispOrd: categoryRows.findIndex((item) => item.rowKey === rowKey) + 1,
        regNo: loginUsrNo,
        udtNo: loginUsrNo,
      });
      alert('카테고리가 저장되었습니다.');
      setCategoryRows((prev) => prev.map((item) => (item.rowKey === rowKey ? { ...item, originCategoryId: categoryId } : item)));
    } catch (e: any) {
      console.error('카테고리 저장에 실패했습니다.');
      const message = e?.response?.data?.message;
      alert(message || '카테고리 저장에 실패했습니다.');
    }
  }, [categoryRows, resolveLoginUsrNo, selectedGoodsId]);

  // 카테고리 행을 삭제합니다.
  const handleDeleteCategoryRow = useCallback(async (rowKey: string) => {
    const row = categoryRows.find((item) => item.rowKey === rowKey);
    if (!row) {
      return;
    }
    if (!row.originCategoryId) {
      setCategoryRows((prev) => prev.filter((item) => item.rowKey !== rowKey));
      return;
    }
    const loginUsrNo = resolveLoginUsrNo();
    if (!loginUsrNo) {
      alert('로그인 정보를 확인할 수 없습니다.');
      return;
    }
    try {
      await api.post('/api/admin/goods/category/delete', {
        goodsId: selectedGoodsId,
        categoryId: row.originCategoryId,
        udtNo: loginUsrNo,
      });
      alert('카테고리가 삭제되었습니다.');
      setCategoryRows((prev) => prev.filter((item) => item.rowKey !== rowKey));
    } catch (e: any) {
      console.error('카테고리 삭제에 실패했습니다.');
      const message = e?.response?.data?.message;
      alert(message || '카테고리 삭제에 실패했습니다.');
    }
  }, [categoryRows, resolveLoginUsrNo, selectedGoodsId]);

  // 수정 폼 입력 값을 갱신합니다.
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm((prev) => (prev ? { ...prev, [name]: value } : prev));
  };

  // 상품 수정 폼의 숫자 입력값을 갱신합니다.
  const handleEditNumberChange = useCallback((field: keyof GoodsDetail) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = normalizeNumberInput(e.target.value);
    setEditForm((prev) => (prev ? { ...prev, [field]: nextValue } : prev));
  }, [normalizeNumberInput]);

  // 숫자 입력에서 빈 값일 때 0으로 보정합니다.
  const handleEditNumberBlur = useCallback((field: keyof GoodsDetail) => () => {
    setEditForm((prev) => {
      if (!prev) {
        return prev;
      }
      const value = prev[field];
      if (value === '' || value === null || value === undefined) {
        return { ...prev, [field]: '0' };
      }
      return prev;
    });
  }, []);

  // 상품 사이즈 입력값을 갱신합니다.
  // 상품 사이즈 순서 정보를 계산합니다.
  const buildGoodsSizeOrders = useCallback((rows: GoodsSizeRow[]) => rows.map((row, index) => ({
    sizeId: row.isNew ? row.sizeId : (row.originSizeId || row.sizeId),
    dispOrd: index + 1,
  })), []);

  // 상품 사이즈 행을 삭제합니다.
  const handleDeleteGoodsSizeRow = useCallback(async (rowKey: string) => {
    const row = goodsSizeRows.find((item) => item.rowKey === rowKey);
    if (!row) {
      return;
    }
    if (row.isNew) {
      setGoodsSizeRows((prev) => prev.filter((item) => item.rowKey !== rowKey));
      return;
    }
    const loginUsrNo = resolveLoginUsrNo();
    if (!loginUsrNo) {
      alert('로그인 정보를 확인할 수 없습니다.');
      return;
    }
    try {
      await api.post('/api/admin/goods/size/delete', {
        goodsId: row.goodsId,
        sizeId: row.originSizeId || row.sizeId,
        udtNo: loginUsrNo,
      });
      alert('상품 사이즈가 삭제되었습니다.');
      if (selectedGoodsId) {
        fetchGoodsSizeList(selectedGoodsId);
      }
    } catch (e: any) {
      console.error('상품 사이즈 삭제에 실패했습니다.');
      const message = e?.response?.data?.message;
      alert(message || '상품 사이즈 삭제에 실패했습니다.');
    }
  }, [fetchGoodsSizeList, goodsSizeRows, resolveLoginUsrNo, selectedGoodsId]);

  // 상품 사이즈 순서를 저장합니다.
  const saveGoodsSizeOrder = useCallback(async (rows: GoodsSizeRow[], showAlert: boolean) => {
    if (!selectedGoodsId) {
      if (showAlert) {
        alert('상품코드를 확인해주세요.');
      }
      return;
    }
    const loginUsrNo = resolveLoginUsrNo();
    if (!loginUsrNo) {
      if (showAlert) {
        alert('로그인 정보를 확인할 수 없습니다.');
      }
      return;
    }
    const orders = buildGoodsSizeOrders(rows);
    if (orders.some((order) => !order.sizeId || order.sizeId.trim() === '')) {
      if (showAlert) {
        alert('사이즈코드를 확인해주세요.');
      }
      return;
    }
    try {
      await api.post('/api/admin/goods/size/order/save', {
        goodsId: selectedGoodsId,
        udtNo: loginUsrNo,
        orders,
      });
      if (showAlert) {
        alert('사이즈 순서가 저장되었습니다.');
      }
    } catch (e: any) {
      console.error('사이즈 순서 저장에 실패했습니다.');
      const message = e?.response?.data?.message;
      if (showAlert) {
        alert(message || '사이즈 순서 저장에 실패했습니다.');
      }
    }
  }, [buildGoodsSizeOrders, fetchGoodsSizeList, resolveLoginUsrNo, selectedGoodsId]);

  // 드래그 후 순서 변경을 반영합니다.
  const handleSizeRowDragEnd = useCallback((event: RowDragEndEvent<GoodsSizeRow>) => {
    const api = event.api;
    const rowCount = api.getDisplayedRowCount();
    const nextRows: GoodsSizeRow[] = [];
    for (let i = 0; i < rowCount; i += 1) {
      const node = api.getDisplayedRowAtIndex(i);
      if (node?.data) {
        nextRows.push({ ...node.data, dispOrd: i + 1 });
      }
    }
    setGoodsSizeRows(nextRows);
    saveGoodsSizeOrder(nextRows, false);
  }, [saveGoodsSizeOrder]);

  const handleSizeCellValueChanged = useCallback((event: CellValueChangedEvent<GoodsSizeRow>) => {
    const rowKey = event.data?.rowKey;
    if (!rowKey) {
      return;
    }
    setGoodsSizeRows((prev) => prev.map((row) => (row.rowKey === rowKey ? { ...row, ...event.data } : row)));
  }, []);

  // 셀 편집 종료 시 편집 스타일을 정리합니다.
  const handleSizeCellEditingStopped = useCallback((event: CellEditingStoppedEvent<GoodsSizeRow>) => {
    event.api.refreshCells({
      rowNodes: [event.node],
      columns: [event.column.getColId()],
      force: true,
    });
  }, []);

  // 그리드 외부 클릭 시 편집 상태를 종료합니다.
  const handleSizeCellFocused = useCallback((event: CellFocusedEvent) => {
    if (event.rowIndex == null) {
      event.api.stopEditing();
      event.api.clearFocusedCell();
    }
  }, []);

  // 상품 사이즈 저장 요청을 처리합니다.
  const handleSaveGoodsSizeRow = useCallback(async (rowKey: string) => {
    const row = goodsSizeRows.find((item) => item.rowKey === rowKey);
    if (!row) {
      return;
    }
    if (!row.sizeId || row.sizeId.trim() === '') {
      alert('사이즈코드를 입력해주세요.');
      return;
    }
    const stockQtyValue = parseNumber(row.stockQty) ?? 0;
    const addAmtValue = parseNumber(row.addAmt) ?? 0;
    const dispOrdValue = goodsSizeRows.findIndex((item) => item.rowKey === rowKey) + 1;
    if (stockQtyValue === null) {
      alert('재고를 입력해주세요.');
      return;
    }
    if (addAmtValue === null) {
      alert('추가 금액을 입력해주세요.');
      return;
    }
    if (!row.erpSyncYn) {
      alert('ERP 연동 여부를 선택해주세요.');
      return;
    }
    if (row.isNew && (!row.erpSizeCd || row.erpSizeCd.trim() === '')) {
      alert('ERP 사이즈코드를 입력해주세요.');
      return;
    }
    const loginUsrNo = resolveLoginUsrNo();
    if (!loginUsrNo) {
      alert('로그인 정보를 확인할 수 없습니다.');
      return;
    }

    const requestBody = {
      goodsId: row.goodsId,
      sizeId: row.sizeId.trim(),
      originSizeId: row.originSizeId?.trim() || null,
      stockQty: stockQtyValue,
      addAmt: addAmtValue,
      erpSyncYn: row.erpSyncYn,
      erpSizeCd: row.erpSizeCd?.trim(),
      dispOrd: dispOrdValue <= 0 ? 0 : dispOrdValue,
      regNo: row.isNew ? loginUsrNo : undefined,
      udtNo: loginUsrNo,
    };

    try {
      await api.post('/api/admin/goods/size/save', requestBody);
      alert('상품 사이즈가 저장되었습니다.');
      setGoodsSizeRows((prev) => prev.map((item) => {
        if (item.rowKey !== rowKey) {
          return item;
        }
        return {
          ...item,
          goodsId: requestBody.goodsId,
          sizeId: requestBody.sizeId,
          originSizeId: requestBody.sizeId,
          stockQty: stockQtyValue,
          addAmt: addAmtValue,
          erpSyncYn: requestBody.erpSyncYn,
          erpSizeCd: requestBody.erpSizeCd ?? '',
          dispOrd: dispOrdValue <= 0 ? 0 : dispOrdValue,
          delYn: 'N',
          isNew: false,
        };
      }));
    } catch (e: any) {
      console.error('상품 사이즈 저장에 실패했습니다.');
      const message = e?.response?.data?.message;
      alert(message || '상품 사이즈 저장에 실패했습니다.');
    }
  }, [goodsSizeRows, resolveLoginUsrNo]);

  // 수정 내용을 저장합니다.
  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editForm) {
      return;
    }

    const udtNo = resolveLoginUsrNo();
    if (!udtNo) {
      alert('로그인 정보를 확인할 수 없습니다.');
      return;
    }

    const categoryList = categoryLoading
      ? undefined
      : categoryRows
        .map((row, index) => {
          const categoryId = row.level3Id || row.level2Id || row.level1Id;
          if (!categoryId) {
            return null;
          }
          return {
            categoryId,
            dispOrd: index + 1,
          };
        })
        .filter((item): item is { categoryId: string; dispOrd: number } => item !== null);

    const requestBody: Record<string, any> = {
      goodsId: editForm.goodsId,
      goodsNm: editForm.goodsNm?.trim(),
      goodsStatCd: editForm.goodsStatCd,
      goodsDivCd: editForm.goodsDivCd,
      goodsMerchId: editForm.goodsMerchId,
      goodsGroupId: editForm.goodsGroupId?.trim(),
      supplyAmt: parseNumber(editForm.supplyAmt) ?? 0,
      saleAmt: parseNumber(editForm.saleAmt) ?? 0,
      showYn: editForm.showYn,
      erpSupplyAmt: parseNumber(editForm.erpSupplyAmt) ?? 0,
      erpCostAmt: parseNumber(editForm.erpCostAmt) ?? 0,
      erpStyleCd: editForm.erpStyleCd?.trim(),
      erpColorCd: editForm.erpColorCd?.trim(),
      erpMerchCd: editForm.erpMerchCd?.trim(),
      udtNo,
    };

    if (categoryList !== undefined) {
      requestBody.categoryList = categoryList;
    }

    setEditSaving(true);
    try {
      await api.post('/api/admin/goods/update', requestBody);
      alert('상품 정보가 수정되었습니다.');
      closeEditModal();
      if (gridApiRef.current && typeof (gridApiRef.current as any).refreshInfiniteCache === 'function') {
        (gridApiRef.current as any).refreshInfiniteCache();
      } else if (gridApiRef.current) {
        applyDatasource(gridApiRef.current, createDataSource());
      }
    } catch (e: any) {
      console.error('상품 수정에 실패했습니다.');
      const message = e?.response?.data?.message;
      alert(message || '상품 수정에 실패했습니다.');
    } finally {
      setEditSaving(false);
    }
  };

  // 상품 목록 그리드 컬럼을 정의합니다.
  const columnDefs = useMemo<ColDef<GoodsData>[]>(() => [
    { headerName: '상품코드', field: 'goodsId', width: 150 },
    { headerName: '품번코드', field: 'erpStyleCd', width: 120 },
    {
      headerName: '상품명',
      field: 'goodsNm',
      width: 450,
      cellClass: 'text-start',
      cellRenderer: (params: ICellRendererParams<GoodsData>) => {
        const goodsId = params.data?.goodsId;
        if (!goodsId) {
          return params.value ?? '';
        }
        return (
          <button
            type="button"
            className="btn p-0 text-start"
            onClick={() => openEditModal(goodsId)}
          >
            {params.value}
          </button>
        );
      },
    },
    { headerName: '상품상태', field: 'goodsStatNm', width: 120 },
    { headerName: '상품분류', field: 'goodsDivNm', width: 120 },
    { headerName: '노출여부', field: 'showYn', width: 100 },
    {
      headerName: '등록일',
      field: 'regDt',
      width: 170,
      valueFormatter: (params) => dateFormatter({ value: params.value } as any),
    },
    {
      headerName: '수정일',
      field: 'udtDt',
      width: 170,
      valueFormatter: (params) => dateFormatter({ value: params.value } as any),
    },
  ], [openEditModal]);

  // 상품 사이즈 그리드 컬럼을 정의합니다.
  const sizeColumnDefs = useMemo<ColDef<GoodsSizeRow>[]>(() => [
    {
      headerName: '',
      field: 'rowKey',
      width: 50,
      rowDrag: true,
    },
    {
      headerName: '사이즈코드',
      field: 'sizeId',
      width: 120,
      editable: true,
    },
    {
      headerName: '재고',
      field: 'stockQty',
      width: 120,
      editable: (params) => params.data?.erpSyncYn === 'N',
      valueParser: (params) => {
        const parsed = normalizeNumberInput(params.newValue ?? '');
        return parsed === '' ? '0' : parsed;
      },
    },
    {
      headerName: '추가금액',
      field: 'addAmt',
      width: 120,
      editable: true,
      valueFormatter: (params) => formatNumber(params.value),
      valueParser: (params) => {
        const parsed = normalizeNumberInput(params.newValue ?? '');
        return parsed === '' ? '0' : parsed;
      },
    },
    {
      headerName: 'ERP연동',
      field: 'erpSyncYn',
      width: 120,
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: ['Y', 'N'],
      },
    },
    {
      headerName: 'ERP사이즈코드',
      field: 'erpSizeCd',
      width: 150,
      editable: (params) => params.data?.isNew === true,
    },
    {
      headerName: '저장',
      field: 'rowKey',
      width: 110,
      cellRenderer: (params: ICellRendererParams<GoodsSizeRow>) => (
        <button
          type="button"
          className="btn btn-sm btn-primary"
          onClick={() => handleSaveGoodsSizeRow(params.data?.rowKey || '')}
        >
          저장
        </button>
      ),
    },
    {
      headerName: '삭제',
      field: 'rowKey',
      width: 110,
      cellRenderer: (params: ICellRendererParams<GoodsSizeRow>) => (
        <button
          type="button"
          className="btn btn-sm btn-danger"
          onClick={() => handleDeleteGoodsSizeRow(params.data?.rowKey || '')}
        >
          삭제
        </button>
      ),
    },
  ], [formatNumber, handleDeleteGoodsSizeRow, handleSaveGoodsSizeRow, normalizeNumberInput]);

  // 그리드 기본 컬럼 속성을 정의합니다.
  const defaultColDef = useMemo<ColDef>(() => ({
    resizable: true,
    sortable: false,
    cellClass: 'text-center',
  }), []);

  // 상품 목록 그리드 데이터소스를 생성합니다.
  const createDataSource = useCallback((): IDatasource => ({
    getRows: async (params: IGetRowsParams) => {
      const pageSize = 20;
      const startRow = params.startRow ?? 0;
      const page = Math.floor(startRow / pageSize) + 1;

      setLoading(true);
      try {
        const response = await api.get('/api/admin/goods/list', {
          params: {
            ...searchParams,
            page,
          },
        });
        const data = (response.data || {}) as GoodsListResponse;
        params.successCallback(data.list || [], data.totalCount || 0);
      } catch (e) {
        console.error('상품 목록을 불러오는 데 실패했습니다.');
        params.failCallback();
      } finally {
        setLoading(false);
      }
    },
  }), [searchParams]);

  // 그리드 데이터소스를 안전하게 설정합니다.
  const applyDatasource = useCallback((apiInstance: GridApi<GoodsData>, datasource: IDatasource) => {
    if (typeof (apiInstance as any).setGridOption === 'function') {
      (apiInstance as any).setGridOption('datasource', datasource);
      return;
    }
    if (typeof (apiInstance as any).setDatasource === 'function') {
      (apiInstance as any).setDatasource(datasource);
    }
  }, []);

  // 상품 목록 그리드를 초기화합니다.
  const handleGridReady = useCallback((event: GridReadyEvent<GoodsData>) => {
    gridApiRef.current = event.api;
    applyDatasource(event.api, createDataSource());
  }, [applyDatasource, createDataSource]);

  // 초기 로딩 시 공통코드를 조회합니다.
  useEffect(() => {
    fetchGoodsStatList();
    fetchGoodsDivList();
    fetchGoodsMerchList();
  }, [fetchGoodsDivList, fetchGoodsMerchList, fetchGoodsStatList]);

  // 검색 조건 변경 시 그리드 데이터를 다시 조회합니다.
  useEffect(() => {
    if (!gridApiRef.current) {
      return;
    }
    applyDatasource(gridApiRef.current, createDataSource());
  }, [applyDatasource, createDataSource]);

  // 수정 팝업이 열릴 때 상품 상세 정보를 로딩합니다.
  useEffect(() => {
    if (!isEditModalOpen || !selectedGoodsId) {
      return;
    }
    fetchGoodsDetail(selectedGoodsId);
    fetchGoodsSizeList(selectedGoodsId);
    if (categoryLevel1Options.length === 0) {
      fetchCategoryList(1)
        .then((data) => setCategoryLevel1Options(data || []))
        .catch(() => {
          console.error('카테고리 목록을 불러오는 데 실패했습니다.');
          alert('카테고리 목록을 불러오는 데 실패했습니다.');
        });
    }
    fetchGoodsCategoryList(selectedGoodsId);
  }, [categoryLevel1Options.length, fetchCategoryList, fetchGoodsCategoryList, fetchGoodsDetail, fetchGoodsSizeList, isEditModalOpen, selectedGoodsId]);

  return (
    <>
      <div className="page-header">
        <h3 className="page-title"> 상품 목록 </h3>
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><a href="#">상품</a></li>
            <li className="breadcrumb-item active" aria-current="page">목록</li>
          </ol>
        </nav>
      </div>

      <GoodsSearchForm
        goodsStatList={goodsStatList}
        goodsDivList={goodsDivList}
        loading={loading}
        formRef={formRef}
        onSearch={handleSearch}
        onReset={handleReset}
      />

      <GoodsListGrid
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        onGridReady={handleGridReady}
      />

      <GoodsEditModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        editLoading={editLoading}
        editSaving={editSaving}
        editForm={editForm}
        goodsStatList={goodsStatList}
        goodsDivList={goodsDivList}
        goodsMerchList={goodsMerchList}
        onSubmit={handleEditSubmit}
        onEditChange={handleEditChange}
        onEditNumberChange={handleEditNumberChange}
        onEditNumberBlur={handleEditNumberBlur}
        formatNumber={formatNumber}
        categoryRows={categoryRows}
        categoryLevel1Options={categoryLevel1Options}
        categoryLoading={categoryLoading}
        onAddCategoryRow={handleAddCategoryRow}
        onCategoryLevel1Change={handleCategoryLevel1Change}
        onCategoryLevel2Change={handleCategoryLevel2Change}
        onCategoryLevel3Change={handleCategoryLevel3Change}
        onSaveCategoryRow={handleSaveCategoryRow}
        onDeleteCategoryRow={handleDeleteCategoryRow}
        goodsSizeRows={goodsSizeRows}
        goodsSizeLoading={goodsSizeLoading}
        sizeColumnDefs={sizeColumnDefs}
        defaultColDef={defaultColDef}
        onAddGoodsSizeRow={handleAddGoodsSizeRow}
        onSizeRowDragEnd={handleSizeRowDragEnd}
        onSizeCellValueChanged={handleSizeCellValueChanged}
        onSizeCellEditingStopped={handleSizeCellEditingStopped}
        onSizeCellFocused={handleSizeCellFocused}
      />
    </>
  );
};

export default GoodsList;
