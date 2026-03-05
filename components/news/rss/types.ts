// 뉴스 RSS 언론사 행 타입입니다.
export interface NewsPressRow {
  rowId: string;
  pressNo: number | null;
  pressNm: string;
  useYn: 'Y' | 'N';
  sortSeq: number;
}

// 뉴스 RSS 카테고리 행 타입입니다.
export interface NewsCategoryRow {
  rowId: string;
  pressNo: number | null;
  categoryCd: string;
  categoryNm: string;
  useYn: 'Y' | 'N';
  sortSeq: number;
  sourceNm: string;
  rssUrl: string;
}
