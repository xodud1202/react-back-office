import React from 'react';

interface AdminResetButtonProps {
  // 버튼 타입입니다.
  type?: 'button' | 'reset';
  // 클릭 처리입니다.
  onClick?: () => void;
  // 비활성화 여부입니다.
  disabled?: boolean;
  // 버튼 라벨입니다.
  label?: string;
  // 추가 클래스명입니다.
  className?: string;
}

// 관리자 공통 초기화 버튼을 렌더링합니다.
const AdminResetButton = ({
  type = 'button',
  onClick,
  disabled = false,
  label = '초기화',
  className = '',
}: AdminResetButtonProps) => {
  return (
    <button
      type={type}
      className={`btn btn-dark ${className}`.trim()}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  );
};

export default AdminResetButton;
