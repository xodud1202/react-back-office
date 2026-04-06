import type { AdminOrderReturnReasonItem } from '@/components/order/types';

// 반품 회수 관리에서 검색 가능한 반품 상세 상태 코드입니다.
export type OrderReturnManageStatusCode = 'CHG_DTL_STAT_11' | 'CHG_DTL_STAT_12' | 'CHG_DTL_STAT_13';

// 반품 회수 관리 검색 조건을 정의합니다.
export interface OrderReturnManageSearchParams {
  // 반품 상세 상태 코드입니다.
  chgDtlStatCd: OrderReturnManageStatusCode;
}

// 반품 회수 관리 목록 행 정보를 정의합니다.
export interface OrderReturnManageRow {
  // 클레임번호입니다.
  clmNo: string;
  // 주문번호입니다.
  ordNo: string;
  // 주문상세번호입니다.
  ordDtlNo: number;
  // 상품코드입니다.
  goodsId: string;
  // 사이즈코드입니다.
  sizeId: string;
  // 수량입니다.
  qty: number;
  // 상품명입니다.
  goodsNm: string;
  // 회수 택배사 코드입니다.
  delvCompCd: string;
  // 회수 택배사명입니다.
  delvCompNm: string;
  // 회수 송장번호입니다.
  invoiceNo: string;
  // 클레임 신청 일시입니다.
  chgDt: string;
  // 반품 상세 상태 코드입니다.
  chgDtlStatCd: OrderReturnManageStatusCode;
  // 반품 상세 상태명입니다.
  chgDtlStatNm: string;
}

// 반품 회수 관리 그리드 병합 표시용 행 정보를 정의합니다.
export interface OrderReturnManageGridRow extends OrderReturnManageRow {
  // 같은 클레임번호 묶음의 첫 행 여부입니다.
  claimGroupFirstRowYn: boolean;
  // 같은 클레임번호 묶음의 병합 행 수입니다.
  claimGroupRowSpan: number;
  // 병합 셀에 표시할 클레임번호입니다.
  clmNoDisplay: string;
}

// 반품 회수 관리 목록 응답 구조를 정의합니다.
export interface OrderReturnManageListResponse {
  // 반품 회수 관리 목록입니다.
  list: OrderReturnManageRow[];
  // 전체 클레임 건수입니다.
  totalCount: number;
  // 현재 페이지입니다.
  page: number;
  // 페이지 크기입니다.
  pageSize: number;
}

// 반품 회수 신청 저장 대상 1건을 정의합니다.
export interface AdminOrderReturnPickupRequestItem {
  // 클레임번호입니다.
  clmNo: string;
  // 회수 택배사 코드입니다.
  delvCompCd: string;
  // 회수 송장번호입니다.
  invoiceNo: string;
}

// 반품 회수 신청 저장 요청을 정의합니다.
export interface AdminOrderReturnPickupRequest {
  // 처리 대상 클레임 목록입니다.
  itemList: AdminOrderReturnPickupRequestItem[];
}

// 반품 회수중 처리 대상 1건을 정의합니다.
export interface AdminOrderReturnPickupStartItem {
  // 클레임번호입니다.
  clmNo: string;
}

// 반품 회수중 처리 요청을 정의합니다.
export interface AdminOrderReturnPickupStartRequest {
  // 처리 대상 클레임 목록입니다.
  itemList: AdminOrderReturnPickupStartItem[];
}

// 반품 회수 관리 상태 변경 응답을 정의합니다.
export interface AdminOrderReturnManageStatusResponse {
  // 변경된 클레임 건수입니다.
  updatedCount: number;
}

// 회수완료 검수 팝업의 클레임 기본 정보를 정의합니다.
export interface OrderReturnManagePickupCompleteClaim {
  // 클레임번호입니다.
  clmNo: string;
  // 주문번호입니다.
  ordNo: string;
  // 클레임 신청 일시입니다.
  chgDt: string;
}

