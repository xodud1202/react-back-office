/**
 * API 에러 객체에서 사용자 노출 메시지를 추출합니다.
 * @param error API 호출 에러 객체입니다.
 * @param fallbackMessage 기본 메시지입니다.
 * @returns 추출된 메시지입니다.
 */
export const extractApiErrorMessage = (error: any, fallbackMessage: string): string => {
  // 서버에서 전달한 message를 우선 사용합니다.
  const responseMessage = error?.response?.data?.message;
  if (typeof responseMessage === 'string' && responseMessage.trim() !== '') {
    return responseMessage;
  }

  // Error 객체의 message가 있으면 차선으로 사용합니다.
  const errorMessage = error?.message;
  if (typeof errorMessage === 'string' && errorMessage.trim() !== '') {
    return errorMessage;
  }

  return fallbackMessage;
};
