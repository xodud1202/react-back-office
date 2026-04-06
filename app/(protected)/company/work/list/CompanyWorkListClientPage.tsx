'use client';

import React, { useCallback, useMemo, useState } from 'react';
import type { CommonCode } from '@/components/goods/types';
import CompanyWorkCompletedGrid from '@/components/companyWork/CompanyWorkCompletedGrid';
import CompanyWorkImportModal from '@/components/companyWork/CompanyWorkImportModal';
import CompanyWorkSearchForm from '@/components/companyWork/CompanyWorkSearchForm';
import CompanyWorkSectionGrid from '@/components/companyWork/CompanyWorkSectionGrid';
import type {
  CompanyWorkCompanyOption,
  CompanyWorkCompletedListResponse,
  CompanyWorkProjectOption,
  CompanyWorkSearchFormState,
  CompanyWorkSearchParams,
  CompanyWorkStatusSection,
} from '@/components/companyWork/types';
import {
  fetchCompanyWorkCompletedList,
  fetchCompanyWorkProjectList,
  fetchCompanyWorkStatusList,
} from '@/services/companyWorkApi';
import { notifyError } from '@/utils/ui/feedback';

interface CompanyWorkListClientPageProps {
  // 회사 목록입니다.
  companyList: CompanyWorkCompanyOption[];
  // 최초 선택 회사의 프로젝트 목록입니다.
  initialProjectList: CompanyWorkProjectOption[];
  // 업무 상태 공통코드 목록입니다.
  workStatList: CommonCode[];
  // 업무 우선순위 공통코드 목록입니다.
  workPriorList: CommonCode[];
}

const COMPANY_WORK_COMPLETED_PAGE_SIZE = 20;

// 회사 업무 검색 폼 기본 상태를 생성합니다.
const createInitialSearchFormState = (
  companyList: CompanyWorkCompanyOption[],
  initialProjectList: CompanyWorkProjectOption[],
): CompanyWorkSearchFormState => ({
  // 초기 검색 폼은 첫 회사와 첫 프로젝트를 기본 선택합니다.
  workCompanySeq: companyList[0] ? String(companyList[0].workCompanySeq) : '',
  workCompanyProjectSeq: initialProjectList[0] ? String(initialProjectList[0].workCompanyProjectSeq) : '',
  title: '',
});

// 회사 업무 완료 목록 기본 응답을 생성합니다.
const createEmptyCompletedResponse = (): CompanyWorkCompletedListResponse => ({
  // 초기 완료 목록은 빈 배열과 기본 페이지 정보로 구성합니다.
  list: [],
  totalCount: 0,
  page: 1,
  pageSize: COMPANY_WORK_COMPLETED_PAGE_SIZE,
});

// 업무 상태 코드명 맵을 생성합니다.
const createWorkStatusNameMap = (workStatList: CommonCode[]): Map<string, string> => {
  // 상태 공통코드를 코드명 맵으로 변환합니다.
  const workStatusNameMap = new Map<string, string>();
  for (const workStatusItem of workStatList) {
    if (!workStatusItem?.cd) {
      continue;
    }
    workStatusNameMap.set(workStatusItem.cd, workStatusItem.cdNm || '');
  }
  return workStatusNameMap;
};

// 숫자 문자열을 유효한 번호로 변환합니다.
const resolveRequiredSequence = (value: string): number | null => {
  // 숫자 문자열이 아니면 null을 반환합니다.
  const resolvedNumber = Number(value);
  if (!Number.isInteger(resolvedNumber) || resolvedNumber < 1) {
    return null;
  }
  return resolvedNumber;
};

