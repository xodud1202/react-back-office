import type {
  AdminOrderReturnAmountSummary,
  AdminOrderReturnDetailItem,
  AdminOrderReturnFeeContext,
  AdminOrderReturnOrderGroup,
  AdminOrderReturnReasonItem,
  AdminOrderReturnSiteInfo,
} from '@/components/order/types';
import { ADMIN_ORDER_DETAIL_DELIVERY_COMPLETED_STATUS } from '@/components/order/utils/orderDetailStatusUtils';

// 관리자 반품 상품별 선택 상태를 정의합니다.
export interface AdminOrderReturnSelectionItem {
  // 선택 여부입니다.
  selected: boolean;
  // 반품 수량입니다.
  returnQty: number;
}

// 주문상세번호 키 기반 관리자 반품 선택 상태 맵을 정의합니다.
export type AdminOrderReturnSelectionMap = Record<number, AdminOrderReturnSelectionItem>;

// 관리자 반품 예정 금액 요약을 정의합니다.
export interface AdminOrderReturnPreviewSummary {
  // 총 공급가입니다.
  totalSupplyAmt: number;
  // 총 주문금액입니다.
  totalOrderAmt: number;
  // 총 상품할인 금액입니다.
  totalGoodsDiscountAmt: number;
  // 총 상품쿠폰 환급 금액입니다.
  totalGoodsCouponDiscountAmt: number;
  // 총 장바구니쿠폰 환급 금액입니다.
  totalCartCouponDiscountAmt: number;
  // 총 포인트 환급 금액입니다.
  totalPointRefundAmt: number;
  // 배송비쿠폰 환급 금액입니다.
  deliveryCouponRefundAmt: number;
  // 실결제 상품가입니다.
  paidGoodsAmt: number;
  // 환급 혜택 합계입니다.
  benefitAmt: number;
  // 배송비 조정 금액입니다.
  shippingAdjustmentAmt: number;
  // 반품 예정 금액입니다.
  expectedRefundAmt: number;
}

// 관리자 반품 예정 금액 계산 결과를 정의합니다.
export interface AdminOrderReturnPreviewResult {
  // 반품 예정 금액 요약입니다.
  returnPreviewSummary: AdminOrderReturnPreviewSummary;
  // 전체 반품 여부입니다.
  isFullReturn: boolean;
  // 선택된 상품 건수입니다.
  selectedItemCount: number;
  // 선택된 총 반품 수량입니다.
  selectedQtyCount: number;
  // 현금 환불 예정 금액입니다.
  cashRefundAmt: number;
  // 반품 신청 가능 여부입니다.
  canSubmit: boolean;
  // 차단 메시지입니다.
  submitBlockMessage: string;
  // 예정 금액 노출 여부입니다.
  previewVisible: boolean;
}

interface AdminOrderReturnSliceAmount {
  // 공급가입니다.
  supplyAmt: number;
  // 주문금액입니다.
  orderAmt: number;
  // 상품할인 금액입니다.
  goodsDiscountAmt: number;
  // 상품쿠폰 환급 금액입니다.
  goodsCouponDiscountAmt: number;
  // 장바구니쿠폰 환급 금액입니다.
  cartCouponDiscountAmt: number;
  // 포인트 환급 금액입니다.
  pointUseAmt: number;
}

const COMPANY_FAULT_REASON_PREFIX = 'R_2';

// 숫자 값을 0 이상 정수로 보정합니다.
function normalizeNonNegativeInt(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(Math.floor(value), 0);
}

// 반품 예정 금액 요약 기본값 객체를 생성합니다.
function createEmptyAdminOrderReturnPreviewSummary(): AdminOrderReturnPreviewSummary {
  return {
    totalSupplyAmt: 0,
    totalOrderAmt: 0,
    totalGoodsDiscountAmt: 0,
    totalGoodsCouponDiscountAmt: 0,
    totalCartCouponDiscountAmt: 0,
    totalPointRefundAmt: 0,
    deliveryCouponRefundAmt: 0,
    paidGoodsAmt: 0,
    benefitAmt: 0,
    shippingAdjustmentAmt: 0,
    expectedRefundAmt: 0,
  };
}

// 반품 가능 잔여수량을 0 이상 정수로 보정합니다.
function resolveAdminOrderReturnableQty(item: AdminOrderReturnDetailItem): number {
  return normalizeNonNegativeInt(item.cancelableQty);
}

