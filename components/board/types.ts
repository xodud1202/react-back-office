// 게시글 행 데이터 타입입니다.
export interface BoardData {
  boardNo: number;
  boardDivNm: string | null;
  boardDetailDivCd: string | null;
  boardDetailDivNm: string | null;
  title: string | null;
  content?: string | null;
  viewYn: string | null;
  readCnt: number | null;
  regDt: string | null;
  udtDt: string | null;
}

// 공통코드 데이터 타입입니다.
export interface CommonCode {
  grpCd: string;
  cd: string;
  cdNm: string;
  dispOrd: number;
}

// 게시글 목록 응답 타입입니다.
export interface BoardListResponse {
  list: BoardData[];
  totalCount: number;
  page: number;
  pageSize: number;
}

// 게시글 수정/등록 폼 타입입니다.
export interface BoardEditForm {
  boardNo: number | null;
  boardDetailDivCd: string;
  title: string;
  content: string;
}
