import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Modal from '@/components/common/Modal';
import type { CommonCodeRow, EditFormState, EditMode } from '@/components/user/types';

interface UserEditModalProps {
  isOpen: boolean;
  editMode: EditMode;
  editForm: EditFormState;
  usrGradeOptions: CommonCodeRow[];
  usrStatOptions: CommonCodeRow[];
  isSaving: boolean;
  onClose: () => void;
  onSave: () => void;
  onChangeField: (field: keyof EditFormState, value: string) => void;
}

// 사용자 등록/수정 모달 컴포넌트를 렌더링합니다.
const UserEditModal = ({
  isOpen,
  editMode,
  editForm,
  usrGradeOptions,
  usrStatOptions,
  isSaving,
  onClose,
  onSave,
  onChangeField,
}: UserEditModalProps) => {
  const [isPwdVisible, setIsPwdVisible] = useState(false);
  const [isPwdConfirmVisible, setIsPwdConfirmVisible] = useState(false);

  // 현재 모달 제목을 반환합니다.
  const modalTitle = useMemo(() => (
    editMode === 'create' ? '사용자 등록' : '사용자 수정'
  ), [editMode]);

  // 수정 모드에서 ID 입력 비활성화 여부를 반환합니다.
  const isLoginIdDisabled = useMemo(() => editMode === 'edit', [editMode]);

  // 비밀번호 입력값 표시 상태를 전환합니다.
  const togglePwdVisible = useCallback(() => {
    setIsPwdVisible((prev) => !prev);
  }, []);

  // 비밀번호 확인 입력값 표시 상태를 전환합니다.
  const togglePwdConfirmVisible = useCallback(() => {
    setIsPwdConfirmVisible((prev) => !prev);
  }, []);

  // 모달이 열릴 때 비밀번호 표시 상태를 기본값으로 초기화합니다.
  useEffect(() => {
    if (isOpen) {
      setIsPwdVisible(false);
      setIsPwdConfirmVisible(false);
    }
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      width="720px"
      footerActions={(
        <button type="button" className="btn btn-primary" onClick={onSave} disabled={isSaving}>
          {isSaving ? '저장중...' : '저장'}
        </button>
      )}
    >
      <div className="row g-2">
        <div className="col-md-6">
          <label className="form-label mb-1">ID</label>
          <input
            type="text"
            className="form-control"
            value={editForm.loginId}
            maxLength={50}
            disabled={isLoginIdDisabled}
            onChange={(event) => onChangeField('loginId', event.target.value)}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label mb-1">이름</label>
          <input
            type="text"
            className="form-control"
            value={editForm.userNm}
            maxLength={50}
            onChange={(event) => onChangeField('userNm', event.target.value)}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label mb-1">비밀번호</label>
          <div className="input-group">
            <input
              type={isPwdVisible ? 'text' : 'password'}
              className="form-control"
              value={editForm.pwd}
              maxLength={100}
              onChange={(event) => onChangeField('pwd', event.target.value)}
            />
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={togglePwdVisible}
              aria-label="비밀번호 표시 전환"
            >
              <i className={`fa ${isPwdVisible ? 'fa-eye-slash' : 'fa-eye'}`} />
            </button>
          </div>
        </div>
        <div className="col-md-6">
          <label className="form-label mb-1">비밀번호확인</label>
          <div className="input-group">
            <input
              type={isPwdConfirmVisible ? 'text' : 'password'}
              className="form-control"
              value={editForm.pwdConfirm}
              maxLength={100}
              onChange={(event) => onChangeField('pwdConfirm', event.target.value)}
            />
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={togglePwdConfirmVisible}
              aria-label="비밀번호 확인 표시 전환"
            >
              <i className={`fa ${isPwdConfirmVisible ? 'fa-eye-slash' : 'fa-eye'}`} />
            </button>
          </div>
        </div>
        <div className="col-md-6">
          <label className="form-label mb-1">휴대폰번호</label>
          <input
            type="text"
            className="form-control"
            value={editForm.hPhoneNo}
            maxLength={13}
            onChange={(event) => onChangeField('hPhoneNo', event.target.value)}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label mb-1">이메일</label>
          <input
            type="text"
            className="form-control"
            value={editForm.email}
            maxLength={100}
            onChange={(event) => onChangeField('email', event.target.value)}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label mb-1">등급</label>
          <select
            className="form-select"
            value={editForm.usrGradeCd}
            onChange={(event) => onChangeField('usrGradeCd', event.target.value)}
          >
            <option value="">선택</option>
            {usrGradeOptions.map((item) => (
              <option key={item.cd} value={item.cd}>{item.cdNm}</option>
            ))}
          </select>
        </div>
        <div className="col-md-6">
          <label className="form-label mb-1">상태</label>
          <select
            className="form-select"
            value={editForm.usrStatCd}
            onChange={(event) => onChangeField('usrStatCd', event.target.value)}
          >
            <option value="">선택</option>
            {usrStatOptions.map((item) => (
              <option key={item.cd} value={item.cd}>{item.cdNm}</option>
            ))}
          </select>
        </div>
      </div>
    </Modal>
  );
};

export default UserEditModal;