// 원수량 기준 누적 배분 금액을 계산합니다.
function resolveCumulativeAllocatedAmt(totalAmt: number, totalQty: number, appliedQty: number): number {
  const safeTotalAmt = normalizeNonNegativeInt(totalAmt);
  const safeTotalQty = Math.max(totalQty, 0);
  const safeAppliedQty = Math.max(Math.min(appliedQty, safeTotalQty), 0);
  if (safeTotalAmt < 1 || safeTotalQty < 1 || safeAppliedQty < 1) {
    return 0;
  }
  if (safeAppliedQty >= safeTotalQty) {
    return safeTotalAmt;
  }
  return Math.floor((safeTotalAmt * safeAppliedQty) / safeTotalQty);
}

// 선택된 반품 수량 기준 행 금액/환급값을 계산합니다.
function buildAdminOrderReturnSliceAmount(
  item: AdminOrderReturnDetailItem,
  quantity: number,
  currentRemainingQty: number,
): AdminOrderReturnSliceAmount {
  const safeRemainingQty = normalizeNonNegativeInt(currentRemainingQty);
  const resolvedQty = Math.min(Math.max(quantity, 0), safeRemainingQty);
  const unitOrderAmt = normalizeNonNegativeInt(item.saleAmt) + normalizeNonNegativeInt(item.addAmt);
  const supplyAmt = normalizeNonNegativeInt(item.supplyAmt) * resolvedQty;
  const orderAmt = unitOrderAmt * resolvedQty;
  const goodsDiscountAmt = Math.max(supplyAmt - orderAmt, 0);
  const goodsCouponDiscountAmt = resolveCumulativeAllocatedAmt(item.goodsCouponDiscountAmt, safeRemainingQty, resolvedQty);
  const cartCouponDiscountAmt = resolveCumulativeAllocatedAmt(item.cartCouponDiscountAmt, safeRemainingQty, resolvedQty);
  const pointUseAmt = resolveCumulativeAllocatedAmt(item.pointUseAmt, safeRemainingQty, resolvedQty);

  return {
    supplyAmt,
    orderAmt,
    goodsDiscountAmt,
    goodsCouponDiscountAmt,
    cartCouponDiscountAmt,
    pointUseAmt,
  };
}

// 반품 예정 금액 요약에 행 금액을 누적합니다.
function accumulateAdminOrderReturnPreviewSummary(
  target: AdminOrderReturnPreviewSummary,
  sliceAmount: AdminOrderReturnSliceAmount,
): void {
  target.totalSupplyAmt += sliceAmount.supplyAmt;
  target.totalOrderAmt += sliceAmount.orderAmt;
  target.totalGoodsDiscountAmt += sliceAmount.goodsDiscountAmt;
  target.totalGoodsCouponDiscountAmt += sliceAmount.goodsCouponDiscountAmt;
  target.totalCartCouponDiscountAmt += sliceAmount.cartCouponDiscountAmt;
  target.totalPointRefundAmt += sliceAmount.pointUseAmt;
}

// 반품 사유 목록에서 현재 선택된 사유 1건을 찾습니다.
function resolveAdminOrderReturnReasonItem(
  reasonList: AdminOrderReturnReasonItem[],
  reasonCd: string,
): AdminOrderReturnReasonItem | null {
  return reasonList.find((reasonItem) => reasonItem.cd === reasonCd) ?? null;
}

// 현재 선택된 반품 사유가 상세 입력을 요구하는지 반환합니다.
function isAdminOrderReturnReasonDetailRequired(reasonItem: AdminOrderReturnReasonItem | null): boolean {
  return (reasonItem?.cdNm ?? '').includes('기타');
}

// 관리자 반품 사유 입력 완료 여부를 검증합니다.
function resolveAdminOrderReturnReasonValidationMessage(
  selectedItemCount: number,
  reasonCd: string,
  reasonDetail: string,
  reasonList: AdminOrderReturnReasonItem[],
): string {
  if (selectedItemCount < 1) {
    return '반품할 상품을 선택해주세요.';
  }

  const trimmedReasonCd = reasonCd.trim();
  if (trimmedReasonCd === '') {
    return '사유를 선택하시면 환불 예정 금액이 보여집니다.';
  }

  const selectedReasonItem = resolveAdminOrderReturnReasonItem(reasonList, trimmedReasonCd);
  if (!selectedReasonItem) {
    return '사유를 선택하시면 환불 예정 금액이 보여집니다.';
  }

  if (isAdminOrderReturnReasonDetailRequired(selectedReasonItem) && reasonDetail.trim() === '') {
    return '기타 사유를 입력해주세요.';
  }

  return '';
}

// 현재 선택 사유가 회사 귀책인지 반환합니다.
function isAdminOrderCompanyFaultReason(reasonCd: string): boolean {
  return reasonCd.trim().startsWith(COMPANY_FAULT_REASON_PREFIX);
}

