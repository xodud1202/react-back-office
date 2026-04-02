import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef, IHeaderParams } from 'ag-grid-community';
import api from '@/utils/axios/axios';
import AdminFormTable from '@/components/common/AdminFormTable';
import type {
  AdminOrderAddressSearchItem,
  AdminOrderAddressSearchResponse,
  AdminOrderReturnDetailItem,
  AdminOrderReturnPageResponse,
  AdminOrderReturnPickupAddress,
  AdminOrderReturnRequest,
  AdminOrderReturnResponse,
} from '@/components/order/types';
import {
  buildAdminOrderReturnPreviewResult,
  clampAdminOrderReturnQty,
  createInitialAdminOrderReturnSelectionMap,
  isAdminOrderReturnable,
  resolveAdminOrderReturnSelectionItem,
  type AdminOrderReturnSelectionMap,
} from '@/components/order/utils/orderReturnUtils';

interface OrderReturnModalProps {
  // 모달 오픈 여부입니다.
  isOpen: boolean;
  // 조회할 주문번호입니다.
  ordNo: string;
  // 고객 휴대폰번호입니다.
  customerPhoneNumber?: string;
  // 주문 상세에서 선택한 주문상세번호 목록입니다.
  selectedOrdDtlNoList?: number[];
  // 모달 닫기 콜백입니다.
  onClose: () => void;
  // 저장 성공 콜백입니다.
  onSuccess: () => void;
}

// 주소 검색 목록 페이지 크기입니다.
const ADDRESS_SEARCH_PAGE_SIZE = 5;
// 클레임 주소명 최대 길이입니다.
const ORDER_CHANGE_ADDRESS_NAME_MAX_LENGTH = 20;
// 클레임 우편번호 최대 길이입니다.
const ORDER_CHANGE_ADDRESS_POST_NO_MAX_LENGTH = 10;
// 클레임 기본주소 최대 길이입니다.
const ORDER_CHANGE_ADDRESS_BASE_MAX_LENGTH = 100;
// 클레임 상세주소 최대 길이입니다.
const ORDER_CHANGE_ADDRESS_DETAIL_MAX_LENGTH = 100;

// 금액을 천 단위 구분 문자열로 변환합니다.
const formatAmount = (value: number): string => value.toLocaleString('ko-KR');

// 부호 포함 금액 문자열을 변환합니다.
const formatSignedAmount = (value: number): string => {
  if (value > 0) return `+${formatAmount(value)}`;
  if (value < 0) return `-${formatAmount(Math.abs(value))}`;
  return '0';
};

// 가운데 정렬 셀 스타일입니다.
const ADMIN_ORDER_RETURN_CENTER_CELL_STYLE = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center' as const,
};

// 우측 정렬 셀 스타일입니다.
const ADMIN_ORDER_RETURN_RIGHT_CELL_STYLE = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  textAlign: 'right' as const,
};

// 값이 비어 있으면 대체 문자열을 반환합니다.
const displayValue = (value?: string | null): string => {
  if (!value || value.trim() === '') {
    return '-';
  }
  return value;
};

// 반품 저장 API 오류 메시지를 안전하게 추출합니다.
const resolveOrderReturnActionErrorMessage = (error: unknown, fallbackMessage: string): string => {
  const errorResponse = error as { response?: { data?: { message?: string } } };
  const message = errorResponse.response?.data?.message;
  if (typeof message === 'string' && message.trim()) {
    return message;
  }
  return fallbackMessage;
};

interface AdminOrderReturnAmountItem {
  // 항목 키입니다.
  key: string;
  // 라벨입니다.
  label: string;
  // 표시 텍스트입니다.
  valueText: string;
  // 강조 여부입니다.
  isStrong?: boolean;
}

interface AdminOrderReturnAmountColumn {
  // 컬럼 키입니다.
  key: string;
  // 컬럼 제목입니다.
  title: string;
  // 컬럼 아이템 목록입니다.
  itemList: AdminOrderReturnAmountItem[];
}

interface AdminOrderReturnAmountTableProps {
  // 금액 컬럼 목록입니다.
  columnList: AdminOrderReturnAmountColumn[];
}

