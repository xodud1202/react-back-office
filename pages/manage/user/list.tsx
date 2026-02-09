import React, { useCallback, useEffect, useState } from 'react';
import UserSearchForm from '@/components/user/UserSearchForm';
import UserListGrid from '@/components/user/UserListGrid';
import UserEditModal from '@/components/user/UserEditModal';
import type { CommonCodeRow, EditFormState, UserRow, UserSearchCriteria } from '@/components/user/types';
import {
  createDefaultSearchCriteria,
  createEditFormFromRow,
  createEmptyEditForm,
  createUserSavePayload,
  formatPhoneNumber,
  validateUserEditForm,
} from '@/components/user/userManageUtils';
import api from '@/utils/axios/axios';
import { requireLoginUsrNo } from '@/utils/auth';

// 사용자 관리 화면을 렌더링합니다.
const UserManagePage = () => {
  const [searchGb, setSearchGb] = useState<UserSearchCriteria['searchGb']>('loginId');
  const [searchValue, setSearchValue] = useState('');
  const [usrStatCd, setUsrStatCd] = useState('');
  const [usrGradeCd, setUsrGradeCd] = useState('');
  const [usrStatOptions, setUsrStatOptions] = useState<CommonCodeRow[]>([]);
  const [usrGradeOptions, setUsrGradeOptions] = useState<CommonCodeRow[]>([]);
  const [userRows, setUserRows] = useState<UserRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editMode, setEditMode] = useState<'create' | 'edit'>('create');
  const [editForm, setEditForm] = useState<EditFormState>(createEmptyEditForm());

  // 공통코드 옵션을 조회합니다.
  const fetchCommonCodeOptions = useCallback(async () => {
    try {
      const [statResponse, gradeResponse] = await Promise.all([
        api.get('/api/admin/common/code', { params: { grpCd: 'USR_STAT' } }),
        api.get('/api/admin/common/code', { params: { grpCd: 'USR_GRADE' } }),
      ]);
      setUsrStatOptions((statResponse.data || []) as CommonCodeRow[]);
      setUsrGradeOptions((gradeResponse.data || []) as CommonCodeRow[]);
    } catch (error) {
      console.error('사용자 공통코드 조회에 실패했습니다.', error);
      alert('사용자 공통코드 조회에 실패했습니다.');
    }
  }, []);

  // 사용자 목록을 조회합니다.
  const fetchUserList = useCallback(async (criteria?: UserSearchCriteria) => {
    const resolved = criteria || { searchGb, searchValue, usrStatCd, usrGradeCd };
    const trimmedSearchValue = resolved.searchValue.trim();

    setIsLoading(true);
    try {
      const response = await api.get('/api/admin/user/manage/list', {
        params: {
          searchGb: resolved.searchGb,
          searchValue: trimmedSearchValue || undefined,
          usrStatCd: resolved.usrStatCd || undefined,
          usrGradeCd: resolved.usrGradeCd || undefined,
        },
      });
      setUserRows((response.data || []) as UserRow[]);
    } catch (error) {
      console.error('사용자 목록 조회에 실패했습니다.', error);
      alert('사용자 목록 조회에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [searchGb, searchValue, usrGradeCd, usrStatCd]);

  // 화면 초기 진입 시 공통코드와 사용자 목록을 조회합니다.
  useEffect(() => {
    fetchCommonCodeOptions();
    fetchUserList();
  }, [fetchCommonCodeOptions, fetchUserList]);

  // 등록/수정 팝업 입력 상태를 갱신합니다.
  const updateEditFormField = useCallback((field: keyof EditFormState, value: string) => {
    if (field === 'hPhoneNo') {
      setEditForm((prev) => ({ ...prev, [field]: formatPhoneNumber(value) }));
      return;
    }
    setEditForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  // 사용자 등록 팝업을 엽니다.
  const openCreateModal = useCallback(() => {
    setEditMode('create');
    setEditForm(createEmptyEditForm());
    setIsModalOpen(true);
  }, []);

  // 사용자 수정 팝업을 엽니다.
  const openEditModal = useCallback((row: UserRow) => {
    setEditMode('edit');
    setEditForm(createEditFormFromRow(row));
    setIsModalOpen(true);
  }, []);

  // 등록/수정 팝업을 닫습니다.
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  // 사용자 저장 입력값을 검증합니다.
  const validateEditForm = useCallback(() => {
    return validateUserEditForm(editForm, editMode);
  }, [editForm, editMode]);

  // 사용자 등록/수정을 저장합니다.
  const saveUser = useCallback(async () => {
    const validationMessage = validateEditForm();
    if (validationMessage) {
      alert(validationMessage);
      return;
    }

    const usrNo = requireLoginUsrNo();
    if (!usrNo) {
      return;
    }

    const isCreateMode = editMode === 'create';
    const requestUri = isCreateMode
      ? '/api/admin/user/manage/create'
      : '/api/admin/user/manage/update';

    const payload = createUserSavePayload(editForm, editMode, usrNo);

    setIsSaving(true);
    try {
      const response = await api.post(requestUri, payload);
      if (response.data > 0) {
        alert(isCreateMode ? '사용자가 등록되었습니다.' : '사용자가 수정되었습니다.');
        closeModal();
        await fetchUserList();
        return;
      }
      alert('사용자 저장에 실패했습니다.');
    } catch (error) {
      console.error('사용자 저장에 실패했습니다.', error);
      const message = (error as any)?.response?.data?.message;
      alert(message || '사용자 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  }, [closeModal, editForm, editMode, fetchUserList, validateEditForm]);

  // 사용자 검색을 수행합니다.
  const handleSearch = useCallback(() => {
    fetchUserList();
  }, [fetchUserList]);

  // 검색조건을 초기화하고 사용자 목록을 재조회합니다.
  const handleResetSearch = useCallback(() => {
    const resetCriteria = createDefaultSearchCriteria();
    setSearchGb(resetCriteria.searchGb);
    setSearchValue(resetCriteria.searchValue);
    setUsrStatCd(resetCriteria.usrStatCd);
    setUsrGradeCd(resetCriteria.usrGradeCd);
    fetchUserList(resetCriteria);
  }, [fetchUserList]);

  return (
    <>
      <div className="page-header">
        <h3 className="page-title">사용자 관리</h3>
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><a href="#">사용자</a></li>
            <li className="breadcrumb-item active" aria-current="page">관리</li>
          </ol>
        </nav>
      </div>

      <UserSearchForm
        searchGb={searchGb}
        searchValue={searchValue}
        usrStatCd={usrStatCd}
        usrGradeCd={usrGradeCd}
        usrStatOptions={usrStatOptions}
        usrGradeOptions={usrGradeOptions}
        isLoading={isLoading}
        onChangeSearchGb={setSearchGb}
        onChangeSearchValue={setSearchValue}
        onChangeUsrStatCd={setUsrStatCd}
        onChangeUsrGradeCd={setUsrGradeCd}
        onSearch={handleSearch}
        onReset={handleResetSearch}
      />

      <UserListGrid
        rowData={userRows}
        usrGradeOptions={usrGradeOptions}
        usrStatOptions={usrStatOptions}
        onEdit={openEditModal}
        onCreate={openCreateModal}
      />

      <UserEditModal
        isOpen={isModalOpen}
        editMode={editMode}
        editForm={editForm}
        usrGradeOptions={usrGradeOptions}
        usrStatOptions={usrStatOptions}
        isSaving={isSaving}
        onClose={closeModal}
        onSave={saveUser}
        onChangeField={updateEditFormField}
      />
    </>
  );
};

export default UserManagePage;
