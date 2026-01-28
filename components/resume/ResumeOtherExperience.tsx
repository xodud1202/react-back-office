import React, { useEffect, useMemo, useState } from 'react';
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

  // 입력값 변경을 처리합니다.
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 목록의 항목을 수정용 폼에 반영합니다.
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

  // 폼을 신규 상태로 초기화합니다.
  const handleResetForm = () => {
    setFormData(createEmptyForm(nextSortSeq));
  };

  // 입력 여부를 확인합니다.
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

  // 폼 유효성 검사를 수행합니다.
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

  // 제출 이벤트를 처리합니다.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const saved = await saveOtherExperience();
    if (saved && !formData.otherExperienceNo) {
      handleResetForm();
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-[10px]">
        <div className="text-[24px] font-bold">기타 항목 관리</div>
        <button
          type="button"
          onClick={handleSwitchToNew}
          className="px-4 py-2 text-sm font-medium transition-colors duration-150 bg-gray-400 text-white"
        >
          신규 기타 항목 추가
        </button>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[16px] font-semibold">기타 항목 목록</div>
        </div>
        <div className="border rounded-lg">
          <table className="w-full table-fixed border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 w-1/4">경험명</th>
                <th className="p-2 w-1/4">타이틀</th>
                <th className="p-2 w-1/4">기간</th>
                <th className="p-2 w-1/12">정렬</th>
                <th className="p-2 w-1/6">관리</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="p-4 text-center">불러오는 중...</td>
                </tr>
              )}
              {!loading && otherExperienceList.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-4 text-center">등록된 기타 항목이 없습니다.</td>
                </tr>
              )}
              {!loading && otherExperienceList.map((item, index) => (
                <tr key={`${item.otherExperienceNo ?? index}`} className="border-t">
                  <td className="p-2 text-center">{item.experienceTitle}</td>
                  <td className="p-2 text-center">{item.experienceSubTitle}</td>
                  <td className="p-2 text-center">
                    {item.experienceStartDt || '-'} ~ {item.experienceEndDt || '진행 중'}
                  </td>
                  <td className="p-2 text-center">{item.sortSeq ?? '-'}</td>
                  <td className="p-2 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(item)}
                        className="px-3 py-1 text-sm font-medium transition-colors duration-150 bg-blue-500 text-white"
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.otherExperienceNo)}
                        className="px-3 py-1 text-sm font-medium transition-colors duration-150 bg-red-500 text-white"
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

      <form onSubmit={handleSubmit}>
        <div className="flex items-center justify-between mb-2">
          <div className="text-[16px] font-semibold">
            {formData.otherExperienceNo ? '기타 항목 수정' : '기타 항목 등록'}
          </div>
        </div>
        <table className="w-full table-fixed border-collapse mb-6">
          <tbody>
            <tr>
              <th className="p-2 text-left bg-blue-50 w-1/6">경험명</th>
              <td className="p-2 w-1/3">
                <input
                  type="text"
                  name="experienceTitle"
                  value={formData.experienceTitle}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  required
                />
              </td>
              <th className="p-2 text-left bg-blue-50 w-1/6">타이틀</th>
              <td className="p-2 w-1/3">
                <input
                  type="text"
                  name="experienceSubTitle"
                  value={formData.experienceSubTitle}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  required
                />
              </td>
            </tr>
            <tr>
              <th className="p-2 text-left bg-blue-50 w-1/6">시작</th>
              <td className="p-2 w-1/3">
                <input
                  type="month"
                  name="experienceStartDt"
                  value={formData.experienceStartDt || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </td>
              <th className="p-2 text-left bg-blue-50 w-1/6">종료</th>
              <td className="p-2 w-1/3">
                <input
                  type="month"
                  name="experienceEndDt"
                  value={formData.experienceEndDt || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </td>
            </tr>
            <tr>
              <th className="p-2 text-left bg-blue-50 w-1/6">정렬순서</th>
              <td className="p-2 w-1/3">
                <input
                  type="number"
                  name="sortSeq"
                  value={formData.sortSeq ?? ''}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  min={1}
                />
              </td>
              <th className="p-2 text-left bg-blue-50 w-1/6">설명</th>
              <td className="p-2 w-1/3">
                <textarea
                  name="experienceDesc"
                  value={formData.experienceDesc || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  rows={3}
                />
              </td>
            </tr>
          </tbody>
        </table>

        <div className="flex justify-end gap-2">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium transition-colors duration-150 bg-gray-400 text-white"
            >
              닫기
            </button>
          )}
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 text-sm font-medium transition-colors duration-150 bg-blue-500 text-white disabled:bg-gray-400"
          >
            {saving ? (formData.otherExperienceNo ? '수정 중...' : '등록 중...') : (formData.otherExperienceNo ? '수정' : '등록')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ResumeOtherExperience;
