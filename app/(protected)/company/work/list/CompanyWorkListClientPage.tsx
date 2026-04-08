'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CommonCode } from '@/components/goods/types';
import CompanyWorkCompletedGrid from '@/components/companyWork/CompanyWorkCompletedGrid';
import CompanyWorkDetailModal from '@/components/companyWork/CompanyWorkDetailModal';
import CompanyWorkImportModal from '@/components/companyWork/CompanyWorkImportModal';
import CompanyWorkSearchForm from '@/components/companyWork/CompanyWorkSearchForm';
import CompanyWorkSectionGrid from '@/components/companyWork/CompanyWorkSectionGrid';
import type {
  CompanyWorkCompanyOption,
  CompanyWorkCompletedListResponse,
  CompanyWorkDetail,
  CompanyWorkDetailEditableValues,
  CompanyWorkDetailResponse,
  CompanyWorkListRow,
  CompanyWorkProjectOption,
  CompanyWorkReply,
  CompanyWorkReplyDeleteRequest,
  CompanyWorkReplyUpdateRequest,
  CompanyWorkSaveEditableRowHandler,
  CompanyWorkSearchFormState,
  CompanyWorkSearchParams,
  CompanyWorkStatusSection,
  CompanyWorkUpdateRequest,
} from '@/components/companyWork/types';
import {
  createCompanyWorkReply,
  deleteCompanyWorkReply,
  fetchCompanyWorkCompletedList,
  fetchCompanyWorkDetail,
  fetchCompanyWorkProjectList,
  fetchCompanyWorkStatusList,
  updateCompanyWorkReply,
  updateCompanyWork,
  updateCompanyWorkDetail,
} from '@/services/companyWorkApi';
import { requireLoginUsrNo } from '@/utils/auth';
import { extractApiErrorMessage } from '@/utils/api/error';
import { notifyError, notifySuccess } from '@/utils/ui/feedback';

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
const COMPANY_WORK_COMPLETED_STATUS_CODE = 'WORK_STAT_05';

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

// 문자열 값을 비교 가능한 빈 문자열 기준으로 정규화합니다.
const normalizeComparableText = (value?: string | null): string => {
  // undefined/null 값은 빈 문자열로 통일합니다.
  if (typeof value !== 'string') {
    return '';
  }
  return value;
};

// 날짜 값을 yyyy-MM-dd 문자열로 정규화합니다.
const normalizeEditableDate = (value?: string | null): string => {
  // 날짜 값이 없으면 빈 문자열을 반환합니다.
  const normalizedValue = normalizeComparableText(value).trim();
  if (!normalizedValue) {
    return '';
  }
  return normalizedValue.slice(0, 10);
};

// IT 담당자 문자열을 저장용으로 정규화합니다.
const normalizeEditableManager = (value?: string | null): string => {
  // 문자열 양끝 공백만 제거해 저장값을 맞춥니다.
  return normalizeComparableText(value).trim();
};

// 공수시간 값을 저장 가능한 숫자 또는 null로 정규화합니다.
const normalizeEditableWorkTime = (value?: number | null): number | null => {
  // 숫자가 아니면 빈값(null)으로 저장합니다.
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
};

// 상세 업무 정보를 목록 행 구조로 변환합니다.
const createCompanyWorkListRowFromDetail = (detail: CompanyWorkDetail): CompanyWorkListRow => ({
  // 상세 응답을 현재 목록 행 갱신에 필요한 구조로 맞춥니다.
  workSeq: detail.workSeq,
  workCompanySeq: detail.workCompanySeq,
  workCompanyProjectSeq: detail.workCompanyProjectSeq,
  workStatCd: detail.workStatCd,
  workKey: detail.workKey,
  title: detail.title,
  workCreateDt: detail.workCreateDt,
  workStartDt: detail.workStartDt,
  workEndDt: detail.workEndDt,
  workTime: detail.workTime,
  workPriorCd: detail.workPriorCd,
  workPriorNm: detail.workPriorNm,
  itManager: detail.itManager,
  coManager: detail.coManager,
  regDt: detail.regDt,
  udtDt: detail.udtDt,
});

