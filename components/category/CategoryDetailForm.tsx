import React from 'react';
import { CategoryFormState } from './types';

type CategoryDetailFormProps = {
  mode: 'idle' | 'create' | 'edit';
  formState: CategoryFormState | null;
  loading: boolean;
  onChange: (field: keyof CategoryFormState, value: string) => void;
  onSave: () => void;
  onClear: () => void;
};

// 카테고리 상세 입력 폼을 렌더링합니다.
const CategoryDetailForm = ({
  mode,
  formState,
  loading,
  onChange,
  onSave,
  onClear,
}: CategoryDetailFormProps) => {
  // 입력값이 없을 때 기본값을 제공합니다.
  const safeForm = formState ?? {
    categoryId: '',
    parentCategoryId: null,
    categoryLevel: null,
    categoryNm: '',
    dispOrd: null,
    showYn: 'Y',
  };

  // 화면 상단 타이틀을 구성합니다.
  const title = mode === 'create'
    ? '카테고리 등록'
    : mode === 'edit'
      ? '카테고리 수정'
      : '카테고리 정보';
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
          <div className="text-muted">좌측 카테고리를 선택하거나 추가 버튼을 눌러주세요.</div>
        ) : (
          <>
            <input type="hidden" value={safeForm.categoryId} readOnly />
            <input type="hidden" value={safeForm.parentCategoryId ?? ''} readOnly />
            <input type="hidden" value={safeForm.categoryLevel != null ? String(safeForm.categoryLevel) : ''} readOnly />
            <div className="mb-3">
              <label className="form-label">카테고리명</label>
              <input
                type="text"
                className="form-control"
                value={safeForm.categoryNm}
                onChange={(event) => {
                  // 카테고리명을 입력합니다.
                  onChange('categoryNm', event.target.value);
                }}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">정렬 순서</label>
              <input
                type="number"
                className="form-control"
                value={safeForm.dispOrd ?? ''}
                onChange={(event) => {
                  // 정렬 순서를 입력합니다.
                  onChange('dispOrd', event.target.value);
                }}
              />
            </div>
            <div className="mb-4">
              <label className="form-label">노출 여부</label>
              <select
                className="form-select"
                value={safeForm.showYn}
                onChange={(event) => {
                  // 노출 여부를 변경합니다.
                  onChange('showYn', event.target.value);
                }}
              >
                <option value="Y">노출</option>
                <option value="N">비노출</option>
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

export default CategoryDetailForm;
