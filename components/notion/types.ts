// Notion 저장 목록 행 타입입니다.
export interface NotionListRow {
  id: string;
  categoryId: string | null;
  categoryNm: string | null;
  title: string | null;
  notes: string | null;
  url: string | null;
  notionUrl: string | null;
  createDt: string | null;
}

// Notion 저장 목록 응답 타입입니다.
export interface NotionListResponse {
  list: NotionListRow[];
  totalCount: number;
  page: number;
  pageSize: number;
}

// Notion 카테고리 옵션 타입입니다.
export interface NotionCategoryOption {
  categoryId: string;
  categoryNm: string;
  color: string | null;
  sortSeq: number;
  regDt: string | null;
}

// Notion 카테고리 정렬 행 타입입니다.
export interface NotionCategorySortRow {
  rowId: string;
  categoryId: string;
  categoryNm: string;
  color: string | null;
  sortSeq: number;
}

// Notion 검색 폼 타입입니다.
export interface NotionSearchForm {
  categoryId: string;
  createDtStart: string;
  createDtEnd: string;
  title: string;
}
