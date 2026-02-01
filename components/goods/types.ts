export interface GoodsData {
  goodsId: string;
  erpStyleCd: string;
  goodsNm: string;
  goodsStatCd: string;
  goodsStatNm: string;
  goodsDivCd: string;
  goodsDivNm: string;
  showYn: string;
  regDt: string;
  udtDt: string;
}

export interface CommonCode {
  grpCd: string;
  cd: string;
  cdNm: string;
  dispOrd: number;
}

export interface GoodsMerch {
  goodsMerchId: string;
  goodsMerchNm: string;
}

export interface GoodsDetail {
  goodsId: string;
  goodsDivCd: string;
  goodsStatCd: string;
  goodsNm: string;
  goodsGroupId: string;
  goodsMerchId: string;
  supplyAmt: number | string;
  saleAmt: number | string;
  showYn: string;
  erpSupplyAmt: number | string;
  erpCostAmt: number | string;
  erpStyleCd: string;
  erpColorCd: string;
  erpMerchCd: string;
}

export interface GoodsSizeRow {
  rowKey: string;
  goodsId: string;
  sizeId: string;
  originSizeId?: string;
  stockQty: number | string;
  addAmt: number | string;
  erpSyncYn: string;
  erpSizeCd: string;
  dispOrd: number | string;
  delYn?: string;
  isNew: boolean;
}

export interface GoodsSizeApi {
  goodsId: string;
  sizeId: string;
  stockQty: number;
  addAmt: number;
  erpSyncYn: string;
  erpSizeCd: string;
  dispOrd: number;
  delYn: string;
}

export interface CategoryOption {
  categoryId: string;
  parentCategoryId: string;
  categoryLevel: number;
  categoryNm: string;
  dispOrd: number;
}

export interface GoodsCategoryApi {
  goodsId: string;
  categoryId: string;
  level1Id: string | null;
  level2Id: string | null;
  level3Id: string | null;
  dispOrd: number;
}

export interface CategoryRow {
  rowKey: string;
  level1Id: string;
  level2Id: string;
  level3Id: string;
  level2Options: CategoryOption[];
  level3Options: CategoryOption[];
  level2Disabled: boolean;
  level3Disabled: boolean;
  originCategoryId?: string;
}

export interface GoodsListResponse {
  list: GoodsData[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface GoodsImageData {
  imgNo: number;
  goodsId: string;
  dispOrd: number;
  imgPath: string;
  imgUrl?: string;
}

export interface GoodsDescData {
  goodsId: string;
  deviceGbCd: string;
  goodsDesc: string;
}
