import React from 'react';

interface AdminFormTableProps {
  // 테이블 내부 콘텐츠입니다.
  children: React.ReactNode;
  // 추가 클래스명입니다.
  className?: string;
}

// 관리자 공통 입력 테이블 레이아웃을 렌더링합니다.
const AdminFormTable = ({ children, className = '' }: AdminFormTableProps) => {
  return (
    <div className="table-responsive">
      <table className={`table admin-form-table mb-0 ${className}`.trim()}>
        {children}
      </table>
    </div>
  );
};

export default AdminFormTable;
