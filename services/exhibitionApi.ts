import api from '@/utils/axios/axios';
import type { ExhibitionDetail, ExhibitionSavePayload } from '@/components/exhibition/types';

/**
 * 기획전 썸네일을 업로드합니다.
 * @param formData 업로드 폼 데이터입니다.
 * @returns 업로드 응답 데이터입니다.
 */
export const uploadExhibitionThumbnailApi = async (formData: FormData): Promise<any> => {
  const response = await api.post('/api/admin/exhibition/thumbnail/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

/**
 * 기획전 상세를 조회합니다.
 * @param exhibitionNo 기획전 번호입니다.
 * @returns 기획전 상세입니다.
 */
export const fetchExhibitionDetailApi = async (exhibitionNo: number): Promise<ExhibitionDetail> => {
  const response = await api.get('/api/admin/exhibition/detail', {
    params: { exhibitionNo },
  });
  return (response.data || {}) as ExhibitionDetail;
};

/**
 * 기획전 마스터 정보를 저장합니다.
 * @param payload 저장 요청 데이터입니다.
 * @returns 저장 응답 데이터입니다.
 */
export const saveExhibitionMasterApi = async (payload: ExhibitionSavePayload): Promise<any> => {
  const response = await api.post('/api/admin/exhibition/master/save', payload);
  return response.data;
};

/**
 * 기획전 탭 정보를 저장합니다.
 * @param payload 저장 요청 데이터입니다.
 */
export const saveExhibitionTabApi = async (payload: Record<string, any>) => {
  await api.post('/api/admin/exhibition/tab/save', payload);
};

/**
 * 기획전 상품 정보를 저장합니다.
 * @param payload 저장 요청 데이터입니다.
 */
export const saveExhibitionGoodsApi = async (payload: Record<string, any>) => {
  await api.post('/api/admin/exhibition/goods/save', payload);
};

/**
 * 기획전을 삭제합니다.
 * @param exhibitionNo 기획전 번호입니다.
 * @param udtNo 수정자 번호입니다.
 */
export const deleteExhibitionApi = async (exhibitionNo: number, udtNo: number) => {
  await api.post('/api/admin/exhibition/delete', { exhibitionNo, udtNo });
};
