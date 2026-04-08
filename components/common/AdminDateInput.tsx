'use client';

import React, { forwardRef, useCallback, useRef } from 'react';

interface AdminDateInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  // 날짜 입력 바깥 래퍼 클래스명입니다.
  wrapperClassName?: string;
}

// 날짜 입력 DOM ref를 내부와 외부에 함께 연결합니다.
const assignInputRef = (
  targetRef: React.ForwardedRef<HTMLInputElement>,
  element: HTMLInputElement | null,
) => {
  // 함수 ref면 그대로 호출합니다.
  if (typeof targetRef === 'function') {
    targetRef(element);
    return;
  }

  // 객체 ref면 current에 직접 반영합니다.
  if (targetRef) {
    targetRef.current = element;
  }
};

// 좌측 캘린더 아이콘이 포함된 공통 날짜 입력을 렌더링합니다.
const AdminDateInput = forwardRef<HTMLInputElement, AdminDateInputProps>(({
  className,
  wrapperClassName,
  disabled,
  readOnly,
  ...inputProps
}, ref) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  // 내부 input ref와 외부 전달 ref를 동시에 동기화합니다.
  const handleInputRef = useCallback((element: HTMLInputElement | null) => {
    inputRef.current = element;
    assignInputRef(ref, element);
  }, [ref]);

  // 좌측 캘린더 아이콘 클릭 시 브라우저 날짜 선택기를 엽니다.
  const handleClickCalendarButton = useCallback(() => {
    // 비활성화 또는 읽기 전용이면 선택기를 열지 않습니다.
    if (!inputRef.current || disabled || readOnly) {
      return;
    }

    const dateInputElement = inputRef.current;

    try {
      // 지원 브라우저면 날짜 선택기를 직접 엽니다.
      if (typeof dateInputElement.showPicker === 'function') {
        dateInputElement.showPicker();
        return;
      }
    } catch (errorObject) {
      // 직접 호출이 실패해도 포커스 방식으로 다시 시도합니다.
      console.error('날짜 선택기 호출에 실패했습니다.', errorObject);
    }

    // showPicker 미지원 환경은 포커스와 클릭으로 폴백합니다.
    inputRef.current.focus();
    inputRef.current.click();
  }, [disabled, readOnly]);

  return (
    <div className={['admin-date-input-wrapper', wrapperClassName].filter(Boolean).join(' ')}>
      <button
        type="button"
        className="admin-date-input-icon"
        onClick={handleClickCalendarButton}
        disabled={disabled || readOnly}
        tabIndex={-1}
        aria-label="날짜 선택"
      >
        <i className="mdi mdi-calendar" aria-hidden="true"></i>
      </button>
      <input
        {...inputProps}
        ref={handleInputRef}
        type="date"
        className={className}
        disabled={disabled}
        readOnly={readOnly}
      />
    </div>
  );
});

AdminDateInput.displayName = 'AdminDateInput';

export default AdminDateInput;
