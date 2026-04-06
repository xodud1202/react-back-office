import type {
  CompanyWorkCompletedListResponse,
  CompanyWorkImportRequest,
  CompanyWorkImportResponse,
  CompanyWorkProjectOption,
  CompanyWorkSearchParams,
  CompanyWorkStatusListResponse,
  CompanyWorkUpdateRequest,
  CompanyWorkListRow,
} from '@/components/companyWork/types';
import api from '@/utils/axios/axios';

// 회사 업무 목록 행 응답을 안전하게 정규화합니다.
const normalizeCompanyWorkListRow = (row: Partial<CompanyWorkListRow> | null | undefined): CompanyWorkListRow => ({
  // 그리드 편집에 필요한 문자열 필드를 빈 문자열 기준으로 정규화합니다.
  workSeq: typeof row?.workSeq === 'number' ? row.workSeq : 0,
  workCompanySeq: typeof row?.workCompanySeq === 'number' ? row.workCompanySeq : 0,
  workCompanyProjectSeq: typeof row?.workCompanyProjectSeq === 'number' ? row.workCompanyProjectSeq : 0,
  workStatCd: typeof row?.workStatCd === 'string' ? row.workStatCd : '',
  workKey: typeof row?.workKey === 'string' ? row.workKey : '',
  title: typeof row?.title === 'string' ? row.title : '',
  workCreateDt: typeof row?.workCreateDt === 'string' ? row.workCreateDt : '',
  workStartDt: typeof row?.workStartDt === 'string' ? row.workStartDt : '',
  workEndDt: typeof row?.workEndDt === 'string' ? row.workEndDt : '',
  workPriorCd: typeof row?.workPriorCd === 'string' ? row.workPriorCd : '',
  workPriorNm: typeof row?.workPriorNm === 'string' ? row.workPriorNm : '',
  itManager: typeof row?.itManager === 'string' ? row.itManager : '',
  coManager: typeof row?.coManager === 'string' ? row.coManager : '',
  regDt: typeof row?.regDt === 'string' ? row.regDt : '',
  udtDt: typeof row?.udtDt === 'string' ? row.udtDt : '',
});

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
    statusSectionList: Array.isArray(responseData?.statusSectionList)
      ? responseData!.statusSectionList!.map((statusSectionItem) => ({
        workStatCd: typeof statusSectionItem?.workStatCd === 'string' ? statusSectionItem.workStatCd : '',
        list: Array.isArray(statusSectionItem?.list)
          ? statusSectionItem.list.map((rowItem) => normalizeCompanyWorkListRow(rowItem))
          : [],
      }))
      : [],
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
    list: Array.isArray(responseData?.list)
      ? responseData!.list!.map((rowItem) => normalizeCompanyWorkListRow(rowItem))
      : [],
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

// 회사 업무 편집 가능 항목을 즉시 저장합니다.
export const updateCompanyWork = async (
  payload: CompanyWorkUpdateRequest,
): Promise<CompanyWorkListRow> => {
  // 수정 요청 본문을 백엔드 저장 API로 전송합니다.
  const response = await api.post('/api/admin/company/work/update', payload);
  return normalizeCompanyWorkListRow(response.data as Partial<CompanyWorkListRow> | null);
};
