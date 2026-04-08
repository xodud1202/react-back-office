import type {
  CompanyWorkCompletedListResponse,
  CompanyWorkDetail,
  CompanyWorkDetailResponse,
  CompanyWorkDetailUpdateRequest,
  CompanyWorkFile,
  CompanyWorkImportRequest,
  CompanyWorkImportResponse,
  CompanyWorkProjectOption,
  CompanyWorkReplyDeleteRequest,
  CompanyWorkReplyFile,
  CompanyWorkReplyFileDownloadData,
  CompanyWorkReply,
  CompanyWorkReplySaveRequest,
  CompanyWorkReplyUpdateRequest,
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
  workTime: typeof row?.workTime === 'number' ? row.workTime : null,
  workPriorCd: typeof row?.workPriorCd === 'string' ? row.workPriorCd : '',
  workPriorNm: typeof row?.workPriorNm === 'string' ? row.workPriorNm : '',
  itManager: typeof row?.itManager === 'string' ? row.itManager : '',
  coManager: typeof row?.coManager === 'string' ? row.coManager : '',
  regDt: typeof row?.regDt === 'string' ? row.regDt : '',
  udtDt: typeof row?.udtDt === 'string' ? row.udtDt : '',
});

// 회사 업무 상세 응답을 안전하게 정규화합니다.
const normalizeCompanyWorkDetail = (detail: Partial<CompanyWorkDetail> | null | undefined): CompanyWorkDetail => ({
  // 목록 공통 필드와 상세 전용 필드를 모두 기본값 기준으로 정규화합니다.
  ...normalizeCompanyWorkListRow(detail),
  workCompanyNm: typeof detail?.workCompanyNm === 'string' ? detail.workCompanyNm : '',
  workCompanyProjectNm: typeof detail?.workCompanyProjectNm === 'string' ? detail.workCompanyProjectNm : '',
  content: typeof detail?.content === 'string' ? detail.content : '',
  workTime: typeof detail?.workTime === 'number' ? detail.workTime : null,
});

// 회사 업무 첨부파일 응답을 안전하게 정규화합니다.
const normalizeCompanyWorkFile = (file: Partial<CompanyWorkFile> | null | undefined): CompanyWorkFile => ({
  // 첨부파일 목록에 필요한 값을 안전한 기본값으로 정규화합니다.
  workJobFileSeq: typeof file?.workJobFileSeq === 'number' ? file.workJobFileSeq : 0,
  workSeq: typeof file?.workSeq === 'number' ? file.workSeq : 0,
  workJobFileNm: typeof file?.workJobFileNm === 'string' ? file.workJobFileNm : '',
  workJobFileUrl: typeof file?.workJobFileUrl === 'string' ? file.workJobFileUrl : '',
  regDt: typeof file?.regDt === 'string' ? file.regDt : '',
  udtDt: typeof file?.udtDt === 'string' ? file.udtDt : '',
});

// 회사 업무 댓글 첨부파일 응답을 안전하게 정규화합니다.
const normalizeCompanyWorkReplyFile = (file: Partial<CompanyWorkReplyFile> | null | undefined): CompanyWorkReplyFile => ({
  // 댓글 첨부파일 목록에 필요한 값을 안전한 기본값으로 정규화합니다.
  replyFileSeq: typeof file?.replyFileSeq === 'number' ? file.replyFileSeq : 0,
  replySeq: typeof file?.replySeq === 'number' ? file.replySeq : 0,
  workSeq: typeof file?.workSeq === 'number' ? file.workSeq : 0,
  replyFileNm: typeof file?.replyFileNm === 'string' ? file.replyFileNm : '',
  replyFileUrl: typeof file?.replyFileUrl === 'string' ? file.replyFileUrl : '',
  replyFileSize: typeof file?.replyFileSize === 'number' ? file.replyFileSize : null,
  regDt: typeof file?.regDt === 'string' ? file.regDt : '',
  udtDt: typeof file?.udtDt === 'string' ? file.udtDt : '',
});

