import type {
  CompanyWorkCompletedListResponse,
  CompanyWorkImportRequest,
  CompanyWorkImportResponse,
  CompanyWorkProjectOption,
  CompanyWorkSearchParams,
  CompanyWorkStatusListResponse,
} from '@/components/companyWork/types';
import api from '@/utils/axios/axios';

// 회사 업무 프로젝트 목록을 조회합니다.
export const fetchCompanyWorkProjectList = async (workCompanySeq: number): Promise<CompanyWorkProjectOption[]> => {
  // 선택 회사 번호 기준으로 프로젝트 목록을 요청합니다.
  const response = await api.get('/api/admin/company/work/project/list', {
    params: { workCompanySeq },
  });
  return Array.isArray(response.data) ? response.data as CompanyWorkProjectOption[] : [];
};

// 회사 업무 비완료 상태별 목록을 조회합니다.
export const fetchCompanyWorkStatusList = async (
  params: CompanyWorkSearchParams,
): Promise<CompanyWorkStatusListResponse> => {
  // 검색 조건 기준 상태별 목록을 요청합니다.
  const response = await api.get('/api/admin/company/work/status/list', {
    params,
  });
  const responseData = response.data as Partial<CompanyWorkStatusListResponse> | null;
  return {
    statusSectionList: Array.isArray(responseData?.statusSectionList) ? responseData!.statusSectionList! : [],
  };
};

// 회사 업무 완료 목록을 조회합니다.
export const fetchCompanyWorkCompletedList = async (
  params: CompanyWorkSearchParams & { page: number; pageSize: number },
): Promise<CompanyWorkCompletedListResponse> => {
  // 검색 조건과 페이지 조건 기준 완료 목록을 요청합니다.
  const response = await api.get('/api/admin/company/work/completed/list', {
    params,
  });
  const responseData = response.data as Partial<CompanyWorkCompletedListResponse> | null;
  return {
    list: Array.isArray(responseData?.list) ? responseData!.list! : [],
    totalCount: typeof responseData?.totalCount === 'number' ? responseData.totalCount : 0,
    page: typeof responseData?.page === 'number' ? responseData.page : params.page,
    pageSize: typeof responseData?.pageSize === 'number' ? responseData.pageSize : params.pageSize,
  };
};

// 회사 업무 Jira 가져오기 저장을 요청합니다.
export const importCompanyWork = async (
  payload: CompanyWorkImportRequest,
): Promise<CompanyWorkImportResponse> => {
  // 가져오기 요청 본문을 백엔드 저장 API로 전송합니다.
  const response = await api.post('/api/admin/company/work/import', payload);
  const responseData = response.data as Partial<CompanyWorkImportResponse> | null;
  return {
    message: typeof responseData?.message === 'string' ? responseData.message : '',
    workSeq: typeof responseData?.workSeq === 'number' ? responseData.workSeq : 0,
    workKey: typeof responseData?.workKey === 'string' ? responseData.workKey : payload.workKey,
  };
};
