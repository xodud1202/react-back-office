// /store/store.ts
export interface User {
  usrNo: 0;
  userNm: string;
  loginId: string;
  hPhoneNo: string;
  email: string;
  usrGradeCd: string;
  usrStatCd: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}
