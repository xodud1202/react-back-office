import type {
  OrderStartDeliverySearchParams,
  OrderStartDeliveryStatusCode,
} from '@/components/order/startDeliveryTypes';

// 상품 준비중 상태 코드입니다.
export const ORDER_START_DELIVERY_PREPARING_STATUS = 'ORD_DTL_STAT_03';
// 배송 준비중 상태 코드입니다.
export const ORDER_START_DELIVERY_DELIVERY_PREPARING_STATUS = 'ORD_DTL_STAT_04';
// 배송중 상태 코드입니다.
export const ORDER_START_DELIVERY_DELIVERING_STATUS = 'ORD_DTL_STAT_05';
// 배송완료 상태 코드입니다.
export const ORDER_START_DELIVERY_DELIVERY_COMPLETED_STATUS = 'ORD_DTL_STAT_06';
// 검색 가능 상태 코드 목록입니다.
export const ORDER_START_DELIVERY_ALLOWED_STATUS_LIST: OrderStartDeliveryStatusCode[] = [
  ORDER_START_DELIVERY_PREPARING_STATUS,
  ORDER_START_DELIVERY_DELIVERY_PREPARING_STATUS,
  ORDER_START_DELIVERY_DELIVERING_STATUS,
];
// 배송 시작 관리 페이지 기본 크기입니다.
export const ORDER_START_DELIVERY_PAGE_SIZE = 20;
// 송장번호 최대 길이입니다.
export const ORDER_START_DELIVERY_INVOICE_NO_MAX_LENGTH = 20;

// 배송 시작 관리 기본 검색 조건을 생성합니다.
export function createDefaultOrderStartDeliverySearchParams(): OrderStartDeliverySearchParams {
  return {
    ordDtlStatCd: ORDER_START_DELIVERY_PREPARING_STATUS,
  };
}

// 현재 조회 상태가 상품 준비중인지 반환합니다.
export function isOrderStartDeliveryPrepareEditableStatus(ordDtlStatCd: string): boolean {
  return ordDtlStatCd === ORDER_START_DELIVERY_PREPARING_STATUS;
}

// 현재 조회 상태에 맞는 액션 버튼 라벨을 반환합니다.
export function getOrderStartDeliveryActionLabel(ordDtlStatCd: string): string {
  if (ordDtlStatCd === ORDER_START_DELIVERY_PREPARING_STATUS) {
    return '배송준비중';
  }
  if (ordDtlStatCd === ORDER_START_DELIVERY_DELIVERY_PREPARING_STATUS) {
    return '배송중';
  }
  if (ordDtlStatCd === ORDER_START_DELIVERY_DELIVERING_STATUS) {
    return '배송완료';
  }
  return '';
}

// 현재 조회 상태에 맞는 액션 API 경로를 반환합니다.
export function getOrderStartDeliveryActionEndpoint(ordDtlStatCd: string): string {
  if (ordDtlStatCd === ORDER_START_DELIVERY_PREPARING_STATUS) {
    return '/api/admin/order/start/delivery/prepare';
  }
  if (ordDtlStatCd === ORDER_START_DELIVERY_DELIVERY_PREPARING_STATUS) {
    return '/api/admin/order/start/delivery/start';
  }
  if (ordDtlStatCd === ORDER_START_DELIVERY_DELIVERING_STATUS) {
    return '/api/admin/order/start/delivery/complete';
  }
  return '';
}

// 현재 조회 상태에 맞는 성공 메시지를 반환합니다.
export function getOrderStartDeliveryActionSuccessMessage(ordDtlStatCd: string): string {
  if (ordDtlStatCd === ORDER_START_DELIVERY_PREPARING_STATUS) {
    return '배송준비중으로 변경되었습니다.';
  }
  if (ordDtlStatCd === ORDER_START_DELIVERY_DELIVERY_PREPARING_STATUS) {
    return '배송중으로 변경되었습니다.';
  }
  if (ordDtlStatCd === ORDER_START_DELIVERY_DELIVERING_STATUS) {
    return '배송완료로 변경되었습니다.';
  }
  return '';
}

// 송장번호 입력값을 숫자만 남기고 최대 길이까지 잘라냅니다.
export function sanitizeOrderStartDeliveryInvoiceNo(value: string): string {
  // 숫자가 아닌 값은 모두 제거합니다.
  const digitsOnlyValue = value.replace(/\D/g, '');
  // DB 컬럼 길이 20자까지만 유지합니다.
  return digitsOnlyValue.slice(0, ORDER_START_DELIVERY_INVOICE_NO_MAX_LENGTH);
}
