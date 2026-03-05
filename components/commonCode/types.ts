// 공통코드 행 데이터 타입입니다.
export interface CommonCodeRow {
  grpCd: string;
  cd: string;
  cdNm: string;
  cdDesc?: string | null;
  useYn: string;
  dispOrd?: number | null;
}

// 공통코드 편집 모드 타입입니다.
export type EditMode = 'create-group' | 'edit-group' | 'create-child' | 'edit-child';

// 공통코드 편집 폼 상태 타입입니다.
export interface EditFormState {
  grpCd: string;
  cd: string;
  cdNm: string;
  cdDesc: string;
  useYn: string;
  dispOrd: string;
}