// 관리자 반품 금액 테이블 공통 UI를 렌더링합니다.
const AdminOrderReturnAmountTable = ({ columnList }: AdminOrderReturnAmountTableProps) => {
  return (
    <div className="admin-order-return-amount-table">
      {columnList.map((columnItem) => (
        <section key={columnItem.key} className="admin-order-return-amount-column">
          <h6 className="admin-order-return-amount-title">{columnItem.title}</h6>
          <div className="admin-order-return-amount-item-list">
            {columnItem.itemList.map((amountItem) => (
              <div key={amountItem.key} className="admin-order-return-amount-item">
                <span className="admin-order-return-amount-label">{amountItem.label}</span>
                <span
                  className={
                    amountItem.isStrong
                      ? 'admin-order-return-amount-value admin-order-return-amount-value-strong'
                      : 'admin-order-return-amount-value'
                  }
                >
                  {amountItem.valueText}
                </span>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

// 현재 주문 금액 컬럼 목록을 생성합니다.
const createCurrentAmountColumnList = (
  pageData: AdminOrderReturnPageResponse,
): AdminOrderReturnAmountColumn[] => {
  const totalBenefitAmt =
    pageData.amountSummary.totalGoodsCouponDiscountAmt +
    pageData.amountSummary.totalCartCouponDiscountAmt +
    pageData.amountSummary.totalPointUseAmt;
  return [
    {
      key: 'goodsPrice',
      title: '상품가격',
      itemList: [
        { key: 'totalSupplyAmt', label: '상품가격', valueText: `${formatAmount(pageData.amountSummary.totalSupplyAmt)}원` },
        { key: 'totalGoodsDiscountAmt', label: '상품할인', valueText: `${formatAmount(pageData.amountSummary.totalGoodsDiscountAmt)}원` },
      ],
    },
    {
      key: 'discountBenefit',
      title: '상품 할인혜택',
      itemList: [
        { key: 'totalGoodsCouponDiscountAmt', label: '상품쿠폰', valueText: `${formatAmount(pageData.amountSummary.totalGoodsCouponDiscountAmt)}원` },
        { key: 'totalCartCouponDiscountAmt', label: '장바구니쿠폰', valueText: `${formatAmount(pageData.amountSummary.totalCartCouponDiscountAmt)}원` },
        { key: 'totalPointUseAmt', label: '포인트', valueText: `${formatAmount(pageData.amountSummary.totalPointUseAmt)}원` },
      ],
    },
    {
      key: 'finalAmount',
      title: '최종금액',
      itemList: [
        { key: 'totalOrderAmt', label: '상품 판매가', valueText: `${formatAmount(pageData.amountSummary.totalOrderAmt)}원` },
        { key: 'totalBenefitAmt', label: '할인 총액', valueText: `${formatAmount(totalBenefitAmt)}원` },
        { key: 'deliveryFeeAmt', label: '배송비', valueText: `${formatAmount(pageData.amountSummary.deliveryFeeAmt)}원` },
        { key: 'finalPayAmt', label: '결제금액', valueText: `${formatAmount(pageData.amountSummary.finalPayAmt)}원`, isStrong: true },
      ],
    },
  ];
};

// 반품 예정 금액 컬럼 목록을 생성합니다.
const createReturnPreviewAmountColumnList = (
  previewResult: NonNullable<ReturnType<typeof buildAdminOrderReturnPreviewResult>>,
): AdminOrderReturnAmountColumn[] => {
  return [
    {
      key: 'goodsPrice',
      title: '상품가격',
      itemList: [
        { key: 'totalSupplyAmt', label: '상품가격', valueText: `${formatAmount(previewResult.returnPreviewSummary.totalSupplyAmt)}원` },
        { key: 'totalGoodsDiscountAmt', label: '상품할인', valueText: `${formatAmount(previewResult.returnPreviewSummary.totalGoodsDiscountAmt)}원` },
      ],
    },
    {
      key: 'returnBenefit',
      title: '반품 혜택',
      itemList: [
        { key: 'totalGoodsCouponDiscountAmt', label: '상품쿠폰', valueText: `${formatAmount(previewResult.returnPreviewSummary.totalGoodsCouponDiscountAmt)}원` },
        { key: 'totalCartCouponDiscountAmt', label: '장바구니쿠폰', valueText: `${formatAmount(previewResult.returnPreviewSummary.totalCartCouponDiscountAmt)}원` },
        { key: 'deliveryCouponRefundAmt', label: '배송비쿠폰환급', valueText: `${formatAmount(previewResult.returnPreviewSummary.deliveryCouponRefundAmt)}원` },
        { key: 'totalPointRefundAmt', label: '포인트환급', valueText: `${formatAmount(previewResult.returnPreviewSummary.totalPointRefundAmt)}원` },
      ],
    },
    {
      key: 'expectedRefund',
      title: '반품 예정금액',
      itemList: [
        { key: 'paidGoodsAmt', label: '실결제 상품가', valueText: `${formatAmount(previewResult.returnPreviewSummary.paidGoodsAmt)}원` },
        { key: 'benefitAmt', label: '환급 혜택 합계', valueText: `${formatAmount(previewResult.returnPreviewSummary.benefitAmt)}원` },
        { key: 'shippingAdjustmentAmt', label: '배송비', valueText: `${formatSignedAmount(previewResult.returnPreviewSummary.shippingAdjustmentAmt)}원` },
        { key: 'expectedRefundAmt', label: '반품 예정 금액', valueText: `${formatAmount(previewResult.returnPreviewSummary.expectedRefundAmt)}원`, isStrong: true },
      ],
    },
  ];
};

// 연락처 입력값을 숫자와 하이픈 기준으로 포맷합니다.
const formatPhoneNumberValue = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length < 4) return digits;
  if (digits.length < 8) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  if (digits.length < 11) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
};

// 주소 검색 응답 기본값을 생성합니다.
const createDefaultAdminOrderAddressSearchResponse = (): AdminOrderAddressSearchResponse => ({
  common: {
    errorCode: '0',
    errorMessage: '',
    totalCount: 0,
    currentPage: 1,
    countPerPage: ADDRESS_SEARCH_PAGE_SIZE,
  },
  jusoList: [],
});

// 빈 회수지 정보를 생성합니다.
const createEmptyPickupAddress = (): AdminOrderReturnPickupAddress => ({
  custNo: 0,
  addressNm: '',
  postNo: '',
  baseAddress: '',
  detailAddress: '',
  phoneNumber: '',
  rsvNm: '',
  defaultYn: 'N',
});

// 반품 저장용 회수지 정보를 생성합니다.
const buildAdminOrderReturnSubmitPickupAddress = (
  pickupAddress: AdminOrderReturnPickupAddress,
): AdminOrderReturnRequest['pickupAddress'] => ({
  rsvNm: pickupAddress.rsvNm.trim(),
  postNo: pickupAddress.postNo.trim(),
  baseAddress: pickupAddress.baseAddress.trim(),
  detailAddress: pickupAddress.detailAddress.trim(),
});

// 반품 회수지 입력값의 클라이언트 유효성을 확인합니다.
const resolveAdminOrderReturnPickupAddressValidationMessage = (
  pickupAddress: AdminOrderReturnPickupAddress,
): string => {
  const submitPickupAddress = buildAdminOrderReturnSubmitPickupAddress(pickupAddress);
  if (
    submitPickupAddress.rsvNm === '' ||
    submitPickupAddress.postNo === '' ||
    submitPickupAddress.baseAddress === '' ||
    submitPickupAddress.detailAddress === ''
  ) {
    return '회수지 정보를 확인해주세요.';
  }
  if (submitPickupAddress.rsvNm.length > ORDER_CHANGE_ADDRESS_NAME_MAX_LENGTH) {
    return '회수지 정보를 확인해주세요.';
  }
  if (submitPickupAddress.postNo.length > ORDER_CHANGE_ADDRESS_POST_NO_MAX_LENGTH) {
    return '회수지 정보를 확인해주세요.';
  }
  if (submitPickupAddress.baseAddress.length > ORDER_CHANGE_ADDRESS_BASE_MAX_LENGTH) {
    return '회수지 정보를 확인해주세요.';
  }
  if (submitPickupAddress.detailAddress.length > ORDER_CHANGE_ADDRESS_DETAIL_MAX_LENGTH) {
    return '회수지 정보를 확인해주세요.';
  }
  return '';
};

// 주소 검색 결과를 회수지 정보에 반영합니다.
const applySearchItemToPickupAddress = (
  pickupAddress: AdminOrderReturnPickupAddress,
  item: AdminOrderAddressSearchItem,
): AdminOrderReturnPickupAddress => ({
  ...pickupAddress,
  postNo: item.zipNo,
  baseAddress: item.roadAddrPart1 || item.roadAddr,
});

// 총 페이지 수를 계산합니다.
const resolveTotalPageCount = (response: AdminOrderAddressSearchResponse): number => {
  const totalCount = response.common.totalCount;
  const countPerPage = response.common.countPerPage || ADDRESS_SEARCH_PAGE_SIZE;
  if (totalCount < 1) return 1;
  return Math.max(1, Math.ceil(totalCount / countPerPage));
};

// 현재 페이지 기준 페이지 번호 목록을 계산합니다.
const resolvePageNumberList = (currentPage: number, totalPageCount: number): number[] => {
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPageCount);
  const startPage = Math.max(1, safeCurrentPage - 2);
  const endPage = Math.min(totalPageCount, startPage + 4);
  const pageNumberList: number[] = [];
  for (let pageNo = Math.max(1, endPage - 4); pageNo <= endPage; pageNo += 1) {
    pageNumberList.push(pageNo);
  }
  return pageNumberList;
};

// 선택 상태 리듀서 액션 타입입니다.
type SelectionAction =
  | { type: 'INIT'; payload: AdminOrderReturnSelectionMap }
  | { type: 'TOGGLE'; ordDtlNo: number; item: AdminOrderReturnDetailItem }
  | { type: 'SET_QTY'; ordDtlNo: number; item: AdminOrderReturnDetailItem; qty: number }
  | { type: 'TOGGLE_ALL'; items: AdminOrderReturnDetailItem[]; selectAll: boolean };

interface AdminOrderReturnHeaderCheckboxProps extends IHeaderParams<AdminOrderReturnDetailItem> {
  // 전체 선택 여부입니다.
  checked: boolean;
  // 부분 선택 여부입니다.
  indeterminate: boolean;
  // 비활성 여부입니다.
  disabled: boolean;
  // 체크 변경 콜백입니다.
  onToggle: (checked: boolean) => void;
}

// 반품 선택 상태 리듀서입니다.
function selectionReducer(
  state: AdminOrderReturnSelectionMap,
  action: SelectionAction,
): AdminOrderReturnSelectionMap {
  switch (action.type) {
    case 'INIT':
      return action.payload;
    case 'TOGGLE': {
      const current = state[action.ordDtlNo];
      const selected = !current?.selected;
      const defaultQty = (current?.returnQty ?? 0) > 0 ? current!.returnQty : action.item.cancelableQty;
      return {
        ...state,
        [action.ordDtlNo]: {
          selected,
          returnQty: selected ? clampAdminOrderReturnQty(action.item, defaultQty) : 0,
        },
      };
    }
    case 'SET_QTY': {
      const current = state[action.ordDtlNo];
      return {
        ...state,
        [action.ordDtlNo]: {
          selected: current?.selected ?? false,
          returnQty: clampAdminOrderReturnQty(action.item, action.qty),
        },
      };
    }
    case 'TOGGLE_ALL': {
      const nextState = { ...state };
      for (const item of action.items) {
        const previousQty = nextState[item.ordDtlNo]?.returnQty ?? 0;
        const defaultQty = previousQty > 0 ? previousQty : item.cancelableQty;
        nextState[item.ordDtlNo] = {
          selected: action.selectAll,
          returnQty: action.selectAll ? clampAdminOrderReturnQty(item, defaultQty) : 0,
        };
      }
      return nextState;
    }
    default:
      return state;
  }
}

// 반품 상품 그리드 헤더 전체 선택 체크박스를 렌더링합니다.
const AdminOrderReturnHeaderCheckbox = ({
  checked,
  indeterminate,
  disabled,
  onToggle,
}: AdminOrderReturnHeaderCheckboxProps) => {
  const checkboxRef = useRef<HTMLInputElement | null>(null);

  // 헤더 체크박스의 부분 선택 상태를 input 속성에 반영합니다.
  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <div className="d-flex justify-content-center align-items-center w-100 h-100">
      <input
        ref={checkboxRef}
        className="form-check-input m-0"
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onToggle(event.target.checked)}
        aria-label="반품 상품 전체 선택"
      />
    </div>
  );
};

// 관리자 주문 반품 신청 레이어팝업을 렌더링합니다.
const OrderReturnModal = ({
  isOpen,
  ordNo,
  customerPhoneNumber = '',
  selectedOrdDtlNoList = [],
  onClose,
  onSuccess,
}: OrderReturnModalProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageData, setPageData] = useState<AdminOrderReturnPageResponse | null>(null);
  // 공통 반품 사유 코드입니다.
  const [reasonCd, setReasonCd] = useState('');
  // 공통 반품 사유 상세입니다.
  const [reasonDetail, setReasonDetail] = useState('');
  // 선택 상품 상태 맵입니다.
  const [selectionMap, dispatch] = useReducer(selectionReducer, {});
  // 회수지 수정 상태입니다.
  const [pickupAddress, setPickupAddress] = useState<AdminOrderReturnPickupAddress>(createEmptyPickupAddress());
  // 저장 진행 상태입니다.
  const [isSubmitting, setIsSubmitting] = useState(false);
  // 주소 검색 UI 상태입니다.
  const [showAddressSearch, setShowAddressSearch] = useState(false);
  const [addressKeyword, setAddressKeyword] = useState('');
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [addressSearchError, setAddressSearchError] = useState<string | null>(null);
  const [addressSearchResponse, setAddressSearchResponse] = useState<AdminOrderAddressSearchResponse>(
    createDefaultAdminOrderAddressSearchResponse(),
  );

  // 주문 상세에서 전달된 선택 상품만 팝업 목록으로 노출합니다.
  const targetDetailList = useMemo(() => {
    if (!pageData?.order) {
      return [];
    }
    const selectedOrdDtlNoSet = new Set(selectedOrdDtlNoList);
    return pageData.order.detailList.filter(
      (detailItem) => selectedOrdDtlNoSet.has(detailItem.ordDtlNo) && isAdminOrderReturnable(detailItem),
    );
  }, [pageData, selectedOrdDtlNoList]);

  // 전체 선택 체크박스 상태를 계산합니다.
  const { allSelected, someSelected } = useMemo(() => {
    if (targetDetailList.length < 1) {
      return { allSelected: false, someSelected: false };
    }
    const selectedCount = targetDetailList.filter(
      (detailItem) => resolveAdminOrderReturnSelectionItem(selectionMap, detailItem).selected,
    ).length;
    return {
      allSelected: selectedCount === targetDetailList.length,
      someSelected: selectedCount > 0 && selectedCount < targetDetailList.length,
    };
  }, [selectionMap, targetDetailList]);

  // 반품 상품 ag-grid 컬럼을 구성합니다.
  const columnDefs = useMemo<ColDef<AdminOrderReturnDetailItem>[]>(() => {
    return [
      {
        headerName: '',
        field: 'ordDtlNo',
        width: 40,
        minWidth: 40,
        resizable: false,
        sortable: false,
        pinned: 'left',
        lockPinned: true,
        cellClass: 'admin-order-return-center-cell',
        cellStyle: ADMIN_ORDER_RETURN_CENTER_CELL_STYLE,
        headerComponent: AdminOrderReturnHeaderCheckbox,
        headerComponentParams: {
          checked: allSelected,
          indeterminate: someSelected,
          disabled: targetDetailList.length < 1,
          onToggle: (checked: boolean) =>
            dispatch({
              type: 'TOGGLE_ALL',
              items: targetDetailList,
              selectAll: checked,
            }),
        },
        cellRenderer: (params: { data?: AdminOrderReturnDetailItem }) => {
          if (!params.data) {
            return null;
          }
          const selectionItem = resolveAdminOrderReturnSelectionItem(selectionMap, params.data);
          return (
            <div className="d-flex justify-content-center align-items-center w-100">
              <input
                className="form-check-input"
                type="checkbox"
                checked={selectionItem.selected}
                onChange={() =>
                  dispatch({
                    type: 'TOGGLE',
                    ordDtlNo: params.data!.ordDtlNo,
                    item: params.data!,
                  })
                }
              />
            </div>
          );
        },
      },
      {
        headerName: '상세번호',
        field: 'ordDtlNo',
        minWidth: 70,
        width: 70,
        flex: 0.8,
        pinned: 'left',
        lockPinned: true,
        cellClass: 'admin-order-return-center-cell',
        cellStyle: ADMIN_ORDER_RETURN_CENTER_CELL_STYLE,
      },
      {
        headerName: '반품 수량',
        field: 'cancelableQty',
        minWidth: 140,
        width: 140,
        flex: 1,
        pinned: 'left',
        lockPinned: true,
        cellClass: 'admin-order-return-center-cell',
        cellStyle: ADMIN_ORDER_RETURN_CENTER_CELL_STYLE,
        cellRenderer: (params: { data?: AdminOrderReturnDetailItem }) => {
          if (!params.data) {
            return null;
          }
          const selectionItem = resolveAdminOrderReturnSelectionItem(selectionMap, params.data);
          return (
            <select
              className="form-select form-select-sm"
              value={selectionItem.selected ? selectionItem.returnQty : ''}
              disabled={!selectionItem.selected}
              onChange={(event) =>
                dispatch({
                  type: 'SET_QTY',
                  ordDtlNo: params.data!.ordDtlNo,
                  item: params.data!,
                  qty: Number.parseInt(event.target.value, 10),
                })
              }
            >
              <option value="">선택</option>
              {Array.from({ length: params.data.cancelableQty }, (_, index) => index + 1).map((qty) => (
                <option key={qty} value={qty}>
                  {qty}개
                </option>
              ))}
            </select>
          );
        },
      },
      {
        headerName: '상품코드',
        field: 'goodsId',
        minWidth: 140,
        flex: 1,
        valueFormatter: (params) => displayValue(params.value as string | null),
      },
      {
        headerName: '상품명',
        field: 'goodsNm',
        minWidth: 260,
        flex: 2,
        cellClass: 'text-start',
        valueFormatter: (params) => displayValue(params.value as string | null),
      },
      {
        headerName: '사이즈',
        field: 'sizeId',
        minWidth: 100,
        flex: 0.8,
        cellClass: 'admin-order-return-center-cell',
        cellStyle: ADMIN_ORDER_RETURN_CENTER_CELL_STYLE,
        valueFormatter: (params) => displayValue(params.value as string | null),
      },
      {
        headerName: '주문상태',
        field: 'ordDtlStatNm',
        minWidth: 120,
        flex: 0.9,
        cellClass: 'admin-order-return-center-cell',
        cellStyle: ADMIN_ORDER_RETURN_CENTER_CELL_STYLE,
      },
      {
        headerName: '주문수량',
        field: 'ordQty',
        minWidth: 100,
        flex: 0.7,
        cellClass: 'admin-order-return-center-cell',
        cellStyle: ADMIN_ORDER_RETURN_CENTER_CELL_STYLE,
        valueFormatter: (params) => `${params.value ?? 0}개`,
      },
      {
        headerName: '반품가능수량',
        field: 'cancelableQty',
        minWidth: 120,
        flex: 0.9,
        cellClass: 'admin-order-return-center-cell',
        cellStyle: ADMIN_ORDER_RETURN_CENTER_CELL_STYLE,
        valueFormatter: (params) => `${params.value ?? 0}개`,
      },
      {
        headerName: '주문금액',
        field: 'saleAmt',
        minWidth: 130,
        flex: 1,
        cellClass: 'admin-order-return-right-cell',
        cellStyle: ADMIN_ORDER_RETURN_RIGHT_CELL_STYLE,
        valueFormatter: (params) => `${formatAmount(((params.data?.saleAmt ?? 0) + (params.data?.addAmt ?? 0)) * (params.data?.ordQty ?? 0))}원`,
      },
    ];
  }, [allSelected, selectionMap, someSelected, targetDetailList]);

  // 반품 상품 ag-grid 공통 컬럼 속성입니다.
  const defaultColDef = useMemo<ColDef<AdminOrderReturnDetailItem>>(
    () => ({
      editable: false,
      sortable: false,
      resizable: true,
      cellClass: 'text-center',
    }),
    [],
  );

  // 반품 예정 금액을 실시간 계산합니다.
  const previewResult = useMemo(() => {
    if (!pageData?.order) {
      return null;
    }
    return buildAdminOrderReturnPreviewResult(
      pageData.order,
      pageData.amountSummary,
      pageData.siteInfo,
      pageData.returnFeeContext,
      selectionMap,
      reasonCd,
      reasonDetail,
      pageData.reasonList,
    );
  }, [pageData, reasonCd, reasonDetail, selectionMap]);
  const pickupAddressValidationMessage = useMemo(
    () => resolveAdminOrderReturnPickupAddressValidationMessage(pickupAddress),
    [pickupAddress],
  );
  const submitDisabled = loading || isSubmitting || pickupAddressValidationMessage !== '' || !previewResult?.canSubmit;

  // 반품 신청 화면 데이터를 조회합니다.
  const fetchPageData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setPageData(null);
    setReasonCd('');
    setReasonDetail('');
    dispatch({ type: 'INIT', payload: {} });
    setPickupAddress(createEmptyPickupAddress());
    setIsSubmitting(false);
    setShowAddressSearch(false);
    setAddressKeyword('');
    setAddressSearchError(null);
    setAddressSearchResponse(createDefaultAdminOrderAddressSearchResponse());

    try {
      const response = await api.get<AdminOrderReturnPageResponse>('/api/admin/order/return/page', {
        params: { ordNo },
      });
      const data = response.data;
      setPageData(data);
      setPickupAddress({
        ...(data.pickupAddress ?? createEmptyPickupAddress()),
        phoneNumber: formatPhoneNumberValue(customerPhoneNumber || data.pickupAddress?.phoneNumber || ''),
      });
      dispatch({
        type: 'INIT',
        payload: createInitialAdminOrderReturnSelectionMap(data.order?.detailList ?? [], selectedOrdDtlNoList),
      });
    } catch {
      setError('반품 신청 화면 데이터를 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [customerPhoneNumber, ordNo, selectedOrdDtlNoList]);

  // 모달 오픈 시 반품 신청 화면 데이터를 조회합니다.
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    fetchPageData();
  }, [fetchPageData, isOpen]);

  // 우편번호 검색을 수행합니다.
  const handleSearchAddress = useCallback(
    async (page: number) => {
      const keyword = addressKeyword.trim();
      if (keyword === '') {
        setAddressSearchError('주소 검색어를 입력해주세요.');
        setAddressSearchResponse(createDefaultAdminOrderAddressSearchResponse());
        return;
      }

      setIsSearchingAddress(true);
      setAddressSearchError(null);
      try {
        const response = await api.get<AdminOrderAddressSearchResponse>('/api/admin/order/address/search', {
          params: { keyword, currentPage: page, countPerPage: ADDRESS_SEARCH_PAGE_SIZE },
        });
        setAddressSearchResponse(response.data);
      } catch {
        setAddressSearchError('주소 검색 중 오류가 발생했습니다.');
      } finally {
        setIsSearchingAddress(false);
      }
    },
    [addressKeyword],
  );

  // 주소 검색 결과 선택값을 회수지에 반영합니다.
  const handleSelectAddress = useCallback((item: AdminOrderAddressSearchItem) => {
    setPickupAddress((previous) => applySearchItemToPickupAddress(previous, item));
    setShowAddressSearch(false);
  }, []);

  // 반품 신청 버튼 클릭을 처리합니다.
  const handleSubmit = useCallback(async () => {
    if (!previewResult) {
      window.alert('반품 신청 정보를 확인해주세요.');
      return;
    }
    if (pickupAddressValidationMessage !== '') {
      window.alert(pickupAddressValidationMessage);
      return;
    }
    if (!previewResult.canSubmit) {
      window.alert(previewResult.submitBlockMessage || '반품 신청 정보를 확인해주세요.');
      return;
    }

    const selectedItemList = targetDetailList.flatMap((detailItem) => {
      const selectionItem = resolveAdminOrderReturnSelectionItem(selectionMap, detailItem);
      if (!selectionItem.selected || selectionItem.returnQty < 1) {
        return [];
      }
      return [
        {
          ordDtlNo: detailItem.ordDtlNo,
          returnQty: selectionItem.returnQty,
        },
      ];
    });
    if (selectedItemList.length < 1) {
      window.alert('반품할 상품을 선택해주세요.');
      return;
    }
    if (!pageData?.order) {
      window.alert('반품 신청 정보를 확인해주세요.');
      return;
    }

    const requestBody: AdminOrderReturnRequest = {
      ordNo: pageData.order.ordNo,
      reasonCd: reasonCd.trim(),
      reasonDetail: reasonDetail.trim(),
      returnItemList: selectedItemList,
      previewAmount: {
        ...previewResult.returnPreviewSummary,
      },
      pickupAddress: buildAdminOrderReturnSubmitPickupAddress(pickupAddress),
    };

    // 현재 화면 계산값을 포함해 주문반품 API를 호출하고 실패 메시지는 alert로 노출합니다.
    setIsSubmitting(true);
    try {
      await api.post<AdminOrderReturnResponse>('/api/admin/order/return', requestBody);
      window.alert('반품 신청이 완료되었습니다.');
      onSuccess();
    } catch (actionError) {
      window.alert(resolveOrderReturnActionErrorMessage(actionError, '반품 신청 처리 중 오류가 발생했습니다.'));
    } finally {
      setIsSubmitting(false);
    }
  }, [
    onSuccess,
    pageData?.order,
    pickupAddress,
    pickupAddressValidationMessage,
    previewResult,
    reasonCd,
    reasonDetail,
    selectionMap,
    targetDetailList,
  ]);

  if (!isOpen) {
    return null;
  }

  const currentAmountColumnList = pageData ? createCurrentAmountColumnList(pageData) : [];
  const returnPreviewAmountColumnList = previewResult ? createReturnPreviewAmountColumnList(previewResult) : [];
  const totalPageCount = resolveTotalPageCount(addressSearchResponse);
  const pageNumberList = resolvePageNumberList(addressSearchResponse.common.currentPage, totalPageCount);

  return (
    <>
      <div className="modal-backdrop fade show" style={{ zIndex: 1060 }} onClick={onClose} aria-hidden="true" />
      <div
        className="modal fade show d-block"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        style={{ zIndex: 1065 }}
      >
        <div className="modal-dialog modal-xl modal-dialog-scrollable" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">반품 신청</h5>
              <button type="button" className="btn-close btn-close-white" aria-label="닫기" onClick={onClose} />
            </div>
            <div className="modal-body">
              {loading ? (
                <div className="text-center py-5">불러오는 중...</div>
              ) : error ? (
                <div className="alert alert-danger mb-0">{error}</div>
              ) : !pageData?.order ? (
                <div className="alert alert-warning mb-0">반품 신청 대상 주문 정보를 찾을 수 없습니다.</div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  <div>
                    <h6 className="fw-bold mb-2">주문 정보</h6>
                    <AdminFormTable>
                      <tbody>
                        <tr>
                          <th>주문번호</th>
                          <td>{displayValue(pageData.order.ordNo)}</td>
                          <th>주문일시</th>
                          <td>{displayValue(pageData.order.orderDt)}</td>
                        </tr>
                      </tbody>
                    </AdminFormTable>
                  </div>

                  <div className="card">
                    <div className="card-body">
                      <div className="mb-3">
                        <h6 className="mb-0 text-white">반품 상품</h6>
                      </div>

                      {targetDetailList.length < 1 ? (
                        <div className="alert alert-warning mb-0">반품 신청 가능한 선택 상품이 없습니다.</div>
                      ) : (
                        <div className="ag-theme-alpine-dark header-center admin-order-return-grid-theme" style={{ width: '100%' }}>
                          <AgGridReact<AdminOrderReturnDetailItem>
                            columnDefs={columnDefs}
                            defaultColDef={defaultColDef}
                            rowData={targetDetailList}
                            domLayout="autoHeight"
                            rowHeight={52}
                            headerHeight={42}
                            suppressRowClickSelection
                            suppressCellFocus
                            overlayNoRowsTemplate="반품 신청 가능한 선택 상품이 없습니다."
                            getRowId={(params) => String(params.data?.ordDtlNo ?? '')}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-body">
                      <h6 className="mb-3 text-white">반품 사유</h6>
                      <AdminFormTable>
                        <tbody>
                          <tr>
                            <th>반품 사유</th>
                            <td>
                              <select
                                className="form-select"
                                value={reasonCd}
                                onChange={(event) => setReasonCd(event.target.value)}
                              >
                                <option value="">반품 사유를 선택해주세요.</option>
                                {pageData.reasonList.map((reasonItem) => (
                                  <option key={reasonItem.cd} value={reasonItem.cd}>
                                    {reasonItem.cdNm}
                                  </option>
                                ))}
                              </select>
                            </td>
                          </tr>
                          <tr>
                            <th>상세 사유</th>
                            <td>
                              <textarea
                                className="form-control"
                                rows={4}
                                placeholder="추가로 전달할 반품 사유가 있다면 입력해주세요."
                                value={reasonDetail}
                                onChange={(event) => setReasonDetail(event.target.value)}
                              />
                            </td>
                          </tr>
                        </tbody>
                      </AdminFormTable>
                    </div>
                  </div>

                  <div>
                    <h6 className="fw-bold mb-2 text-white">현재 주문 금액</h6>
                    <AdminOrderReturnAmountTable columnList={currentAmountColumnList} />
                  </div>

                  <div>
                    <h6 className="fw-bold mb-2 text-white">반품 예정 금액</h6>
                    {previewResult?.previewVisible ? (
                      <>
                        <AdminOrderReturnAmountTable columnList={returnPreviewAmountColumnList} />
                        {!previewResult.canSubmit && previewResult.submitBlockMessage && (
                          <div className="alert alert-danger mt-3 mb-0">{previewResult.submitBlockMessage}</div>
                        )}
                      </>
                    ) : (
                      <div className="alert alert-info mb-0">
                        {previewResult?.submitBlockMessage || '사유를 선택하시면 환불 예정 금액이 보여집니다.'}
                      </div>
                    )}
                  </div>

                  <div className="card">
                    <div className="card-body">
                      <h6 className="mb-3 text-white">반품 회수지</h6>
                      <AdminFormTable>
                        <tbody>
                          <tr>
                            <th>받는사람</th>
                            <td>
                              <input
                                type="text"
                                className="form-control"
                                value={pickupAddress.rsvNm}
                                onChange={(event) =>
                                  setPickupAddress((previous) => ({
                                    ...previous,
                                    rsvNm: event.target.value.slice(0, 20),
                                  }))
                                }
                              />
                            </td>
                            <th>연락처</th>
                            <td>
                              <input
                                type="text"
                                className="form-control"
                                value={formatPhoneNumberValue(customerPhoneNumber || pickupAddress.phoneNumber)}
                                readOnly
                              />
                            </td>
                          </tr>
                          <tr>
                            <th>우편번호</th>
                            <td>
                              <div className="admin-form-inline flex-nowrap">
                                <input type="text" className="form-control" value={pickupAddress.postNo} disabled />
                                <button
                                  type="button"
                                  className="btn btn-outline-primary"
                                  onClick={() => setShowAddressSearch((previous) => !previous)}
                                >
                                  우편번호 검색
                                </button>
                              </div>
                            </td>
                            <th>기본주소</th>
                            <td>
                              <input type="text" className="form-control" value={pickupAddress.baseAddress} readOnly />
                            </td>
                          </tr>
                          <tr>
                            <th>상세주소</th>
                            <td colSpan={3}>
                              <input
                                type="text"
                                className="form-control"
                                value={pickupAddress.detailAddress}
                                onChange={(event) =>
                                  setPickupAddress((previous) => ({
                                    ...previous,
                                    detailAddress: event.target.value.slice(0, 100),
                                  }))
                                }
                              />
                            </td>
                          </tr>
                        </tbody>
                      </AdminFormTable>

                      {pickupAddressValidationMessage !== '' ? (
                        <div className="alert alert-danger mt-3 mb-0">{pickupAddressValidationMessage}</div>
                      ) : null}

                      {showAddressSearch && (
                        <div className="border rounded p-3 mt-3" style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}>
                          <div className="row g-2 align-items-center">
                            <div className="col-md-8">
                              <input
                                type="text"
                                className="form-control"
                                placeholder="도로명, 건물명으로 검색해주세요."
                                value={addressKeyword}
                                onChange={(event) => setAddressKeyword(event.target.value)}
                                onKeyDown={(event) => {
                                  if (event.key === 'Enter') {
                                    event.preventDefault();
                                    handleSearchAddress(1);
                                  }
                                }}
                              />
                            </div>
                            <div className="col-md-4 d-grid">
                              <button
                                type="button"
                                className="btn btn-primary"
                                onClick={() => handleSearchAddress(1)}
                                disabled={isSearchingAddress}
                              >
                                {isSearchingAddress ? '검색 중...' : '주소 검색'}
                              </button>
                            </div>
                          </div>

                          {addressSearchError && <div className="alert alert-danger mt-3 mb-0">{addressSearchError}</div>}

                          {!addressSearchError && (
                            <div className="mt-3">
                              {addressSearchResponse.jusoList.length < 1 ? (
                                <div className="text-muted small">검색 결과가 없습니다.</div>
                              ) : (
                                <div className="d-flex flex-column gap-2">
                                  {addressSearchResponse.jusoList.map((searchItem) => (
                                    <button
                                      key={`${searchItem.admCd}-${searchItem.rnMgtSn}-${searchItem.bdMgtSn}`}
                                      type="button"
                                      className="btn btn-outline-secondary text-start"
                                      onClick={() => handleSelectAddress(searchItem)}
                                    >
                                      <div className="fw-semibold">{searchItem.roadAddrPart1 || searchItem.roadAddr}</div>
                                      <div className="small text-muted">우편번호: {searchItem.zipNo}</div>
                                      <div className="small text-muted">{displayValue(searchItem.jibunAddr)}</div>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {addressSearchResponse.jusoList.length > 0 && (
                            <div className="d-flex justify-content-center gap-2 mt-3 flex-wrap">
                              <button
                                type="button"
                                className="btn btn-outline-secondary btn-sm"
                                disabled={addressSearchResponse.common.currentPage <= 1 || isSearchingAddress}
                                onClick={() => handleSearchAddress(addressSearchResponse.common.currentPage - 1)}
                              >
                                이전
                              </button>
                              {pageNumberList.map((pageNo) => (
                                <button
                                  key={pageNo}
                                  type="button"
                                  className={
                                    pageNo === addressSearchResponse.common.currentPage
                                      ? 'btn btn-primary btn-sm'
                                      : 'btn btn-outline-secondary btn-sm'
                                  }
                                  disabled={isSearchingAddress}
                                  onClick={() => handleSearchAddress(pageNo)}
                                >
                                  {pageNo}
                                </button>
                              ))}
                              <button
                                type="button"
                                className="btn btn-outline-secondary btn-sm"
                                disabled={addressSearchResponse.common.currentPage >= totalPageCount || isSearchingAddress}
                                onClick={() => handleSearchAddress(addressSearchResponse.common.currentPage + 1)}
                              >
                                다음
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={submitDisabled}>
                {isSubmitting ? '처리 중...' : '반품 신청'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
                닫기
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderReturnModal;
