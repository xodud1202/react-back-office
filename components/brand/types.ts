export interface BrandListItem {
  brandNo: number;
  brandNm: string;
  brandLogoPath: string | null;
  brandNoti: string | null;
  dispOrd: number | null;
  useYn: string | null;
  delYn: string | null;
  regDt: string | null;
  udtDt: string | null;
}

export interface BrandListResponse {
  list: BrandListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface BrandDetail {
  brandNo: number;
  brandNm: string;
  brandLogoPath: string | null;
  brandNoti: string | null;
  dispOrd: number | null;
  useYn: string | null;
  delYn: string | null;
  regDt: string | null;
  udtDt: string | null;
}

export interface BrandSavePayload {
  brandNo?: number | null;
  brandNm: string;
  brandLogoPath?: string | null;
  brandNoti?: string | null;
  dispOrd?: number | null;
  useYn?: string | null;
  delYn?: string | null;
  regNo?: number;
  udtNo?: number;
}
