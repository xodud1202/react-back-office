// 배너 공통 타입을 정의합니다.
export interface BannerItem {
  // 배너 번호입니다.
  bannerNo: number;
  // 배너 구분 코드입니다.
  bannerDivCd: string;
  // 배너 구분명입니다.
  bannerDivNm: string;
  // 배너명입니다.
  bannerNm: string;
  // 노출 시작일시입니다.
  dispStartDt?: string;
  // 노출 종료일시입니다.
  dispEndDt?: string;
  // 노출 순서입니다.
  dispOrd: number;
  // 노출 여부입니다.
  showYn: string;
  // 이미지 경로입니다.
  imgPath?: string;
  // 등록일시입니다.
  regDt?: string;
  // 수정일시입니다.
  udtDt?: string;
}

// 이미지 배너 정보를 정의합니다.
export interface BannerImageInfo {
  // 배너 번호입니다.
  bannerNo?: number;
  // 이미지 경로입니다.
  imgPath?: string;
  // 이동 URL입니다.
  url?: string;
  // 배너 오픈 코드입니다.
  bannerOpenCd?: string;
  // 노출 순서입니다.
  dispOrd?: number;
}

// 배너 탭 정보를 정의합니다.
export interface BannerTabItem {
  // 배너 탭 번호입니다.
  bannerTabNo?: number;
  // 탭명입니다.
  tabNm: string;
  // 노출 순서입니다.
  dispOrd: number;
  // 노출 여부입니다.
  showYn: string;
}

// 배너 상품 정보를 정의합니다.
export interface BannerGoodsItem {
  // 행 키입니다.
  rowKey: string;
  // 배너 번호입니다.
  bannerNo?: number;
  // 배너 탭 번호입니다.
  bannerTabNo?: number;
  // 탭명입니다.
  tabNm?: string;
  // 상품 코드입니다.
  goodsId: string;
  // ERP 품번 코드입니다.
  erpStyleCd?: string;
  // 상품명입니다.
  goodsNm?: string;
  // 상품 상태명입니다.
  goodsStatNm?: string;
  // 상품 구분명입니다.
  goodsDivNm?: string;
  // 이미지 URL입니다.
  imgUrl?: string;
  // 이미지 경로입니다.
  imgPath?: string;
  // 노출 순서입니다.
  dispOrd: number;
  // 노출 여부입니다.
  showYn: string;
}

// 배너 상세 정보를 정의합니다.
export interface BannerDetail {
  // 배너 번호입니다.
  bannerNo: number;
  // 배너 구분 코드입니다.
  bannerDivCd: string;
  // 배너명입니다.
  bannerNm: string;
  // 노출 시작일시입니다.
  dispStartDt?: string;
  // 노출 종료일시입니다.
  dispEndDt?: string;
  // 노출 순서입니다.
  dispOrd: number;
  // 노출 여부입니다.
  showYn: string;
  // 이미지 배너 정보입니다.
  imageInfo?: BannerImageInfo;
  // 탭 목록입니다.
  tabList?: BannerTabItem[];
  // 상품 목록입니다.
  goodsList?: BannerGoodsItem[];
}

// 배너 목록 응답을 정의합니다.
export interface BannerListResponse {
  // 목록입니다.
  list: BannerItem[];
  // 총 건수입니다.
  totalCount: number;
  // 현재 페이지입니다.
  page: number;
  // 페이지 크기입니다.
  pageSize: number;
}

// 검색 폼 값을 정의합니다.
export interface BannerSearchParams {
  // 배너 구분 코드입니다.
  bannerDivCd: string;
  // 노출 여부입니다.
  showYn: string;
  // 검색어입니다.
  searchValue: string;
  // 노출기간 검색 시작일시입니다.
  searchStartDt: string;
  // 노출기간 검색 종료일시입니다.
  searchEndDt: string;
}

// 배너 저장 요청 본문을 정의합니다.
export interface BannerSavePayload {
  // 배너 번호입니다.
  bannerNo?: number;
  // 배너 구분 코드입니다.
  bannerDivCd: string;
  // 배너명입니다.
  bannerNm: string;
  // 노출 시작일시입니다.
  dispStartDt?: string;
  // 노출 종료일시입니다.
  dispEndDt?: string;
  // 노출 순서입니다.
  dispOrd: number;
  // 노출 여부입니다.
  showYn: string;
  // 등록자 번호입니다.
  regNo?: number;
  // 수정자 번호입니다.
  udtNo?: number;
  // 이미지 배너 정보입니다.
  imageInfo?: BannerImageInfo;
  // 탭 목록입니다.
  tabList?: BannerTabItem[];
  // 상품 목록입니다.
  goodsList?: BannerGoodsItem[];
}
