import type { ComponentProps } from 'react';
import OrderReturnManageClientPage from '@/app/(protected)/order/return/manage/OrderReturnManageClientPage';
import { fetchCommonCodeList } from '@/utils/server/backOffice';
import { ORDER_RETURN_MANAGE_ALLOWED_STATUS_LIST } from '@/components/order/utils/orderReturnManageUtils';

/**
 * 반품 회수 관리 화면에 필요한 초기 공통코드를 서버에서 조회합니다.
 * @returns 서버 데이터가 주입된 반품 회수 관리 화면입니다.
 */
export default async function OrderReturnManagePage() {
  const [chgDtlStatList, deliveryCompanyList] = await Promise.all([
    fetchCommonCodeList('CHG_DTL_STAT'),
    fetchCommonCodeList('DELV_COMP'),
  ]);

  // 반품 회수 관리에서 허용된 반품 상태 코드만 화면 선택 목록으로 제공합니다.
  const allowedStatusSet = new Set(ORDER_RETURN_MANAGE_ALLOWED_STATUS_LIST);
  const filteredChgDtlStatList = chgDtlStatList.filter((item) => allowedStatusSet.has(item.cd as typeof ORDER_RETURN_MANAGE_ALLOWED_STATUS_LIST[number]));

  const props: ComponentProps<typeof OrderReturnManageClientPage> = {
    chgDtlStatList: filteredChgDtlStatList,
    deliveryCompanyList,
  };

  return <OrderReturnManageClientPage {...props} />;
}
