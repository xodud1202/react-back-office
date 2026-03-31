// 주문 대기 상태 코드입니다.
export const ADMIN_ORDER_DETAIL_READY_STATUS = 'ORD_DTL_STAT_00';
// 무통장 입금 대기 상태 코드입니다.
export const ADMIN_ORDER_DETAIL_WAITING_DEPOSIT_STATUS = 'ORD_DTL_STAT_01';
// 결제 완료 상태 코드입니다.
export const ADMIN_ORDER_DETAIL_PAYMENT_DONE_STATUS = 'ORD_DTL_STAT_02';
// 상품 준비중 상태 코드입니다.
export const ADMIN_ORDER_DETAIL_PREPARING_STATUS = 'ORD_DTL_STAT_03';
// 주문 취소 상태 코드입니다.
export const ADMIN_ORDER_DETAIL_CANCEL_STATUS = 'ORD_DTL_STAT_99';

// 주문 취소 가능 상태인지 반환합니다.
export function isAdminOrderCancelableStatus(ordDtlStatCd?: string | null): boolean {
  return ordDtlStatCd === ADMIN_ORDER_DETAIL_PAYMENT_DONE_STATUS
    || ordDtlStatCd === ADMIN_ORDER_DETAIL_PREPARING_STATUS;
}

// 상품 준비중 변경 가능 상태인지 반환합니다.
export function isAdminOrderPreparingAvailableStatus(ordDtlStatCd?: string | null): boolean {
  return ordDtlStatCd === ADMIN_ORDER_DETAIL_PAYMENT_DONE_STATUS;
}
