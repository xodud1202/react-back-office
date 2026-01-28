import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '@/utils/axios/axios';

interface ResumeOtherExperienceItem {
  otherExperienceNo?: number;
  usrNo?: number;
  sortSeq?: number;
  experienceTitle: string;
  experienceSubTitle: string;
  experienceDesc?: string;
  experienceStartDt?: string;
  experienceEndDt?: string;
}

interface ResumeOtherExperienceProps {
  usrNo: string;
  onClose?: () => void;
}

// 신규 폼의 기본값을 생성합니다.
const createEmptyForm = (sortSeq?: number): ResumeOtherExperienceItem => ({
  otherExperienceNo: undefined,
  usrNo: undefined,
  sortSeq,
  experienceTitle: '',
  experienceSubTitle: '',
  experienceDesc: '',
  experienceStartDt: '',
  experienceEndDt: '',
});

const ResumeOtherExperience: React.FC<ResumeOtherExperienceProps> = ({ usrNo, onClose }) => {
  const [otherExperienceList, setOtherExperienceList] = useState<ResumeOtherExperienceItem[]>([]);
  const [footerEl, setFooterEl] = useState<Element | null>(null);
  const [formData, setFormData] = useState<ResumeOtherExperienceItem>(createEmptyForm());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // 목록에서 다음 정렬순서를 계산합니다.
  const nextSortSeq = useMemo(() => {
    if (otherExperienceList.length === 0) {
      return 1;
    }
    const maxSeq = otherExperienceList
      .map(item => item.sortSeq ?? 0)
      .reduce((acc, cur) => Math.max(acc, cur), 0);
    return maxSeq + 1;
  }, [otherExperienceList]);

  // 기타 항목 목록을 조회합니다.
  const fetchOtherExperienceList = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/admin/resume/other-experience/${usrNo}`);
      const list = Array.isArray(response.data) ? response.data : [];
      const normalizedList = list.map((item: ResumeOtherExperienceItem) => ({
        ...item,
        sortSeq: item.sortSeq ?? 0,
        experienceDesc: item.experienceDesc || '',
        experienceStartDt: item.experienceStartDt || '',
        experienceEndDt: item.experienceEndDt || '',
      }));
      setOtherExperienceList(normalizedList);
    } catch (e) {
      console.error('기타 항목 정보를 불러오는 데 실패했습니다.', e);
      alert('기타 항목 정보를 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 사용자 변경 시 데이터와 폼을 초기화합니다.
  useEffect(() => {
    if (usrNo) {
      fetchOtherExperienceList();
      setFormData(createEmptyForm());
    }
  }, [usrNo]);
  useEffect(() => {
    if (typeof document !== 'undefined') {
      setFooterEl(document.querySelector('.modal-footer-actions'));
    }
  }, []);

  // 폼 입력 변경을 처리합니다.
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 선택된 항목을 수정 폼에 반영합니다.
  const handleEdit = (item: ResumeOtherExperienceItem) => {
    setFormData({
      otherExperienceNo: item.otherExperienceNo,
      usrNo: item.usrNo,
      sortSeq: item.sortSeq ?? nextSortSeq,
      experienceTitle: item.experienceTitle || '',
      experienceSubTitle: item.experienceSubTitle || '',
      experienceDesc: item.experienceDesc || '',
      experienceStartDt: item.experienceStartDt || '',
      experienceEndDt: item.experienceEndDt || '',
    });
  };

  // 폼을 신규 등록 상태로 초기화합니다.
  const handleResetForm = () => {
    setFormData(createEmptyForm(nextSortSeq));
  };

  // 폼 입력 여부를 확인합니다.
  const hasFormInput = (data: ResumeOtherExperienceItem) => {
    return Boolean(
      data.experienceTitle ||
      data.experienceSubTitle ||
      data.experienceDesc ||
      data.experienceStartDt ||
      data.experienceEndDt ||
      data.sortSeq ||
      data.otherExperienceNo
    );
  };

  // 신규 등록 모드로 전환합니다.
  const handleSwitchToNew = () => {
    if (!hasFormInput(formData)) {
      handleResetForm();
      return;
    }

    const ok = confirm('작성 중인 내용이 있습니다. 새 기타 항목을 등록하시겠습니까?');
    if (!ok) return;
    handleResetForm();
  };

  // 필수 입력값을 검증합니다.
  const validateForm = (data: ResumeOtherExperienceItem) => {
    if (!data.experienceTitle || !data.experienceSubTitle) {
      alert('경험명과 타이틀은 필수 입력입니다.');
      return false;
    }
    return true;
  };

  // 기타 항목 저장을 처리합니다.
  const saveOtherExperience = async () => {
    if (!validateForm(formData)) {
      return false;
    }

    setSaving(true);

    const payload: ResumeOtherExperienceItem = {
      ...formData,
      sortSeq: formData.sortSeq ?? nextSortSeq,
      experienceDesc: formData.experienceDesc || '',
      experienceStartDt: formData.experienceStartDt || '',
      experienceEndDt: formData.experienceEndDt || '',
    };

    try {
      const response = await api.put(`/api/admin/resume/other-experience/${usrNo}`, payload);
      const body = response.data;
      if (body?.result === 'success') {
        alert(body.message || '기타 항목이 저장되었습니다.');
        await fetchOtherExperienceList();
        return true;
      }
      alert(body?.message || '기타 항목 저장에 실패했습니다.');
      return false;
    } catch (error) {
      console.error('기타 항목 저장 중 오류가 발생했습니다.', error);
      alert('기타 항목 저장 중 오류가 발생했습니다.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  // 기타 항목 삭제를 처리합니다.
  const handleDelete = async (otherExperienceNo?: number) => {
    if (!otherExperienceNo) return;

    const ok = confirm('해당 기타 항목을 삭제하시겠습니까?');
    if (!ok) return;

    try {
      const response = await api.delete(`/api/admin/resume/other-experience/${usrNo}`, {
        params: { otherExperienceNo },
      });
      const body = response.data;
      if (body?.result === 'success') {
        alert(body.message || '기타 항목이 삭제되었습니다.');
        await fetchOtherExperienceList();
        if (formData.otherExperienceNo === otherExperienceNo) {
          handleResetForm();
        }
      } else {
        alert(body?.message || '기타 항목 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('기타 항목 삭제 중 오류가 발생했습니다.', error);
      alert('기타 항목 삭제 중 오류가 발생했습니다.');
    }
  };

  // 폼 제출을 처리합니다.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const saved = await saveOtherExperience();
    if (saved && !formData.otherExperienceNo) {
      handleResetForm();
    }
  };

  return (
    <div className="forms-sample">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h4 className="card-title mb-0">기타 항목 관리</h4>
        <button type="button" onClick={handleSwitchToNew} className="btn btn-secondary btn-sm">
          신규 기타 항목 추가
        </button>
      </div>

      <div className="mx-auto" style={{ maxWidth: '960px', width: '100%' }}>
        <div className="mb-4">
          <h6 className="font-weight-bold mb-2">기타 항목 목록</h6>
          <div className="table-responsive">
            <table className="table table-bordered" style={{ tableLayout: 'fixed', width: '100%' }}>
              <colgroup>
                <col style={{ width: '24%' }} />
                <col style={{ width: '24%' }} />
                <col style={{ width: '24%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '16%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th className="text-center align-middle">경험명</th>
                  <th className="text-center align-middle">타이틀</th>
                  <th className="text-center align-middle">기간</th>
                  <th className="text-center align-middle">정렬</th>
                  <th className="text-center align-middle">관리</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={5} className="text-center">불러오는 중...</td>
                  </tr>
                )}
                {!loading && otherExperienceList.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center">등록된 기타 항목이 없습니다.</td>
                  </tr>
                )}
                {!loading && otherExperienceList.map((item, index) => (
                  <tr key={`${item.otherExperienceNo ?? index}`}>
                    <td className="text-center align-middle">{item.experienceTitle}</td>
                    <td className="text-center align-middle">{item.experienceSubTitle}</td>
                    <td className="text-center align-middle">
                      {item.experienceStartDt || '-'} ~ {item.experienceEndDt || '진행 중'}
                    </td>
                    <td className="text-center align-middle">{item.sortSeq ?? '-'}</td>
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
                          onClick={() => handleDelete(item.otherExperienceNo)}
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

        <form id="resume-other-experience-form" onSubmit={handleSubmit}>
          <h6 className="font-weight-bold mb-2">
            {formData.otherExperienceNo ? '기타 항목 수정' : '기타 항목 등록'}
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
                  <th className="align-middle">경험명</th>
                  <td>
                    <input
                      type="text"
                      name="experienceTitle"
                      value={formData.experienceTitle}
                      onChange={handleChange}
                      className="form-control form-control-sm"
                      required
                    />
                  </td>
                  <th className="align-middle">타이틀</th>
                  <td>
                    <input
                      type="text"
                      name="experienceSubTitle"
                      value={formData.experienceSubTitle}
                      onChange={handleChange}
                      className="form-control form-control-sm"
                      required
                    />
                  </td>
                </tr>
                <tr>
                  <th className="align-middle">시작</th>
                  <td>
                    <input
                      type="month"
                      name="experienceStartDt"
                      value={formData.experienceStartDt || ''}
                      onChange={handleChange}
                      className="form-control form-control-sm"
                    />
                  </td>
                  <th className="align-middle">종료</th>
                  <td>
                    <input
                      type="month"
                      name="experienceEndDt"
                      value={formData.experienceEndDt || ''}
                      onChange={handleChange}
                      className="form-control form-control-sm"
                    />
                  </td>
                </tr>
                <tr>
                  <th className="align-middle">정렬순서</th>
                  <td>
                    <input
                      type="number"
                      name="sortSeq"
                      value={formData.sortSeq ?? ''}
                      onChange={handleChange}
                      className="form-control form-control-sm"
                      min={1}
                    />
                  </td>
                  <th className="align-middle">설명</th>
                  <td>
                    <textarea
                      name="experienceDesc"
                      value={formData.experienceDesc || ''}
                      onChange={handleChange}
                      className="form-control form-control-sm"
                      rows={3}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </form>
      </div>
      {footerEl && createPortal(
        <button type="submit" form="resume-other-experience-form" disabled={saving} className="btn btn-primary">
          {saving ? (formData.otherExperienceNo ? '수정 중...' : '등록 중...') : (formData.otherExperienceNo ? '수정' : '등록')}
        </button>,
        footerEl
      )}
    </div>
  );
};

export default ResumeOtherExperience;
