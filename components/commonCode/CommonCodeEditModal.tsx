import React, { useMemo } from 'react';
import Modal from '@/components/common/Modal';
import AdminFormTable from '@/components/common/AdminFormTable';
import type { EditFormState, EditMode } from '@/components/commonCode/types';

interface CommonCodeEditModalProps {
  // 모달 오픈 여부입니다.
  isOpen: boolean;
  // 편집 모드입니다.
  editMode: EditMode;
  // 저장 중 여부입니다.
  isSaving: boolean;
  // 편집 폼 상태입니다.
  editForm: EditFormState;
  // 모달 닫기 처리입니다.
  onClose: () => void;
  // 저장 처리입니다.
  onSave: () => void;
  // 입력 필드 변경 처리입니다.
  onChangeField: (field: keyof EditFormState, value: string) => void;
}

// 공통코드 편집 모달을 렌더링합니다.
const CommonCodeEditModal = ({
  isOpen,
  editMode,
  isSaving,
  editForm,
  onClose,
  onSave,
  onChangeField,
}: CommonCodeEditModalProps) => {
  // 현재 모달 제목을 계산합니다.
  const modalTitle = useMemo(() => {
    if (editMode === 'create-group') {
      return '상위 그룹코드 등록';
    }
    if (editMode === 'edit-group') {
      return '상위 그룹코드 수정';
    }
    if (editMode === 'create-child') {
      return '하위 코드 등록';
    }
    return '하위 코드 수정';
  }, [editMode]);

  // 코드 입력란 비활성화 여부를 계산합니다.
  const isCdDisabled = useMemo(() => {
    return editMode === 'edit-group' || editMode === 'edit-child';
  }, [editMode]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      width="620px"
      footerActions={(
        <button type="button" className="btn btn-primary" onClick={onSave} disabled={isSaving}>
          {isSaving ? '저장중...' : '저장'}
        </button>
      )}
    >
      <AdminFormTable>
        <tbody>
          <tr>
            <th scope="row">GRP_CD</th>
            <td>
              <input
                type="text"
                className="form-control"
                value={editForm.grpCd}
                disabled
                maxLength={20}
                onChange={(event) => onChangeField('grpCd', event.target.value)}
              />
            </td>
            <th scope="row">CD</th>
            <td>
              <input
                type="text"
                className="form-control"
                value={editForm.cd}
                maxLength={20}
                disabled={isCdDisabled}
                onChange={(event) => onChangeField('cd', event.target.value)}
              />
            </td>
          </tr>
          <tr>
            <th scope="row">코드명</th>
            <td colSpan={3}>
              <input
                type="text"
                className="form-control"
                value={editForm.cdNm}
                maxLength={50}
                onChange={(event) => onChangeField('cdNm', event.target.value)}
              />
            </td>
          </tr>
          <tr>
            <th scope="row">코드 설명</th>
            <td colSpan={3}>
              <input
                type="text"
                className="form-control"
                value={editForm.cdDesc}
                maxLength={60}
                onChange={(event) => onChangeField('cdDesc', event.target.value)}
              />
            </td>
          </tr>
          <tr>
            <th scope="row">정렬순서</th>
            <td>
              <input
                type="number"
                className="form-control"
                value={editForm.dispOrd}
                onChange={(event) => onChangeField('dispOrd', event.target.value)}
              />
            </td>
            <th scope="row">사용여부</th>
            <td>
              <select
                className="form-select"
                value={editForm.useYn}
                onChange={(event) => onChangeField('useYn', event.target.value)}
              >
                <option value="Y">Y</option>
                <option value="N">N</option>
              </select>
            </td>
          </tr>
        </tbody>
      </AdminFormTable>
    </Modal>
  );
};

export default CommonCodeEditModal;
