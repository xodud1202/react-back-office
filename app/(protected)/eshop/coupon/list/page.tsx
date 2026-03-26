import type { ComponentProps } from 'react';
import CouponListPageClient from '@/app/(protected)/eshop/coupon/list/CouponListPageClient';
import { fetchGoodsLookupBundle, fetchCommonCodeList } from '@/utils/server/backOffice';

/**
 * 쿠폰 관리 화면에 필요한 초기 옵션 데이터를 서버에서 조회합니다.
 * @returns 서버 데이터가 주입된 쿠폰 관리 화면입니다.
 */
export default async function CouponListPage() {
  const [cpnStatList, cpnGbList, cpnTargetList, cpnUseDtList, cpnDcGbList, lookupBundle] = await Promise.all([
    fetchCommonCodeList('CPN_STAT'),
    fetchCommonCodeList('CPN_GB'),
    fetchCommonCodeList('CPN_TARGET'),
    fetchCommonCodeList('CPN_USE_DT'),
    fetchCommonCodeList('CPN_DC_GB'),
    fetchGoodsLookupBundle({ includeCategoryOptions: true }),
  ]);

  const props: ComponentProps<typeof CouponListPageClient> = {
    cpnStatList,
    cpnGbList,
    cpnTargetList,
    cpnUseDtList,
    cpnDcGbList,
    goodsStatList: lookupBundle.goodsStatList,
    goodsDivList: lookupBundle.goodsDivList,
    goodsMerchList: lookupBundle.goodsMerchList,
    brandList: lookupBundle.brandList,
    categoryOptions: lookupBundle.categoryOptions,
  };

  return <CouponListPageClient {...props} />;
}
