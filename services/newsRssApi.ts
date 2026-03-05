import api from '@/utils/axios/axios';

/**
 * 뉴스 RSS 언론사 목록을 조회합니다.
 * @returns 언론사 목록입니다.
 */
export const fetchNewsRssPressListApi = async (): Promise<any[]> => {
  const response = await api.get('/api/admin/news/rss/manage/press/list');
  return response.data || [];
};

/**
 * 뉴스 RSS 카테고리 목록을 조회합니다.
 * @param pressNo 언론사 번호입니다.
 * @returns 카테고리 목록입니다.
 */
export const fetchNewsRssCategoryListApi = async (pressNo: number): Promise<any[]> => {
  const response = await api.get('/api/admin/news/rss/manage/category/list', {
    params: { pressNo },
  });
  return response.data || [];
};

/**
 * 뉴스 RSS 언론사 목록을 저장합니다.
 * @param payload 저장 요청 데이터입니다.
 * @returns 저장 결과입니다.
 */
export const saveNewsRssPressApi = async (payload: Record<string, any>) => {
  const response = await api.post('/api/admin/news/rss/manage/press/save', payload);
  return response.data;
};

/**
 * 뉴스 RSS 카테고리 목록을 저장합니다.
 * @param payload 저장 요청 데이터입니다.
 * @returns 저장 결과입니다.
 */
export const saveNewsRssCategoryApi = async (payload: Record<string, any>) => {
  const response = await api.post('/api/admin/news/rss/manage/category/save', payload);
  return response.data;
};

/**
 * 뉴스 RSS 언론사를 삭제합니다.
 * @param payload 삭제 요청 데이터입니다.
 */
export const deleteNewsRssPressApi = async (payload: Record<string, any>) => {
  await api.post('/api/admin/news/rss/manage/press/delete', payload);
};

/**
 * 뉴스 RSS 카테고리를 삭제합니다.
 * @param payload 삭제 요청 데이터입니다.
 */
export const deleteNewsRssCategoryApi = async (payload: Record<string, any>) => {
  await api.post('/api/admin/news/rss/manage/category/delete', payload);
};
