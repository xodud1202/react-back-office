import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '@/utils/axios/axios';
import { uploadResumeImage } from '@/utils/upload';

interface ResumeEducationItem {
  educationNo?: number;
  educationNm: string;
  department: string;
  educationScore?: string;
  educationStatCd: string;
  educationStartDt?: string;
  educationEndDt?: string;
  logoPath?: string;
}

interface ResumeEducationProps {
  usrNo: string;
  onClose?: () => void;
}

interface EducationStatOption {
  value: string;
  label: string;
}

const createEmptyForm = (): ResumeEducationItem => ({
  educationNo: undefined,
  educationNm: '',
  department: '',
  educationScore: '',
  educationStatCd: '',
  educationStartDt: '',
  educationEndDt: '',
  logoPath: '',
});

const ResumeEducation: React.FC<ResumeEducationProps> = ({ usrNo, onClose }) => {
  const [educationList, setEducationList] = useState<ResumeEducationItem[]>([]);
  const [footerEl, setFooterEl] = useState<Element | null>(null);
  const [formData, setFormData] = useState<ResumeEducationItem>(createEmptyForm());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [educationStatOptions, setEducationStatOptions] = useState<EducationStatOption[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const educationStatLabelMap = useMemo(() => {
    return educationStatOptions.reduce((acc, option) => {
      acc[option.value] = option.label;
      return acc;
    }, {} as Record<string, string>);
  }, [educationStatOptions]);

  // 학력 목록을 조회합니다.
  const fetchEducationList = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/admin/resume/education/${usrNo}`);
      const list = Array.isArray(response.data) ? response.data : [];
      const normalizedList = list.map((item: ResumeEducationItem) => ({
        ...item,
        educationScore: item.educationScore || '',
        educationStartDt: item.educationStartDt || '',
        educationEndDt: item.educationEndDt || '',
        logoPath: item.logoPath || '',
      }));
      setEducationList(normalizedList);
    } catch (e) {
      console.error('학력 정보를 불러오는 데 실패했습니다.', e);
      alert('학력 정보를 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 학력 상태 공통코드를 조회합니다.
  const fetchEducationStats = async () => {
    try {
      const response = await api.get('/api/admin/common/code', {
        params: { grpCd: 'EDUCATION_STAT' },
      });
      const list = Array.isArray(response.data) ? response.data : [];
      setEducationStatOptions(
        list.map((item: { cd: string; cdNm: string }) => ({
          value: item.cd,
          label: item.cdNm,
        }))
      );
    } catch (e) {
      console.error('학력 상태를 불러오는 데 실패했습니다.', e);
      setEducationStatOptions([]);
    }
  };

  useEffect(() => {
    if (usrNo) {
      fetchEducationList();
      fetchEducationStats();
      setFormData(createEmptyForm());
    }
  }, [usrNo]);
  useEffect(() => {
    if (typeof document !== 'undefined') {
      setFooterEl(document.querySelector('.modal-footer-actions'));
    }
  }, []);

  // 폼 입력 변경을 처리합니다.
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 선택된 항목을 수정 폼에 반영합니다.
  const handleEdit = (item: ResumeEducationItem) => {
    setFormData({
      educationNo: item.educationNo,
      educationNm: item.educationNm || '',
      department: item.department || '',
      educationScore: item.educationScore || '',
      educationStatCd: item.educationStatCd || '',
      educationStartDt: item.educationStartDt || '',
      educationEndDt: item.educationEndDt || '',
      logoPath: item.logoPath || '',
    });
  };

  // 폼을 신규 등록 상태로 초기화합니다.
  const handleResetForm = () => {
    setFormData(createEmptyForm());
  };

  // 폼 입력 여부를 확인합니다.
  const hasFormInput = (data: ResumeEducationItem) => {
    return Boolean(
      data.educationNm ||
      data.department ||
      data.educationScore ||
      data.educationStatCd ||
      data.educationStartDt ||
      data.educationEndDt ||
      data.logoPath ||
      data.educationNo
    );
  };

  // 신규 등록 모드로 전환합니다.
  const handleSwitchToNew = () => {
    if (!hasFormInput(formData)) {
      handleResetForm();
      return;
    }

    const ok = confirm('작성 중인 내용이 있습니다. 새 학력을 등록하시겠습니까?');
    if (!ok) return;
    handleResetForm();
  };

  // 필수 입력값을 검증합니다.
  const validateForm = (data: ResumeEducationItem) => {
    if (!data.educationNm || !data.department || !data.educationStatCd || !data.educationStartDt) {
      alert('학교명, 학과, 재학상태, 입학일은 필수 입력입니다.');
      return false;
    }
    return true;
  };

  // 학력 저장을 처리합니다.
  const saveEducation = async () => {
    if (!validateForm(formData)) {
      return false;
    }

    setSaving(true);

    const payload: ResumeEducationItem = {
      ...formData,
      educationScore: formData.educationScore || '',
      educationStartDt: formData.educationStartDt || '',
      educationEndDt: formData.educationEndDt || '',
      logoPath: formData.logoPath || '',
    };

    try {
      const response = await api.put(`/api/admin/resume/education/${usrNo}`, payload);
      const body = response.data;
      if (body?.result === 'success') {
        alert(body.message || '학력이 저장되었습니다.');
        await fetchEducationList();
        return true;
      }
      alert(body?.message || '학력 저장에 실패했습니다.');
      return false;
    } catch (error) {
      console.error('학력 저장 중 오류가 발생했습니다.', error);
      alert('학력 저장 중 오류가 발생했습니다.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  // 학력 삭제를 처리합니다.
  const handleDelete = async (educationNo?: number) => {
    if (!educationNo) return;

    const ok = confirm('해당 학력을 삭제하시겠습니까?');
    if (!ok) return;

    try {
      const response = await api.delete(`/api/admin/resume/education/${usrNo}`, {
        params: { educationNo },
      });
      const body = response.data;
      if (body?.result === 'success') {
        alert(body.message || '학력이 삭제되었습니다.');
        await fetchEducationList();
        if (formData.educationNo === educationNo) {
          handleResetForm();
        }
      } else {
        alert(body?.message || '학력 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('학력 삭제 중 오류가 발생했습니다.', error);
      alert('학력 삭제 중 오류가 발생했습니다.');
    }
  };

  // 폼 제출을 처리합니다.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const saved = await saveEducation();
    if (saved && !formData.educationNo) {
      setFormData(createEmptyForm());
    }
  };

  // 파일 선택 창을 엽니다.
  const handleUploadButtonClick = () => {
    fileInputRef.current?.click();
  };

  // 로고 파일 업로드를 처리합니다.
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const data = await uploadResumeImage('/api/upload/education-logo', file, usrNo);
      if (data?.error) {
        throw new Error(data.error);
      }
      setFormData(prev => ({ ...prev, logoPath: data.logoPath || '' }));
      alert(data.message || '이미지가 업로드되었습니다.');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`이미지 업로드 중 오류가 발생했습니다: ${errorMessage}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="forms-sample">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h4 className="card-title mb-0">학력 관리</h4>
        <button type="button" onClick={handleSwitchToNew} className="btn btn-secondary btn-sm">
          신규 학력 추가
        </button>
      </div>

      <div className="mx-auto" style={{ maxWidth: '960px', width: '100%' }}>
        <div className="mb-4">
          <h6 className="font-weight-bold mb-2">학력 목록</h6>
          <div className="table-responsive">
            <table className="table table-bordered" style={{ tableLayout: 'fixed', width: '100%' }}>
              <colgroup>
                <col style={{ width: '24%' }} />
                <col style={{ width: '20%' }} />
                <col style={{ width: '16%' }} />
                <col style={{ width: '24%' }} />
                <col style={{ width: '16%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th className="text-center align-middle">학교명</th>
                  <th className="text-center align-middle">학과</th>
                  <th className="text-center align-middle">상태</th>
                  <th className="text-center align-middle">기간</th>
                  <th className="text-center align-middle">관리</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={5} className="text-center">불러오는 중...</td>
                  </tr>
                )}
                {!loading && educationList.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center">등록된 학력이 없습니다.</td>
                  </tr>
                )}
                {!loading && educationList.map((item, index) => (
                  <tr key={`${item.educationNo ?? index}`}>
                    <td className="text-center align-middle">{item.educationNm}</td>
                    <td className="text-center align-middle">{item.department}</td>
                    <td className="text-center align-middle">
                      {educationStatLabelMap[item.educationStatCd] || item.educationStatCd}
                    </td>
                    <td className="text-center align-middle">
                      {item.educationStartDt || '-'} ~ {item.educationEndDt || '재학 중'}
                    </td>
                    <td className="text-center align-middle">
                      <div className="d-flex justify-content-center">
                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                          className="btn btn-outline-primary btn-sm mr-2"
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.educationNo)}
                          className="btn btn-outline-danger btn-sm"
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <form id="resume-education-form" onSubmit={handleSubmit}>
          <h6 className="font-weight-bold mb-2">
            {formData.educationNo ? '학력 수정' : '학력 등록'}
          </h6>
          <div className="table-responsive mb-4">
            <table className="table table-bordered" style={{ tableLayout: 'fixed', width: '100%' }}>
              <colgroup>
                <col style={{ width: '18%' }} />
                <col style={{ width: '32%' }} />
                <col style={{ width: '18%' }} />
                <col style={{ width: '32%' }} />
              </colgroup>
              <tbody>
                <tr>
                  <th className="align-middle">학교명</th>
                  <td>
                    <input
                      type="text"
                      name="educationNm"
                      value={formData.educationNm}
                      onChange={handleChange}
                      className="form-control form-control-sm"
                      required
                    />
                  </td>
                  <th className="align-middle">학과</th>
                  <td>
                    <input
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      className="form-control form-control-sm"
                      required
                    />
                  </td>
                </tr>
                <tr>
                  <th className="align-middle">재학상태</th>
                  <td>
                    <select
                      name="educationStatCd"
                      value={formData.educationStatCd}
                      onChange={handleChange}
                      className="form-control form-control-sm"
                      required
                    >
                      <option value="">선택</option>
                      {educationStatOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </td>
                  <th className="align-middle">학점</th>
                  <td>
                    <input
                      type="text"
                      name="educationScore"
                      value={formData.educationScore || ''}
                      onChange={handleChange}
                      className="form-control form-control-sm"
                      placeholder="예: 4.2 / 4.5"
                    />
                  </td>
                </tr>
                <tr>
                  <th className="align-middle">입학</th>
                  <td>
                    <input
                      type="month"
                      name="educationStartDt"
                      value={formData.educationStartDt || ''}
                      onChange={handleChange}
                      className="form-control form-control-sm"
                      required
                    />
                  </td>
                  <th className="align-middle">졸업</th>
                  <td>
                    <input
                      type="month"
                      name="educationEndDt"
                      value={formData.educationEndDt || ''}
                      onChange={handleChange}
                      className="form-control form-control-sm"
                    />
                  </td>
                </tr>
                <tr>
                  <th className="align-middle">학교 로고</th>
                  <td colSpan={3}>
                    <div className="d-flex align-items-center">
                      {formData.logoPath ? (
                        <img
                          src={formData.logoPath}
                          alt="학교 로고"
                          className="img-fluid border"
                          style={{ width: '48px', height: '48px', objectFit: 'contain' }}
                        />
                      ) : (
                        <div
                          className="border text-muted d-flex align-items-center justify-content-center"
                          style={{ width: '48px', height: '48px', fontSize: '12px' }}
                        >
                          없음
                        </div>
                      )}
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="d-none"
                        accept="image/*"
                      />
                      <button
                        type="button"
                        onClick={handleUploadButtonClick}
                        className="btn btn-secondary btn-sm ml-3"
                        disabled={uploading}
                      >
                        {uploading ? '업로드 중...' : '로고 업로드'}
                      </button>
                      <input
                        type="text"
                        name="logoPath"
                        value={formData.logoPath || ''}
                        readOnly
                        className="form-control form-control-sm ml-3"
                      />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </form>
      </div>
      {footerEl && createPortal(
        <button type="submit" form="resume-education-form" disabled={saving} className="btn btn-primary">
          {saving ? (formData.educationNo ? '수정 중...' : '등록 중...') : (formData.educationNo ? '수정' : '등록')}
        </button>,
        footerEl
      )}
    </div>
  );
};

export default ResumeEducation;
