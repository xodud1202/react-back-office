import type { ComponentProps } from 'react';
import GoodsRegiPageClient from '@/app/(protected)/goods/regi/GoodsRegiPageClient';
import { fetchGoodsLookupBundle } from '@/utils/server/backOffice';

/**
 * 상품 등록 화면에 필요한 초기 옵션 데이터를 서버에서 조회합니다.
 * @returns 서버 데이터가 주입된 상품 등록 화면입니다.
 */
export default async function GoodsRegiPage() {
  const lookupBundle = await fetchGoodsLookupBundle();

  const props: ComponentProps<typeof GoodsRegiPageClient> = {
    goodsStatList: lookupBundle.goodsStatList,
    goodsDivList: lookupBundle.goodsDivList,
    goodsMerchList: lookupBundle.goodsMerchList,
    brandList: lookupBundle.brandList,
  };

  return <GoodsRegiPageClient {...props} />;
}
