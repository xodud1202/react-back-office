import type { ComponentProps } from 'react';
import OrderStartDeliveryClientPage from '@/app/(protected)/order/start/delivery/OrderStartDeliveryClientPage';
import { fetchCommonCodeList } from '@/utils/server/backOffice';
import { ORDER_START_DELIVERY_ALLOWED_STATUS_LIST } from '@/components/order/utils/orderStartDeliveryUtils';

/**
 * 배송 시작 관리 화면에 필요한 초기 공통코드를 서버에서 조회합니다.
 * @returns 서버 데이터가 주입된 배송 시작 관리 화면입니다.
 */
export default async function OrderStartDeliveryPage() {
  const [ordDtlStatList, deliveryCompanyList] = await Promise.all([
    fetchCommonCodeList('ORD_DTL_STAT'),
    fetchCommonCodeList('DELV_COMP'),
  ]);

  // 배송 시작 관리에서 허용된 상태 코드만 화면 선택 목록으로 제공합니다.
  const allowedStatusSet = new Set(ORDER_START_DELIVERY_ALLOWED_STATUS_LIST);
  const filteredOrdDtlStatList = ordDtlStatList.filter((item) => allowedStatusSet.has(item.cd as typeof ORDER_START_DELIVERY_ALLOWED_STATUS_LIST[number]));

  const props: ComponentProps<typeof OrderStartDeliveryClientPage> = {
    ordDtlStatList: filteredOrdDtlStatList,
    deliveryCompanyList,
  };

  return <OrderStartDeliveryClientPage {...props} />;
}
