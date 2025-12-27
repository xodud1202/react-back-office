import React, { useState, useEffect, useRef } from 'react';

import Image from "next/image";
import api from "@/utils/axios/axios";

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
  onClose?: () => void; // onClose 프로퍼티 추가
}

const ResumeBase: React.FC<ResumeBaseProps> = ({ usrNo, onClose }) => {
  const [formData, setFormData] = useState<ResumeBaseType | null>(null);
  const [skillInput, setSkillInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * handleButtonClick 변수는 특정 버튼 클릭 시 파일 입력을 트리거하는 함수입니다.
   * 파일 선택 창을 열기 위해 fileInputRef의 현재 참조를 클릭 동작으로 호출합니다.
   * 주의사항:
   * - fileInputRef는 React의 useRef를 통해 생성된 참조 객체여야 정상 작동합니다.
   * - fileInputRef가 올바르게 current 속성을 가지고 있지 않으면 클릭 동작이 실행되지 않습니다.
   */
  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  /**
   * 파일 선택 변경 이벤트를 처리하는 함수.
   * 사용자가 파일 입력 필드를 통해 파일을 선택하면 호출되며,
   * 선택된 파일을 서버로 업로드하는 작업을 수행합니다.
   *
   * @param {React.ChangeEvent<HTMLInputElement>} event - 파일 입력 필드의 변경 이벤트 객체.
   *   - `event.target.files`: 사용자가 선택한 파일 목록을 포함.
   *
   * @throws {Error} 서버 응답이 오류를 포함하거나 네트워크 요청이 실패하는 경우 오류를 발생시킴.
   *
   * 동작:
   * 1. 사용자가 파일을 선택하지 않았을 경우 함수 종료.
   * 2. FormData를 생성하고 선택된 파일과 사용자 번호(`usrNo`)를 추가.
   * 3. 서버의 `/api/upload/image` 엔드포인트로 비동기 POST 요청 전달.
   * 4. 요청 응답이 성공적이면, 상태를 업데이트하고 사용자에게 성공 메시지를 알림.
   * 5. 오류 발생 시, 사용자에게 적절한 오류 메시지를 표시.
   */
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

      const uploadFormData = new FormData();
      uploadFormData.append('image', file);
      uploadFormData.append('usrNo', String(usrNo));

      try {
        await api.post('/api/upload/image', uploadFormData)
          .then(response => {
            const data = response.data;
            if (data.error) {
                throw new Error(data.error);
            }

            setFormData(prev => prev ? {...prev, faceImgPath: data.faceImgPath} : null);
            alert(data.message || '이미지가 변경되었습니다.');
            console.log('Image uploaded successfully:', data);
          }).catch(e => {
            console.log('Failed to upload image:', e)
            alert(e);
          });
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
          await api.get(`/api/admin/resume/${usrNo}`).then(response => {
            const body = response.data;
            setFormData(body);
          }).catch(e => {
            console.error('Failed to fetch resume data');
            console.error(e);
          });
        } catch (error) {
          console.error('Error fetching resume data:', error);
        }
      };

      fetchResumeData();
    }
  }, [usrNo]);

  /**
   * 사용자의 입력 이벤트를 처리하는 함수입니다.
   * 입력 필드에서 발생한 변경 이벤트를 받아 해당 필드의 값을 상태 업데이트에 반영합니다.
   *
   * @param {React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>} e
   * 입력 이벤트 객체로, 이벤트가 발생한 요소의 정보를 포함합니다.
   *
   * - 이벤트 객체의 `target` 속성을 통해 요소의 `name`, `value`, `type`을 가져와 처리합니다.
   * - 입력 타입이 'number'인 경우 문자열로 전달된 값을 정수로 변환합니다.
   * - 기존 상태 객체를 복사하고, 변경된 값을 새 상태에 반영합니다.
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'number' ? parseInt(value, 10) : value;
    if (formData) {
      setFormData({ ...formData, [name]: newValue });
    }
  };

  /**
   * handleSkillChange 변수는 입력 필드에서 발생하는 변경 이벤트를 처리하는 함수입니다.
   * 이 함수는 사용자의 입력값을 받아 상태 관리 변수에 업데이트합니다.
   * @param e - 사용자의 입력 이벤트를 나타내는 React.ChangeEvent<HTMLInputElement> 객체
   */
  const handleSkillChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSkillInput(e.target.value);
  };

  /**
   * 사용자가 입력한 스킬을 폼 데이터의 스킬 리스트에 추가하는 함수.
   *
   * 이 함수는 유효한 입력 값이 있을 경우, 입력된 스킬을 현재 폼 데이터의
   * 스킬 리스트에 추가하고 입력 필드를 초기화합니다.
   *
   * 조건:
   * - 스킬 입력 값이 비어있지 않아야 함.
   * - formData가 유효한 값이어야 함.
   *
   * 기능:
   * 1. 스킬 입력 값을 공백 제거(trim) 후 확인.
   * 2. 현재 폼 데이터의 스킬 리스트에 새 스킬 추가.
   * 3. 업데이트된 스킬 리스트를 formData에 저장.
   * 4. 입력 필드를 초기화.
   */
  const addSkill = () => {
    if (skillInput.trim() !== '' && formData) {
      const newSkillList = [...(formData.skillList || []), skillInput.trim()];
      setFormData({ ...formData, skillList: newSkillList });
      setSkillInput('');
    }
  };

  /**
   * 사용자가 제공한 특정 스킬을 현재 스킬 목록에서 제거합니다.
   *
   * @param {string} skillToRemove - 제거할 스킬의 이름.
   *
   * 이 함수는 `formData` 객체가 존재하는 경우에만 동작합니다.
   * `formData.skillList` 배열에서 `skillToRemove`와 일치하지 않는 항목만 남기는 새로운 배열을 생성한 후,
   * `formData` 객체를 업데이트합니다.
   *
   * 스킬 목록 필드가 존재하지 않거나 초기화되지 않은 경우, 빈 배열로 처리된 후 업데이트됩니다.
   */
  const removeSkill = (skillToRemove: string) => {
    if (formData) {
      const newSkillList = (formData.skillList || []).filter((skill: string) => skill !== skillToRemove);
      setFormData({ ...formData, skillList: newSkillList });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) {
      const dataToSend = { ...formData, usrNo };

      try {
        const requestParam = {
          body: JSON.stringify(dataToSend),
        };

        await api.put(`/api/admin/resume/${usrNo}`, dataToSend).then(response => {
          const body = response.data;
          if(body.result === "success") {
            alert(body.message);
            if (onClose) onClose(); // 저장이 성공하면 모달 닫기 함수 호출
          } else {
            alert(body.message);
          }
        });

        // const response = await fetch(`/api/admin/resume/${usrNo}`, {
        //   method: 'PUT',
        //   headers: {
        //     'Content-Type': 'application/json',
        //   },
        //   body: JSON.stringify(dataToSend),
        // });
        //
        // if (response.ok) {
        //   // 성공적으로 업데이트됨
        //   console.log('Resume updated successfully');
        // } else {
        //   console.error('Failed to update resume');
        // }
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
      <table className="w-full table-fixed border-collapse" >
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
            <th className="p-2 text-left bg-blue-50 w-1/6">{/* 증명사진 URL */}</th>
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