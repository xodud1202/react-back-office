import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import api from '@/utils/axios/axios';
import type {
  AdminOrderCancelDetailItem,
  AdminOrderCancelPageResponse,
  AdminOrderCancelRequest,
} from '@/components/order/types';
import {
  buildAdminOrderCancelPreviewResult,
  createInitialAdminOrderCancelSelectionMap,
  isAdminOrderActiveDetail,
  isAdminOrderFullCancelOnly,
  isAdminOrderPartialCancelable,
  clampAdminOrderCancelQty,
  resolveAdminOrderCancelSelectionItem,
  toAdminOrderCancelPreviewAmount,
  type AdminOrderCancelSelectionMap,
} from '@/components/order/utils/orderCancelUtils';

interface OrderCancelModalProps {
  // 모달 오픈 여부입니다.
  isOpen: boolean;
  // 취소 대상 주문번호입니다.
  ordNo: string;
  // 상세 팝업에서 선택한 기본 주문상세번호 목록입니다.
  selectedOrdDtlNoList?: number[];
  // 모달 닫기 콜백입니다.
  onClose: () => void;
  // 취소 성공 콜백입니다.
  onSuccess: () => void;
}

// 금액을 천 단위 구분 문자열로 변환합니다.
const formatAmount = (value: number): string => value.toLocaleString('ko-KR');

// 선택 상태 리듀서 액션 타입입니다.
type SelectionAction =
  | { type: 'INIT'; payload: AdminOrderCancelSelectionMap }
  | { type: 'TOGGLE'; ordDtlNo: number; item: AdminOrderCancelDetailItem }
  | { type: 'SET_QTY'; ordDtlNo: number; item: AdminOrderCancelDetailItem; qty: number }
  | { type: 'TOGGLE_ALL'; items: AdminOrderCancelDetailItem[]; selectAll: boolean };

// 선택 상태 리듀서입니다.
function selectionReducer(
  state: AdminOrderCancelSelectionMap,
  action: SelectionAction,
): AdminOrderCancelSelectionMap {
  switch (action.type) {
    case 'INIT':
      return action.payload;
    case 'TOGGLE': {
      const current = state[action.ordDtlNo];
      const selected = !current?.selected;
      // 체크박스 선택 시 기본 수량을 취소 가능 수량 전체로 설정합니다.
      // cancelQty가 0이면 초기 미선택 상태이므로 취소 가능 수량 전체를 기본값으로 사용합니다.
      const defaultQty = (current?.cancelQty ?? 0) > 0 ? current!.cancelQty : action.item.cancelableQty;
      const cancelQty = selected ? clampAdminOrderCancelQty(action.item, defaultQty) : 0;
      return { ...state, [action.ordDtlNo]: { selected, cancelQty } };
    }
    case 'SET_QTY': {
      const clamped = clampAdminOrderCancelQty(action.item, action.qty);
      const current = state[action.ordDtlNo];
      return {
        ...state,
        [action.ordDtlNo]: { selected: current?.selected ?? false, cancelQty: clamped },
      };
    }
    case 'TOGGLE_ALL': {
      // 전체 선택/해제 시 각 항목의 cancelQty를 취소 가능 수량 전체로 설정합니다.
      const newState = { ...state };
      for (const item of action.items) {
        const prevQty = (newState[item.ordDtlNo]?.cancelQty ?? 0);
        const defaultQty = prevQty > 0 ? prevQty : item.cancelableQty;
        newState[item.ordDtlNo] = {
          selected: action.selectAll,
          cancelQty: action.selectAll ? clampAdminOrderCancelQty(item, defaultQty) : 0,
        };
      }
      return newState;
    }
    default:
      return state;
  }
}