// 회사 업무 행 목록을 정렬 기준에 맞게 정렬합니다.
const sortCompanyWorkRows = (rowList: CompanyWorkListRow[]): CompanyWorkListRow[] => {
  // 업무 생성일시 내림차순, 업무 번호 내림차순으로 정렬합니다.
  return [...rowList].sort((previousRow, nextRow) => {
    const previousWorkCreateDt = normalizeComparableText(previousRow.workCreateDt);
    const nextWorkCreateDt = normalizeComparableText(nextRow.workCreateDt);
    if (previousWorkCreateDt !== nextWorkCreateDt) {
      return nextWorkCreateDt.localeCompare(previousWorkCreateDt);
    }
    return Number(nextRow.workSeq || 0) - Number(previousRow.workSeq || 0);
  });
};

// 최신 행 정보를 상태별 섹션 목록에 반영합니다.
const applyUpdatedRowToStatusSections = (
  statusSectionList: CompanyWorkStatusSection[],
  updatedRow: CompanyWorkListRow,
): CompanyWorkStatusSection[] => {
  // 대상 행을 모든 섹션에서 제거한 뒤 새 상태 섹션에 다시 삽입합니다.
  return statusSectionList.map((statusSectionItem) => {
    const filteredRowList = (statusSectionItem.list || []).filter((rowItem) => rowItem.workSeq !== updatedRow.workSeq);
    if (updatedRow.workStatCd === COMPANY_WORK_COMPLETED_STATUS_CODE || statusSectionItem.workStatCd !== updatedRow.workStatCd) {
      return {
        ...statusSectionItem,
        list: filteredRowList,
      };
    }
    return {
      ...statusSectionItem,
      list: sortCompanyWorkRows([...filteredRowList, updatedRow]),
    };
  });
};

// 최신 행 정보를 완료 목록 응답에 반영합니다.
const applyUpdatedRowToCompletedResponse = (
  completedResponse: CompanyWorkCompletedListResponse,
  updatedRow: CompanyWorkListRow,
): CompanyWorkCompletedListResponse => {
  const hasCurrentRow = completedResponse.list.some((rowItem) => rowItem.workSeq === updatedRow.workSeq);
  const filteredRowList = completedResponse.list.filter((rowItem) => rowItem.workSeq !== updatedRow.workSeq);

  // 완료 상태가 아니면 현재 완료 목록에서만 제거합니다.
  if (updatedRow.workStatCd !== COMPANY_WORK_COMPLETED_STATUS_CODE) {
    return {
      ...completedResponse,
      list: filteredRowList,
      totalCount: hasCurrentRow ? Math.max(0, completedResponse.totalCount - 1) : completedResponse.totalCount,
    };
  }

  // 완료 상태면 전체 건수를 보정하고 현재 페이지가 1일 때만 목록에 삽입합니다.
  const nextTotalCount = hasCurrentRow ? completedResponse.totalCount : completedResponse.totalCount + 1;
  if (completedResponse.page !== 1 && !hasCurrentRow) {
    return {
      ...completedResponse,
      totalCount: nextTotalCount,
    };
  }
  return {
    ...completedResponse,
    list: sortCompanyWorkRows([...filteredRowList, updatedRow]).slice(0, completedResponse.pageSize),
    totalCount: nextTotalCount,
  };
};

