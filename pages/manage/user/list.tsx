import React, { useCallback, useEffect, useState } from 'react';
import UserSearchForm from '@/components/user/UserSearchForm';
import UserListGrid from '@/components/user/UserListGrid';
import UserEditModal from '@/components/user/UserEditModal';
import type { CommonCodeRow, EditFormState, SearchGb, UserRow } from '@/components/user/types';
import api from '@/utils/axios/axios';
import { requireLoginUsrNo } from '@/utils/auth';

// 사용자 관리 화면을 렌더링합니다.
const UserManagePage = () => {
  const [searchGb, setSearchGb] = useState<SearchGb>('loginId');
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
  const [editForm, setEditForm] = useState<EditFormState>({
    usrNo: '',
    loginId: '',
    pwd: '',
    userNm: '',
    usrGradeCd: '',
    usrStatCd: '',
    hPhoneNo: '',
    email: '',
  });

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
  const fetchUserList = useCallback(async (criteria?: {
    searchGb: SearchGb;
    searchValue: string;
    usrStatCd: string;
    usrGradeCd: string;
  }) => {
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
    setEditForm({
      usrNo: '',
      loginId: '',
      pwd: '',
      userNm: '',
      usrGradeCd: '',
      usrStatCd: '',
      hPhoneNo: '',
      email: '',
    });
    setIsModalOpen(true);
  }, []);

  // 사용자 수정 팝업을 엽니다.
  const openEditModal = useCallback((row: UserRow) => {
    setEditMode('edit');
    setEditForm({
      usrNo: String(row.usrNo),
      loginId: row.loginId || '',
      pwd: '',
      userNm: row.userNm || '',
      usrGradeCd: row.usrGradeCd || '',
      usrStatCd: row.usrStatCd || '',
      hPhoneNo: row.hPhoneNo || '',
      email: row.email || '',
    });
    setIsModalOpen(true);
  }, []);

  // 등록/수정 팝업을 닫습니다.
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  // 사용자 저장 입력값을 검증합니다.
  const validateEditForm = useCallback(() => {
    const trimmedLoginId = editForm.loginId.trim();
    const trimmedPwd = editForm.pwd.trim();
    const trimmedUserNm = editForm.userNm.trim();
    const trimmedUsrGradeCd = editForm.usrGradeCd.trim();
    const trimmedUsrStatCd = editForm.usrStatCd.trim();
    const trimmedHPhoneNo = editForm.hPhoneNo.trim();
    const trimmedEmail = editForm.email.trim();
    const phonePattern = /^01\d-\d{3,4}-\d{4}$/;
    const emailPattern = /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$/;

    // 필수 입력값을 검증합니다.
    if (trimmedLoginId === '') {
      return 'ID를 입력해주세요.';
    }
    if (trimmedPwd === '') {
      return '비밀번호를 입력해주세요.';
    }
    if (trimmedUserNm === '') {
      return '이름을 입력해주세요.';
    }
    if (trimmedUsrGradeCd === '') {
      return '등급을 선택해주세요.';
    }
    if (trimmedUsrStatCd === '') {
      return '상태를 선택해주세요.';
    }
    if (trimmedHPhoneNo === '') {
      return '휴대폰번호를 입력해주세요.';
    }
    if (trimmedEmail === '') {
      return '이메일을 입력해주세요.';
    }
    // 입력 형식을 검증합니다.
    if (trimmedLoginId.length < 5) {
      return 'ID는 최소 5자 이상 입력해주세요.';
    }
    if (trimmedPwd.length < 6) {
      return '비밀번호는 최소 6자 이상 입력해주세요.';
    }
    if (trimmedUserNm.length < 2) {
      return '이름은 최소 2자 이상 입력해주세요.';
    }
    if (!phonePattern.test(trimmedHPhoneNo)) {
      return '휴대폰번호 형식을 확인해주세요.';
    }
    if (!emailPattern.test(trimmedEmail)) {
      return '이메일 형식을 확인해주세요.';
    }
    return null;
  }, [editForm]);

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

    const payload: Record<string, any> = {
      loginId: editForm.loginId.trim(),
      pwd: editForm.pwd.trim(),
      userNm: editForm.userNm.trim(),
      usrGradeCd: editForm.usrGradeCd.trim(),
      usrStatCd: editForm.usrStatCd.trim(),
      hPhoneNo: editForm.hPhoneNo.trim(),
      email: editForm.email.trim(),
      udtNo: usrNo,
    };
    // 등록 모드와 수정 모드 요청 파라미터를 분기합니다.
    if (isCreateMode) {
      payload.regNo = usrNo;
    } else {
      payload.usrNo = Number(editForm.usrNo);
    }

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
    const resetCriteria = { searchGb: 'loginId' as SearchGb, searchValue: '', usrStatCd: '', usrGradeCd: '' };
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

// 휴대폰번호 입력값을 하이픈 포함 형식으로 변환합니다.
const formatPhoneNumber = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length < 4) {
    return digits;
  }
  if (digits.length < 8) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }
  if (digits.length < 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
};

export default UserManagePage;

