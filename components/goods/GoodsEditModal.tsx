import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import api from '@/utils/axios/axios';
import Modal from '@/components/common/Modal';
import { getLoginUsrNo } from '@/utils/auth';
import type {
  CategoryOption,
  CategoryRow,
  CommonCode,
  GoodsDetail,
  GoodsMerch,
  GoodsSizeApi,
  GoodsSizeRow,
} from '@/components/goods/types';
import { formatNumber, normalizeNumberInput, parseNumber } from '@/components/goods/utils';
import GoodsCategorySection from '@/components/goods/GoodsCategorySection';
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
  const [editLoading, setEditLoading] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editForm, setEditForm] = useState<GoodsDetail | null>(null);
  const [goodsSizeLoading, setGoodsSizeLoading] = useState(false);
  const [goodsSizeRows, setGoodsSizeRows] = useState<GoodsSizeRow[]>([]);
  const [categoryLevel1Options, setCategoryLevel1Options] = useState<CategoryOption[]>(initialCategoryLevel1Options || []);
  const [categoryRows, setCategoryRows] = useState<CategoryRow[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const sizeRowSeqRef = useRef(0);

  // 상품 상세 정보를 조회합니다.
  const fetchGoodsDetail = useCallback(async (targetGoodsId: string) => {
    setEditLoading(true);
    try {
      const response = await api.get('/api/admin/goods/detail', {
        params: { goodsId: targetGoodsId },
      });
      setEditForm(response.data || null);
    } catch (e) {
      console.error('상품 상세 정보를 불러오는 데 실패했습니다.');
      alert('상품 상세 정보를 불러오는 데 실패했습니다.');
      onClose();
    } finally {
      setEditLoading(false);
    }
  }, [onClose]);

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


  // 수정 폼 입력 값을 갱신합니다.
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm((prev) => (prev ? { ...prev, [name]: value } : prev));
  };

  // 상품 수정 폼의 숫자 입력값을 갱신합니다.
  const handleEditNumberChange = useCallback((field: keyof GoodsDetail) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = normalizeNumberInput(e.target.value);
    setEditForm((prev) => (prev ? { ...prev, [field]: nextValue } : prev));
  }, []);

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


  // 상품 수정 요청을 처리합니다.
  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editForm) {
      return;
    }

    const udtNo = getLoginUsrNo();
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
      onUpdated();
      onClose();
    } catch (e: any) {
      console.error('상품 수정에 실패했습니다.');
      const message = e?.response?.data?.message;
      alert(message || '상품 수정에 실패했습니다.');
    } finally {
      setEditSaving(false);
    }
  };

  // 수정 팝업이 열릴 때 데이터를 로딩합니다.
  useEffect(() => {
    if (!isOpen || !goodsId) {
      return;
    }
    fetchGoodsDetail(goodsId);
    fetchGoodsSizeList(goodsId);
  }, [fetchGoodsDetail, fetchGoodsSizeList, goodsId, isOpen]);

  // 팝업 닫힐 때 상태를 초기화합니다.
  useEffect(() => {
    if (isOpen) {
      return;
    }
    setEditForm(null);
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
                  <input
                    name="supplyAmt"
                    type="text"
                    className="form-control"
                    value={formatNumber(editForm.supplyAmt ?? '')}
                    onChange={handleEditNumberChange('supplyAmt')}
                    onBlur={handleEditNumberBlur('supplyAmt')}
                    required
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-group">
                  <label>판매가 <span className="text-danger">*</span></label>
                  <input
                    name="saleAmt"
                    type="text"
                    className="form-control"
                    value={formatNumber(editForm.saleAmt ?? '')}
                    onChange={handleEditNumberChange('saleAmt')}
                    onBlur={handleEditNumberBlur('saleAmt')}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-3">
                <div className="form-group">
                  <label>ERP 공급가</label>
                  <input
                    name="erpSupplyAmt"
                    type="text"
                    className="form-control"
                    value={formatNumber(editForm.erpSupplyAmt ?? '')}
                    onChange={handleEditNumberChange('erpSupplyAmt')}
                    disabled
                  />
                </div>
              </div>
              <div className="col-md-3">
                <div className="form-group">
                  <label>ERP 원가</label>
                  <input
                    name="erpCostAmt"
                    type="text"
                    className="form-control"
                    value={formatNumber(editForm.erpCostAmt ?? '')}
                    onChange={handleEditNumberChange('erpCostAmt')}
                    disabled
                  />
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
        </>
      )}
    </Modal>
  );
};

export default GoodsEditModal;
