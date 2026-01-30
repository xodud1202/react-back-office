import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import api from '@/utils/axios/axios';
import { dateFormatter } from '@/utils/common';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef, GridApi, GridReadyEvent, IDatasource, IGetRowsParams, ICellRendererParams } from 'ag-grid-community';
import Modal from '@/components/common/Modal';
import { getCookie } from 'cookies-next';

// 상품 목록 데이터 타입 정의
interface GoodsData {
  goodsId: string;
  erpStyleCd: string;
  goodsNm: string;
  goodsStatCd: string;
  goodsStatNm: string;
  goodsDivCd: string;
  goodsDivNm: string;
  showYn: string;
  regDt: string;
  udtDt: string;
}

interface CommonCode {
  grpCd: string;
  cd: string;
  cdNm: string;
  dispOrd: number;
}

interface GoodsMerch {
  goodsMerchId: string;
  goodsMerchNm: string;
}

interface GoodsDetail {
  goodsId: string;
  goodsDivCd: string;
  goodsStatCd: string;
  goodsNm: string;
  goodsGroupId: string;
  goodsMerchId: string;
  supplyAmt: number | string;
  saleAmt: number | string;
  showYn: string;
  erpSupplyAmt: number | string;
  erpCostAmt: number | string;
  erpStyleCd: string;
  erpColorCd: string;
  erpMerchCd: string;
}

interface GoodsSizeRow {
  rowKey: string;
  goodsId: string;
  sizeId: string;
  originSizeId?: string;
  stockQty: number | string;
  addAmt: number | string;
  erpSyncYn: string;
  erpSizeCd: string;
  dispOrd: number | string;
  delYn?: string;
  isNew: boolean;
}

interface GoodsSizeApi {
  goodsId: string;
  sizeId: string;
  stockQty: number;
  addAmt: number;
  erpSyncYn: string;
  erpSizeCd: string;
  dispOrd: number;
  delYn: string;
}

