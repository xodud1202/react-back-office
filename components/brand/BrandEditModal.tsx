import React, { useCallback, useEffect, useMemo, useState } from 'react';
import api from '@/utils/axios/axios';
import { getLoginUsrNo } from '@/utils/auth';
import type { BrandDetail, BrandSavePayload } from '@/components/brand/types';

interface BrandEditModalProps {
  isOpen: boolean;
  brandNo: number | null;
  onClose: () => void;
  onSaved: () => void;
}

interface BrandFormState {
  brandNo: number | null;
  brandNm: string;
  brandLogoPath: string;
  brandNoti: string;
  dispOrd: string;
  useYn: string;
}

// 브랜드 등록/수정 모달을 렌더링합니다.
const BrandEditModal = ({ isOpen, brandNo, onClose, onSaved }: BrandEditModalProps) => {
  // 신규 등록 모드 여부를 계산합니다.
  const isCreateMode = useMemo(() => !brandNo, [brandNo]);
  const [form, setForm] = useState<BrandFormState>({
    brandNo: null,
    brandNm: '',
    brandLogoPath: '',
    brandNoti: '',
    dispOrd: '',
    useYn: 'Y',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 상세 조회 결과를 폼 상태로 변환합니다.
  const buildFormFromDetail = useCallback((detail: BrandDetail | null): BrandFormState => ({
    brandNo: detail?.brandNo ?? null,
    brandNm: detail?.brandNm ?? '',
    brandLogoPath: detail?.brandLogoPath ?? '',
    brandNoti: detail?.brandNoti ?? '',
    dispOrd: detail?.dispOrd != null ? String(detail?.dispOrd) : '',
    useYn: detail?.useYn ?? 'Y',
  }), []);

  // 모달 초기 상태를 설정합니다.
  const resetForm = useCallback(() => {
    // 신규 등록 기본값을 설정합니다.
    setForm({
      brandNo: null,
      brandNm: '',
      brandLogoPath: '',
      brandNoti: '',
      dispOrd: '',
      useYn: 'Y',
    });
  }, []);

  // 브랜드 상세 정보를 조회합니다.
  const fetchDetail = useCallback(async (targetBrandNo: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/admin/brand/admin/detail', {
        params: { brandNo: targetBrandNo },
      });
      setForm(buildFormFromDetail(response.data || null));
    } catch (e) {
      console.error('브랜드 상세를 불러오는 데 실패했습니다.');
      setError('브랜드 상세를 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [buildFormFromDetail]);

  // 모달 오픈 시 모드에 맞게 데이터를 준비합니다.
  useEffect(() => {
    // 모달이 닫혀있으면 상태를 초기화하지 않습니다.
    if (!isOpen) {
      return;
    }
    if (brandNo) {
      fetchDetail(brandNo);
      return;
    }
    resetForm();
    setError(null);
  }, [brandNo, fetchDetail, isOpen, resetForm]);

  // 입력값 변경을 처리합니다.
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    // 이벤트에서 name과 값을 추출합니다.
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  // 저장을 처리합니다.
  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // 필수 입력값을 검증합니다.
    if (!form.brandNm.trim()) {
      setError('브랜드명을 입력하세요.');
      return;
    }

    // 로그인 사용자 정보를 확인합니다.
    const usrNo = getLoginUsrNo();
    if (!usrNo) {
      setError('로그인 사용자 정보를 확인할 수 없습니다.');
      return;
    }

    // 숫자 필드 값을 변환합니다.
    const dispOrdValue = form.dispOrd.trim() === '' ? null : Number(form.dispOrd);
    if (dispOrdValue !== null && Number.isNaN(dispOrdValue)) {
      setError('정렬순서는 숫자만 입력할 수 있습니다.');
      return;
    }

    const payload: BrandSavePayload = {
      brandNo: form.brandNo,
      brandNm: form.brandNm.trim(),
      brandLogoPath: form.brandLogoPath.trim() ? form.brandLogoPath.trim() : null,
      brandNoti: form.brandNoti.trim() ? form.brandNoti.trim() : null,
      dispOrd: dispOrdValue,
      useYn: form.useYn,
      regNo: isCreateMode ? usrNo : undefined,
      udtNo: usrNo,
      delYn: isCreateMode ? 'N' : undefined,
    };

    setSaving(true);
    setError(null);
    try {
      const apiUrl = isCreateMode ? '/api/admin/brand/admin/create' : '/api/admin/brand/admin/update';
      await api.post(apiUrl, payload);
      alert(isCreateMode ? '브랜드가 등록되었습니다.' : '브랜드가 수정되었습니다.');
      onSaved();
      onClose();
    } catch (saveError) {
      console.error('브랜드 저장에 실패했습니다.', saveError);
      setError(isCreateMode ? '브랜드 등록을 실패했습니다.' : '브랜드 수정을 실패했습니다.');
    } finally {
      setSaving(false);
    }
  }, [form, isCreateMode, onClose, onSaved]);

  if (!isOpen) {
    return null;
  }

  return (
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
              <h2 className="modal-title w-100 text-center">{isCreateMode ? '브랜드 등록' : '브랜드 수정'}</h2>
              <button type="button" className="btn p-0 position-absolute end-0 me-3" aria-label="닫기" onClick={onClose}>
                <i className="fa fa-window-close" aria-hidden="true"></i>
              </button>
            </div>
            <form className="modal-body" style={{ overflowY: 'auto', flex: 1 }} onSubmit={handleSubmit}>
              {loading && <div>브랜드 정보를 불러오는 중입니다.</div>}
              {!loading && error && <div className="text-danger mb-3">{error}</div>}
              {!loading && (
                <>
                  <div className="form-group mb-3">
                    <label>브랜드명</label>
                    <input
                      type="text"
                      name="brandNm"
                      className="form-control"
                      value={form.brandNm}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group mb-3">
                    <label>브랜드 로고 경로</label>
                    <input
                      type="text"
                      name="brandLogoPath"
                      className="form-control"
                      value={form.brandLogoPath}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group mb-3">
                    <label>브랜드 알림</label>
                    <textarea
                      name="brandNoti"
                      className="form-control"
                      value={form.brandNoti}
                      onChange={handleChange}
                      rows={4}
                    />
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group mb-3">
                        <label>정렬순서</label>
                        <input
                          type="number"
                          name="dispOrd"
                          className="form-control"
                          value={form.dispOrd}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group mb-3">
                        <label>노출여부</label>
                        <select
                          name="useYn"
                          className="form-select"
                          value={form.useYn}
                          onChange={handleChange}
                        >
                          <option value="Y">Y</option>
                          <option value="N">N</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </>
              )}
              <div className="modal-footer">
                <button type="submit" className="btn btn-primary" disabled={saving || loading}>
                  {saving ? '저장중...' : '저장'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={onClose}>
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
        onClick={onClose}
      ></div>
    </>
  );
};

export default BrandEditModal;
