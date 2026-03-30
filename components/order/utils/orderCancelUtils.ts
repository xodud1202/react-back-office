import type {
  AdminOrderCancelAmountSummary,
  AdminOrderCancelDetailItem,
  AdminOrderCancelPreviewAmount,
  AdminOrderCancelSiteInfo,
} from '@/components/order/types';

// 무통장입금대기 상태 코드입니다.
const WAITING_DEPOSIT_STATUS = 'ORD_DTL_STAT_01';
// 결제완료 상태 코드입니다.
const PAYMENT_DONE_STATUS = 'ORD_DTL_STAT_02';
// 상품준비중 상태 코드입니다.
const PREPARING_STATUS = 'ORD_DTL_STAT_03';

// 취소 상품별 선택 상태를 정의합니다.
export interface AdminOrderCancelSelectionItem {
  // 선택 여부입니다.
  selected: boolean;
  // 취소 수량입니다.
  cancelQty: number;
}

// 주문상세번호 키 기반 선택 상태 맵을 정의합니다.
export type AdminOrderCancelSelectionMap = Record<number, AdminOrderCancelSelectionItem>;

// 취소 미리보기 요약을 정의합니다.
export interface AdminOrderCancelPreviewSummary {
  totalSupplyAmt: number;
  totalOrderAmt: number;
  totalGoodsDiscountAmt: number;
  totalGoodsCouponDiscountAmt: number;
  totalCartCouponDiscountAmt: number;
  totalPointRefundAmt: number;
  deliveryCouponRefundAmt: number;
  paidGoodsAmt: number;
  benefitAmt: number;
  shippingAdjustmentAmt: number;
  expectedRefundAmt: number;
}

// 취소 미리보기 결과를 정의합니다.
export interface AdminOrderCancelPreviewResult {
  // 취소 예정 금액 요약입니다.
  cancelPreviewSummary: AdminOrderCancelPreviewSummary;
  // 전체취소 여부입니다.
  isFullCancel: boolean;
  // 선택된 상품 건수입니다.
  selectedItemCount: number;
  // 선택된 총 취소 수량입니다.
  selectedQtyCount: number;
  // 현금 환불 예정 금액입니다.
  cashRefundAmt: number;
  // 취소 신청 가능 여부입니다.
  canSubmit: boolean;
  // 취소 불가 사유입니다.
  submitBlockMessage: string;
}

// 숫자를 0 이상 정수로 보정합니다.
function normalizeNonNegativeInt(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(Math.floor(value), 0);
}

// 상품이 전체취소 전용 상태인지 반환합니다.
export function isAdminOrderFullCancelOnly(item: AdminOrderCancelDetailItem): boolean {
  return item.ordDtlStatCd === WAITING_DEPOSIT_STATUS && normalizeNonNegativeInt(item.cancelableQty) > 0;
}

// 상품이 부분취소 선택 가능한 상태인지 반환합니다.
export function isAdminOrderPartialCancelable(item: AdminOrderCancelDetailItem): boolean {
  return (item.ordDtlStatCd === PAYMENT_DONE_STATUS || item.ordDtlStatCd === PREPARING_STATUS)
    && normalizeNonNegativeInt(item.cancelableQty) > 0;
}

// 상품이 취소 가능한 활성 상태인지 반환합니다.
export function isAdminOrderActiveDetail(item: AdminOrderCancelDetailItem): boolean {
  return normalizeNonNegativeInt(item.cancelableQty) > 0;
}

// 취소 수량 입력값을 취소 가능 수량 범위로 보정합니다.
export function clampAdminOrderCancelQty(item: AdminOrderCancelDetailItem, qty: number): number {
  const maxQty = normalizeNonNegativeInt(item.cancelableQty);
  if (maxQty < 1) return 0;
  if (!Number.isFinite(qty)) return 1;
  return Math.min(Math.max(Math.floor(qty), 1), maxQty);
}

// 현재 선택 상태 아이템을 안전하게 반환합니다.
export function resolveAdminOrderCancelSelectionItem(
  selectionMap: AdminOrderCancelSelectionMap,
  item: AdminOrderCancelDetailItem,
): AdminOrderCancelSelectionItem {
  const resolved = selectionMap[item.ordDtlNo];
  if (!resolved) return { selected: false, cancelQty: 0 };
  return {
    selected: resolved.selected,
    cancelQty: resolved.selected ? clampAdminOrderCancelQty(item, resolved.cancelQty) : 0,
  };
}

// 전체취소 모드의 초기 선택 맵을 생성합니다.
function createFullCancelSelectionMap(detailList: AdminOrderCancelDetailItem[]): AdminOrderCancelSelectionMap {
  const map: AdminOrderCancelSelectionMap = {};
  for (const item of detailList) {
    const qty = normalizeNonNegativeInt(item.cancelableQty);
    map[item.ordDtlNo] = { selected: qty > 0, cancelQty: qty };
  }
  return map;
}