// 고객 귀책 반품일 때 배송비 차감 금액을 계산합니다.
function resolveAdminOrderReturnShippingDeductionAmt(
  siteInfo: AdminOrderReturnSiteInfo,
  returnFeeContext: AdminOrderReturnFeeContext,
  beforeShippingExpectedRefundAmt: number,
  hasCompanyFaultReason: boolean,
): number {
  const siteDeliveryFee = normalizeNonNegativeInt(siteInfo.deliveryFee);
  const siteDeliveryFeeLimit = normalizeNonNegativeInt(siteInfo.deliveryFeeLimit);
  if (siteDeliveryFee < 1 || hasCompanyFaultReason) {
    return 0;
  }

  // 유료배송 주문의 고객 귀책 반품은 회수비용 1회만 차감합니다.
  if (!returnFeeContext.originalFreeDeliveryYn) {
    return siteDeliveryFee;
  }

  // 회사 귀책 이력이나 기존 고객 귀책 배송비 차감 이력이 있으면 원배송비 재청구 없이 회수비용만 차감합니다.
  if (
    returnFeeContext.hasPriorCompanyFaultReturnOrExchange ||
    returnFeeContext.hasPriorCustomerFaultReturnDeduction
  ) {
    return siteDeliveryFee;
  }

  // 무료배송 주문은 반품 후 잔여 결제금액이 기준 미만일 때만 왕복 배송비를 차감합니다.
  const remainingFinalPayAmtAfterReturn =
    normalizeNonNegativeInt(returnFeeContext.currentRemainingFinalPayAmt) - beforeShippingExpectedRefundAmt;
  return remainingFinalPayAmtAfterReturn < siteDeliveryFeeLimit ? siteDeliveryFee * 2 : siteDeliveryFee;
}

// 관리자 반품신청 가능 상품인지 반환합니다.
export function isAdminOrderReturnable(item: AdminOrderReturnDetailItem): boolean {
  return (
    item.ordDtlStatCd === ADMIN_ORDER_DETAIL_DELIVERY_COMPLETED_STATUS &&
    item.returnApplyableYn &&
    resolveAdminOrderReturnableQty(item) > 0
  );
}

// 관리자 반품 수량 입력값을 허용 범위 안으로 보정합니다.
export function clampAdminOrderReturnQty(item: AdminOrderReturnDetailItem, qty: number): number {
  const maxQty = resolveAdminOrderReturnableQty(item);
  if (maxQty < 1) {
    return 0;
  }
  if (!Number.isFinite(qty)) {
    return 1;
  }
  return Math.min(Math.max(Math.floor(qty), 1), maxQty);
}

// 현재 상품의 반품 선택 상태를 기본값과 함께 안전하게 반환합니다.
export function resolveAdminOrderReturnSelectionItem(
  selectionMap: AdminOrderReturnSelectionMap,
  item: AdminOrderReturnDetailItem,
): AdminOrderReturnSelectionItem {
  const resolved = selectionMap[item.ordDtlNo];
  if (!resolved) {
    return { selected: false, returnQty: 0 };
  }
  return {
    selected: resolved.selected,
    returnQty: resolved.selected ? clampAdminOrderReturnQty(item, resolved.returnQty) : 0,
  };
}

// 선택된 주문상세번호 목록 기준 초기 반품 선택 상태 맵을 생성합니다.
export function createInitialAdminOrderReturnSelectionMap(
  detailList: AdminOrderReturnDetailItem[],
  selectedOrdDtlNoList: number[],
): AdminOrderReturnSelectionMap {
  const selectedOrdDtlNoSet = new Set(selectedOrdDtlNoList);
  const result: AdminOrderReturnSelectionMap = {};

  // 전달받은 주문상세번호 중 반품 가능한 항목만 기본 선택합니다.
  for (const detailItem of detailList) {
    const selected = selectedOrdDtlNoSet.has(detailItem.ordDtlNo) && isAdminOrderReturnable(detailItem);
    result[detailItem.ordDtlNo] = {
      selected,
      returnQty: selected ? clampAdminOrderReturnQty(detailItem, detailItem.cancelableQty) : 0,
    };
  }

  return result;
}

