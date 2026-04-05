import type {
  OrderReturnManageSearchParams,
  OrderReturnManageStatusCode,
} from '@/components/order/returnManageTypes';

// 반품신청 상태 코드입니다.
export const ORDER_RETURN_MANAGE_APPLY_STATUS = 'CHG_DTL_STAT_11';
// 반품회수신청 상태 코드입니다.
export const ORDER_RETURN_MANAGE_PICKUP_REQUEST_STATUS = 'CHG_DTL_STAT_12';
// 반품회수중 상태 코드입니다.
export const ORDER_RETURN_MANAGE_PICKUP_IN_PROGRESS_STATUS = 'CHG_DTL_STAT_13';
// 반품회수완료 상태 코드입니다.
export const ORDER_RETURN_MANAGE_PICKUP_COMPLETE_STATUS = 'CHG_DTL_STAT_14';
// 반품 회수 관리 검색 허용 상태 목록입니다.
export const ORDER_RETURN_MANAGE_ALLOWED_STATUS_LIST: OrderReturnManageStatusCode[] = [
  ORDER_RETURN_MANAGE_APPLY_STATUS,
  ORDER_RETURN_MANAGE_PICKUP_REQUEST_STATUS,
  ORDER_RETURN_MANAGE_PICKUP_IN_PROGRESS_STATUS,
];
// 반품 회수 관리 페이지 기본 크기입니다.
export const ORDER_RETURN_MANAGE_PAGE_SIZE = 20;
// 반품 회수 송장번호 최대 길이입니다.
export const ORDER_RETURN_MANAGE_INVOICE_NO_MAX_LENGTH = 20;

// 반품 회수 관리 기본 검색 조건을 생성합니다.
export function createDefaultOrderReturnManageSearchParams(): OrderReturnManageSearchParams {
  return {
    chgDtlStatCd: ORDER_RETURN_MANAGE_APPLY_STATUS,
  };
}

// 현재 조회 상태가 송장 입력 가능 상태인지 반환합니다.
export function isOrderReturnManageEditableStatus(chgDtlStatCd: string): boolean {
  return chgDtlStatCd === ORDER_RETURN_MANAGE_APPLY_STATUS;
}

// 현재 조회 상태가 회수중 처리 가능 상태인지 반환합니다.
export function isOrderReturnManagePickupStartStatus(chgDtlStatCd: string): boolean {
  return chgDtlStatCd === ORDER_RETURN_MANAGE_PICKUP_REQUEST_STATUS;
}

// 현재 조회 상태가 회수완료 예정 안내 상태인지 반환합니다.
export function isOrderReturnManagePickupCompletePendingStatus(chgDtlStatCd: string): boolean {
  return chgDtlStatCd === ORDER_RETURN_MANAGE_PICKUP_IN_PROGRESS_STATUS;
}

// 송장번호 입력값을 숫자만 남기고 최대 길이까지 잘라냅니다.
export function sanitizeOrderReturnManageInvoiceNo(value: string): string {
  // 숫자가 아닌 값은 모두 제거합니다.
  const digitsOnlyValue = value.replace(/\D/g, '');
  // DB 컬럼 길이 20자까지만 유지합니다.
  return digitsOnlyValue.slice(0, ORDER_RETURN_MANAGE_INVOICE_NO_MAX_LENGTH);
}
