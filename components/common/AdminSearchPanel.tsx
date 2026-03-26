import React, { useCallback } from 'react';
import AdminResetButton from '@/components/common/AdminResetButton';

interface AdminSearchPanelProps {
  // 검색 조건 행 콘텐츠입니다.
  children: React.ReactNode;
  // 검색 제출 처리입니다.
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  // 검색 초기화 처리입니다.
  onReset?: () => void;
  // 검색 중 여부입니다.
  loading?: boolean;
  // 폼 ref입니다.
  formRef?: React.Ref<HTMLFormElement>;
  // 초기화 버튼 타입입니다.
  resetType?: 'reset' | 'button';
  // 검색 버튼 라벨입니다.
  submitLabel?: string;
  // 검색 중 버튼 라벨입니다.
  loadingLabel?: string;
  // 초기화 버튼 라벨입니다.
  resetLabel?: string;
}

// 관리자 공통 검색 패널 레이아웃을 렌더링합니다.
const AdminSearchPanel = ({
  children,
  onSubmit,
  onReset,
  loading = false,
  formRef,
  resetType = 'reset',
  submitLabel = '검색',
  loadingLabel = '검색중...',
  resetLabel = '초기화',
}: AdminSearchPanelProps) => {
  // reset 타입 폼에서 초기화 이벤트를 상위로 전달합니다.
  const handleFormReset = useCallback(() => {
    if (resetType !== 'reset') {
      return;
    }

    // reset 버튼 클릭 시 상위 검색 상태도 함께 초기화합니다.
    onReset?.();
  }, [onReset, resetType]);

  return (
    <div className="row">
      <div className="col-12 grid-margin stretch-card">
        <div className="card admin-search-panel">
          <div className="card-body">
            <form
              ref={formRef}
              className="forms-sample"
              onSubmit={onSubmit}
              onReset={resetType === 'reset' ? handleFormReset : undefined}
            >
              <div className="table-responsive">
                <table className="table admin-search-table mb-0">
                  <tbody>{children}</tbody>
                </table>
              </div>
              <div className="admin-search-actions">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? loadingLabel : submitLabel}
                </button>
                {onReset ? (
                  resetType === 'button' ? (
                    <AdminResetButton type="button" onClick={onReset} label={resetLabel} />
                  ) : (
                    <AdminResetButton type="reset" label={resetLabel} />
                  )
                ) : null}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSearchPanel;
