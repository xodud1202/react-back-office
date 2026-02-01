import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import api from '@/utils/axios/axios';
import Modal from '@/components/common/Modal';
import { getLoginUsrNo } from '@/utils/auth';
import type {
  CategoryOption,
  CategoryRow,
  CommonCode,
  GoodsMerch,
  GoodsSizeApi,
  GoodsSizeRow,
} from '@/components/goods/types';
import { formatNumber, normalizeNumberInput, parseNumber } from '@/components/goods/utils';
import GoodsEditBasicSection from '@/components/goods/GoodsEditBasicSection';
import GoodsCategorySection from '@/components/goods/GoodsCategorySection';
import GoodsImageManager from '@/components/goods/GoodsImageManager';
import GoodsSizeGrid from '@/components/goods/GoodsSizeGrid';

interface GoodsEditModalProps {
  isOpen: boolean;
  goodsId: string | null;
  goodsStatList: CommonCode[];
  goodsDivList: CommonCode[];
  goodsMerchList: GoodsMerch[];
  initialCategoryLevel1Options: CategoryOption[];
  onClose: () => void;
  onUpdated: () => void;
}

// 상품 수정 레이어 팝업을 렌더링합니다.
const GoodsEditModal = ({
  isOpen,
  goodsId,
  goodsStatList,
  goodsDivList,
  goodsMerchList,
  initialCategoryLevel1Options,
  onClose,
  onUpdated,
}: GoodsEditModalProps) => {
  const [editBasicState, setEditBasicState] = useState({
    editLoading: false,
    editSaving: false,
    hasForm: false,
  });
  const [goodsSizeLoading, setGoodsSizeLoading] = useState(false);
  const [goodsSizeRows, setGoodsSizeRows] = useState<GoodsSizeRow[]>([]);
  const [categoryLevel1Options, setCategoryLevel1Options] = useState<CategoryOption[]>(initialCategoryLevel1Options || []);
  const [categoryRows, setCategoryRows] = useState<CategoryRow[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const sizeRowSeqRef = useRef(0);

  // 상품 사이즈 목록을 조회합니다.
  const fetchGoodsSizeList = useCallback(async (targetGoodsId: string) => {
    setGoodsSizeLoading(true);
    try {
      const response = await api.get('/api/admin/goods/size/list', { params: { goodsId: targetGoodsId } });
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


  // 상품 사이즈 행을 추가합니다.
  const handleAddGoodsSizeRow = useCallback(() => {
    if (!goodsId) {
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
      goodsId,
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
  }, [goodsId, goodsSizeRows]);

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
    const loginUsrNo = getLoginUsrNo();
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
      setGoodsSizeRows((prev) => prev.filter((item) => item.rowKey !== rowKey));
    } catch (e: any) {
      console.error('상품 사이즈 삭제에 실패했습니다.');
      const message = e?.response?.data?.message;
      alert(message || '상품 사이즈 삭제에 실패했습니다.');
    }
  }, [goodsSizeRows]);

  // 상품 사이즈 순서 정보를 계산합니다.
  const buildGoodsSizeOrders = useCallback((rows: GoodsSizeRow[]) => rows.map((row, index) => ({
    sizeId: row.isNew ? row.sizeId : (row.originSizeId || row.sizeId),
    dispOrd: index + 1,
  })), []);

  // 상품 사이즈 순서를 저장합니다.
  const saveGoodsSizeOrder = useCallback(async (rows: GoodsSizeRow[], showAlert: boolean) => {
    if (!goodsId) {
      if (showAlert) {
        alert('상품코드를 확인해주세요.');
      }
      return;
    }
    const loginUsrNo = getLoginUsrNo();
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
        goodsId,
        udtNo: loginUsrNo,
        orders,
      });
    } catch (e: any) {
      console.error('사이즈 순서 저장에 실패했습니다.');
      const message = e?.response?.data?.message;
      if (showAlert) {
        alert(message || '사이즈 순서 저장에 실패했습니다.');
      }
    }
  }, [buildGoodsSizeOrders, goodsId]);

  // 상품 사이즈 순서 저장 함수를 전달합니다.
  const handleSaveSizeOrder = useCallback((rows: GoodsSizeRow[]) => {
    saveGoodsSizeOrder(rows, false);
  }, [saveGoodsSizeOrder]);

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
    const loginUsrNo = getLoginUsrNo();
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
  }, [goodsSizeRows]);

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
  ], [handleDeleteGoodsSizeRow, handleSaveGoodsSizeRow]);

  // 그리드 기본 컬럼 속성을 정의합니다.
  const defaultColDef = useMemo<ColDef>(() => ({
    resizable: true,
    sortable: false,
    cellClass: 'text-center',
  }), []);


  // 수정 팝업이 열릴 때 데이터를 로딩합니다.
  useEffect(() => {
    if (!isOpen || !goodsId) {
      return;
    }
    fetchGoodsSizeList(goodsId);
  }, [fetchGoodsSizeList, goodsId, isOpen]);

  // 팝업 닫힐 때 상태를 초기화합니다.
  useEffect(() => {
    if (isOpen) {
      return;
    }
    setGoodsSizeRows([]);
    setCategoryRows([]);
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="상품정보 수정"
      width="80vw"
      footerActions={(
        <button
          type="submit"
          form="goods-edit-form"
          className="btn btn-primary"
          disabled={editBasicState.editSaving || editBasicState.editLoading || !editBasicState.hasForm}
        >
          {editBasicState.editSaving ? '저장중...' : '저장'}
        </button>
      )}
    >
      <>
        <GoodsEditBasicSection
          isOpen={isOpen}
          goodsId={goodsId}
          goodsStatList={goodsStatList}
          goodsDivList={goodsDivList}
          goodsMerchList={goodsMerchList}
          categoryRows={categoryRows}
          categoryLoading={categoryLoading}
          onUpdated={onUpdated}
          onClose={onClose}
          onStateChange={setEditBasicState}
        />

        <GoodsCategorySection
          goodsId={goodsId}
          isOpen={isOpen}
          categoryRows={categoryRows}
          categoryLevel1Options={categoryLevel1Options}
          categoryLoading={categoryLoading}
          setCategoryRows={setCategoryRows}
          setCategoryLevel1Options={setCategoryLevel1Options}
          setCategoryLoading={setCategoryLoading}
        />

        <GoodsSizeGrid
          goodsSizeRows={goodsSizeRows}
          goodsSizeLoading={goodsSizeLoading}
          sizeColumnDefs={sizeColumnDefs}
          defaultColDef={defaultColDef}
          onAddRow={handleAddGoodsSizeRow}
          onSaveOrder={handleSaveSizeOrder}
          setGoodsSizeRows={setGoodsSizeRows}
        />

        <GoodsImageManager
          goodsId={goodsId}
          isOpen={isOpen}
        />
      </>
    </Modal>
  );
};

export default GoodsEditModal;
