import type { BrandOption, CategoryOption, CommonCode, GoodsMerch } from '@/components/goods/types';
import { fetchServerList } from '@/utils/server/auth';

interface GoodsLookupBundleOptions {
  categoryLevel?: number;
  includeCategoryOptions?: boolean;
}

interface GoodsLookupBundle {
  goodsStatList: CommonCode[];
  goodsDivList: CommonCode[];
  goodsMerchList: GoodsMerch[];
  brandList: BrandOption[];
  categoryOptions: CategoryOption[];
}

/**
 * 공통코드 그룹 목록을 서버에서 조회합니다.
 * @param grpCd 조회할 공통코드 그룹 코드입니다.
 * @returns 공통코드 목록입니다.
 */
export const fetchCommonCodeList = async (grpCd: string): Promise<CommonCode[]> => (
  fetchServerList<CommonCode>(`/api/admin/common/code?grpCd=${encodeURIComponent(grpCd)}`)
);

/**
 * 상품 선택 레이어에서 공통으로 사용하는 옵션 묶음을 조회합니다.
 * @param options 카테고리 포함 여부와 조회 레벨입니다.
 * @returns 상품 관련 공통 옵션 묶음입니다.
 */
export const fetchGoodsLookupBundle = async (
  options: GoodsLookupBundleOptions = {},
): Promise<GoodsLookupBundle> => {
  const { categoryLevel, includeCategoryOptions = false } = options;
  const categoryQuery = includeCategoryOptions
    ? `/api/admin/category/list${typeof categoryLevel === 'number' ? `?categoryLevel=${categoryLevel}` : ''}`
    : null;

  const [goodsStatList, goodsDivList, goodsMerchList, brandList, categoryOptions] = await Promise.all([
    fetchCommonCodeList('GOODS_STAT'),
    fetchCommonCodeList('GOODS_DIV'),
    fetchServerList<GoodsMerch>('/api/admin/goods/merch/list'),
    fetchServerList<BrandOption>('/api/admin/brand/list'),
    categoryQuery ? fetchServerList<CategoryOption>(categoryQuery) : Promise.resolve([] as CategoryOption[]),
  ]);

  return {
    goodsStatList,
    goodsDivList,
    goodsMerchList,
    brandList,
    categoryOptions,
  };
};
