// 사용자 관리 공통코드 옵션 타입입니다.
export interface CommonCodeRow {
  cd: string;
  cdNm: string;
}

// 사용자 목록 행 데이터 타입입니다.
export interface UserRow {
  usrNo: number;
  loginId: string;
  userNm: string;
  usrGradeCd: string;
  usrStatCd: string;
  hPhoneNo: string;
  email: string;
  accessDt?: string | null;
  loginFailCnt?: number | null;
  regDt?: string | null;
}

// 사용자 검색 구분 타입입니다.
export type SearchGb = 'loginId' | 'userNm';

// 사용자 검색 조건 타입입니다.
export interface UserSearchCriteria {
  searchGb: SearchGb;
  searchValue: string;
  usrStatCd: string;
  usrGradeCd: string;
}

// 사용자 등록/수정 모드 타입입니다.
export type EditMode = 'create' | 'edit';

// 사용자 등록/수정 폼 타입입니다.
export interface EditFormState {
  usrNo: string;
  loginId: string;
  pwd: string;
  pwdConfirm: string;
  userNm: string;
  usrGradeCd: string;
  usrStatCd: string;
  hPhoneNo: string;
  email: string;
}
