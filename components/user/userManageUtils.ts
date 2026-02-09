import type { EditFormState, EditMode, UserRow, UserSearchCriteria } from '@/components/user/types';

// 휴대폰번호 형식 검증 정규식입니다.
const PHONE_PATTERN = /^01\d-\d{3,4}-\d{4}$/;
// 이메일 형식 검증 정규식입니다.
const EMAIL_PATTERN = /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$/;

// 사용자 등록/수정 폼의 기본값을 생성합니다.
export const createEmptyEditForm = (): EditFormState => ({
  usrNo: '',
  loginId: '',
  pwd: '',
  pwdConfirm: '',
  userNm: '',
  usrGradeCd: '',
  usrStatCd: '',
  hPhoneNo: '',
  email: '',
});

// 사용자 검색 기본값을 생성합니다.
export const createDefaultSearchCriteria = (): UserSearchCriteria => ({
  searchGb: 'loginId',
  searchValue: '',
  usrStatCd: '',
  usrGradeCd: '',
});

// 목록 행 데이터를 수정 폼 데이터로 변환합니다.
export const createEditFormFromRow = (row: UserRow): EditFormState => ({
  ...createEmptyEditForm(),
  usrNo: String(row.usrNo),
  loginId: row.loginId || '',
  userNm: row.userNm || '',
  usrGradeCd: row.usrGradeCd || '',
  usrStatCd: row.usrStatCd || '',
  hPhoneNo: row.hPhoneNo || '',
  email: row.email || '',
});

// 휴대폰번호 입력값을 하이픈 포함 형식으로 변환합니다.
export const formatPhoneNumber = (value: string): string => {
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

// 문자열 양끝 공백을 제거합니다.
const trim = (value: string): string => value.trim();

// 사용자 등록/수정 폼 입력값을 검증합니다.
export const validateUserEditForm = (editForm: EditFormState, editMode: EditMode): string | null => {
  const trimmedLoginId = trim(editForm.loginId);
  const trimmedPwd = trim(editForm.pwd);
  const trimmedPwdConfirm = trim(editForm.pwdConfirm);
  const trimmedUserNm = trim(editForm.userNm);
  const trimmedUsrGradeCd = trim(editForm.usrGradeCd);
  const trimmedUsrStatCd = trim(editForm.usrStatCd);
  const trimmedHPhoneNo = trim(editForm.hPhoneNo);
  const trimmedEmail = trim(editForm.email);
  const isCreateMode = editMode === 'create';
  const hasPasswordInput = trimmedPwd !== '' || trimmedPwdConfirm !== '';

  // 필수 입력값을 검증합니다.
  if (trimmedLoginId === '') {
    return 'ID를 입력해주세요.';
  }
  if (isCreateMode && trimmedPwd === '') {
    return '비밀번호를 입력해주세요.';
  }
  if (isCreateMode && trimmedPwdConfirm === '') {
    return '비밀번호 확인을 입력해주세요.';
  }
  if (!isCreateMode && hasPasswordInput && trimmedPwd === '') {
    return '비밀번호를 입력해주세요.';
  }
  if (!isCreateMode && hasPasswordInput && trimmedPwdConfirm === '') {
    return '비밀번호 확인을 입력해주세요.';
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
  if ((isCreateMode || hasPasswordInput) && trimmedPwd.length < 6) {
    return '비밀번호는 최소 6자 이상 입력해주세요.';
  }
  if (hasPasswordInput && trimmedPwd !== trimmedPwdConfirm) {
    return '비밀번호와 비밀번호 확인이 일치하지 않습니다.';
  }
  if (trimmedUserNm.length < 2) {
    return '이름은 최소 2자 이상 입력해주세요.';
  }
  if (!PHONE_PATTERN.test(trimmedHPhoneNo)) {
    return '휴대폰번호 형식을 확인해주세요.';
  }
  if (!EMAIL_PATTERN.test(trimmedEmail)) {
    return '이메일 형식을 확인해주세요.';
  }
  return null;
};

// 사용자 저장 요청 payload를 생성합니다.
export const createUserSavePayload = (
  editForm: EditFormState,
  editMode: EditMode,
  usrNo: number,
): Record<string, string | number> => {
  const payload: Record<string, string | number> = {
    loginId: trim(editForm.loginId),
    pwd: trim(editForm.pwd),
    userNm: trim(editForm.userNm),
    usrGradeCd: trim(editForm.usrGradeCd),
    usrStatCd: trim(editForm.usrStatCd),
    hPhoneNo: trim(editForm.hPhoneNo),
    email: trim(editForm.email),
    udtNo: usrNo,
  };

  // 등록/수정 모드별 요청 파라미터를 분기합니다.
  if (editMode === 'create') {
    payload.regNo = usrNo;
  } else {
    payload.usrNo = Number(editForm.usrNo);
  }

  return payload;
};
