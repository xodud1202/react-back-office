import React, { useCallback, useEffect, useState } from 'react';
import api from '@/utils/axios/axios';
import { requireLoginUsrNo } from '@/utils/auth';
import type {
  CommonCode,
  GoodsDetail,
  GoodsMerch,
} from '@/components/goods/types';
import { formatNumber, normalizeNumberInput, parseNumber } from '@/components/goods/utils';

interface GoodsEditBasicSectionProps {
  isOpen: boolean;
  goodsId: string | null;
  goodsStatList: CommonCode[];
  goodsDivList: CommonCode[];
  goodsMerchList: GoodsMerch[];
  onUpdated: () => void;
  onClose: () => void;
  onStateChange: (state: {
    editLoading: boolean;
    editSaving: boolean;
    hasForm: boolean;
  }) => void;
}

// 상품 기본 정보 수정 영역을 렌더링합니다.
const GoodsEditBasicSection = ({
  isOpen,
  goodsId,
  goodsStatList,
  goodsDivList,
  goodsMerchList,
  onUpdated,
  onClose,
  onStateChange,
}: GoodsEditBasicSectionProps) => {
  const [editLoading, setEditLoading] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editForm, setEditForm] = useState<GoodsDetail | null>(null);

  // 상태 변경을 상위로 전달합니다.
  useEffect(() => {
    onStateChange({
      editLoading,
      editSaving,
      hasForm: Boolean(editForm),
    });
  }, [editForm, editLoading, editSaving, onStateChange]);

  // 상품 상세 정보를 조회합니다.
  const fetchGoodsDetail = useCallback(async (targetGoodsId: string) => {
    setEditLoading(true);
    try {
      const response = await api.get('/api/admin/goods/detail', {
        params: { goodsId: targetGoodsId },
      });
      setEditForm(response.data || null);
    } catch {
      console.error('상품 상세 정보를 불러오는 데 실패했습니다.');
      alert('상품 상세 정보를 불러오는 데 실패했습니다.');
      onClose();
    } finally {
      setEditLoading(false);
    }
  }, [onClose]);

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

  // 상품 수정 요청을 처리합니다.
  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editForm) {
      return;
    }

    const udtNo = requireLoginUsrNo();
    if (!udtNo) {
      return;
    }

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
  }, [fetchGoodsDetail, goodsId, isOpen]);

  // 팝업 닫힐 때 상태를 초기화합니다.
  useEffect(() => {
    if (isOpen) {
      return;
    }
    setEditForm(null);
  }, [isOpen]);

  if (editLoading || !editForm) {
    return <div className="text-center">로딩중...</div>;
  }

  return (
    <>
        <div className="d-flex align-items-center justify-content-between mb-4">
            <h5 className="mb-0">기본정보</h5>
            <button
                type="submit"
                form="goods-edit-form"
                className="btn btn-sm btn-primary"
                disabled={editSaving || editLoading || !editForm}
            >
                {editSaving ? '저장중...' : '저장'}
            </button>
        </div>
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
    </>
  );
};

export default GoodsEditBasicSection;
