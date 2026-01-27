import React, {useCallback, useEffect, useRef, useState} from 'react';
import CommonGrid from '@/components/common/CommonGrid';
import {ColDef, ICellRendererParams} from 'ag-grid-community';
import {dateFormatter} from "@/utils/common";
import Modal from '@/components/common/Modal';
import ResumeBase from '@/components/resume/ResumeBase';
import ResumeIntroduce from '@/components/resume/ResumeIntroduce';
import ResumeExperience from '@/components/resume/ResumeExperience';
import api from "@/utils/axios/axios";

// 이력서 데이터 타입 정의
interface ResumeData {
  loginId: string;
  usrNo: string;
  userNm: string;
  resumeNm: string;
  subTitle: string;
  regDt: string;
  udtDt: string;
}

const ResumeList = () => {
  const [rowData, setRowData] = useState<ResumeData[]>([]);
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUsrNo, setSelectedUsrNo] = useState<string | null>(null);
  const [isIntroduceModalOpen, setIsIntroduceModalOpen] = useState(false);
  const [selectedIntroduceUsrNo, setSelectedIntroduceUsrNo] = useState<string | null>(null);
  const [isExperienceModalOpen, setIsExperienceModalOpen] = useState(false);
  const [selectedExperienceUsrNo, setSelectedExperienceUsrNo] = useState<string | null>(null);

  const handleOpenModal = (usrNo: string) => {
    setSelectedUsrNo(usrNo);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUsrNo(null);
  };
  const handleOpenIntroduceModal = (usrNo: string) => {
    setSelectedIntroduceUsrNo(usrNo);
    setIsIntroduceModalOpen(true);
  };

  const handleCloseIntroduceModal = () => {
    setIsIntroduceModalOpen(false);
    setSelectedIntroduceUsrNo(null);
  };

  const handleOpenExperienceModal = (usrNo: string) => {
    setSelectedExperienceUsrNo(usrNo);
    setIsExperienceModalOpen(true);
  };

  const handleCloseExperienceModal = () => {
    setIsExperienceModalOpen(false);
    setSelectedExperienceUsrNo(null);
  };

  // 저장이 성공했을 때 호출될 함수 >> 리스트 변경때 필요하나, 없음.
  const handleSaveSuccess = () => {
    handleCloseModal(); // 1. 모달 닫기
    fetchResumes().then(r => setRowData(r || [])); // 2. 목록 새로고침
  };

  // 그리드 컬럼 정의
  const [columnDefs] = useState<ColDef[]>([
    { headerName: '사용자번호', width: 150, field: 'usrNo', cellClass: 'text-center', checkboxSelection: true, headerCheckboxSelection: true },
    { headerName: '사용자계정', width: 150, field: 'loginId', cellClass: 'text-center' },
    { headerName: '사용자명', width: 150, field: 'userNm', cellClass: 'text-center' },
    { headerName: '기본정보', width:150, cellClass: 'text-center'
      , cellRenderer: (params: ICellRendererParams) => {
        return <button type="button" onClick={() => handleOpenModal(params.data.usrNo)} className="px-4 py-2 text-sm font-medium transition-colors duration-150 bg-gray-400 text-white">
          기본정보
        </button>
      }},
    { headerName: '자기소개', width:150, cellClass: 'text-center'
      , cellRenderer: (params: ICellRendererParams) => {
        return <button type="button" onClick={() => handleOpenIntroduceModal(params.data.usrNo)} className="px-4 py-2 text-sm font-medium transition-colors duration-150 bg-gray-400 text-white">
          자기소개
        </button>
      }},
    { headerName: '경력', width:150, cellClass: 'text-center'
      , cellRenderer: (params: ICellRendererParams) => {
        return <button type="button" onClick={() => handleOpenExperienceModal(params.data.usrNo)} className="px-4 py-2 text-sm font-medium transition-colors duration-150 bg-gray-400 text-white">
          경력
        </button>
      }},
    { headerName: '학력', width:150, cellClass: 'text-center'
      , cellRenderer: () => {
        return <button type="button" className="px-4 py-2 text-sm font-medium transition-colors duration-150 bg-gray-400 text-white">
          학력
        </button>
      }},
    { headerName: '기타', width:150, cellClass: 'text-center'
      , cellRenderer: () => {
        return <button type="button" className="px-4 py-2 text-sm font-medium transition-colors duration-150 bg-gray-400 text-white">
          기타
        </button>
      }},
    { 
      headerName: '등록일',
      width: 180,
      field: 'regDt',
      cellClass: 'text-center',
      valueFormatter: (params) => dateFormatter(params),
    },
    {
      headerName: '수정일',
      width: 180,
      field: 'udtDt',
      cellClass: 'text-center',
      valueFormatter: (params) => dateFormatter(params),
    },
  ]);

  // 데이터 조회 함수
  const fetchResumes = useCallback(async (params: Record<string, any> = {}) => {
    setLoading(true);
    let result = {};

    try {
      const response = await api.get('/api/admin/resume/list', { params });
      return response.data;
    } catch (e) {
      console.error('Failed to fetch resume list');
      alert('이력서 목록을 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  // 검색 폼 제출 핸들러
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const searchParams = Object.fromEntries(formData.entries());
    fetchResumes(searchParams).then(r => setRowData(r || []));
  };

  // 컴포넌트 마운트 시 초기 데이터 로드
  useEffect(() => {
    fetchResumes()
        .then(r => setRowData(r || []));
  }, [fetchResumes]);

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-4">이력서 관리</h1>
      
      {/* 검색 영역 */}
      <form ref={formRef} onSubmit={handleSearch} className="search-bar mb-4 p-4 border rounded-lg bg-gray-50">
        <table className="w-full">
          <tbody>
            <tr>
              <th className="p-2 text-left bg-gray-100 w-1/6">검색어</th>
              <td className="p-2">
                <div className="flex items-center space-x-2">
                  <select 
                    name='searchGb'
                    defaultValue='loginId'
                    className="p-2 border border-gray-300 rounded"
                  >
                    <option value="loginId">사용자계정</option>
                    <option value="usrNo">사용자번호</option>
                    <option value="userNm">사용자명</option>
                  </select>
                  <input 
                    type="text"
                    name='searchValue'
                    className="p-2 border border-gray-300 rounded w-full"
                    placeholder="검색어를 입력하세요..."
                  />
                </div>
              </td>
            </tr>
            {/* 추가 검색 조건이 필요할 경우 여기에 tr을 추가 */}
          </tbody>
        </table>
        <div className="flex justify-center mt-4">
          <button 
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 whitespace-nowrap"
          >
            {loading ? '검색중...' : '검색'}
          </button>
        </div>
      </form>

      {/* 그리드 영역 */}
      <CommonGrid
        rowData={rowData}
        columnDefs={columnDefs as any}
        overlayLoadingTemplate={'<span class="ag-overlay-loading-center">데이터를 불러오는 중입니다...</span>'}
        overlayNoRowsTemplate={'<span class="ag-overlay-no-rows-center">데이터가 없습니다.</span>'}
        {...(loading && { overlayLoadingTemplate: '<span class="ag-overlay-loading-center">데이터를 불러오는 중입니다...</span>'})}
      />

      {/* 이력서 상세 정보 모달 */}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
        {selectedUsrNo && <ResumeBase usrNo={selectedUsrNo} onClose={handleCloseModal} />}
      </Modal>
      <Modal isOpen={isIntroduceModalOpen} onClose={handleCloseIntroduceModal}>
        {selectedIntroduceUsrNo && <ResumeIntroduce usrNo={selectedIntroduceUsrNo} onClose={handleCloseIntroduceModal} />}
      </Modal>
      <Modal isOpen={isExperienceModalOpen} onClose={handleCloseExperienceModal}>
        {selectedExperienceUsrNo && <ResumeExperience usrNo={selectedExperienceUsrNo} onClose={handleCloseExperienceModal} />}
      </Modal>
    </div>
  );
};

export default ResumeList;
