import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import dynamic from 'next/dynamic';
import api from '@/utils/axios/axios';
import {getLoginUsrNo} from '@/utils/auth';
import useQuillImageUpload from '@/hooks/useQuillImageUpload';
import type {BrandDetail, BrandSavePayload} from '@/components/brand/types';

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

// 리액트 퀼 에디터를 SSR 없이 로딩합니다.
const ReactQuill = dynamic(
  async () => {
    const mod = await import('react-quill-new');
    const Component = mod.default;
    return React.forwardRef<any, React.ComponentProps<typeof Component>>((props, ref) => (
      <Component ref={ref} {...props} />
    ));
  },
  {ssr: false}
);

// 브랜드 등록/수정 모달을 렌더링합니다.
const BrandEditModal = ({isOpen, brandNo, onClose, onSaved}: BrandEditModalProps) => {
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
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 상품 상단 안내 에디터 툴바/포맷 옵션을 구성합니다.
  const quillToolbarOptions = useMemo(
    () => ([
      ['bold', 'italic', 'underline', 'strike'],
      [{list: 'ordered'}, {list: 'bullet'}],
      ['link', 'image'],
      ['clean'],
    ]),
    []
  );
  const quillFormatsOptions = useMemo(
    () => ([
      'bold',
      'italic',
      'underline',
      'strike',
      'list',
      'link',
      'image',
    ]),
    []
  );

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
        params: {brandNo: targetBrandNo},
      });
      setForm(buildFormFromDetail(response.data || null));
    } catch (e) {
      console.error('브랜드 상세를 불러오는 데 실패했습니다.');
      setError('브랜드 상세를 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [buildFormFromDetail]);

  // 모달 진입 시 모드에 맞게 데이터를 준비합니다.
  useEffect(() => {
    // 모달이 열려있지 않으면 종료합니다.
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
    const {name, value} = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  // 브랜드 로고 업로드 버튼 클릭을 처리합니다.
  const handleLogoUploadClick = useCallback(() => {
    if (!brandNo) {
      alert('브랜드를 먼저 저장한 뒤 로고를 업로드해주세요.');
      return;
    }
    fileInputRef.current?.click();
  }, [brandNo]);

  // 브랜드 로고 파일 선택을 처리합니다.
  const handleLogoFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!brandNo) {
      alert('브랜드를 먼저 저장한 뒤 로고를 업로드해주세요.');
      return;
    }

    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('brandNo', String(brandNo));

      const response = await api.post('/api/upload/brand-logo', formData);
      const data = response.data || {};
      if (data?.error) {
        throw new Error(data.error);
      }

      setForm((prev) => ({
        ...prev,
        brandLogoPath: data.brandLogoPath || '',
      }));
      alert(data.message || '로고가 업로드되었습니다.');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      alert('로고 업로드 중 오류가 발생했습니다: ' + message);
    } finally {
      setUploadingLogo(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  }, [brandNo]);

  // 상품 상단 안내 에디터 값을 반영합니다.
  const handleBrandNotiChange = useCallback((value: string) => {
    setForm((prev) => ({
      ...prev,
      brandNoti: value,
    }));
  }, []);

  // 상품 상단 안내 에디터 이미지 업로드를 연동합니다.
  const brandNotiQuill = useQuillImageUpload({
    toolbarOptions: quillToolbarOptions,
    formats: quillFormatsOptions,
    onChange: handleBrandNotiChange,
    editorId: 'brand-noti-editor',
  });

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

  // 브랜드 삭제를 처리합니다.
  const handleDeleteBrand = useCallback(async () => {
    if (!brandNo) {
      return;
    }

    const ok = confirm('해당 브랜드를 삭제하시겠습니까?');
    if (!ok) {
      return;
    }

    const usrNo = getLoginUsrNo();
    if (!usrNo) {
      setError('로그인 사용자 정보를 확인할 수 없습니다.');
      return;
    }

    setDeleting(true);
    setError(null);
    try {
      const response = await api.post('/api/admin/brand/admin/delete', {
        brandNo,
        udtNo: usrNo,
      });
      if (response.data > 0) {
        alert('브랜드가 삭제되었습니다.');
        onSaved();
        onClose();
        return;
      }
      setError('브랜드 삭제에 실패했습니다.');
    } catch (deleteError) {
      console.error('브랜드 삭제에 실패했습니다.', deleteError);
      setError('브랜드 삭제에 실패했습니다.');
    } finally {
      setDeleting(false);
    }
  }, [brandNo, onClose, onSaved]);

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
        <div className="modal-dialog modal-lg" style={{margin: 0, maxWidth: '90vw', width: '100%', maxHeight: '90vh'}}>
          <div className="modal-content" style={{
            height: '90vh',
            maxHeight: '90vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div className="modal-header position-relative">
              <h2 className="modal-title w-100 text-center">{isCreateMode ? '브랜드 등록' : '브랜드 수정'}</h2>
              <button type="button" className="btn p-0 position-absolute end-0 me-3" aria-label="닫기" onClick={onClose}>
                <i className="fa fa-window-close" aria-hidden="true"></i>
              </button>
            </div>
            <form className="modal-body" style={{overflowY: 'auto', flex: 1}} onSubmit={handleSubmit}>
              {loading && <div>브랜드 정보를 불러오는 중입니다.</div>}
              {!loading && error && <div className="text-danger mb-3">{error}</div>}
              {!loading && (
                <>
                  <div className={"row"}>
                    <div className="col-md-3">
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
                    </div>
                    <div className="col-md-3">
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
                    <div className="col-md-3">
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

                  <div className="form-group mb-3">
                    <label>브랜드 로고</label>
                    <div className="d-flex align-items-center">
                      {form.brandLogoPath ? (
                        <img
                          src={form.brandLogoPath}
                          alt="브랜드 로고"
                          className="img-fluid border"
                          style={{width: '48px', height: '48px', objectFit: 'contain'}}
                        />
                      ) : (
                        <div
                          className="border text-muted d-flex align-items-center justify-content-center"
                          style={{width: '48px', height: '48px', fontSize: '12px'}}
                        >
                          없음
                        </div>
                      )}
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleLogoFileChange}
                        className="d-none"
                        accept="image/*"
                      />
                      <button
                        type="button"
                        onClick={handleLogoUploadClick}
                        className="btn btn-secondary btn-sm ml-3"
                        disabled={uploadingLogo}
                      >
                        {uploadingLogo ? '업로드 중...' : '로고 업로드'}
                      </button>
                      <input
                        type="text"
                        name="brandLogoPath"
                        value={form.brandLogoPath}
                        readOnly
                        className="form-control ml-3"
                      />
                    </div>
                    {!brandNo && (
                      <small className="text-muted d-block mt-2">브랜드 등록 후 로고를 업로드할 수 있습니다.</small>
                    )}
                  </div>
                  <div className="form-group mb-3">
                    <label>상품 상단 안내</label>
                    <ReactQuill
                      id="brand-noti-editor"
                      ref={brandNotiQuill.quillRef}
                      theme="snow"
                      className="board-editor brand-noti-editor"
                      value={form.brandNoti}
                      onChange={brandNotiQuill.handleEditorChange}
                      modules={brandNotiQuill.quillModules}
                      formats={brandNotiQuill.quillFormats}
                    />
                  </div>

                </>
              )}
              <div className="modal-footer">
                {!isCreateMode && (
                  <button type="button" className="btn btn-danger" onClick={handleDeleteBrand}
                          disabled={deleting || saving || loading}>
                    {deleting ? '삭제 중...' : '삭제'}
                  </button>
                )}
                <button type="submit" className="btn btn-primary" disabled={saving || loading || deleting}>
                  {saving ? '저장 중...' : '저장'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  닫기
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <style jsx>{`
        .brand-noti-editor {
          height: 350px;
        }
        .brand-noti-editor {
          min-height: 350px;
        }
      `}</style>
      <div
        className="modal-backdrop fade show"
        style={{position: 'fixed', inset: 0, zIndex: 1055}}
        onClick={onClose}
      ></div>
    </>
  );
};

export default BrandEditModal;
