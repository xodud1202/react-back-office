import React, {useCallback, useEffect, useRef, useState} from 'react';
import {dateFormatter} from "@/utils/common";
import Modal from '@/components/common/Modal';
import ResumeBase from '@/components/resume/ResumeBase';
import ResumeIntroduce from '@/components/resume/ResumeIntroduce';
import ResumeExperience from '@/components/resume/ResumeExperience';
import ResumeEducation from '@/components/resume/ResumeEducation';
import ResumeOtherExperience from '@/components/resume/ResumeOtherExperience';
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
  const [isEducationModalOpen, setIsEducationModalOpen] = useState(false);
  const [selectedEducationUsrNo, setSelectedEducationUsrNo] = useState<string | null>(null);
  const [isOtherExperienceModalOpen, setIsOtherExperienceModalOpen] = useState(false);
  const [selectedOtherExperienceUsrNo, setSelectedOtherExperienceUsrNo] = useState<string | null>(null);

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

  const handleOpenEducationModal = (usrNo: string) => {
    setSelectedEducationUsrNo(usrNo);
    setIsEducationModalOpen(true);
  };

  const handleCloseEducationModal = () => {
    setIsEducationModalOpen(false);
    setSelectedEducationUsrNo(null);
  };

  // 기타 항목 모달을 엽니다.
  const handleOpenOtherExperienceModal = (usrNo: string) => {
    setSelectedOtherExperienceUsrNo(usrNo);
    setIsOtherExperienceModalOpen(true);
  };

  // 기타 항목 모달을 닫습니다.
  const handleCloseOtherExperienceModal = () => {
    setIsOtherExperienceModalOpen(false);
    setSelectedOtherExperienceUsrNo(null);
  };

  // 저장이 성공했을 때 호출될 함수 >> 리스트 변경때 필요하나, 없음.
  const handleSaveSuccess = () => {
    handleCloseModal(); // 1. 모달 닫기
    fetchResumes().then(r => setRowData(r || [])); // 2. 목록 새로고침
  };

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
    <>
      <div className="page-header">
        <h3 className="page-title"> 이력서 관리 </h3>
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><a href="#">이력서</a></li>
            <li className="breadcrumb-item active" aria-current="page">목록</li>
          </ol>
        </nav>
      </div>

      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card">
            <div className="card-body">
              <h4 className="card-title">검색 조건</h4>
              <p className="card-description">이력서 목록 조회 조건을 입력하세요.</p>
              <form ref={formRef} onSubmit={handleSearch} className="forms-sample">
                <div className="row">
                  <div className="col-md-2">
                    <div className="form-group">
                      <label>검색 구분</label>
                      <select name="searchGb" defaultValue="loginId" className="form-select">
                        <option value="loginId">사용자계정</option>
                        <option value="usrNo">사용자번호</option>
                        <option value="userNm">사용자명</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-10">
                    <div className="form-group">
                      <label>검색어</label>
                      <input
                        type="text"
                        name="searchValue"
                        className="form-control"
                        placeholder="검색어를 입력하세요"
                      />
                    </div>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary me-2" disabled={loading}>
                  {loading ? '검색중...' : '검색'}
                </button>
                <button type="reset" className="btn btn-dark">
                  초기화
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-12 grid-margin stretch-card">
          <div className="card">
            <div className="card-body">
              <h4 className="card-title">이력서 목록</h4>
              <p className="card-description">조회 결과 목록입니다.</p>
              <div className="table-responsive">
                <table className="table table-fixed text-center">
                  <thead>
                    <tr>
                      <th style={{ width: '120px' }}>사용자번호</th>
                      <th style={{ width: '140px' }}>사용자계정</th>
                      <th style={{ width: '140px' }}>사용자명</th>
                      <th style={{ width: '90px' }}>기본정보</th>
                      <th style={{ width: '90px' }}>자기소개</th>
                      <th style={{ width: '90px' }}>경력</th>
                      <th style={{ width: '90px' }}>학력</th>
                      <th style={{ width: '90px' }}>기타</th>
                      <th style={{ width: '140px' }}>등록일</th>
                      <th style={{ width: '140px' }}>수정일</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rowData.length === 0 && (
                      <tr>
                        <td colSpan={10} className="text-center">데이터가 없습니다.</td>
                      </tr>
                    )}
                    {rowData.map((row) => (
                      <tr key={row.usrNo}>
                        <td style={{ width: '120px' }}>{row.usrNo}</td>
                        <td style={{ width: '140px' }}>{row.loginId}</td>
                        <td style={{ width: '140px' }}>{row.userNm}</td>
                        <td>
                          <button type="button" onClick={() => handleOpenModal(row.usrNo)} className="btn btn-primary btn-sm">
                            기본정보
                          </button>
                        </td>
                        <td>
                          <button type="button" onClick={() => handleOpenIntroduceModal(row.usrNo)} className="btn btn-primary btn-sm">
                            자기소개
                          </button>
                        </td>
                        <td>
                          <button type="button" onClick={() => handleOpenExperienceModal(row.usrNo)} className="btn btn-primary btn-sm">
                            경력
                          </button>
                        </td>
                        <td>
                          <button type="button" onClick={() => handleOpenEducationModal(row.usrNo)} className="btn btn-primary btn-sm">
                            학력
                          </button>
                        </td>
                        <td>
                          <button type="button" onClick={() => handleOpenOtherExperienceModal(row.usrNo)} className="btn btn-primary btn-sm">
                            기타
                          </button>
                        </td>
                        <td style={{ width: '140px' }}>{dateFormatter({ value: row.regDt } as any)}</td>
                        <td style={{ width: '140px' }}>{dateFormatter({ value: row.udtDt } as any)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

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
      <Modal isOpen={isEducationModalOpen} onClose={handleCloseEducationModal}>
        {selectedEducationUsrNo && <ResumeEducation usrNo={selectedEducationUsrNo} onClose={handleCloseEducationModal} />}
      </Modal>
      <Modal isOpen={isOtherExperienceModalOpen} onClose={handleCloseOtherExperienceModal}>
        {selectedOtherExperienceUsrNo && <ResumeOtherExperience usrNo={selectedOtherExperienceUsrNo} onClose={handleCloseOtherExperienceModal} />}
      </Modal>
    </>
  );
};

export default ResumeList;
