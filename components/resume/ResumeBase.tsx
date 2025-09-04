import React, { useState, useEffect, useRef } from 'react';

import Image from "next/image";

export interface ResumeBaseType {
  usrNo: string;
  userNm: string;
  subTitle: string;
  mobile: string;
  email: string;
  portfolio: string;
  lastPay: number;
  faceImgPath: string;
  addr: string;
  delYn: string;
  skillList: string[];
  
}

interface ResumeBaseProps {
  usrNo: string;
}

const ResumeBase: React.FC<ResumeBaseProps> = ({ usrNo }) => {
  const [formData, setFormData] = useState<ResumeBaseType | null>(null);
  const [skillInput, setSkillInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

      const formData = new FormData();
      formData.append('image', file);
      formData.append('usrNo', usrNo);

      try {
          // 직접 백엔드로 전송 (backend-api 거치지 않음)
          alert(process.env.BACKEND_URL);
          alert(process.env.BACKEND_URL);
          const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:3010';
          const response = await fetch(`${backendUrl}/api/upload/image`, {
              method: 'POST',
              body: formData // Content-Type은 자동으로 multipart/form-data가 됩니다
          });

          if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();

          if (data.error) {
              throw new Error(data.error);
          }

          setFormData(prev => prev ? {...prev, faceImgPath: data.faceImgPath} : null);
          console.log('Image uploaded successfully:', data);

      } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          alert(`Failed to upload image: ${errorMessage}`);
      }
  };

  useEffect(() => {
    if (usrNo) {
      // usrNo를 사용하여 이력서 데이터를 가져오는 API 호출
      const fetchResumeData = async () => {
        try {
          const requestUri = `/api/admin/resume/${usrNo}`;
          const requestParam = { method: 'GET', params: {} };

          const response = await fetch('/api/backend-api', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requestUri, requestParam })
          });

          if (response.ok) {
            const data = await response.json();
            setFormData(data);
          } else {
            console.error('Failed to fetch resume data');
          }
        } catch (error) {
          console.error('Error fetching resume data:', error);
        }
      };

      fetchResumeData();
    }
  }, [usrNo]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'number' ? parseInt(value, 10) : value;
    if (formData) {
      setFormData({ ...formData, [name]: newValue });
    }
  };

  const handleSkillChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSkillInput(e.target.value);
  };

  const addSkill = () => {
    if (skillInput.trim() !== '' && formData) {
      const newSkillList = [...(formData.skillList || []), skillInput.trim()];
      setFormData({ ...formData, skillList: newSkillList });
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    if (formData) {
      const newSkillList = (formData.skillList || []).filter((skill: string) => skill !== skillToRemove);
      setFormData({ ...formData, skillList: newSkillList });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) {
      const dataToSend = { ...formData };

      try {
        const response = await fetch(`/api/admin/resume/${usrNo}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(dataToSend),
        });

        if (response.ok) {
          // 성공적으로 업데이트됨
          console.log('Resume updated successfully');
        } else {
          console.error('Failed to update resume');
        }
      } catch (error) {
        console.error('Error updating resume:', error);
      }
    }
  };

  if (!formData) {
    return <div>Loading...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="">
      <div className="text-[24px] font-bold text-center mb-[10px]">이력서 기본 정보</div>
      <table className="w-full border-collapse max-h-[500px] overflow-y-auto block" >
        <tbody>
          <tr>
            <th className="p-2 text-left bg-blue-50 w-1/6">성명</th>
            <td className="p-2 w-1/3">
              <input
                type="text"
                name="userNm"
                id="userNm"
                value={formData?.userNm || ''}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </td>
            <th className="p-2 text-left bg-blue-50 w-1/6" rowSpan={2}>증명사진</th>
            <td className="p-2 w-1/3" rowSpan={2}>
              <div>
                <div className={"relative h-[100px]"}>
                  <img src={formData?.faceImgPath || ''} alt="이력서 사진" className={"max-h-full w-auto inline-block"} />

                  <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden" // 실제 파일 입력 필드는 숨김
                      accept="image/*" // 이미지 파일만 허용
                  />
                  <button
                      type="button"
                      onClick={handleButtonClick}
                      className="inline-block ml-[30px] px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    변경
                  </button>
                </div>
              </div>
            </td>
          </tr>
          <tr>
            <th className="p-2 text-left bg-blue-50 w-1/6">부제</th>
            <td className="p-2 w-1/3">
              <input
                  type="text"
                  name="subTitle"
                  id="subTitle"
                  value={formData?.subTitle || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </td>
          </tr>
          <tr>
            <th className="p-2 text-left bg-blue-50 w-1/6">연락처</th>
            <td className="p-2 w-1/3">
              <input
                type="text"
                name="mobile"
                id="mobile"
                value={formData?.mobile || ''}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </td>
            <th className="p-2 text-left bg-blue-50 w-1/6">Email</th>
            <td className="p-2 w-1/3">
              <input
                type="email"
                name="email"
                id="email"
                value={formData?.email || ''}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </td>
          </tr>
          <tr>
            <th className="p-2 text-left bg-blue-50 w-1/6">최종연봉</th>
            <td className="p-2 w-1/3">
              <input
                type="number"
                name="lastPay"
                id="lastPay"
                value={formData?.lastPay || ''}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </td>
            <th className="p-2 text-left bg-blue-50 w-1/6">증명사진</th>
            <td className="p-2 w-1/3">
              <div className="flex items-center">
                <input
                  type="text"
                  name="faceImgPath"
                  id="faceImgPath"
                  value={formData?.faceImgPath || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  readOnly // 사용자가 직접 수정하지 못하도록 readOnly로 설정
                />
              </div>
            </td>
          </tr>
          <tr>
            <th className="p-2 text-left bg-blue-50 w-1/6">포트폴리오</th>
            <td className="p-2" colSpan={3}>
              <input
                type="text"
                name="portfolio"
                id="portfolio"
                value={formData?.portfolio || ''}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </td>
          </tr>
          <tr>
            <th className="p-2 text-left bg-blue-50 w-1/6">주소</th>
            <td className="p-2" colSpan={3}>
              <input
                type="text"
                name="addr"
                id="addr"
                value={formData?.addr || ''}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </td>
          </tr>
          <tr>
            <th className="p-2 text-left bg-blue-50 w-1/6">기술</th>
            <td className="p-2" colSpan={3}>
              <div className="flex items-center">
                <input
                  type="text"
                  value={skillInput}
                  onChange={handleSkillChange}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                <button type="button" onClick={addSkill} className="ml-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  +
                </button>
              </div>
              <div className="mt-2">
                {formData?.skillList?.map((skill: string) => (
                  skill && <span key={skill} className="inline-block bg-blue-50 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">
                    {skill}
                    <button type="button" onClick={() => removeSkill(skill)} className="ml-2 text-red-500 hover:text-red-700">
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div className="mt-4 flex justify-end">
        <button type="submit" className="m-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          저장
        </button>
      </div>
    </form>
  );
};

export default ResumeBase;