// 관리자 반품 예정 금액 계산 결과를 생성합니다.
export function buildAdminOrderReturnPreviewResult(
  order: AdminOrderReturnOrderGroup | null,
  amountSummary: AdminOrderReturnAmountSummary,
  siteInfo: AdminOrderReturnSiteInfo,
  returnFeeContext: AdminOrderReturnFeeContext,
  selectionMap: AdminOrderReturnSelectionMap,
  reasonCd: string,
  reasonDetail: string,
  reasonList: AdminOrderReturnReasonItem[],
): AdminOrderReturnPreviewResult {
  const returnPreviewSummary = createEmptyAdminOrderReturnPreviewSummary();

  // 주문 정보가 없으면 빈 결과를 반환합니다.
  if (!order) {
    return {
      returnPreviewSummary,
      isFullReturn: false,
      selectedItemCount: 0,
      selectedQtyCount: 0,
      cashRefundAmt: 0,
      canSubmit: false,
      submitBlockMessage: '주문 정보를 확인해주세요.',
      previewVisible: false,
    };
  }

  let activeItemCount = 0;
  let fullyReturnedItemCount = 0;
  let selectedItemCount = 0;
  let selectedQtyCount = 0;

  // 주문 전체를 기준으로 반품 후 남을 상품 수와 환급 금액을 계산합니다.
  for (const detailItem of order.detailList) {
    const currentRemainingQty = resolveAdminOrderReturnableQty(detailItem);
    if (currentRemainingQty < 1) {
      continue;
    }

    activeItemCount += 1;
    const selectionItem = resolveAdminOrderReturnSelectionItem(selectionMap, detailItem);
    const returnQty = selectionItem.selected ? selectionItem.returnQty : 0;
    const remainingQty = Math.max(currentRemainingQty - returnQty, 0);

    if (returnQty > 0) {
      selectedItemCount += 1;
      selectedQtyCount += returnQty;
      accumulateAdminOrderReturnPreviewSummary(
        returnPreviewSummary,
        buildAdminOrderReturnSliceAmount(detailItem, returnQty, currentRemainingQty),
      );
      if (remainingQty < 1) {
        fullyReturnedItemCount += 1;
      }
    }
  }

  // 선택 상품과 반품 사유 입력이 완료되지 않았으면 예정 금액 계산을 보류합니다.
  const reasonValidationMessage = resolveAdminOrderReturnReasonValidationMessage(
    selectedItemCount,
    reasonCd,
    reasonDetail,
    reasonList,
  );
  const isFullReturn = activeItemCount > 0 && selectedItemCount > 0 && fullyReturnedItemCount === activeItemCount;
  if (reasonValidationMessage !== '') {
    return {
      returnPreviewSummary,
      isFullReturn,
      selectedItemCount,
      selectedQtyCount,
      cashRefundAmt: 0,
      canSubmit: false,
      submitBlockMessage: reasonValidationMessage,
      previewVisible: false,
    };
  }

  // 배송비 조정 전 환불예정금액과 배송비 차감/환급 금액을 계산합니다.
  const hasCompanyFaultReason = isAdminOrderCompanyFaultReason(reasonCd);
  const beforeShippingExpectedRefundAmt =
    returnPreviewSummary.totalOrderAmt -
    (
      returnPreviewSummary.totalGoodsCouponDiscountAmt +
      returnPreviewSummary.totalCartCouponDiscountAmt +
      returnPreviewSummary.totalPointRefundAmt
    );
  const shippingDeductionAmt = resolveAdminOrderReturnShippingDeductionAmt(
    siteInfo,
    returnFeeContext,
    beforeShippingExpectedRefundAmt,
    hasCompanyFaultReason,
  );
  const deliveryCouponRefundAmt = isFullReturn ? normalizeNonNegativeInt(amountSummary.deliveryCouponDiscountAmt) : 0;
  const paidDeliveryFeeRefundAmt = isFullReturn ? normalizeNonNegativeInt(returnFeeContext.originalPaidDeliveryAmt) : 0;

  // 화면 표시용 최종 반품 예정 금액 필드를 완성합니다.
  returnPreviewSummary.deliveryCouponRefundAmt = deliveryCouponRefundAmt;
  returnPreviewSummary.paidGoodsAmt = returnPreviewSummary.totalOrderAmt;
  returnPreviewSummary.benefitAmt =
    returnPreviewSummary.totalGoodsCouponDiscountAmt +
    returnPreviewSummary.totalCartCouponDiscountAmt +
    returnPreviewSummary.totalPointRefundAmt;
  returnPreviewSummary.shippingAdjustmentAmt = paidDeliveryFeeRefundAmt - shippingDeductionAmt;
  returnPreviewSummary.expectedRefundAmt =
    returnPreviewSummary.paidGoodsAmt -
    returnPreviewSummary.benefitAmt +
    returnPreviewSummary.shippingAdjustmentAmt;

  const cashRefundAmt = returnPreviewSummary.expectedRefundAmt;
  const submitBlockMessage =
    cashRefundAmt < 0 ? '배송비 차감 후 반품 예정 금액이 0원 미만이라 신청할 수 없습니다.' : '';

  return {
    returnPreviewSummary,
    isFullReturn,
    selectedItemCount,
    selectedQtyCount,
    cashRefundAmt,
    canSubmit: submitBlockMessage === '',
    submitBlockMessage,
    previewVisible: true,
  };
}
