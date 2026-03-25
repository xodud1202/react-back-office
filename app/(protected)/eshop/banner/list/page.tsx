import type { ComponentProps } from 'react';
import BannerListClientPage from '@/app/(protected)/eshop/banner/list/BannerListClientPage';
import { fetchGoodsLookupBundle, fetchCommonCodeList } from '@/utils/server/backOffice';

/**
 * 배너 관리 화면에 필요한 초기 옵션 데이터를 서버에서 조회합니다.
 * @returns 서버 데이터가 주입된 배너 관리 화면입니다.
 */
export default async function BannerListPage() {
  const [bannerDivList, lookupBundle] = await Promise.all([
    fetchCommonCodeList('BANNER_DIV'),
    fetchGoodsLookupBundle({ categoryLevel: 3, includeCategoryOptions: true }),
  ]);

  const props: ComponentProps<typeof BannerListClientPage> = {
    bannerDivList,
    goodsStatList: lookupBundle.goodsStatList,
    goodsDivList: lookupBundle.goodsDivList,
    goodsMerchList: lookupBundle.goodsMerchList,
    brandList: lookupBundle.brandList,
    categoryOptions: lookupBundle.categoryOptions,
  };

  return <BannerListClientPage {...props} />;
}