// 관리자 주문 취소 신청 레이어팝업을 렌더링합니다.
const OrderCancelModal = ({
  isOpen,
  ordNo,
  selectedOrdDtlNoList = [],
  onClose,
  onSuccess,
}: OrderCancelModalProps) => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pageData, setPageData] = useState<AdminOrderCancelPageResponse | null>(null);
  // 취소 사유 코드입니다.
  const [reasonCd, setReasonCd] = useState('');
  // 취소 사유 상세 텍스트입니다.
  const [reasonDetail, setReasonDetail] = useState('');
  // 상품 선택/수량 상태 맵입니다.
  const [selectionMap, dispatch] = useReducer(selectionReducer, {});

  // 취소 모드를 결정합니다. true이면 전체취소(무통장), false이면 부분취소 모드입니다.
  const isFullCancelMode = useMemo(() => {
    if (!pageData?.order) return false;
    return pageData.order.detailList.some(isAdminOrderFullCancelOnly);
  }, [pageData]);

  // 부분취소 가능한 활성 상품 목록입니다.
  const partialCancelableItems = useMemo(() => {
    if (!pageData?.order) return [];
    return pageData.order.detailList.filter(isAdminOrderActiveDetail).filter(isAdminOrderPartialCancelable);
  }, [pageData]);

  // 헤더 전체선택 체크박스의 전체선택/부분선택 상태를 계산합니다.
  const { allPartialSelected, somePartialSelected } = useMemo(() => {
    if (partialCancelableItems.length === 0) return { allPartialSelected: false, somePartialSelected: false };
    const selectedCount = partialCancelableItems.filter(
      (item) => resolveAdminOrderCancelSelectionItem(selectionMap, item).selected,
    ).length;
    return {
      allPartialSelected: selectedCount === partialCancelableItems.length,
      somePartialSelected: selectedCount > 0 && selectedCount < partialCancelableItems.length,
    };
  }, [partialCancelableItems, selectionMap]);

  // 헤더 전체선택 체크박스의 indeterminate 상태를 DOM에 직접 반영합니다.
  const headerCheckboxRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = somePartialSelected;
    }
  }, [somePartialSelected]);

  // 취소 미리보기 결과를 실시간으로 계산합니다.
  const previewResult = useMemo(() => {
    if (!pageData) {
      return null;
    }
    return buildAdminOrderCancelPreviewResult(
      pageData.order,
      pageData.amountSummary,
      pageData.siteInfo,
      selectionMap,
    );
  }, [pageData, selectionMap]);

  // 취소 신청 화면 데이터를 조회합니다.
  const fetchPageData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setPageData(null);
    setReasonCd('');
    setReasonDetail('');
    dispatch({ type: 'INIT', payload: {} });
    try {
      const response = await api.get<AdminOrderCancelPageResponse>('/api/admin/order/cancel/page', {
        params: { ordNo },
      });
      const data = response.data;
      setPageData(data);
      // 첫 번째 사유를 기본 선택합니다.
      if (data.reasonList.length > 0) {
        setReasonCd(data.reasonList[0].cd);
      }
      // 취소 모드에 따른 초기 선택 맵을 생성합니다.
      const fullMode = data.order?.detailList.some(isAdminOrderFullCancelOnly) ?? false;
      const initialMap = createInitialAdminOrderCancelSelectionMap(
        data.order?.detailList ?? [],
        fullMode,
        selectedOrdDtlNoList,
      );
      dispatch({ type: 'INIT', payload: initialMap });
    } catch {
      setError('취소 신청 화면 데이터를 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [ordNo, selectedOrdDtlNoList]);

  // 모달 오픈 시 데이터를 조회합니다.
  useEffect(() => {
    if (!isOpen) return;
    fetchPageData();
  }, [isOpen, fetchPageData]);

  // 취소 신청 처리를 수행합니다.
  const handleSubmit = useCallback(async () => {
    if (!pageData?.order || !previewResult) return;
    if (!previewResult.canSubmit) {
      setSubmitError(previewResult.submitBlockMessage);
      return;
    }
    if (!reasonCd) {
      setSubmitError('취소 사유를 선택해주세요.');
      return;
    }

    // 취소 상품 목록을 구성합니다.
    const cancelItemList = pageData.order.detailList
      .map((item) => {
        const sel = resolveAdminOrderCancelSelectionItem(selectionMap, item);
        return { ordDtlNo: item.ordDtlNo, cancelQty: sel.selected ? sel.cancelQty : 0 };
      })
      .filter((item) => item.cancelQty > 0);

    const body: AdminOrderCancelRequest = {
      ordNo: pageData.order.ordNo,
      reasonCd,
      // 사유 상세는 항상 전송합니다.
      reasonDetail,
      cancelItemList,
      previewAmount: toAdminOrderCancelPreviewAmount(previewResult.cancelPreviewSummary),
    };

    setSubmitting(true);
    setSubmitError(null);
    try {
      await api.post('/api/admin/order/cancel', body);
      onSuccess();
    } catch {
      setSubmitError('취소 신청 처리 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  }, [pageData, previewResult, reasonCd, reasonDetail, selectionMap, onSuccess]);

  if (!isOpen) return null;

  return (
    <>
      {/* 취소 모달 백드롭입니다. (상세 모달 위에 표시되도록 z-index를 높입니다.) */}
      <div
        className="modal-backdrop fade show"
        style={{ zIndex: 1060 }}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="modal fade show d-block"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        style={{ zIndex: 1065 }}
      >
        <div className="modal-dialog modal-lg modal-dialog-scrollable" role="document">
          <div className="modal-content">
            {/* 모달 헤더입니다. */}
            <div className="modal-header">
              <h5 className="modal-title">주문 취소 신청</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  aria-label="닫기"
                  onClick={onClose}
                />
            </div>

            {/* 모달 본문입니다. */}
            <div className="modal-body">
              {loading && (
                <div className="text-center py-4">
                  <div className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                  취소 신청 정보를 불러오는 중입니다.
                </div>
              )}

              {error && !loading && (
                <div className="alert alert-danger">{error}</div>
              )}

              {pageData && !loading && (
                <>
                  {/* 취소 상품 목록 섹션입니다. */}
                  <div className="mb-3">
                    <h6 className="fw-bold mb-2">취소 상품 목록</h6>
                    {!pageData.order || pageData.order.detailList.filter(isAdminOrderActiveDetail).length === 0 ? (
                      <div className="text-muted small">취소 가능한 상품이 없습니다.</div>
                    ) : (
                      <table className="table table-sm table-bordered align-middle mb-0">
                        <thead className="table-secondary text-center">
                          <tr>
                            {!isFullCancelMode && (
                              <th style={{ width: 50 }}>
                                {/* 전체 선택/해제 체크박스입니다. */}
                                <input
                                  ref={headerCheckboxRef}
                                  type="checkbox"
                                  checked={allPartialSelected}
                                  onChange={(e) =>
                                    dispatch({
                                      type: 'TOGGLE_ALL',
                                      items: partialCancelableItems,
                                      selectAll: e.target.checked,
                                    })
                                  }
                                />
                              </th>
                            )}
                            <th>주문상세번호</th>
                            <th>상품코드</th>
                            <th>사이즈</th>
                            <th>취소가능수량</th>
                            {!isFullCancelMode && <th style={{ width: 100 }}>취소수량</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {pageData.order!.detailList.filter(isAdminOrderActiveDetail).map((item) => {
                            const sel = resolveAdminOrderCancelSelectionItem(selectionMap, item);
                            const isPartial = isAdminOrderPartialCancelable(item);
                            const isFullOnly = isAdminOrderFullCancelOnly(item);
                            return (
                              <tr key={item.ordDtlNo} className="text-center">
                                {/* 전체취소 모드가 아닐 때만 체크박스를 표시합니다. */}
                                {!isFullCancelMode && (
                                  <td>
                                    {isPartial && (
                                      <input
                                        type="checkbox"
                                        checked={sel.selected}
                                        onChange={() =>
                                          dispatch({ type: 'TOGGLE', ordDtlNo: item.ordDtlNo, item })
                                        }
                                      />
                                    )}
                                    {isFullOnly && (
                                      <input type="checkbox" checked disabled />
                                    )}
                                  </td>
                                )}
                                <td>{item.ordDtlNo}</td>
                                <td>{item.goodsId}</td>
                                <td>{item.sizeId}</td>
                                <td>{item.cancelableQty}</td>
                                {/* 부분취소 모드일 때만 수량 selectBox를 표시합니다. */}
                                {!isFullCancelMode && (
                                  <td>
                                    {isPartial && sel.selected ? (
                                      <select
                                        className="form-select form-select-sm text-center"
                                        value={sel.cancelQty}
                                        onChange={(e) =>
                                          dispatch({
                                            type: 'SET_QTY',
                                            ordDtlNo: item.ordDtlNo,
                                            item,
                                            qty: Number(e.target.value),
                                          })
                                        }
                                      >
                                        {/* 1부터 취소 가능 수량까지 옵션을 생성합니다. */}
                                        {Array.from({ length: item.cancelableQty }, (_, i) => i + 1).map((qty) => (
                                          <option key={qty} value={qty}>{qty}</option>
                                        ))}
                                      </select>
                                    ) : (
                                      <span className="text-muted">-</span>
                                    )}
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* 취소 사유 선택 섹션입니다. */}
                  <div className="mb-3">
                    <label className="form-label fw-bold" htmlFor="cancelReasonCd">
                      취소 사유
                    </label>
                    <select
                      id="cancelReasonCd"
                      className="form-select mb-2"
                      value={reasonCd}
                      onChange={(e) => {
                        setReasonCd(e.target.value);
                        setReasonDetail('');
                      }}
                    >
                      {pageData.reasonList.map((reason) => (
                        <option key={reason.cd} value={reason.cd}>
                          {reason.cdNm}
                        </option>
                      ))}
                    </select>
                    {/* 사유 상세는 항상 노출합니다. */}
                    <textarea
                      id="cancelReasonDetail"
                      className="form-control"
                      rows={3}
                      maxLength={500}
                      placeholder="사유를 입력해주세요."
                      value={reasonDetail}
                      onChange={(e) => setReasonDetail(e.target.value)}
                    />
                  </div>

                  {/* 환불 예정 금액 섹션입니다. */}
                  {previewResult && (
                    <div className="mb-3">
                      <h6 className="fw-bold mb-2">환불 예정 금액</h6>
                      {/*
                        레이아웃: 4컬럼(구분1 | 금액1 | 구분2 | 금액2)
                        1행: 실결제 상품가 (colspan 4)
                        2행: 상품쿠폰 | 장바구니쿠폰
                        3행: 포인트환급 | 배송비 조정
                        4행: 취소 예정 금액 (colspan 4)
                      */}
                      <table className="table table-sm table-bordered mb-0 text-center">
                        <tbody>
                          {/* 실결제 상품가 - 전체 너비 1행 */}
                          <tr>
                            <td className="table-secondary fw-semibold" style={{ width: '30%' }}>실결제 상품가</td>
                            <td colSpan={3} className="text-end">
                              {formatAmount(previewResult.cancelPreviewSummary.paidGoodsAmt)}원
                            </td>
                          </tr>
                          {/* 상품쿠폰 / 장바구니쿠폰 - 2열 배치 */}
                          <tr>
                            <td className="table-secondary fw-semibold">상품쿠폰 환급</td>
                            <td className="text-end" style={{ width: '20%' }}>
                              -{formatAmount(previewResult.cancelPreviewSummary.totalGoodsCouponDiscountAmt)}원
                            </td>
                            <td className="table-secondary fw-semibold" style={{ width: '30%' }}>장바구니쿠폰 환급</td>
                            <td className="text-end" style={{ width: '20%' }}>
                              -{formatAmount(previewResult.cancelPreviewSummary.totalCartCouponDiscountAmt)}원
                            </td>
                          </tr>
                          {/* 포인트환급 / 배송비 조정 - 2열 배치 */}
                          <tr>
                            <td className="table-secondary fw-semibold">포인트 환급</td>
                            <td className="text-end">
                              -{formatAmount(previewResult.cancelPreviewSummary.totalPointRefundAmt)}원
                            </td>
                            <td className="table-secondary fw-semibold">배송비 조정</td>
                            <td className="text-end">
                              {previewResult.cancelPreviewSummary.shippingAdjustmentAmt >= 0 ? '+' : ''}
                              {formatAmount(previewResult.cancelPreviewSummary.shippingAdjustmentAmt)}원
                            </td>
                          </tr>
                          {/* 취소 예정 금액 - 전체 너비 합계 행 */}
                          <tr className="table-warning fw-bold">
                            <td className="fw-bold">취소 예정 금액</td>
                            <td colSpan={3} className="text-end">
                              {formatAmount(previewResult.cashRefundAmt)}원
                            </td>
                          </tr>
                        </tbody>
                      </table>
                      {/* 취소 불가 메시지를 표시합니다. */}
                      {previewResult.submitBlockMessage && (
                        <div className="text-danger small mt-1">
                          {previewResult.submitBlockMessage}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 제출 오류 메시지를 표시합니다. */}
                  {submitError && (
                    <div className="alert alert-danger py-2">{submitError}</div>
                  )}
                </>
              )}
            </div>

            {/* 모달 푸터입니다. */}
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleSubmit}
                disabled={submitting || loading || !previewResult?.canSubmit}
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" />
                    처리 중...
                  </>
                ) : (
                  '취소 신청'
                )}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={submitting}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderCancelModal;
