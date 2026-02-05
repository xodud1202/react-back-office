// /store/store.ts
export interface User {
  usrNo: 0;
  userNm: string;
  loginId: string;
  usrGradeCd: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}