interface GoodsListResponse {
  list: GoodsData[];
  totalCount: number;
  page: number;
  pageSize: number;
}

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
  const [selectedGoodsId, setSelectedGoodsId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<GoodsDetail | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [searchParams, setSearchParams] = useState<Record<string, any>>({});
  const gridApiRef = useRef<GridReadyEvent<GoodsData>['api'] | null>(null);
  const sizeRowSeqRef = useRef(0);

  // 숫자 입력에서 숫자만 추출합니다.
  const normalizeNumberInput = useCallback((value: string) => value.replace(/[^0-9]/g, ''), []);

  // 숫자 값을 천 단위 콤마로 표시합니다.
  const formatNumber = useCallback((value: number | string | null | undefined) => {
    if (value === null || value === undefined) {
      return '';
    }
    const digits = String(value).replace(/[^0-9]/g, '');
    if (digits === '') {
      return '';
    }
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }, []);

  // 숫자 문자열을 숫자로 변환합니다.
  const parseNumber = useCallback((value: number | string | null | undefined) => {
    if (value === null || value === undefined) {
      return null;
    }
    const digits = String(value).replace(/[^0-9]/g, '');
    return digits === '' ? null : Number(digits);
  }, []);

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

  // 상품 사이즈 입력값을 갱신합니다.
  const handleGoodsSizeChange = useCallback((rowKey: string, field: keyof GoodsSizeRow, value: string) => {
    setGoodsSizeRows((prev) => prev.map((row) => (row.rowKey === rowKey ? { ...row, [field]: value } : row)));
  }, []);

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
    const stockQtyValue = parseNumber(row.stockQty);
    const addAmtValue = parseNumber(row.addAmt);
    const dispOrdValue = parseNumber(row.dispOrd) ?? 0;
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
      dispOrd: dispOrdValue,
      regNo: row.isNew ? loginUsrNo : undefined,
      udtNo: loginUsrNo,
    };

    try {
      await api.post('/api/admin/goods/size/save', requestBody);
      alert('상품 사이즈가 저장되었습니다.');
      if (selectedGoodsId) {
        fetchGoodsSizeList(selectedGoodsId);
      }
    } catch (e: any) {
      console.error('상품 사이즈 저장에 실패했습니다.');
      const message = e?.response?.data?.message;
      alert(message || '상품 사이즈 저장에 실패했습니다.');
    }
  }, [fetchGoodsSizeList, goodsSizeRows, resolveLoginUsrNo, selectedGoodsId]);

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

    const requestBody = {
      goodsId: editForm.goodsId,
      goodsNm: editForm.goodsNm?.trim(),
      goodsStatCd: editForm.goodsStatCd,
      goodsDivCd: editForm.goodsDivCd,
      goodsMerchId: editForm.goodsMerchId,
      goodsGroupId: editForm.goodsGroupId?.trim(),
      supplyAmt: parseNumber(editForm.supplyAmt),
      saleAmt: parseNumber(editForm.saleAmt),
      showYn: editForm.showYn,
      erpSupplyAmt: parseNumber(editForm.erpSupplyAmt),
      erpCostAmt: parseNumber(editForm.erpCostAmt),
      erpStyleCd: editForm.erpStyleCd?.trim(),
      erpColorCd: editForm.erpColorCd?.trim(),
      erpMerchCd: editForm.erpMerchCd?.trim(),
      udtNo,
    };

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
      headerName: '노출순서',
      field: 'dispOrd',
      width: 120,
      cellRenderer: (params: ICellRendererParams<GoodsSizeRow>) => (
        <input
          type="number"
          className="form-control"
          value={params.data?.dispOrd ?? ''}
          onChange={(e) => handleGoodsSizeChange(params.data?.rowKey || '', 'dispOrd', normalizeNumberInput(e.target.value))}
        />
      ),
    },
    {
      headerName: '사이즈코드',
      field: 'sizeId',
      width: 120,
      cellRenderer: (params: ICellRendererParams<GoodsSizeRow>) => (
        <input
          type="text"
          className="form-control"
          value={params.data?.sizeId ?? ''}
          onChange={(e) => handleGoodsSizeChange(params.data?.rowKey || '', 'sizeId', e.target.value)}
        />
      ),
    },
    {
      headerName: '재고',
      field: 'stockQty',
      width: 120,
      cellRenderer: (params: ICellRendererParams<GoodsSizeRow>) => {
        const row = params.data;
        const disabled = row?.erpSyncYn !== 'N';
        return (
          <input
            type="number"
            className="form-control"
            value={row?.stockQty ?? ''}
            onChange={(e) => handleGoodsSizeChange(row?.rowKey || '', 'stockQty', normalizeNumberInput(e.target.value))}
            disabled={disabled}
          />
        );
      },
    },
    {
      headerName: '추가금액',
      field: 'addAmt',
      width: 120,
      cellRenderer: (params: ICellRendererParams<GoodsSizeRow>) => (
        <input
          type="text"
          className="form-control"
          value={formatNumber(params.data?.addAmt ?? '')}
          onChange={(e) => handleGoodsSizeChange(params.data?.rowKey || '', 'addAmt', normalizeNumberInput(e.target.value))}
        />
      ),
    },
    {
      headerName: 'ERP연동',
      field: 'erpSyncYn',
      width: 120,
      cellRenderer: (params: ICellRendererParams<GoodsSizeRow>) => (
        <select
          className="form-select"
          value={params.data?.erpSyncYn ?? 'Y'}
          onChange={(e) => handleGoodsSizeChange(params.data?.rowKey || '', 'erpSyncYn', e.target.value)}
        >
          <option value="Y">Y</option>
          <option value="N">N</option>
        </select>
      ),
    },
    {
      headerName: 'ERP사이즈코드',
      field: 'erpSizeCd',
      width: 150,
      cellRenderer: (params: ICellRendererParams<GoodsSizeRow>) => {
        const row = params.data;
        const disabled = !row?.isNew;
        return (
          <input
            type="text"
            className="form-control"
            value={row?.erpSizeCd ?? ''}
            onChange={(e) => handleGoodsSizeChange(row?.rowKey || '', 'erpSizeCd', e.target.value)}
            disabled={disabled}
          />
        );
      },
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
  ], [formatNumber, handleDeleteGoodsSizeRow, handleGoodsSizeChange, handleSaveGoodsSizeRow, normalizeNumberInput]);

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
  }, [fetchGoodsDetail, fetchGoodsSizeList, isEditModalOpen, selectedGoodsId]);

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

      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card">
            <div className="card-body">
              <form ref={formRef} onSubmit={handleSearch} onReset={handleReset} className="forms-sample">
                <div className="row">
                  <div className="col-md-2">
                    <div className="form-group">
                      <label>검색 구분</label>
                      <select name="searchGb" defaultValue="goodsId" className="form-select">
                        <option value="goodsId">상품코드</option>
                        <option value="erpStyleCd">ERP품번코드</option>
                        <option value="goodsNm">상품명</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-group">
                      <label>검색어</label>
                      <input
                        type="text"
                        name="searchValue"
                        className="form-control"
                        placeholder="검색어를 입력하세요"
                      />
                    </div>
                  </div>
                  <div className="col-md-2">
                    <div className="form-group">
                      <label>상품상태</label>
                      <select name="goodsStatCd" defaultValue="" className="form-select">
                        <option value="">전체</option>
                        {goodsStatList.map((item) => (
                          <option key={item.cd} value={item.cd}>{item.cdNm}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="col-md-2">
                    <div className="form-group">
                      <label>상품분류</label>
                      <select name="goodsDivCd" defaultValue="" className="form-select">
                        <option value="">전체</option>
                        {goodsDivList.map((item) => (
                          <option key={item.cd} value={item.cd}>{item.cdNm}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="col-md-2">
                    <div className="form-group">
                      <label>노출여부</label>
                      <select name="showYn" defaultValue="" className="form-select">
                        <option value="">전체</option>
                        <option value="Y">Y</option>
                        <option value="N">N</option>
                      </select>
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
                <AgGridReact<GoodsData>
                  columnDefs={columnDefs}
                  defaultColDef={defaultColDef}
                  domLayout="autoHeight"
                  overlayNoRowsTemplate="데이터가 없습니다."
                  rowModelType="infinite"
                  cacheBlockSize={20}
                  pagination
                  paginationPageSize={20}
                  getRowId={(params) => String(params.data?.goodsId ?? '')}
                  onGridReady={handleGridReady}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        title="상품정보 수정"
        width="80vw"
        footerActions={(
          <button
            type="submit"
            form="goods-edit-form"
            className="btn btn-primary"
            disabled={editSaving || editLoading || !editForm}
          >
            {editSaving ? '저장중...' : '저장'}
          </button>
        )}
      >
        {editLoading || !editForm ? (
          <div className="text-center">로딩중...</div>
        ) : (
          <>
            <form id="goods-edit-form" onSubmit={handleEditSubmit} className="forms-sample">
            <div className="row">
              <div className="col-md-4">
                <div className="form-group">
                  <label>상품코드</label>
                  <input name="goodsId" type="text" className="form-control" value={editForm.goodsId || ''} disabled />
                </div>
              </div>
                <div className="col-md-4">
                <div className="form-group">
                  <label>ERP 품번코드</label>
                  <input name="erpStyleCd" type="text" className="form-control" value={editForm.erpStyleCd || ''} onChange={handleEditChange} disabled />
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-group">
                  <label>상품그룹코드 <span className="text-danger">*</span></label>
                  <input name="goodsGroupId" type="text" className="form-control" value={editForm.goodsGroupId || ''} onChange={handleEditChange} required />
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-12">
                <div className="form-group">
                  <label>상품명 <span className="text-danger">*</span></label>
                  <input name="goodsNm" type="text" className="form-control" value={editForm.goodsNm || ''} onChange={handleEditChange} required />
                </div>
              </div>
            </div>

            <div className="row">
                <div className="col-md-3">
                <div className="form-group">
                  <label>상품분류 <span className="text-danger">*</span></label>
                  <select name="goodsMerchId" className="form-select" value={editForm.goodsMerchId || ''} onChange={handleEditChange} required>
                    <option value="">선택</option>
                    {goodsMerchList.map((item) => (
                      <option key={item.goodsMerchId} value={item.goodsMerchId}>{item.goodsMerchNm}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="col-md-3">
                <div className="form-group">
                  <label>상품구분 <span className="text-danger">*</span></label>
                  <select name="goodsDivCd" className="form-select" value={editForm.goodsDivCd || ''} onChange={handleEditChange} required>
                    <option value="">선택</option>
                    {goodsDivList.map((item) => (
                      <option key={item.cd} value={item.cd}>{item.cdNm}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="col-md-3">
                <div className="form-group">
                  <label>상품상태 <span className="text-danger">*</span></label>
                  <select name="goodsStatCd" className="form-select" value={editForm.goodsStatCd || ''} onChange={handleEditChange} required>
                    <option value="">선택</option>
                    {goodsStatList.map((item) => (
                      <option key={item.cd} value={item.cd}>{item.cdNm}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="col-md-3">
                <div className="form-group">
                  <label>노출여부 <span className="text-danger">*</span></label>
                  <select name="showYn" className="form-select" value={editForm.showYn || ''} onChange={handleEditChange} required>
                    <option value="">선택</option>
                    <option value="Y">Y</option>
                    <option value="N">N</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="row">
                <div className="col-md-4">
                <div className="form-group">
                  <label>공급가 <span className="text-danger">*</span></label>
                  <input name="supplyAmt" type="text" className="form-control" value={formatNumber(editForm.supplyAmt ?? '')} onChange={handleEditNumberChange('supplyAmt')} required />
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-group">
                  <label>판매가 <span className="text-danger">*</span></label>
                  <input name="saleAmt" type="text" className="form-control" value={formatNumber(editForm.saleAmt ?? '')} onChange={handleEditNumberChange('saleAmt')} required />
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-3">
                <div className="form-group">
                  <label>ERP 공급가</label>
                  <input name="erpSupplyAmt" type="text" className="form-control" value={formatNumber(editForm.erpSupplyAmt ?? '')} onChange={handleEditNumberChange('erpSupplyAmt')} disabled />
                </div>
              </div>
              <div className="col-md-3">
                <div className="form-group">
                  <label>ERP 원가</label>
                  <input name="erpCostAmt" type="text" className="form-control" value={formatNumber(editForm.erpCostAmt ?? '')} onChange={handleEditNumberChange('erpCostAmt')} disabled />
                </div>
              </div>
              <div className="col-md-3">
                <div className="form-group">
                  <label>ERP 컬러코드</label>
                  <input name="erpColorCd" type="text" className="form-control" value={editForm.erpColorCd || ''} onChange={handleEditChange} disabled />
                </div>
              </div>
              <div className="col-md-3">
                <div className="form-group">
                  <label>ERP 상품구분코드</label>
                  <input name="erpMerchCd" type="text" className="form-control" value={editForm.erpMerchCd || ''} onChange={handleEditChange} disabled />
                </div>
              </div>
            </div>
          </form>
            <div className="mt-4">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <h5 className="mb-0">사이즈 및 재고</h5>
                <button type="button" className="btn btn-sm btn-secondary" onClick={handleAddGoodsSizeRow}>
                  사이즈 추가
                </button>
              </div>
              {goodsSizeLoading ? (
                <div className="text-center">사이즈 로딩중...</div>
              ) : (
                <div className="ag-theme-alpine-dark header-center" style={{ width: '100%', height: '300px' }}>
                  <AgGridReact<GoodsSizeRow>
                    columnDefs={sizeColumnDefs}
                    defaultColDef={defaultColDef}
                    rowData={goodsSizeRows}
                    domLayout="normal"
                    overlayNoRowsTemplate="데이터가 없습니다."
                    getRowId={(params) => String(params.data?.rowKey ?? '')}
                  />
                </div>
              )}
            </div>
          </>
        )}
      </Modal>
    </>
  );
};

export default GoodsList;