// 부분취소 모드의 초기 선택 맵을 생성합니다.
function createPartialCancelSelectionMap(detailList: AdminOrderCancelDetailItem[]): AdminOrderCancelSelectionMap {
  const map: AdminOrderCancelSelectionMap = {};
  for (const item of detailList) {
    map[item.ordDtlNo] = { selected: false, cancelQty: 0 };
  }
  return map;
}

// 취소 모드에 따른 초기 선택 맵을 생성합니다.
export function createInitialAdminOrderCancelSelectionMap(
  detailList: AdminOrderCancelDetailItem[],
  isFullCancel: boolean,
): AdminOrderCancelSelectionMap {
  // 취소 모드에 따라 전체/부분취소 초기 선택 상태를 생성합니다.
  return isFullCancel
    ? createFullCancelSelectionMap(detailList)
    : createPartialCancelSelectionMap(detailList);
}

// 누적 배분 금액을 원주문 수량 기준으로 계산합니다.
function resolveCumulativeAllocatedAmt(totalAmt: number, totalQty: number, appliedQty: number): number {
  const safeTotalAmt = normalizeNonNegativeInt(totalAmt);
  const safeTotal = Math.max(totalQty, 0);
  const safeApplied = Math.max(Math.min(appliedQty, safeTotal), 0);
  if (safeTotalAmt < 1 || safeTotal < 1 || safeApplied < 1) return 0;
  if (safeApplied >= safeTotal) return safeTotalAmt;
  return Math.floor((safeTotalAmt * safeApplied) / safeTotal);
}

interface SliceAmount {
  supplyAmt: number;
  orderAmt: number;
  goodsDiscountAmt: number;
  goodsCouponDiscountAmt: number;
  cartCouponDiscountAmt: number;
  pointUseAmt: number;
}

// 취소 수량 기준 행 금액/할인 배분값을 계산합니다.
// DB의 쿠폰/포인트 할인금액은 이전 취소분이 이미 차감된 현재 잔여 금액이므로, RMN_QTY(현재 잔여 수량) 기준으로 비례 계산합니다.
function buildSliceAmount(
  item: AdminOrderCancelDetailItem,
  quantity: number,
  currentRemainingQty: number,
): SliceAmount {
  const safeRemainingQty = normalizeNonNegativeInt(currentRemainingQty);
  const resolvedQty = Math.min(Math.max(quantity, 0), safeRemainingQty);
  const unitOrderAmt = normalizeNonNegativeInt(item.saleAmt) + normalizeNonNegativeInt(item.addAmt);
  const supplyAmt = normalizeNonNegativeInt(item.supplyAmt) * resolvedQty;
  const orderAmt = unitOrderAmt * resolvedQty;
  const goodsDiscountAmt = Math.max(supplyAmt - orderAmt, 0);

  // 현재 잔여 수량 대비 취소 수량 비율로 쿠폰/포인트 환급 금액을 계산합니다.
  const goodsCouponDiscountAmt = resolveCumulativeAllocatedAmt(item.goodsCouponDiscountAmt, safeRemainingQty, resolvedQty);
  const cartCouponDiscountAmt = resolveCumulativeAllocatedAmt(item.cartCouponDiscountAmt, safeRemainingQty, resolvedQty);
  const pointUseAmt = resolveCumulativeAllocatedAmt(item.pointUseAmt, safeRemainingQty, resolvedQty);

  return { supplyAmt, orderAmt, goodsDiscountAmt, goodsCouponDiscountAmt, cartCouponDiscountAmt, pointUseAmt };
}

