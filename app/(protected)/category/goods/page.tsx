import type { ComponentProps } from 'react';
import CategoryGoodsClientPage from '@/app/(protected)/category/goods/CategoryGoodsClientPage';
import { fetchGoodsLookupBundle } from '@/utils/server/backOffice';

/**
 * 카테고리별 상품 관리 화면에 필요한 초기 옵션 데이터를 서버에서 조회합니다.
 * @returns 서버 데이터가 주입된 카테고리별 상품 관리 화면입니다.
 */
export default async function CategoryGoodsPage() {
  const lookupBundle = await fetchGoodsLookupBundle();

  const props: ComponentProps<typeof CategoryGoodsClientPage> = {
    goodsStatList: lookupBundle.goodsStatList,
    goodsDivList: lookupBundle.goodsDivList,
    goodsMerchList: lookupBundle.goodsMerchList,
    brandList: lookupBundle.brandList,
  };

  return <CategoryGoodsClientPage {...props} />;
}