// 현재 화면에 보이는 회사 업무 행을 업무번호 기준 맵으로 구성합니다.
const createCompanyWorkRowMap = (
  statusSectionList: CompanyWorkStatusSection[],
  completedResponse: CompanyWorkCompletedListResponse,
): Map<number, CompanyWorkListRow> => {
  const companyWorkRowMap = new Map<number, CompanyWorkListRow>();

  // 상태별 목록의 최신 행 정보를 먼저 맵에 적재합니다.
  for (const statusSectionItem of statusSectionList) {
    for (const rowItem of statusSectionItem.list || []) {
      companyWorkRowMap.set(rowItem.workSeq, rowItem);
    }
  }

  // 완료 목록도 함께 적재해 페이지 내 최신 행을 찾을 수 있게 합니다.
  for (const rowItem of completedResponse.list || []) {
    companyWorkRowMap.set(rowItem.workSeq, rowItem);
  }
  return companyWorkRowMap;
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
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailSaving, setDetailSaving] = useState(false);
  const [replySaving, setReplySaving] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailResponse, setDetailResponse] = useState<CompanyWorkDetailResponse | null>(null);
  const companyWorkRowMapRef = useRef<Map<number, CompanyWorkListRow>>(new Map());
  const detailRequestSequenceRef = useRef(0);
  const initialAutoSearchDoneRef = useRef(false);

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

  // 상태 목록이나 완료 목록이 바뀌면 최신 행 맵을 함께 갱신합니다.
  useEffect(() => {
    companyWorkRowMapRef.current = createCompanyWorkRowMap(statusSectionList, completedResponse);
  }, [completedResponse, statusSectionList]);

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

  // 화면 최초 진입 시 기본 선택 회사/프로젝트 조건으로 자동 검색을 실행합니다.
  useEffect(() => {
    // 최초 자동 검색은 한 번만 수행하고 필수 선택값이 없으면 건너뜁니다.
    if (initialAutoSearchDoneRef.current) {
      return;
    }
    if (!initialSearchFormState.workCompanySeq || !initialSearchFormState.workCompanyProjectSeq) {
      return;
    }

    initialAutoSearchDoneRef.current = true;
    void handleSearch();
  }, [
    handleSearch,
    initialSearchFormState.workCompanyProjectSeq,
    initialSearchFormState.workCompanySeq,
  ]);

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

  // 상세 팝업을 닫고 관련 상태를 초기화합니다.
  const handleCloseDetailModal = useCallback(() => {
    // 상세 조회 상태와 선택 데이터를 모두 비웁니다.
    detailRequestSequenceRef.current += 1;
    setIsDetailModalOpen(false);
    setDetailLoading(false);
    setDetailSaving(false);
    setReplySaving(false);
    setDetailError(null);
    setDetailResponse(null);
  }, []);

  // SR 가져오기 완료 후 현재 조건으로 목록을 다시 조회합니다.
  const handleImported = useCallback(async () => {
    // 가져오기 완료 직후 현재 검색 조건 기준으로 목록을 새로 고칩니다.
    await handleSearch();
  }, [handleSearch]);

  // 업무 타이틀 클릭 시 상세 팝업을 열고 최신 데이터를 조회합니다.
  const handleOpenDetail = useCallback(async (workSeq: number) => {
    // 요청 순서를 증가시켜 늦게 도착한 이전 응답을 무시할 수 있게 합니다.
    detailRequestSequenceRef.current += 1;
    const requestSequence = detailRequestSequenceRef.current;

    setIsDetailModalOpen(true);
    setDetailLoading(true);
    setDetailError(null);
    setDetailResponse(null);

    try {
      // 선택 업무의 상세/첨부/댓글 데이터를 조회합니다.
      const nextDetailResponse = await fetchCompanyWorkDetail(workSeq);
      if (detailRequestSequenceRef.current !== requestSequence) {
        return;
      }
      setDetailResponse(nextDetailResponse);
    } catch (error) {
      // 조회 실패 시 모달 내부 메시지로 오류를 안내합니다.
      if (detailRequestSequenceRef.current !== requestSequence) {
        return;
      }
      console.error('회사 업무 상세 조회에 실패했습니다.', error);
      setDetailError(extractApiErrorMessage(error, '업무 상세 조회에 실패했습니다.'));
    } finally {
      if (detailRequestSequenceRef.current !== requestSequence) {
        return;
      }
      setDetailLoading(false);
    }
  }, []);

  // 회사 업무 즉시 수정 요청을 저장하고 현재 목록 상태에 반영합니다.
  const handleSaveEditableRow = useCallback<CompanyWorkSaveEditableRowHandler>(async (row, changes) => {
    // 로그인 사용자 번호가 없으면 저장을 진행하지 않습니다.
    const loginUsrNo = requireLoginUsrNo();
    if (!loginUsrNo) {
      throw new Error('로그인 사용자 정보를 확인할 수 없습니다.');
    }

    // 항상 최신 행 기준으로 수정 payload를 조합해 이전 값 덮어쓰기를 방지합니다.
    const latestRow = companyWorkRowMapRef.current.get(row.workSeq) || row;

    // 현재 행과 변경값을 합쳐 즉시 저장 요청 본문을 구성합니다.
    const requestPayload: CompanyWorkUpdateRequest = {
      workSeq: latestRow.workSeq,
      workStatCd: normalizeComparableText(changes.workStatCd ?? latestRow.workStatCd),
      workStartDt: normalizeEditableDate(changes.workStartDt ?? latestRow.workStartDt),
      workEndDt: normalizeEditableDate(changes.workEndDt ?? latestRow.workEndDt),
      workTime: normalizeEditableWorkTime(changes.workTime ?? latestRow.workTime),
      itManager: normalizeEditableManager(changes.itManager ?? latestRow.itManager),
      udtNo: loginUsrNo,
    };

    try {
      // 수정 API를 호출한 뒤 최신 행 정보를 각 목록 상태에 반영합니다.
      const updatedRow = await updateCompanyWork(requestPayload);
      setStatusSectionList((prevState) => applyUpdatedRowToStatusSections(prevState, updatedRow));
      setCompletedResponse((prevState) => applyUpdatedRowToCompletedResponse(prevState, updatedRow));
    } catch (error) {
      // 저장 실패 시 서버 메시지를 노출하고 호출부에 다시 전달합니다.
      const message = extractApiErrorMessage(error, '업무 저장에 실패했습니다.');
      notifyError(message);
      throw error;
    }
  }, []);

  // 상세 팝업 수정값을 저장하고 현재 목록과 상세 상태를 함께 반영합니다.
  const handleSaveDetail = useCallback(async (changes: CompanyWorkDetailEditableValues) => {
    // 상세 데이터나 로그인 사용자 정보가 없으면 저장을 진행하지 않습니다.
    const selectedWorkSeq = detailResponse?.detail?.workSeq;
    if (!selectedWorkSeq) {
      notifyError('업무 정보를 확인해주세요.');
      return;
    }

    const loginUsrNo = requireLoginUsrNo();
    if (!loginUsrNo) {
      throw new Error('로그인 사용자 정보를 확인할 수 없습니다.');
    }

    setDetailSaving(true);
    try {
      // 상세 저장 API를 호출하고 최신 상세값을 모달과 그리드에 반영합니다.
      const updatedDetail = await updateCompanyWorkDetail({
        workSeq: selectedWorkSeq,
        workStatCd: normalizeComparableText(changes.workStatCd),
        workStartDt: normalizeEditableDate(changes.workStartDt),
        workEndDt: normalizeEditableDate(changes.workEndDt),
        workTime: typeof changes.workTime === 'number' ? changes.workTime : null,
        udtNo: loginUsrNo,
      });

      setDetailResponse((prevState) => prevState ? ({
        ...prevState,
        detail: updatedDetail,
      }) : prevState);

      const updatedRow = createCompanyWorkListRowFromDetail(updatedDetail);
      setStatusSectionList((prevState) => applyUpdatedRowToStatusSections(prevState, updatedRow));
      setCompletedResponse((prevState) => applyUpdatedRowToCompletedResponse(prevState, updatedRow));
      notifySuccess('업무를 저장했습니다.');
    } catch (error) {
      // 저장 실패 시 서버 메시지를 사용자에게 노출합니다.
      notifyError(extractApiErrorMessage(error, '업무 저장에 실패했습니다.'));
      throw error;
    } finally {
      setDetailSaving(false);
    }
  }, [detailResponse]);

  // 상세 팝업 댓글을 저장하고 목록 최상단에 즉시 반영합니다.
  const handleSaveReply = useCallback(async (replyComment: string, replyFiles: File[]) => {
    // 상세 데이터나 로그인 사용자 정보가 없으면 저장을 진행하지 않습니다.
    const selectedWorkSeq = detailResponse?.detail?.workSeq;
    if (!selectedWorkSeq) {
      notifyError('업무 정보를 확인해주세요.');
      return;
    }

    const loginUsrNo = requireLoginUsrNo();
    if (!loginUsrNo) {
      throw new Error('로그인 사용자 정보를 확인할 수 없습니다.');
    }

    setReplySaving(true);
    try {
      // 댓글 저장 API를 호출하고 현재 상세 댓글 목록 최상단에 반영합니다.
      const savedReply: CompanyWorkReply = await createCompanyWorkReply({
        workSeq: selectedWorkSeq,
        replyComment,
        regNo: loginUsrNo,
        udtNo: loginUsrNo,
      }, replyFiles);

      setDetailResponse((prevState) => prevState ? ({
        ...prevState,
        replyList: [savedReply, ...(prevState.replyList || [])],
      }) : prevState);
      notifySuccess('댓글을 등록했습니다.');
    } catch (error) {
      // 저장 실패 시 서버 메시지를 사용자에게 노출합니다.
      notifyError(extractApiErrorMessage(error, '댓글 등록에 실패했습니다.'));
      throw error;
    } finally {
      setReplySaving(false);
    }
  }, [detailResponse]);

  // 상세 팝업 댓글을 수정하고 현재 댓글 목록에 즉시 반영합니다.
  const handleUpdateReply = useCallback(async (
    replySeq: number,
    replyComment: string,
    deleteReplyFileSeqList: number[],
    replyFiles: File[],
  ) => {
    // 상세 데이터나 로그인 사용자 정보가 없으면 수정을 진행하지 않습니다.
    const selectedWorkSeq = detailResponse?.detail?.workSeq;
    if (!selectedWorkSeq) {
      notifyError('업무 정보를 확인해주세요.');
      return;
    }

    const loginUsrNo = requireLoginUsrNo();
    if (!loginUsrNo) {
      throw new Error('로그인 사용자 정보를 확인할 수 없습니다.');
    }

    setReplySaving(true);
    try {
      // 댓글 수정 API를 호출하고 현재 상세 댓글 목록의 대상 항목만 교체합니다.
      const requestPayload: CompanyWorkReplyUpdateRequest = {
        replySeq,
        workSeq: selectedWorkSeq,
        replyComment,
        deleteReplyFileSeqList,
        udtNo: loginUsrNo,
      };
      const updatedReply: CompanyWorkReply = await updateCompanyWorkReply(requestPayload, replyFiles);

      setDetailResponse((prevState) => prevState ? ({
        ...prevState,
        replyList: (prevState.replyList || []).map((replyItem) => (
          replyItem.replySeq === replySeq ? updatedReply : replyItem
        )),
      }) : prevState);
      notifySuccess('댓글을 수정했습니다.');
    } catch (error) {
      // 수정 실패 시 서버 메시지를 사용자에게 노출합니다.
      notifyError(extractApiErrorMessage(error, '댓글 수정에 실패했습니다.'));
      throw error;
    } finally {
      setReplySaving(false);
    }
  }, [detailResponse]);

  // 상세 팝업 댓글을 삭제하고 현재 댓글 목록에서 즉시 제거합니다.
  const handleDeleteReply = useCallback(async (replySeq: number) => {
    // 상세 데이터나 로그인 사용자 정보가 없으면 삭제를 진행하지 않습니다.
    const selectedWorkSeq = detailResponse?.detail?.workSeq;
    if (!selectedWorkSeq) {
      notifyError('업무 정보를 확인해주세요.');
      return;
    }

    const loginUsrNo = requireLoginUsrNo();
    if (!loginUsrNo) {
      throw new Error('로그인 사용자 정보를 확인할 수 없습니다.');
    }

    setReplySaving(true);
    try {
      // 댓글 삭제 API를 호출하고 현재 상세 댓글 목록에서 대상 항목을 제거합니다.
      const requestPayload: CompanyWorkReplyDeleteRequest = {
        replySeq,
        workSeq: selectedWorkSeq,
        udtNo: loginUsrNo,
      };
      await deleteCompanyWorkReply(requestPayload);

      setDetailResponse((prevState) => prevState ? ({
        ...prevState,
        replyList: (prevState.replyList || []).filter((replyItem) => replyItem.replySeq !== replySeq),
      }) : prevState);
      notifySuccess('댓글을 삭제했습니다.');
    } catch (error) {
      // 삭제 실패 시 서버 메시지를 사용자에게 노출합니다.
      notifyError(extractApiErrorMessage(error, '댓글 삭제에 실패했습니다.'));
      throw error;
    } finally {
      setReplySaving(false);
    }
  }, [detailResponse]);

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
              workStatList={workStatList}
              workPriorList={workPriorList}
              onSaveEditableRow={handleSaveEditableRow}
              onOpenDetail={handleOpenDetail}
            />
          ))}
          <CompanyWorkCompletedGrid
            rowData={completedResponse.list}
            totalCount={completedResponse.totalCount}
            page={completedResponse.page}
            pageSize={completedResponse.pageSize}
            loading={completedLoading}
            workStatList={workStatList}
            workPriorList={workPriorList}
            onChangePage={handleChangeCompletedPage}
            onSaveEditableRow={handleSaveEditableRow}
            onOpenDetail={handleOpenDetail}
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

      <CompanyWorkDetailModal
        isOpen={isDetailModalOpen}
        loading={detailLoading}
        saving={detailSaving}
        replySaving={replySaving}
        error={detailError}
        detailResponse={detailResponse}
        workStatList={workStatList}
        onSave={handleSaveDetail}
        onSaveReply={handleSaveReply}
        onUpdateReply={handleUpdateReply}
        onDeleteReply={handleDeleteReply}
        onClose={handleCloseDetailModal}
      />
    </>
  );
};

export default CompanyWorkListClientPage;
