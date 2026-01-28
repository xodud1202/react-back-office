import api from '@/utils/axios/axios';

interface UploadResponse {
  error?: string;
  message?: string;
  [key: string]: any;
}

/**
 * 이력서용 이미지 업로드를 공통 처리합니다.
 */
export const uploadResumeImage = async (
  endpoint: string,
  file: File,
  usrNo: string
): Promise<UploadResponse> => {
  const uploadFormData = new FormData();
  uploadFormData.append('image', file);
  uploadFormData.append('usrNo', String(usrNo));

  const response = await api.post(endpoint, uploadFormData);
  return response.data;
};
