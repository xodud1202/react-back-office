import type { ComponentProps } from 'react';
import OrderListClientPage from '@/app/(protected)/order/list/OrderListClientPage';
import { fetchCommonCodeList } from '@/utils/server/backOffice';

/**
 * 주문관리 화면에 필요한 초기 공통코드를 서버에서 조회합니다.
 * @returns 서버 데이터가 주입된 주문관리 화면입니다.
 */
export default async function OrderListPage() {
  const [ordDtlStatList, chgDtlStatList] = await Promise.all([
    fetchCommonCodeList('ORD_DTL_STAT'),
    fetchCommonCodeList('CHG_DTL_STAT'),
  ]);

  // 실주문이 아닌 주문대기 상태 코드는 화면 선택 목록에서 제외합니다.
  const filteredOrdDtlStatList = ordDtlStatList.filter((item) => item.cd !== 'ORD_DTL_STAT_00');

  const props: ComponentProps<typeof OrderListClientPage> = {
    ordDtlStatList: filteredOrdDtlStatList,
    chgDtlStatList,
  };

  return <OrderListClientPage {...props} />;
}
