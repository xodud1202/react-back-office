import api from '@/utils/axios/axios';

/**
 * 상위 그룹코드 목록을 조회합니다.
 * @param params 조회 파라미터입니다.
 * @returns 상위 그룹코드 목록입니다.
 */
export const fetchCommonCodeGroupListApi = async (params: Record<string, any>): Promise<any[]> => {
  const response = await api.get('/api/admin/common/code/manage/group/list', { params });
  return response.data || [];
};

/**
 * 하위 코드 목록을 조회합니다.
 * @param grpCd 그룹코드입니다.
 * @returns 하위 코드 목록입니다.
 */
export const fetchCommonCodeChildListApi = async (grpCd: string): Promise<any[]> => {
  const response = await api.get('/api/admin/common/code/manage/child/list', {
    params: { grpCd },
  });
  return response.data || [];
};

/**
 * 공통코드를 등록 또는 수정합니다.
 * @param requestUri 저장 URI입니다.
 * @param payload 저장 요청 데이터입니다.
 * @returns 저장 결과입니다.
 */
export const saveCommonCodeApi = async (requestUri: string, payload: Record<string, any>) => {
  const response = await api.post(requestUri, payload);
  return response.data;
};
