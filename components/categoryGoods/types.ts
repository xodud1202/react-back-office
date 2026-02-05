// 카테고리별 상품 목록 정보를 정의합니다.
export interface CategoryGoodsItem {
  categoryId: string;
  goodsId: string;
  dispOrd: number;
  erpStyleCd?: string;
  goodsNm?: string;
  goodsStatNm?: string;
  goodsDivNm?: string;
  imgUrl?: string;
}