// 회사 업무 목록 화면을 렌더링합니다.
const CompanyWorkListClientPage = ({
  companyList,
  initialProjectList,
  workStatList,
  workPriorList,
}: CompanyWorkListClientPageProps) => {
  // 최초 검색 폼 기본값을 계산합니다.
  const initialSearchFormState = useMemo(
    () => createInitialSearchFormState(companyList, initialProjectList),
    [companyList, initialProjectList],
  );

  const [searchFormState, setSearchFormState] = useState<CompanyWorkSearchFormState>(() => initialSearchFormState);
  const [projectList, setProjectList] = useState<CompanyWorkProjectOption[]>(() => initialProjectList);
  const [statusSectionList, setStatusSectionList] = useState<CompanyWorkStatusSection[]>([]);
  const [completedResponse, setCompletedResponse] = useState<CompanyWorkCompletedListResponse>(() => createEmptyCompletedResponse());
  const [projectLoading, setProjectLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [completedLoading, setCompletedLoading] = useState(false);
  const [searchExecuted, setSearchExecuted] = useState(false);
  const [activeSearchParams, setActiveSearchParams] = useState<CompanyWorkSearchParams | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // 상태 코드별 코드명을 빠르게 찾기 위한 맵을 구성합니다.
  const workStatusNameMap = useMemo(() => createWorkStatusNameMap(workStatList), [workStatList]);

  // 화면에 노출할 상태별 섹션 목록만 필터링합니다.
  const visibleStatusSectionList = useMemo(() => (
    statusSectionList.filter((statusSectionItem) => (statusSectionItem.list || []).length > 0)
  ), [statusSectionList]);

  // 현재 검색 결과에 실제 업무가 존재하는지 계산합니다.
  const hasSearchResult = useMemo(() => (
    visibleStatusSectionList.length > 0 || completedResponse.totalCount > 0
  ), [completedResponse.totalCount, visibleStatusSectionList.length]);

  // 조회 결과 상태를 초기화합니다.
  const resetSearchResult = useCallback(() => {
    // 검색 결과와 마지막 실행 조건을 모두 비웁니다.
    setStatusSectionList([]);
    setCompletedResponse(createEmptyCompletedResponse());
    setSearchExecuted(false);
    setActiveSearchParams(null);
  }, []);

  // 선택 회사 기준 프로젝트 목록을 조회합니다.
  const loadProjectList = useCallback(async (workCompanySeqValue: string, preferredProjectSeq = '') => {
    // 회사 번호가 없으면 프로젝트 상태를 초기화합니다.
    if (!workCompanySeqValue) {
      setProjectList([]);
      setSearchFormState((prevState) => ({
        ...prevState,
        workCompanyProjectSeq: '',
      }));
      return;
    }

    setProjectLoading(true);
    try {
      // 회사 번호 기준 프로젝트 목록을 조회합니다.
      const nextProjectList = await fetchCompanyWorkProjectList(Number(workCompanySeqValue));
      setProjectList(nextProjectList);
      setSearchFormState((prevState) => {
        const hasPreferredProject = nextProjectList.some(
          (projectItem) => String(projectItem.workCompanyProjectSeq) === preferredProjectSeq,
        );
        return {
          ...prevState,
          workCompanyProjectSeq: hasPreferredProject
            ? preferredProjectSeq
            : (nextProjectList[0] ? String(nextProjectList[0].workCompanyProjectSeq) : ''),
        };
      });
    } catch (error) {
      // 프로젝트 조회 실패 시 목록을 비우고 오류를 안내합니다.
      console.error('회사 업무 프로젝트 목록 조회에 실패했습니다.', error);
      setProjectList([]);
      setSearchFormState((prevState) => ({
        ...prevState,
        workCompanyProjectSeq: '',
      }));
      notifyError('프로젝트 목록 조회에 실패했습니다.');
    } finally {
      setProjectLoading(false);
    }
  }, []);

  // 현재 검색 폼 상태를 실제 조회 파라미터로 변환합니다.
  const resolveSearchParams = useCallback((): CompanyWorkSearchParams | null => {
    // 필수 회사와 프로젝트를 먼저 검증합니다.
    const workCompanySeq = resolveRequiredSequence(searchFormState.workCompanySeq);
    if (!workCompanySeq) {
      notifyError('회사를 선택해주세요.');
      return null;
    }
    const workCompanyProjectSeq = resolveRequiredSequence(searchFormState.workCompanyProjectSeq);
    if (!workCompanyProjectSeq) {
      notifyError('프로젝트를 선택해주세요.');
      return null;
    }

    // 검증된 검색 조건을 객체로 반환합니다.
    return {
      workCompanySeq,
      workCompanyProjectSeq,
      title: searchFormState.title.trim(),
    };
  }, [searchFormState]);

  // 회사 변경 시 프로젝트 선택과 기존 조회 결과를 초기화합니다.
  const handleChangeWorkCompanySeq = useCallback(async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextWorkCompanySeq = event.target.value;

    // 회사 변경 즉시 프로젝트 선택과 결과 목록을 비웁니다.
    setSearchFormState((prevState) => ({
      ...prevState,
      workCompanySeq: nextWorkCompanySeq,
      workCompanyProjectSeq: '',
    }));
    setProjectList([]);
    resetSearchResult();
    await loadProjectList(nextWorkCompanySeq);
  }, [loadProjectList, resetSearchResult]);

  // 프로젝트 선택 변경을 반영합니다.
  const handleChangeWorkCompanyProjectSeq = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextWorkCompanyProjectSeq = event.target.value;

    // 선택 프로젝트 번호를 검색 폼 상태에 반영합니다.
    setSearchFormState((prevState) => ({
      ...prevState,
      workCompanyProjectSeq: nextWorkCompanyProjectSeq,
    }));
  }, []);

  // 타이틀 검색어 입력을 반영합니다.
  const handleChangeTitle = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const nextTitle = event.target.value;

    // 입력한 타이틀 검색어를 검색 폼 상태에 반영합니다.
    setSearchFormState((prevState) => ({
      ...prevState,
      title: nextTitle,
    }));
  }, []);

  // 검색 버튼 클릭 시 상태별 목록과 완료 목록을 함께 조회합니다.
  const handleSearch = useCallback(async () => {
    // 현재 입력 상태를 조회 파라미터로 검증합니다.
    const nextSearchParams = resolveSearchParams();
    if (!nextSearchParams) {
      return;
    }

    setStatusLoading(true);
    setCompletedLoading(true);
    try {
      // 비완료 상태별 목록과 완료 1페이지를 동시에 조회합니다.
      const [statusListResponse, completedListResponse] = await Promise.all([
        fetchCompanyWorkStatusList(nextSearchParams),
        fetchCompanyWorkCompletedList({
          ...nextSearchParams,
          page: 1,
          pageSize: COMPANY_WORK_COMPLETED_PAGE_SIZE,
        }),
      ]);
      setStatusSectionList(statusListResponse.statusSectionList || []);
      setCompletedResponse(completedListResponse);
      setActiveSearchParams(nextSearchParams);
      setSearchExecuted(true);
    } catch (error) {
      // 조회 실패 시 기존 결과는 유지하지 않고 오류를 안내합니다.
      console.error('회사 업무 목록 조회에 실패했습니다.', error);
      resetSearchResult();
      notifyError('업무 목록 조회에 실패했습니다.');
    } finally {
      setStatusLoading(false);
      setCompletedLoading(false);
    }
  }, [resetSearchResult, resolveSearchParams]);

  // 검색 초기화 시 입력값과 결과를 모두 비웁니다.
  const handleReset = useCallback(() => {
    // 검색 폼과 프로젝트 목록과 결과 상태를 초기화합니다.
    setSearchFormState(initialSearchFormState);
    setProjectList(initialProjectList);
    setProjectLoading(false);
    resetSearchResult();
  }, [initialProjectList, initialSearchFormState, resetSearchResult]);

  // 완료 목록 페이지만 다시 조회합니다.
  const handleChangeCompletedPage = useCallback(async (page: number) => {
    // 이전 검색 조건이 없거나 페이지가 1보다 작으면 종료합니다.
    if (!activeSearchParams || page < 1) {
      return;
    }

    setCompletedLoading(true);
    try {
      // 마지막 검색 조건 기준으로 완료 목록 페이지를 다시 조회합니다.
      const nextCompletedResponse = await fetchCompanyWorkCompletedList({
        ...activeSearchParams,
        page,
        pageSize: COMPANY_WORK_COMPLETED_PAGE_SIZE,
      });
      setCompletedResponse(nextCompletedResponse);
    } catch (error) {
      // 페이지 조회 실패 시 현재 페이지를 유지하고 오류를 안내합니다.
      console.error('회사 업무 완료 목록 조회에 실패했습니다.', error);
      notifyError('완료 목록 조회에 실패했습니다.');
    } finally {
      setCompletedLoading(false);
    }
  }, [activeSearchParams]);

  // SR 가져오기 모달을 엽니다.
  const handleOpenImportModal = useCallback(() => {
    // 모달 오픈 상태를 true로 전환합니다.
    setIsImportModalOpen(true);
  }, []);

  // SR 가져오기 모달을 닫습니다.
  const handleCloseImportModal = useCallback(() => {
    // 모달 오픈 상태를 false로 전환합니다.
    setIsImportModalOpen(false);
  }, []);

  // SR 가져오기 완료 후 현재 조건으로 목록을 다시 조회합니다.
  const handleImported = useCallback(async () => {
    // 가져오기 완료 직후 현재 검색 조건 기준으로 목록을 새로 고칩니다.
    await handleSearch();
  }, [handleSearch]);

  return (
    <>
      <div className="page-header">
        <h3 className="page-title">회사 업무 관리</h3>
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><a href="#">회사 업무</a></li>
            <li className="breadcrumb-item active" aria-current="page">업무 목록</li>
          </ol>
        </nav>
      </div>

      <CompanyWorkSearchForm
        companyList={companyList}
        projectList={projectList}
        formState={searchFormState}
        loading={statusLoading || completedLoading}
        projectLoading={projectLoading}
        onChangeWorkCompanySeq={handleChangeWorkCompanySeq}
        onChangeWorkCompanyProjectSeq={handleChangeWorkCompanyProjectSeq}
        onChangeTitle={handleChangeTitle}
        onSearch={handleSearch}
        onReset={handleReset}
      />

      <div className="d-flex justify-content-end align-items-center mb-3">
        <button type="button" className="btn btn-primary" onClick={handleOpenImportModal}>
          SR가져오기
        </button>
      </div>

      {statusLoading || completedLoading ? (
        <div className="text-end text-muted small mb-3">업무 목록을 불러오는 중입니다.</div>
      ) : null}

      {searchExecuted ? (
        <>
          {!hasSearchResult ? (
            <div className="row">
              <div className="col-lg-12 grid-margin stretch-card">
                <div className="card">
                  <div className="card-body">
                    <p className="mb-0 text-center text-muted">해당 프로젝트에 등록된 업무가 없습니다.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
          {visibleStatusSectionList.map((statusSectionItem) => (
            <CompanyWorkSectionGrid
              key={statusSectionItem.workStatCd}
              title={workStatusNameMap.get(statusSectionItem.workStatCd) || statusSectionItem.workStatCd}
              rowData={statusSectionItem.list || []}
              workPriorList={workPriorList}
            />
          ))}
          <CompanyWorkCompletedGrid
            rowData={completedResponse.list}
            totalCount={completedResponse.totalCount}
            page={completedResponse.page}
            pageSize={completedResponse.pageSize}
            loading={completedLoading}
            workPriorList={workPriorList}
            onChangePage={handleChangeCompletedPage}
          />
        </>
      ) : null}

      <CompanyWorkImportModal
        isOpen={isImportModalOpen}
        companyList={companyList}
        initialWorkCompanySeq={searchFormState.workCompanySeq}
        initialWorkCompanyProjectSeq={searchFormState.workCompanyProjectSeq}
        onClose={handleCloseImportModal}
        onImported={handleImported}
      />
    </>
  );
};

export default CompanyWorkListClientPage;