// 회수완료 검수 팝업의 상품 상세 행 정보를 정의합니다.
export interface OrderReturnManagePickupCompleteDetail {
  // 주문상세번호입니다.
  ordDtlNo: number;
  // 상품코드입니다.
  goodsId: string;
  // 상품명입니다.
  goodsNm: string;
  // 사이즈코드입니다.
  sizeId: string;
  // 반품수량입니다.
  qty: number;
  // 판매가입니다.
  saleAmt: number;
  // 추가금액입니다.
  addAmt: number;
  // 상품쿠폰 차감 금액입니다.
  goodsCouponDiscountAmt: number;
  // 장바구니쿠폰 차감 금액입니다.
  cartCouponDiscountAmt: number;
  // 포인트 환급 예정 금액입니다.
  pointDcAmt: number;
  // 저장된 반품 사유 코드입니다.
  chgReasonCd: string | null;
  // 저장된 반품 사유 상세입니다.
  chgReasonDtl: string | null;
}

// 회수완료 검수 팝업의 고정 금액 요약 정보를 정의합니다.
export interface OrderReturnManagePickupCompletePreviewAmount {
  // 총 상품가격입니다.
  totalSupplyAmt: number;
  // 총 상품할인 금액입니다.
  totalGoodsDiscountAmt: number;
  // 총 상품쿠폰 차감 금액입니다.
  totalGoodsCouponDiscountAmt: number;
  // 총 장바구니쿠폰 차감 금액입니다.
  totalCartCouponDiscountAmt: number;
  // 배송비쿠폰 환급 금액입니다.
  deliveryCouponRefundAmt: number;
  // 총 포인트 환급 금액입니다.
  totalPointRefundAmt: number;
  // 실결제 상품가입니다.
  paidGoodsAmt: number;
  // 환급 혜택 합계입니다.
  benefitAmt: number;
}

// 회수완료 저장 요청에 포함할 반품 예정 금액 요약입니다.
export interface OrderReturnManagePickupCompleteSavePreviewAmount {
  // 실환불 기준 반품 예정 금액입니다.
  expectedRefundAmt: number;
  // 실결제 상품가입니다.
  paidGoodsAmt: number;
  // 환급 혜택 합계입니다.
  benefitAmt: number;
  // 배송비 조정 금액입니다.
  shippingAdjustmentAmt: number;
  // 포인트 환급 금액입니다.
  totalPointRefundAmt: number;
  // 배송비쿠폰 환급 금액입니다.
  deliveryCouponRefundAmt: number;
}

// 회수완료 검수 팝업 화면 응답을 정의합니다.
export interface OrderReturnManagePickupCompletePageResponse {
  // 클레임 기본 정보입니다.
  claim: OrderReturnManagePickupCompleteClaim;
  // 반품 상품 목록입니다.
  detailList: OrderReturnManagePickupCompleteDetail[];
  // 반품 사유 목록입니다.
  reasonList: AdminOrderReturnReasonItem[];
  // 공통 기본 반품 사유 코드입니다.
  defaultReasonCd: string | null;
  // 공통 기본 반품 사유 상세입니다.
  defaultReasonDetail: string | null;
  // 상품별 저장 사유가 서로 다른지 여부입니다.
  mixedReasonYn: boolean;
  // 고정 금액 요약입니다.
  previewAmount: OrderReturnManagePickupCompletePreviewAmount;
  // 회사 귀책 선택 시 배송비 조정 금액입니다.
  companyFaultShippingAdjustmentAmt: number;
  // 고객 귀책 선택 시 배송비 조정 금액입니다.
  customerFaultShippingAdjustmentAmt: number;
}

// 회수완료 저장 요청을 정의합니다.
export interface OrderReturnManagePickupCompleteSaveRequest {
  // 클레임번호입니다.
  clmNo: string;
  // 공통 반품 사유 코드입니다.
  reasonCd: string;
  // 공통 반품 사유 상세입니다.
  reasonDetail: string;
  // 화면에서 계산한 반품 예정 금액 요약입니다.
  previewAmount: OrderReturnManagePickupCompleteSavePreviewAmount;
}

// 회수완료 저장 응답을 정의합니다.
export interface OrderReturnManagePickupCompleteSaveResponse {
  // 클레임번호입니다.
  clmNo: string;
  // 주문번호입니다.
  ordNo: string;
  // 환불 결제번호입니다.
  refundPayNo: number | null;
  // 환불된 현금 금액입니다.
  refundedCashAmt: number;
  // 복구된 포인트 금액입니다.
  restoredPointAmt: number;
  // 재지급된 포인트 금액입니다.
  reissuedPointAmt: number;
}
