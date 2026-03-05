import { useEffect } from 'react';

/**
 * 조건에 따라 body 스크롤 잠금을 제어합니다.
 * @param isLocked 스크롤 잠금 여부입니다.
 */
const useBodyScrollLock = (isLocked: boolean) => {
  useEffect(() => {
    // 잠금 상태일 때 body 스크롤을 비활성화합니다.
    if (isLocked) {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        // 언마운트 또는 잠금 해제 시 기존 overflow 값을 복원합니다.
        document.body.style.overflow = previousOverflow;
      };
    }

    // 잠금 상태가 아니면 기본 스크롤을 허용합니다.
    document.body.style.overflow = '';
    return undefined;
  }, [isLocked]);
};

export default useBodyScrollLock;
