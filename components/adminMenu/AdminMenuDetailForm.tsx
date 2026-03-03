import React from 'react';
import { AdminMenuFormState } from './types';

type AdminMenuDetailFormProps = {
  mode: 'idle' | 'create' | 'edit';
  formState: AdminMenuFormState | null;
  loading: boolean;
  onChange: (field: keyof AdminMenuFormState, value: string) => void;
  onSave: () => void;
  onClear: () => void;
};

// 관리자 메뉴 입력 폼을 렌더링합니다.
const AdminMenuDetailForm = ({
  mode,
  formState,
  loading,
  onChange,
  onSave,
  onClear,
}: AdminMenuDetailFormProps) => {
  // 입력 데이터가 없을 때 기본값을 노출합니다.
  const safeForm: AdminMenuFormState = formState ?? {
    menuNo: 0,
    upMenuNo: 0,
    menuLevel: 1,
    menuNm: '',
    menuUrl: '',
    sortSeq: null,
    useYn: 'Y',
  };

  const title = mode === 'create' ? '메뉴 등록' : mode === 'edit' ? '메뉴 수정' : '메뉴 정보';
  const buttonLabel = mode === 'create' ? '등록' : '저장';

  return (
    <div className="card">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">{title}</h5>
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onClear}>
            선택 해제
          </button>
        </div>

        {mode === 'idle' ? (
          <div className="text-muted">좌측 메뉴를 선택하거나 추가 버튼으로 새 메뉴를 만드세요.</div>
        ) : (
          <>
            <input type="hidden" value={safeForm.menuNo} readOnly />
            <input type="hidden" value={safeForm.upMenuNo} readOnly />
            <div className="mb-2 text-muted small">
              레벨: {safeForm.menuLevel}
            </div>
            <div className="mb-2 text-muted small">
              상위 메뉴: {safeForm.upMenuNo === 0 ? '최상위' : safeForm.upMenuNo}
            </div>
            <div className="mb-3">
              <label className="form-label">메뉴명</label>
              <input
                type="text"
                className="form-control"
                value={safeForm.menuNm}
                onChange={(event) => {
                  // 메뉴명을 입력합니다.
                  onChange('menuNm', event.target.value);
                }}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">메뉴 URL</label>
              <input
                type="text"
                className="form-control"
                placeholder="예: /manage/admin/menu/list"
                value={safeForm.menuUrl}
                onChange={(event) => {
                  // 메뉴 URL을 입력합니다.
                  onChange('menuUrl', event.target.value);
                }}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">정렬 순서</label>
              <input
                type="number"
                className="form-control"
                value={safeForm.sortSeq ?? ''}
                onChange={(event) => {
                  // 정렬 순서를 입력합니다.
                  onChange('sortSeq', event.target.value);
                }}
              />
            </div>
            <div className="mb-4">
              <label className="form-label">사용 여부</label>
              <select
                className="form-select"
                value={safeForm.useYn}
                onChange={(event) => {
                  // 사용 여부를 입력합니다.
                  onChange('useYn', event.target.value);
                }}
              >
                <option value="Y">사용</option>
                <option value="N">사용안함</option>
              </select>
            </div>

            <button type="button" className="btn btn-primary" onClick={onSave} disabled={loading}>
              {loading ? '처리 중...' : buttonLabel}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminMenuDetailForm;
