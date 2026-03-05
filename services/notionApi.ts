import api from '@/utils/axios/axios';
import type { NotionListResponse } from '@/components/notion/types';

/**
 * Notion 카테고리 목록을 조회합니다.
 * @returns 카테고리 목록입니다.
 */
export const fetchNotionCategoryListApi = async (): Promise<any[]> => {
  const response = await api.get('/api/admin/notion/category/list');
  return response.data || [];
};

/**
 * Notion 저장 목록을 조회합니다.
 * @param params 조회 파라미터입니다.
 * @returns Notion 저장 목록 응답입니다.
 */
export const fetchNotionSaveListApi = async (params: Record<string, any>): Promise<NotionListResponse> => {
  const response = await api.get('/api/admin/notion/save/list', { params });
  return (response.data || {}) as NotionListResponse;
};

/**
 * Notion 카테고리 순서를 저장합니다.
 * @param payload 저장 요청 데이터입니다.
 */
export const saveNotionCategorySortApi = async (payload: Record<string, any>) => {
  await api.post('/api/admin/notion/category/sort/save', payload);
};
