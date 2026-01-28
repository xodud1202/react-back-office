import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import api from "@/utils/axios/axios";

interface ResumeExperienceDetail {
  experienceDtlNo?: number;
  workTitle: string;
  workDesc?: string;
  workStartDt?: string;
  workEndDt?: string;
  sortSeq?: number;
}

interface ResumeExperienceBase {
  experienceNo?: number;
  companyNm: string;
  employmentTypeCd: string;
  position: string;
  duty: string;
  workStartDt?: string;
  workEndDt?: string;
  resumeExperienceDetailList: ResumeExperienceDetail[];
}

interface ResumeExperienceProps {
  usrNo: string;
  onClose?: () => void;
}

interface EmploymentTypeOption {
  value: string;
  label: string;
}

const createEmptyForm = (): ResumeExperienceBase => ({
  experienceNo: undefined,
  companyNm: '',
  employmentTypeCd: '',
  position: '',
  duty: '',
  workStartDt: '',
  workEndDt: '',
  resumeExperienceDetailList: [],
});

const ResumeExperience: React.FC<ResumeExperienceProps> = ({ usrNo, onClose }) => {
  const [experienceList, setExperienceList] = useState<ResumeExperienceBase[]>([]);
  const [footerEl, setFooterEl] = useState<Element | null>(null);
  const [formData, setFormData] = useState<ResumeExperienceBase>(createEmptyForm());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [employmentTypeOptions, setEmploymentTypeOptions] = useState<EmploymentTypeOption[]>([]);

  const employmentTypeLabelMap = useMemo(() => {
    return employmentTypeOptions.reduce((acc, option) => {
      acc[option.value] = option.label;
      return acc;
    }, {} as Record<string, string>);
  }, [employmentTypeOptions]);

  // 경력 목록을 조회합니다.
  const fetchExperienceList = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/admin/resume/experience/${usrNo}`);
      const list = Array.isArray(response.data) ? response.data : [];
      const normalizedList = list.map((item: ResumeExperienceBase) => ({
        ...item,
        workStartDt: item.workStartDt || '',
        workEndDt: item.workEndDt || '',
        resumeExperienceDetailList: (item.resumeExperienceDetailList || []).map((detail: ResumeExperienceDetail) => ({
          experienceDtlNo: detail.experienceDtlNo,
          ...detail,
          workStartDt: detail.workStartDt || '',
          workEndDt: detail.workEndDt || '',
        })),
      }));
      setExperienceList(normalizedList);
    } catch (e) {
      console.error('Failed to fetch experience list', e);
      alert('경력 정보를 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 고용형태 공통코드를 조회합니다.
  const fetchEmploymentTypes = async () => {
    try {
      const response = await api.get('/api/admin/common/code', {
        params: { grpCd: 'EMPLOYMENT_TYPE' },
      });
      const list = Array.isArray(response.data) ? response.data : [];
      setEmploymentTypeOptions(
        list.map((item: { cd: string; cdNm: string }) => ({
          value: item.cd,
          label: item.cdNm,
        }))
      );
    } catch (e) {
      console.error('Failed to fetch employment types', e);
      setEmploymentTypeOptions([]);
    }
  };

  useEffect(() => {
    if (usrNo) {
      fetchExperienceList();
      fetchEmploymentTypes();
      setFormData(createEmptyForm());
    }
  }, [usrNo]);
  useEffect(() => {
    if (typeof document !== 'undefined') {
      setFooterEl(document.querySelector('.modal-footer-actions'));
    }
  }, []);

  // 기본 정보 입력 변경을 처리합니다.
  const handleBaseChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 상세 정보 입력 변경을 처리합니다.
  const handleDetailChange = (index: number, field: keyof ResumeExperienceDetail, value: string) => {
    setFormData(prev => {
      const nextDetails = [...prev.resumeExperienceDetailList];
      nextDetails[index] = { ...nextDetails[index], [field]: value };
      return { ...prev, resumeExperienceDetailList: nextDetails };
    });
  };

  // 상세 행을 추가합니다.
  const addDetailRow = () => {
    setFormData(prev => ({
      ...prev,
      resumeExperienceDetailList: [
        ...prev.resumeExperienceDetailList,
        { experienceDtlNo: undefined, workTitle: '', workDesc: '', workStartDt: '', workEndDt: '', sortSeq: prev.resumeExperienceDetailList.length + 1 },
      ],
    }));
  };

  // 상세 행을 삭제합니다.
  const removeDetailRow = (index: number) => {
    setFormData(prev => {
      const nextDetails = prev.resumeExperienceDetailList.filter((_, idx) => idx !== index);
      const normalized = nextDetails.map((detail, idx) => ({
        ...detail,
        sortSeq: idx + 1,
      }));
      return { ...prev, resumeExperienceDetailList: normalized };
    });
  };

  // 선택된 경력을 수정 폼에 반영합니다.
  const handleEdit = (item: ResumeExperienceBase) => {
    setFormData({
      experienceNo: item.experienceNo,
      companyNm: item.companyNm || '',
      employmentTypeCd: item.employmentTypeCd || '',
      position: item.position || '',
      duty: item.duty || '',
      workStartDt: item.workStartDt || '',
      workEndDt: item.workEndDt || '',
      resumeExperienceDetailList: (item.resumeExperienceDetailList || []).map((detail) => ({
        experienceDtlNo: detail.experienceDtlNo,
        workTitle: detail.workTitle || '',
        workDesc: detail.workDesc || '',
        workStartDt: detail.workStartDt || '',
        workEndDt: detail.workEndDt || '',
        sortSeq: detail.sortSeq,
      })),
    });
  };

  // 폼을 신규 등록 상태로 초기화합니다.
  const handleResetForm = () => {
    setFormData(createEmptyForm());
  };

  // 신규 경력 등록 모드로 전환합니다.
  const handleSwitchToNew = () => {
    if (!hasFormInput(formData)) {
      handleResetForm();
      return;
    }

    const ok = confirm('작성 중인 내용이 있습니다. 새 경력을 등록하시겠습니까?');
    if (!ok) return;
    handleResetForm();
  };

  // 폼 입력 여부를 확인합니다.
  const hasFormInput = (data: ResumeExperienceBase) => {
    return Boolean(
      data.companyNm ||
      data.employmentTypeCd ||
      data.position ||
      data.duty ||
      data.workStartDt ||
      data.workEndDt ||
      (data.resumeExperienceDetailList || []).some(detail =>
        detail.workTitle || detail.workDesc || detail.workStartDt || detail.workEndDt
      )
    );
  };

  // 필수 입력값을 검증합니다.
  const validateForm = (data: ResumeExperienceBase) => {
    if (!data.companyNm || !data.employmentTypeCd || !data.position || !data.duty) {
      alert('회사명, 고용형태, 직급, 직책는 필수 입력입니다.');
      return false;
    }
    return true;
  };

  // 경력 저장을 처리합니다.
  const saveExperience = async () => {
    if (!validateForm(formData)) {
      return false;
    }

    setSaving(true);

    const payload: ResumeExperienceBase = {
      ...formData,
      resumeExperienceDetailList: (formData.resumeExperienceDetailList || [])
        .filter(detail => detail.workTitle && detail.workTitle.trim() !== '')
        .map((detail, index) => ({
          ...detail,
          sortSeq: detail.sortSeq ?? index + 1,
          workDesc: detail.workDesc || '',
          workStartDt: detail.workStartDt || '',
          workEndDt: detail.workEndDt || '',
        })),
    };

    try {
      const response = await api.put(`/api/admin/resume/experience/${usrNo}`, payload);
      const body = response.data;
      if (body?.result === 'success') {
        alert(body.message || '경력이 저장되었습니다.');
        await fetchExperienceList();
        return true;
      }
      alert(body?.message || '경력 저장에 실패했습니다.');
      return false;
    } catch (error) {
      console.error('Error saving experience:', error);
      alert('경력 저장 중 오류가 발생했습니다.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  // 경력 삭제를 처리합니다.
  const handleDelete = async (experienceNo?: number) => {
    if (!experienceNo) return;

    const ok = confirm('해당 경력을 삭제하시겠습니까?');
    if (!ok) return;

    try {
      const response = await api.delete(`/api/admin/resume/experience/${usrNo}/${experienceNo}`);
      const body = response.data;
      if (body?.result === 'success') {
        alert(body.message || '경력이 삭제되었습니다.');
        await fetchExperienceList();
        if (formData.experienceNo === experienceNo) {
          setFormData(createEmptyForm());
        }
      } else {
        alert(body?.message || '경력 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error deleting experience:', error);
      alert('경력 삭제 중 오류가 발생했습니다.');
    }
  };

  // 폼 제출을 처리합니다.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const saved = await saveExperience();
    if (saved && !formData.experienceNo) {
      setFormData(createEmptyForm());
    }
  };

  return (
    <div className="forms-sample">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h4 className="card-title mb-0">경력 관리</h4>
        <button type="button" onClick={handleSwitchToNew} className="btn btn-secondary btn-sm">
          신규 경력 추가
        </button>
      </div>
      <div className="mx-auto" style={{ maxWidth: '960px', width: '100%' }}>
        <div className="mb-4">
          <h6 className="font-weight-bold mb-2">경력 목록</h6>
          <div className="table-responsive">
            <table className="table table-bordered" style={{ tableLayout: 'fixed', width: '100%' }}>
              <colgroup>
                <col style={{ width: '24%' }} />
                <col style={{ width: '18%' }} />
                <col style={{ width: '16%' }} />
                <col style={{ width: '26%' }} />
                <col style={{ width: '16%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th className="text-center align-middle">회사명</th>
                  <th className="text-center align-middle">고용형태</th>
                  <th className="text-center align-middle">직책</th>
                  <th className="text-center align-middle">근무기간</th>
                  <th className="text-center align-middle">관리</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={5} className="text-center">불러오는 중...</td>
                  </tr>
                )}
                {!loading && experienceList.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center">등록된 경력이 없습니다.</td>
                  </tr>
                )}
                {!loading && experienceList.map((item, index) => (
                  <tr key={`${item.experienceNo ?? index}`}>
                    <td className="text-center align-middle">{item.companyNm}</td>
                    <td className="text-center align-middle">
                      {employmentTypeLabelMap[item.employmentTypeCd] || item.employmentTypeCd}
                    </td>
                    <td className="text-center align-middle">{item.duty}</td>
                    <td className="text-center align-middle">
                      {item.workStartDt || '-'} ~ {item.workEndDt || '재직 중'}
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
                          onClick={() => handleDelete(item.experienceNo)}
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

        <form id="resume-experience-form" onSubmit={handleSubmit}>
          <h6 className="font-weight-bold mb-2">
            {formData.experienceNo ? '경력 수정' : '경력 등록'}
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
                  <th className="align-middle">회사명</th>
                  <td>
                    <input
                      type="text"
                      name="companyNm"
                      value={formData.companyNm}
                      onChange={handleBaseChange}
                      className="form-control form-control-sm"
                      required
                    />
                  </td>
                  <th className="align-middle">고용형태</th>
                  <td>
                    <select
                      name="employmentTypeCd"
                      value={formData.employmentTypeCd}
                      onChange={handleBaseChange}
                      className="form-control form-control-sm"
                      required
                    >
                      <option value="">선택</option>
                      {employmentTypeOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </td>
                </tr>
                <tr>
                  <th className="align-middle">직급</th>
                  <td>
                    <input
                      type="text"
                      name="position"
                      value={formData.position}
                      onChange={handleBaseChange}
                      className="form-control form-control-sm"
                      required
                    />
                  </td>
                  <th className="align-middle">직책</th>
                  <td>
                    <input
                      type="text"
                      name="duty"
                      value={formData.duty}
                      onChange={handleBaseChange}
                      className="form-control form-control-sm"
                      required
                    />
                  </td>
                </tr>
                <tr>
                  <th className="align-middle">근무 시작</th>
                  <td>
                    <input
                      type="month"
                      name="workStartDt"
                      value={formData.workStartDt || ''}
                      onChange={handleBaseChange}
                      className="form-control form-control-sm"
                    />
                  </td>
                  <th className="align-middle">근무 종료</th>
                  <td>
                    <input
                      type="month"
                      name="workEndDt"
                      value={formData.workEndDt || ''}
                      onChange={handleBaseChange}
                      className="form-control form-control-sm"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="d-flex align-items-center justify-content-between mb-2">
            <h6 className="font-weight-bold mb-0">경력 상세</h6>
            <button type="button" onClick={addDetailRow} className="btn btn-secondary btn-sm">
              상세 추가
            </button>
          </div>
          <div className="table-responsive mb-4">
            <table className="table table-bordered" style={{ tableLayout: 'fixed', width: '100%' }}>
              <colgroup>
                <col style={{ width: '22%' }} />
                <col style={{ width: '22%' }} />
                <col style={{ width: '40%' }} />
                <col style={{ width: '16%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th className="text-center align-middle">프로젝트명</th>
                  <th className="text-center align-middle">기간</th>
                  <th className="text-center align-middle">내용</th>
                  <th className="text-center align-middle">관리</th>
                </tr>
              </thead>
              <tbody>
                {formData.resumeExperienceDetailList.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center">등록된 상세가 없습니다.</td>
                  </tr>
                )}
                {formData.resumeExperienceDetailList.map((detail, index) => (
                  <tr key={`${index}-${detail.sortSeq ?? 0}`}>
                    <td className="align-top">
                      <input
                        type="text"
                        value={detail.workTitle || ''}
                        onChange={(e) => handleDetailChange(index, 'workTitle', e.target.value)}
                        className="form-control form-control-sm"
                        placeholder="프로젝트명"
                        required
                      />
                    </td>
                    <td className="align-top">
                      <div className="d-flex flex-column">
                        <input
                          type="month"
                          value={detail.workStartDt || ''}
                          onChange={(e) => handleDetailChange(index, 'workStartDt', e.target.value)}
                          className="form-control form-control-sm mb-2"
                        />
                        <input
                          type="month"
                          value={detail.workEndDt || ''}
                          onChange={(e) => handleDetailChange(index, 'workEndDt', e.target.value)}
                          className="form-control form-control-sm"
                        />
                      </div>
                    </td>
                    <td className="align-top">
                      <textarea
                        value={detail.workDesc || ''}
                        onChange={(e) => handleDetailChange(index, 'workDesc', e.target.value)}
                        className="form-control form-control-sm"
                        rows={4}
                        placeholder="업무 상세 내용을 입력하세요."
                      />
                    </td>
                    <td className="text-center align-top">
                      <button
                        type="button"
                        onClick={() => removeDetailRow(index)}
                        className="btn btn-outline-danger btn-sm"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </form>
      </div>
      {footerEl && createPortal(
        <button type="submit" form="resume-experience-form" disabled={saving} className="btn btn-primary">
          {saving ? (formData.experienceNo ? '수정 중...' : '등록 중...') : (formData.experienceNo ? '수정' : '등록')}
        </button>,
        footerEl
      )}
    </div>
  );
};

export default ResumeExperience;
