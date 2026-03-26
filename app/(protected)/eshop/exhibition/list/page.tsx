import type { ComponentProps } from 'react';
import ExhibitionListPageClient from '@/app/(protected)/eshop/exhibition/list/ExhibitionListPageClient';
import { fetchGoodsLookupBundle } from '@/utils/server/backOffice';

/**
 * 기획전 관리 화면에 필요한 초기 옵션 데이터를 서버에서 조회합니다.
 * @returns 서버 데이터가 주입된 기획전 관리 화면입니다.
 */
export default async function ExhibitionListPage() {
  const lookupBundle = await fetchGoodsLookupBundle({ categoryLevel: 3, includeCategoryOptions: true });

  const props: ComponentProps<typeof ExhibitionListPageClient> = {
    goodsStatList: lookupBundle.goodsStatList,
    goodsDivList: lookupBundle.goodsDivList,
    goodsMerchList: lookupBundle.goodsMerchList,
    brandList: lookupBundle.brandList,
    categoryOptions: lookupBundle.categoryOptions,
  };

  return <ExhibitionListPageClient {...props} />;
}
