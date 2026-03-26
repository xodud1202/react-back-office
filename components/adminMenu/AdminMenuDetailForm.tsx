import React from 'react';
import AdminFormTable from '@/components/common/AdminFormTable';
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

            <AdminFormTable>
              <tbody>
                <tr>
                  <th scope="row">레벨</th>
                  <td>{safeForm.menuLevel}</td>
                  <th scope="row">상위 메뉴</th>
                  <td>{safeForm.upMenuNo === 0 ? '최상위' : safeForm.upMenuNo}</td>
                </tr>
                <tr>
                  <th scope="row">메뉴명</th>
                  <td>
                    <input
                      type="text"
                      className="form-control"
                      value={safeForm.menuNm}
                      onChange={(event) => {
                        // 메뉴명을 입력합니다.
                        onChange('menuNm', event.target.value);
                      }}
                    />
                  </td>
                  <th scope="row">정렬 순서</th>
                  <td>
                    <input
                      type="number"
                      className="form-control"
                      value={safeForm.sortSeq ?? ''}
                      onChange={(event) => {
                        // 정렬 순서를 입력합니다.
                        onChange('sortSeq', event.target.value);
                      }}
                    />
                  </td>
                </tr>
                <tr>
                  <th scope="row">메뉴 URL</th>
                  <td>
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
                  </td>
                  <th scope="row">사용 여부</th>
                  <td>
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
                  </td>
                </tr>
              </tbody>
            </AdminFormTable>

            <div className="admin-form-actions">
              <button type="button" className="btn btn-primary" onClick={onSave} disabled={loading}>
                {loading ? '처리 중...' : buttonLabel}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminMenuDetailForm;