// 취소 미리보기 요약 초기 객체를 생성합니다.
function createEmptyPreviewSummary(): AdminOrderCancelPreviewSummary {
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

// 관리자 주문취소 미리보기 결과를 계산합니다.
export function buildAdminOrderCancelPreviewResult(
  order: { ordNo: string; detailList: AdminOrderCancelDetailItem[] } | null,
  amountSummary: AdminOrderCancelAmountSummary,
  siteInfo: AdminOrderCancelSiteInfo,
  selectionMap: AdminOrderCancelSelectionMap,
): AdminOrderCancelPreviewResult {
  const cancelPreviewSummary = createEmptyPreviewSummary();

  // 주문 정보가 없으면 빈 결과를 반환합니다.
  if (!order) {
    return {
      cancelPreviewSummary,
      isFullCancel: false,
      selectedItemCount: 0,
      selectedQtyCount: 0,
      cashRefundAmt: 0,
      canSubmit: false,
      submitBlockMessage: '주문 정보를 확인해주세요.',
    };
  }

  let selectedItemCount = 0;
  let selectedQtyCount = 0;
  let activeItemCount = 0;
  let activeOrderAmt = 0;
  let remainingOrderAmtAfterCancel = 0;

  // 각 행을 취소/잔여 수량으로 분리하여 금액 요약을 계산합니다.
  for (const item of order.detailList) {
    const currentRemainingQty = normalizeNonNegativeInt(item.cancelableQty);
    if (currentRemainingQty < 1) continue;

    activeItemCount += 1;
    const unitOrderAmt = normalizeNonNegativeInt(item.saleAmt) + normalizeNonNegativeInt(item.addAmt);
    activeOrderAmt += unitOrderAmt * currentRemainingQty;

    const selectionItem = resolveAdminOrderCancelSelectionItem(selectionMap, item);
    const cancelQty = selectionItem.selected ? selectionItem.cancelQty : 0;
    const remainingQty = Math.max(currentRemainingQty - cancelQty, 0);
    remainingOrderAmtAfterCancel += unitOrderAmt * remainingQty;

    if (cancelQty > 0) {
      selectedItemCount += 1;
      selectedQtyCount += cancelQty;
      // 취소 수량 기준 금액을 누적합니다. currentRemainingQty를 기준으로 쿠폰/포인트 비례 계산합니다.
      const slice = buildSliceAmount(item, cancelQty, currentRemainingQty);
      cancelPreviewSummary.totalSupplyAmt += slice.supplyAmt;
      cancelPreviewSummary.totalOrderAmt += slice.orderAmt;
      cancelPreviewSummary.totalGoodsDiscountAmt += slice.goodsDiscountAmt;
      cancelPreviewSummary.totalGoodsCouponDiscountAmt += slice.goodsCouponDiscountAmt;
      cancelPreviewSummary.totalCartCouponDiscountAmt += slice.cartCouponDiscountAmt;
      cancelPreviewSummary.totalPointRefundAmt += slice.pointUseAmt;
    }
  }

  // 전체취소 여부와 배송비 처리를 계산합니다.
  const isFullCancel = activeItemCount > 0 && remainingOrderAmtAfterCancel === 0;
  const originalBaseDeliveryFee = normalizeNonNegativeInt(amountSummary.deliveryFeeAmt);
  const originalDeliveryCouponAmt = normalizeNonNegativeInt(amountSummary.deliveryCouponDiscountAmt);
  const wasFreeShippingByLimit = originalBaseDeliveryFee === 0 && activeOrderAmt > 0;
  const siteDeliveryFee = normalizeNonNegativeInt(siteInfo.deliveryFee);
  const siteDeliveryFeeLimit = normalizeNonNegativeInt(siteInfo.deliveryFeeLimit);

  // 전체취소이면 배송비/배송비쿠폰을 환급하고, 부분취소이면 기준 미만 시 배송비를 차감합니다.
  const deliveryCouponRefundAmt = isFullCancel ? originalDeliveryCouponAmt : 0;
  const paidDeliveryFeeRefundAmt = isFullCancel ? Math.max(originalBaseDeliveryFee - originalDeliveryCouponAmt, 0) : 0;
  const shippingDeductionAmt =
    !isFullCancel
    && selectedItemCount > 0
    && wasFreeShippingByLimit
    && remainingOrderAmtAfterCancel > 0
    && remainingOrderAmtAfterCancel < siteDeliveryFeeLimit
      ? siteDeliveryFee
      : 0;

  cancelPreviewSummary.deliveryCouponRefundAmt = deliveryCouponRefundAmt;
  cancelPreviewSummary.paidGoodsAmt = cancelPreviewSummary.totalOrderAmt;
  cancelPreviewSummary.benefitAmt =
    cancelPreviewSummary.totalGoodsCouponDiscountAmt
    + cancelPreviewSummary.totalCartCouponDiscountAmt
    + cancelPreviewSummary.totalPointRefundAmt;
  cancelPreviewSummary.shippingAdjustmentAmt = paidDeliveryFeeRefundAmt - shippingDeductionAmt;
  cancelPreviewSummary.expectedRefundAmt =
    cancelPreviewSummary.paidGoodsAmt - cancelPreviewSummary.benefitAmt + cancelPreviewSummary.shippingAdjustmentAmt;

  const cashRefundAmt = cancelPreviewSummary.expectedRefundAmt;

  // 취소 신청 가능 여부와 차단 메시지를 계산합니다.
  let submitBlockMessage = '';
  if (selectedItemCount < 1 || selectedQtyCount < 1) {
    submitBlockMessage = '취소할 상품을 선택해주세요.';
  } else if (cashRefundAmt < 0) {
    submitBlockMessage = '배송비 차감 후 취소 예정 금액이 0원 미만이라 신청할 수 없습니다.';
  }

  return {
    cancelPreviewSummary,
    isFullCancel,
    selectedItemCount,
    selectedQtyCount,
    cashRefundAmt,
    canSubmit: submitBlockMessage === '',
    submitBlockMessage,
  };
}

// AdminOrderCancelPreviewSummary를 API 요청 형식으로 변환합니다.
export function toAdminOrderCancelPreviewAmount(
  summary: AdminOrderCancelPreviewSummary,
): AdminOrderCancelPreviewAmount {
  return {
    expectedRefundAmt: summary.expectedRefundAmt,
    paidGoodsAmt: summary.paidGoodsAmt,
    benefitAmt: summary.benefitAmt,
    shippingAdjustmentAmt: summary.shippingAdjustmentAmt,
    totalPointRefundAmt: summary.totalPointRefundAmt,
    deliveryCouponRefundAmt: summary.deliveryCouponRefundAmt,
  };
}
