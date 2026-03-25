// /store/store.ts
export interface User {
  usrNo: number;
  userNm: string;
  loginId: string;
  usrGradeCd: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}
