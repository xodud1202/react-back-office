import type { OrderReturnManagePickupCompletePageResponse } from '@/components/order/returnManageTypes';

const COMPANY_FAULT_REASON_PREFIX = 'R_2';

export interface OrderReturnManagePickupCompletePreviewResult {
  // 배송비 조정 금액입니다.
  shippingAdjustmentAmt: number;
  // 반품 예정 금액입니다.
  expectedRefundAmt: number;
  // 반품 예정 금액 노출 여부입니다.
  previewVisible: boolean;
  // 진행 가능 여부입니다.
  canSubmit: boolean;
  // 안내 메시지입니다.
  submitBlockMessage: string;
}

// 숫자 값을 안전한 정수로 보정합니다.
const normalizeInteger = (value: number | null | undefined): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0;
  }
  return Math.trunc(value);
};

// 반품 사유 목록에서 선택된 사유를 조회합니다.
const findOrderReturnManagePickupCompleteReason = (
  pageData: OrderReturnManagePickupCompletePageResponse,
  reasonCd: string,
) => {
  return pageData.reasonList.find((item) => item.cd === reasonCd) ?? null;
};

// 현재 선택된 반품 사유가 상세 입력을 요구하는지 반환합니다.
const isOrderReturnManagePickupCompleteReasonDetailRequired = (
  pageData: OrderReturnManagePickupCompletePageResponse,
  reasonCd: string,
): boolean => {
  const selectedReason = findOrderReturnManagePickupCompleteReason(pageData, reasonCd);
  return (selectedReason?.cdNm ?? '').includes('기타');
};

// 공통 반품 사유 입력값을 검증합니다.
const resolveOrderReturnManagePickupCompleteReasonValidationMessage = (
  pageData: OrderReturnManagePickupCompletePageResponse,
  reasonCd: string,
  reasonDetail: string,
): string => {
  const trimmedReasonCd = reasonCd.trim();
  if (trimmedReasonCd === '') {
    return '사유를 선택하시면 반품 예정 금액이 보여집니다.';
  }
  if (!findOrderReturnManagePickupCompleteReason(pageData, trimmedReasonCd)) {
    return '사유를 선택하시면 반품 예정 금액이 보여집니다.';
  }
  if (isOrderReturnManagePickupCompleteReasonDetailRequired(pageData, trimmedReasonCd) && reasonDetail.trim() === '') {
    return '기타 사유를 입력해주세요.';
  }
  return '';
};

// 현재 선택된 반품 사유가 회사 귀책인지 반환합니다.
const isOrderReturnManagePickupCompleteCompanyFaultReason = (reasonCd: string): boolean => {
  return reasonCd.trim().startsWith(COMPANY_FAULT_REASON_PREFIX);
};

// 회수완료 검수 팝업의 반품 예정 금액 계산 결과를 생성합니다.
export const buildOrderReturnManagePickupCompletePreviewResult = (
  pageData: OrderReturnManagePickupCompletePageResponse | null,
  reasonCd: string,
  reasonDetail: string,
): OrderReturnManagePickupCompletePreviewResult => {
  if (!pageData) {
    return {
      shippingAdjustmentAmt: 0,
      expectedRefundAmt: 0,
      previewVisible: false,
      canSubmit: false,
      submitBlockMessage: '반품 정보를 확인해주세요.',
    };
  }

  const reasonValidationMessage = resolveOrderReturnManagePickupCompleteReasonValidationMessage(
    pageData,
    reasonCd,
    reasonDetail,
  );
  if (reasonValidationMessage !== '') {
    return {
      shippingAdjustmentAmt: 0,
      expectedRefundAmt: 0,
      previewVisible: false,
      canSubmit: false,
      submitBlockMessage: reasonValidationMessage,
    };
  }

  const shippingAdjustmentAmt = isOrderReturnManagePickupCompleteCompanyFaultReason(reasonCd)
    ? normalizeInteger(pageData.companyFaultShippingAdjustmentAmt)
    : normalizeInteger(pageData.customerFaultShippingAdjustmentAmt);
  const expectedRefundAmt =
    normalizeInteger(pageData.previewAmount.paidGoodsAmt)
    - normalizeInteger(pageData.previewAmount.benefitAmt)
    + shippingAdjustmentAmt;
  const submitBlockMessage =
    expectedRefundAmt < 0 ? '배송비 차감 후 반품 예정 금액이 0원 미만이라 신청할 수 없습니다.' : '';

  return {
    shippingAdjustmentAmt,
    expectedRefundAmt,
    previewVisible: true,
    canSubmit: submitBlockMessage === '',
    submitBlockMessage,
  };
};
