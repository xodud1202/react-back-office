import React, { useEffect, useMemo, useRef, useState } from 'react';
import api from '@/utils/axios/axios';

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

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

  const handleResetForm = () => {
    setFormData(createEmptyForm());
  };

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

  const handleSwitchToNew = () => {
    if (!hasFormInput(formData)) {
      handleResetForm();
      return;
    }

    const ok = confirm('작성 중인 내용이 있습니다. 새 학력을 등록하시겠습니까?');
    if (!ok) return;
    handleResetForm();
  };

  const validateForm = (data: ResumeEducationItem) => {
    if (!data.educationNm || !data.department || !data.educationStatCd || !data.educationStartDt) {
      alert('학교명, 학과, 재학상태, 입학일은 필수 입력입니다.');
      return false;
    }
    return true;
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const saved = await saveEducation();
    if (saved && !formData.educationNo) {
      setFormData(createEmptyForm());
    }
  };

  const handleUploadButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const uploadFormData = new FormData();
    uploadFormData.append('image', file);
    uploadFormData.append('usrNo', String(usrNo));

    setUploading(true);
    try {
      const response = await api.post('/api/upload/education-logo', uploadFormData);
      const data = response.data;
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
    <div className="w-full">
      <div className="flex items-center justify-between mb-[10px]">
        <div className="text-[24px] font-bold">학력 관리</div>
        <button
          type="button"
          onClick={handleSwitchToNew}
          className="px-4 py-2 text-sm font-medium transition-colors duration-150 bg-gray-400 text-white"
        >
          신규 학력 추가
        </button>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[16px] font-semibold">학력 목록</div>
        </div>
        <div className="border rounded-lg">
          <table className="w-full table-fixed border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 w-1/4">학교명</th>
                <th className="p-2 w-1/5">학과</th>
                <th className="p-2 w-1/6">상태</th>
                <th className="p-2 w-1/4">기간</th>
                <th className="p-2 w-1/6">관리</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="p-4 text-center">불러오는 중...</td>
                </tr>
              )}
              {!loading && educationList.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-4 text-center">등록된 학력이 없습니다.</td>
                </tr>
              )}
              {!loading && educationList.map((item, index) => (
                <tr key={`${item.educationNo ?? index}`} className="border-t">
                  <td className="p-2 text-center">{item.educationNm}</td>
                  <td className="p-2 text-center">{item.department}</td>
                  <td className="p-2 text-center">
                    {educationStatLabelMap[item.educationStatCd] || item.educationStatCd}
                  </td>
                  <td className="p-2 text-center">
                    {item.educationStartDt || '-'} ~ {item.educationEndDt || '재학 중'}
                  </td>
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
                        onClick={() => handleDelete(item.educationNo)}
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
            {formData.educationNo ? '학력 수정' : '학력 등록'}
          </div>
        </div>
        <table className="w-full table-fixed border-collapse mb-6">
          <tbody>
            <tr>
              <th className="p-2 text-left bg-blue-50 w-1/6">학교명</th>
              <td className="p-2 w-1/3">
                <input
                  type="text"
                  name="educationNm"
                  value={formData.educationNm}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  required
                />
              </td>
              <th className="p-2 text-left bg-blue-50 w-1/6">학과</th>
              <td className="p-2 w-1/3">
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  required
                />
              </td>
            </tr>
            <tr>
              <th className="p-2 text-left bg-blue-50 w-1/6">재학상태</th>
              <td className="p-2 w-1/3">
                <select
                  name="educationStatCd"
                  value={formData.educationStatCd}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  required
                >
                  <option value="">선택</option>
                  {educationStatOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </td>
              <th className="p-2 text-left bg-blue-50 w-1/6">학점</th>
              <td className="p-2 w-1/3">
                <input
                  type="text"
                  name="educationScore"
                  value={formData.educationScore || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="예: 4.2 / 4.5"
                />
              </td>
            </tr>
            <tr>
              <th className="p-2 text-left bg-blue-50 w-1/6">입학</th>
              <td className="p-2 w-1/3">
                <input
                  type="month"
                  name="educationStartDt"
                  value={formData.educationStartDt || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  required
                />
              </td>
              <th className="p-2 text-left bg-blue-50 w-1/6">졸업</th>
              <td className="p-2 w-1/3">
                <input
                  type="month"
                  name="educationEndDt"
                  value={formData.educationEndDt || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </td>
            </tr>
            <tr>
              <th className="p-2 text-left bg-blue-50 w-1/6">학교 로고</th>
              <td className="p-2 w-5/6" colSpan={3}>
                <div className="flex items-center gap-4">
                  {formData.logoPath ? (
                    <img src={formData.logoPath} alt="학교 로고" className="h-[48px] w-[48px] object-contain border" />
                  ) : (
                    <div className="h-[48px] w-[48px] flex items-center justify-center border text-sm text-gray-500">
                      없음
                    </div>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*"
                  />
                  <button
                    type="button"
                    onClick={handleUploadButtonClick}
                    className="px-4 py-2 text-sm font-medium transition-colors duration-150 bg-gray-400 text-white disabled:bg-gray-300"
                    disabled={uploading}
                  >
                    {uploading ? '업로드 중...' : '로고 업로드'}
                  </button>
                  <input
                    type="text"
                    name="logoPath"
                    value={formData.logoPath || ''}
                    readOnly
                    className="flex-1 px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm"
                  />
                </div>
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
            {saving ? (formData.educationNo ? '수정 중...' : '등록 중...') : (formData.educationNo ? '수정' : '등록')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ResumeEducation;