// 회사 업무 댓글 응답을 안전하게 정규화합니다.
const normalizeCompanyWorkReply = (reply: Partial<CompanyWorkReply> | null | undefined): CompanyWorkReply => ({
  // 댓글 목록에 필요한 값을 안전한 기본값으로 정규화합니다.
  replySeq: typeof reply?.replySeq === 'number' ? reply.replySeq : 0,
  workSeq: typeof reply?.workSeq === 'number' ? reply.workSeq : 0,
  replyComment: typeof reply?.replyComment === 'string' ? reply.replyComment : '',
  regNo: typeof reply?.regNo === 'number' ? reply.regNo : 0,
  regDt: typeof reply?.regDt === 'string' ? reply.regDt : '',
  udtDt: typeof reply?.udtDt === 'string' ? reply.udtDt : '',
  replyFileList: Array.isArray(reply?.replyFileList)
    ? reply.replyFileList.map((fileItem) => normalizeCompanyWorkReplyFile(fileItem))
    : [],
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

// 회사 업무 상세 팝업 데이터를 조회합니다.
export const fetchCompanyWorkDetail = async (workSeq: number): Promise<CompanyWorkDetailResponse> => {
  // 선택 업무 번호 기준 상세/첨부/댓글 응답을 요청합니다.
  const response = await api.get('/api/admin/company/work/detail', {
    params: { workSeq },
  });
  const responseData = response.data as Partial<CompanyWorkDetailResponse> | null;
  return {
    detail: responseData?.detail ? normalizeCompanyWorkDetail(responseData.detail) : null,
    fileList: Array.isArray(responseData?.fileList)
      ? responseData!.fileList!.map((fileItem) => normalizeCompanyWorkFile(fileItem))
      : [],
    replyList: Array.isArray(responseData?.replyList)
      ? responseData!.replyList!.map((replyItem) => normalizeCompanyWorkReply(replyItem))
      : [],
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

// 회사 업무 상세 수정값을 저장합니다.
export const updateCompanyWorkDetail = async (
  payload: CompanyWorkDetailUpdateRequest,
): Promise<CompanyWorkDetail> => {
  // 상세 저장 요청 본문을 백엔드 저장 API로 전송합니다.
  const response = await api.post('/api/admin/company/work/detail/update', payload);
  return normalizeCompanyWorkDetail(response.data as Partial<CompanyWorkDetail> | null);
};

// 회사 업무 댓글을 등록합니다.
export const createCompanyWorkReply = async (
  payload: CompanyWorkReplySaveRequest,
  replyFiles: File[] = [],
): Promise<CompanyWorkReply> => {
  // 댓글 저장 payload와 첨부파일을 multipart 요청으로 전송합니다.
  const formData = buildCompanyWorkReplyFormData(payload, replyFiles);
  const response = await api.post('/api/admin/company/work/reply', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return normalizeCompanyWorkReply(response.data as Partial<CompanyWorkReply> | null);
};

// 회사 업무 댓글 수정 payload와 첨부파일 FormData를 생성합니다.
const buildCompanyWorkReplyFormData = (
  payload: CompanyWorkReplySaveRequest | CompanyWorkReplyUpdateRequest,
  replyFiles: File[],
): FormData => {
  // 댓글 payload와 첨부파일 배열을 FormData에 담아 반환합니다.
  const formData = new FormData();
  formData.append('payload', JSON.stringify(payload));
  replyFiles.forEach((fileItem) => {
    formData.append('files', fileItem);
  });
  return formData;
};

// 회사 업무 댓글을 수정합니다.
export const updateCompanyWorkReply = async (
  payload: CompanyWorkReplyUpdateRequest,
  replyFiles: File[] = [],
): Promise<CompanyWorkReply> => {
  // 댓글 수정 payload와 첨부파일을 multipart 요청으로 전송합니다.
  const formData = buildCompanyWorkReplyFormData(payload, replyFiles);
  const response = await api.post('/api/admin/company/work/reply/update', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return normalizeCompanyWorkReply(response.data as Partial<CompanyWorkReply> | null);
};

// 회사 업무 댓글을 삭제 처리합니다.
export const deleteCompanyWorkReply = async (
  payload: CompanyWorkReplyDeleteRequest,
): Promise<void> => {
  // 댓글 삭제 요청 본문을 백엔드 삭제 API로 전송합니다.
  await api.post('/api/admin/company/work/reply/delete', payload);
};

// attachment 응답 헤더에서 파일명을 추출합니다.
const resolveDownloadFileName = (contentDisposition: string | undefined): string => {
  // UTF-8 인코딩 파일명과 기본 filename 헤더를 순서대로 확인합니다.
  if (!contentDisposition) {
    return '';
  }

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      return utf8Match[1];
    }
  }

  const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
  return fileNameMatch?.[1] || '';
};

// 회사 업무 댓글 첨부파일을 다운로드합니다.
export const downloadCompanyWorkReplyFile = async (
  replyFileSeq: number,
): Promise<CompanyWorkReplyFileDownloadData> => {
  // 댓글 첨부파일 다운로드 API를 호출하고 blob과 파일명을 함께 반환합니다.
  const response = await api.get('/api/admin/company/work/reply/file/download', {
    params: { replyFileSeq },
    responseType: 'blob',
  });
  const responseBlob = new Blob([response.data], { type: response.headers['content-type'] || 'application/octet-stream' });
  return {
    fileName: resolveDownloadFileName(response.headers['content-disposition'] as string | undefined),
    blob: responseBlob,
  };
};
