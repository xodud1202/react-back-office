/**
 * 성공 안내 메시지를 노출합니다.
 * @param message 안내 메시지입니다.
 */
export const notifySuccess = (message: string) => {
  // 브라우저 기본 alert로 사용자에게 성공 메시지를 노출합니다.
  alert(message);
};

/**
 * 실패 안내 메시지를 노출합니다.
 * @param message 안내 메시지입니다.
 */
export const notifyError = (message: string) => {
  // 브라우저 기본 alert로 사용자에게 에러 메시지를 노출합니다.
  alert(message);
};

/**
 * 확인 대화상자를 노출합니다.
 * @param message 확인 메시지입니다.
 * @returns 사용자 확인 여부입니다.
 */
export const confirmAction = (message: string): boolean => {
  // 브라우저 기본 confirm으로 사용자 확인을 받습니다.
  return confirm(message);
};
