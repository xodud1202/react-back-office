import type { ComponentProps } from 'react';
import GoodsListClientPage from '@/app/(protected)/goods/list/GoodsListClientPage';
import type { CategoryOption } from '@/components/goods/types';
import { fetchServerList } from '@/utils/server/auth';
import { fetchGoodsLookupBundle } from '@/utils/server/backOffice';

/**
 * 상품 목록 화면에 필요한 초기 옵션 데이터를 서버에서 조회합니다.
 * @returns 서버 데이터가 주입된 상품 목록 화면입니다.
 */
export default async function GoodsListPage() {
  const lookupBundle = await fetchGoodsLookupBundle();
  const categoryLevel1Options = await fetchServerList<CategoryOption>('/api/admin/category/list?categoryLevel=1');

  const props: ComponentProps<typeof GoodsListClientPage> = {
    goodsStatList: lookupBundle.goodsStatList,
    goodsDivList: lookupBundle.goodsDivList,
    goodsMerchList: lookupBundle.goodsMerchList,
    brandList: lookupBundle.brandList,
    categoryLevel1Options,
  };

  return <GoodsListClientPage {...props} />;
}
