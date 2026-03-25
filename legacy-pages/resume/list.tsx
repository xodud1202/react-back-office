import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {dateFormatter} from "@/utils/common";
import Modal from '@/components/common/Modal';
import ResumeBase from '@/components/resume/ResumeBase';
import ResumeIntroduce from '@/components/resume/ResumeIntroduce';
import ResumeExperience from '@/components/resume/ResumeExperience';
import ResumeEducation from '@/components/resume/ResumeEducation';
import ResumeOtherExperience from '@/components/resume/ResumeOtherExperience';
import api from "@/utils/axios/axios";
import { AgGridReact } from 'ag-grid-react';
import type { ColDef, GridApi, GridReadyEvent, ICellRendererParams, IDatasource, IGetRowsParams } from 'ag-grid-community';

// 이력서 데이터 타입 정의
interface ResumeData {
  loginId: string;
  usrNo: string;
  userNm: string;
  resumeNm: string;
  subTitle: string;
  regDt: string;
  udtDt: string;
  base?: string;
  introduce?: string;
  experience?: string;
  education?: string;
  other?: string;
}

interface ResumeListResponse {
  list: ResumeData[];
  totalCount: number;
  page: number;
  pageSize: number;
}

const ResumeList = () => {
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [searchParams, setSearchParams] = useState<Record<string, any>>({});
  const gridApiRef = useRef<GridReadyEvent<ResumeData>['api'] | null>(null);
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

  // 검색 폼 제출 핸들러
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const nextParams = Object.fromEntries(formData.entries());
    setSearchParams(nextParams);
  };

  // 이력서 목록 그리드 컬럼을 정의합니다.
  const columnDefs = useMemo<ColDef<ResumeData>[]>(() => [
    { headerName: '사용자번호', field: 'usrNo', width: 120 },
    { headerName: '사용자계정', field: 'loginId', width: 140 },
    { headerName: '사용자명', field: 'userNm', width: 140 },
    {
      headerName: '기본정보',
      field: 'base',
      width: 120,
      cellRenderer: (params: ICellRendererParams<ResumeData>) => (
        <button type="button" onClick={() => params.data?.usrNo && handleOpenModal(params.data.usrNo)} className="btn btn-primary btn-sm">
          기본정보
        </button>
      ),
    },
    {
      headerName: '자기소개',
      field: 'introduce',
      width: 120,
      cellRenderer: (params: ICellRendererParams<ResumeData>) => (
        <button type="button" onClick={() => params.data?.usrNo && handleOpenIntroduceModal(params.data.usrNo)} className="btn btn-primary btn-sm">
          자기소개
        </button>
      ),
    },
    {
      headerName: '경력',
      field: 'experience',
      width: 90,
      cellRenderer: (params: ICellRendererParams<ResumeData>) => (
        <button type="button" onClick={() => params.data?.usrNo && handleOpenExperienceModal(params.data.usrNo)} className="btn btn-primary btn-sm">
          경력
        </button>
      ),
    },
    {
      headerName: '학력',
      field: 'education',
      width: 90,
      cellRenderer: (params: ICellRendererParams<ResumeData>) => (
        <button type="button" onClick={() => params.data?.usrNo && handleOpenEducationModal(params.data.usrNo)} className="btn btn-primary btn-sm">
          학력
        </button>
      ),
    },
    {
      headerName: '기타',
      field: 'other',
      width: 90,
      cellRenderer: (params: ICellRendererParams<ResumeData>) => (
        <button type="button" onClick={() => params.data?.usrNo && handleOpenOtherExperienceModal(params.data.usrNo)} className="btn btn-primary btn-sm">
          기타
        </button>
      ),
    },
    {
      headerName: '등록일',
      field: 'regDt',
      width: 180,
      valueFormatter: (params) => dateFormatter({ value: params.value } as any),
    },
    {
      headerName: '수정일',
      field: 'udtDt',
      width: 180,
      valueFormatter: (params) => dateFormatter({ value: params.value } as any),
    },
  ], []);

  // 그리드 기본 컬럼 속성을 정의합니다.
  const defaultColDef = useMemo<ColDef>(() => ({
    resizable: true,
    sortable: false,
    cellClass: 'text-center',
  }), []);

  // 이력서 목록 그리드 데이터소스를 생성합니다.
  const createDataSource = useCallback((): IDatasource => ({
    getRows: async (params: IGetRowsParams) => {
      const pageSize = 20;
      const startRow = params.startRow ?? 0;
      const page = Math.floor(startRow / pageSize) + 1;

      setLoading(true);
      try {
        const response = await api.get('/api/admin/resume/list', {
          params: {
            ...searchParams,
            page,
          },
        });
        const data = (response.data || {}) as ResumeListResponse;
        params.successCallback(data.list || [], data.totalCount || 0);
      } catch {
        console.error('Failed to fetch resume list');
        params.failCallback();
      } finally {
        setLoading(false);
      }
    },
  }), [searchParams]);

  // 그리드 데이터소스를 안전하게 설정합니다.
  const applyDatasource = useCallback((api: GridApi<ResumeData>, datasource: IDatasource) => {
    if (typeof (api as any).setGridOption === 'function') {
      (api as any).setGridOption('datasource', datasource);
      return;
    }
    if (typeof (api as any).setDatasource === 'function') {
      (api as any).setDatasource(datasource);
    }
  }, []);

  // 이력서 목록 그리드를 초기화합니다.
  const handleGridReady = useCallback((event: GridReadyEvent<ResumeData>) => {
    gridApiRef.current = event.api;
    applyDatasource(event.api, createDataSource());
  }, [applyDatasource, createDataSource]);

  useEffect(() => {
    if (!gridApiRef.current) {
      return;
    }
    applyDatasource(gridApiRef.current, createDataSource());
  }, [applyDatasource, createDataSource]);

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
                <div className="d-flex justify-content-center gap-2">
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? '검색중...' : '검색'}
                  </button>
                  <button type="reset" className="btn btn-dark">
                    초기화
                  </button>
                </div>
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
              <div className="ag-theme-alpine-dark header-center" style={{ width: '100%' }}>
                <AgGridReact<ResumeData>
                  columnDefs={columnDefs}
                  defaultColDef={defaultColDef}
                  domLayout="autoHeight"
                  overlayNoRowsTemplate="데이터가 없습니다."
                  rowModelType="infinite"
                  cacheBlockSize={20}
                  pagination
                  paginationPageSize={20}
                  getRowId={(params) => String(params.data?.usrNo ?? '')}
                  onGridReady={handleGridReady}
                />
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
