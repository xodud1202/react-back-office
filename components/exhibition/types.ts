// 기획전 목록 행 정보를 정의합니다.
export interface ExhibitionItem {
  // 기획전 번호입니다.
  exhibitionNo: number;
  // 기획전명입니다.
  exhibitionNm: string;
  // 노출 시작일시입니다.
  dispStartDt?: string;
  // 노출 종료일시입니다.
  dispEndDt?: string;
  // 리스트 노출여부입니다.
  listShowYn: string;
  // 노출 여부입니다.
  showYn: string;
  // 썸네일 URL입니다.
  thumbnailUrl?: string;
  // 등록일시입니다.
  regDt?: string;
  // 수정일시입니다.
  udtDt?: string;
}

// 기획전 조회 조건입니다.
export interface ExhibitionSearchParams {
  // 검색 구분입니다.
  searchGb: string;
  // 검색 값입니다.
  searchValue: string;
  // 검색 시작일입니다.
  searchStartDt: string;
  // 검색 종료일입니다.
  searchEndDt: string;
}

// 기획전 목록 응답입니다.
export interface ExhibitionListResponse {
  // 목록입니다.
  list: ExhibitionItem[];
  // 전체 건수입니다.
  totalCount: number;
  // 현재 페이지입니다.
  page: number;
  // 페이지 크기입니다.
  pageSize: number;
}

// 기획전 탭 정보를 정의합니다.
export interface ExhibitionTabItem {
  // 행 키입니다.
  rowKey?: string;
  // 기획전 탭 번호입니다.
  exhibitionTabNo?: number;
  // 기획전 번호입니다.
  exhibitionNo?: number;
  // 탭명입니다.
  tabNm: string;
  // 노출 순서입니다.
  dispOrd: number;
  // 노출 여부입니다.
  showYn: string;
  // 삭제 여부입니다.
  delYn?: string;
}

// 기획전 탭 상품 정보를 정의합니다.
export interface ExhibitionGoodsItem {
  // 행 키입니다.
  rowKey?: string;
  // 기획전 번호입니다.
  exhibitionNo?: number;
  // 기획전 탭 번호입니다.
  exhibitionTabNo?: number;
  // 신규 행에 사용하는 탭 행 키입니다.
  exhibitionTabRowKey?: string;
  // 상품코드입니다.
  goodsId: string;
  // ERP 품번 코드입니다.
  erpStyleCd?: string;
  // 상품명입니다.
  goodsNm?: string;
  // 노출 순서입니다.
  dispOrd: number;
  // 노출 여부입니다.
  showYn: string;
  // 삭제 여부입니다.
  delYn?: string;
}

// 기획전 상세 정보를 정의합니다.
export interface ExhibitionDetail {
  // 기획전 번호입니다.
  exhibitionNo: number;
  // 기획전명입니다.
  exhibitionNm: string;
  // 노출 시작일시입니다.
  dispStartDt?: string;
  // 노출 종료일시입니다.
  dispEndDt?: string;
  // 리스트 노출 여부입니다.
  listShowYn: string;
  // 노출 여부입니다.
  showYn: string;
  // 썸네일 URL입니다.
  thumbnailUrl?: string;
  // PC 상세 HTML입니다.
  exhibitionPcDesc?: string;
  // MO 상세 HTML입니다.
  exhibitionMoDesc?: string;
  // 탭 목록입니다.
  tabList: ExhibitionTabItem[];
  // 탭 상품 목록입니다.
  goodsList: ExhibitionGoodsItem[];
}

// 엑셀 파싱 항목입니다.
export interface ExhibitionGoodsExcelRow {
  // 상품코드입니다.
  goodsId: string;
  // 노출 순서입니다.
  dispOrd: number;
  // 노출 여부입니다.
  showYn: string;
}

// 기획전 저장 요청 본문입니다.
export interface ExhibitionSavePayload {
  // 기획전 번호입니다.
  exhibitionNo?: number;
  // 기획전명입니다.
  exhibitionNm: string;
  // 노출 시작일시입니다.
  dispStartDt?: string;
  // 노출 종료일시입니다.
  dispEndDt?: string;
  // 리스트 노출 여부입니다.
  listShowYn: string;
  // 노출 여부입니다.
  showYn: string;
  // PC 상세입니다.
  exhibitionPcDesc: string;
  // MO 상세입니다.
  exhibitionMoDesc: string;
  // 등록자입니다.
  regNo?: number;
  // 수정자입니다.
  udtNo?: number;
  // 탭 목록입니다.
  tabList?: ExhibitionTabItem[];
  // 탭별 상품 목록입니다.
  goodsList?: ExhibitionGoodsItem[];
}

// 기획전 기본 조회 조건 값입니다.
export const DEFAULT_EXHIBITION_SEARCH_PARAMS: ExhibitionSearchParams = {
  searchGb: 'NM',
  searchValue: '',
  searchStartDt: '',
  searchEndDt: '',
};
