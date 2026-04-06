import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { ColDef } from 'ag-grid-community';
import { AgGridReact } from '@/components/common/agGrid/AgGridReact';
import AdminFormTable from '@/components/common/AdminFormTable';
import OrderReturnAmountTable, {
  formatOrderAmount,
  formatSignedOrderAmount,
  type OrderReturnAmountColumn,
} from '@/components/order/OrderReturnAmountTable';
import type {
  OrderReturnManagePickupCompleteDetail,
  OrderReturnManagePickupCompletePageResponse,
} from '@/components/order/returnManageTypes';
import { buildOrderReturnManagePickupCompletePreviewResult } from '@/components/order/utils/orderReturnPickupCompleteUtils';
import api from '@/utils/axios/axios';

interface OrderReturnPickupCompleteModalProps {
  // 모달 오픈 여부입니다.
  isOpen: boolean;
  // 조회할 클레임번호입니다.
  clmNo: string | null;
  // 모달 닫기 함수입니다.
  onClose: () => void;
}

// 가운데 정렬 셀 스타일입니다.
const ORDER_RETURN_PICKUP_COMPLETE_CENTER_CELL_STYLE = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center' as const,
};

// 우측 정렬 셀 스타일입니다.
const ORDER_RETURN_PICKUP_COMPLETE_RIGHT_CELL_STYLE = {
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

// 회수완료 검수 팝업의 금액 컬럼 목록을 생성합니다.
const createOrderReturnPickupCompleteAmountColumnList = (
  pageData: OrderReturnManagePickupCompletePageResponse,
  shippingAdjustmentAmt: number,
  expectedRefundAmt: number,
): OrderReturnAmountColumn[] => {
  return [
    {
      key: 'goodsPrice',
      title: '상품가격',
      itemList: [
        { key: 'totalSupplyAmt', label: '상품가격', valueText: `${formatOrderAmount(pageData.previewAmount.totalSupplyAmt)}원` },
        { key: 'totalGoodsDiscountAmt', label: '상품할인', valueText: `${formatOrderAmount(pageData.previewAmount.totalGoodsDiscountAmt)}원` },
      ],
    },
    {
      key: 'returnBenefit',
      title: '반품 혜택',
      itemList: [
        { key: 'totalGoodsCouponDiscountAmt', label: '상품쿠폰', valueText: `${formatOrderAmount(pageData.previewAmount.totalGoodsCouponDiscountAmt)}원` },
        { key: 'totalCartCouponDiscountAmt', label: '장바구니쿠폰', valueText: `${formatOrderAmount(pageData.previewAmount.totalCartCouponDiscountAmt)}원` },
        { key: 'deliveryCouponRefundAmt', label: '배송비쿠폰환급', valueText: `${formatOrderAmount(pageData.previewAmount.deliveryCouponRefundAmt)}원` },
        { key: 'totalPointRefundAmt', label: '포인트환급', valueText: `${formatOrderAmount(pageData.previewAmount.totalPointRefundAmt)}원` },
      ],
    },
    {
      key: 'expectedRefund',
      title: '반품 예정금액',
      itemList: [
        { key: 'paidGoodsAmt', label: '실결제 상품가', valueText: `${formatOrderAmount(pageData.previewAmount.paidGoodsAmt)}원` },
        { key: 'benefitAmt', label: '환급 혜택 합계', valueText: `${formatOrderAmount(pageData.previewAmount.benefitAmt)}원` },
        { key: 'shippingAdjustmentAmt', label: '배송비', valueText: `${formatSignedOrderAmount(shippingAdjustmentAmt)}원` },
        { key: 'expectedRefundAmt', label: '반품 예정 금액', valueText: `${formatOrderAmount(expectedRefundAmt)}원`, isStrong: true },
      ],
    },
  ];
};

// 회수완료 검수 레이어팝업을 렌더링합니다.
const OrderReturnPickupCompleteModal = ({
  isOpen,
  clmNo,
  onClose,
}: OrderReturnPickupCompleteModalProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageData, setPageData] = useState<OrderReturnManagePickupCompletePageResponse | null>(null);
  const [reasonCd, setReasonCd] = useState('');
  const [reasonDetail, setReasonDetail] = useState('');

  // 모달 내부 상태를 기본값으로 초기화합니다.
  const resetModalState = useCallback(() => {
    setLoading(false);
    setError(null);
    setPageData(null);
    setReasonCd('');
    setReasonDetail('');
  }, []);

  // 회수완료 검수 화면 데이터를 조회합니다.
  const fetchPageData = useCallback(async (targetClmNo: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<OrderReturnManagePickupCompletePageResponse>(
        '/api/admin/order/return/manage/pickup/complete/page',
        {
          params: { clmNo: targetClmNo },
        },
      );
      const nextPageData = response.data;
      setPageData(nextPageData);
      setReasonCd(nextPageData.mixedReasonYn ? '' : nextPageData.defaultReasonCd ?? '');
      setReasonDetail(nextPageData.mixedReasonYn ? '' : nextPageData.defaultReasonDetail ?? '');
    } catch (requestError) {
      console.error('반품 회수완료 검수 화면 데이터를 불러오는 데 실패했습니다.', requestError);
      setError('반품 회수완료 검수 화면 데이터를 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  // 모달이 열리면 현재 클레임 기준으로 화면 데이터를 조회합니다.
  useEffect(() => {
    if (!isOpen || !clmNo) {
      return;
    }
    void fetchPageData(clmNo);
  }, [clmNo, fetchPageData, isOpen]);

  // 모달이 닫히면 내부 상태를 정리합니다.
  useEffect(() => {
    if (isOpen) {
      return;
    }
    resetModalState();
  }, [isOpen, resetModalState]);

  // 상단 상품 ag-grid 컬럼을 정의합니다.
  const columnDefs = useMemo<ColDef<OrderReturnManagePickupCompleteDetail>[]>(() => ([
    {
      headerName: '상품명',
      field: 'goodsNm',
      minWidth: 220,
      flex: 1.4,
      cellClass: 'text-start',
    },
    {
      headerName: '상품코드',
      field: 'goodsId',
      minWidth: 140,
      flex: 1,
      cellStyle: ORDER_RETURN_PICKUP_COMPLETE_CENTER_CELL_STYLE,
    },
    {
      headerName: '사이즈',
      field: 'sizeId',
      minWidth: 100,
      flex: 0.8,
      cellStyle: ORDER_RETURN_PICKUP_COMPLETE_CENTER_CELL_STYLE,
    },
    {
      headerName: '반품수량',
      field: 'qty',
      minWidth: 100,
      flex: 0.8,
      cellStyle: ORDER_RETURN_PICKUP_COMPLETE_CENTER_CELL_STYLE,
      valueFormatter: (params) => `${params.value ?? 0}개`,
    },
    {
      headerName: '반품수량*판매가',
      field: 'saleAmt',
      minWidth: 150,
      flex: 1,
      cellClass: 'admin-order-return-right-cell',
      cellStyle: ORDER_RETURN_PICKUP_COMPLETE_RIGHT_CELL_STYLE,
      valueFormatter: (params) => `${formatOrderAmount(((params.data?.saleAmt ?? 0) + (params.data?.addAmt ?? 0)) * (params.data?.qty ?? 0))}원`,
    },
    {
      headerName: '상품쿠폰할인(반품차감)',
      field: 'goodsCouponDiscountAmt',
      minWidth: 160,
      flex: 1,
      cellClass: 'admin-order-return-right-cell',
      cellStyle: ORDER_RETURN_PICKUP_COMPLETE_RIGHT_CELL_STYLE,
      valueFormatter: (params) => `${formatOrderAmount(params.value ?? 0)}원`,
    },
    {
      headerName: '장바구니쿠폰할인(반품차감)',
      field: 'cartCouponDiscountAmt',
      minWidth: 180,
      flex: 1.1,
      cellClass: 'admin-order-return-right-cell',
      cellStyle: ORDER_RETURN_PICKUP_COMPLETE_RIGHT_CELL_STYLE,
      valueFormatter: (params) => `${formatOrderAmount(params.value ?? 0)}원`,
    },
    {
      headerName: '포인트할인(반품환급예정)',
      field: 'pointDcAmt',
      minWidth: 170,
      flex: 1,
      cellClass: 'admin-order-return-right-cell',
      cellStyle: ORDER_RETURN_PICKUP_COMPLETE_RIGHT_CELL_STYLE,
      valueFormatter: (params) => `${formatOrderAmount(params.value ?? 0)}원`,
    },
    {
      headerName: '반품예정금액',
      field: 'ordDtlNo',
      minWidth: 150,
      flex: 1,
      cellClass: 'admin-order-return-right-cell',
      cellStyle: ORDER_RETURN_PICKUP_COMPLETE_RIGHT_CELL_STYLE,
      valueFormatter: (params) => {
        const orderAmount = ((params.data?.saleAmt ?? 0) + (params.data?.addAmt ?? 0)) * (params.data?.qty ?? 0);
        const expectedRefundAmount =
          orderAmount
          - (params.data?.goodsCouponDiscountAmt ?? 0)
          - (params.data?.cartCouponDiscountAmt ?? 0)
          - (params.data?.pointDcAmt ?? 0);
        return `${formatOrderAmount(expectedRefundAmount)}원`;
      },
    },
  ]), []);

  // 상단 상품 ag-grid 공통 컬럼 속성입니다.
  const defaultColDef = useMemo<ColDef<OrderReturnManagePickupCompleteDetail>>(() => ({
    editable: false,
    sortable: false,
    resizable: true,
    cellClass: 'text-center',
  }), []);

  // 공통 반품 사유 기준 반품 예정 금액을 다시 계산합니다.
  const previewResult = useMemo(() => {
    return buildOrderReturnManagePickupCompletePreviewResult(pageData, reasonCd, reasonDetail);
  }, [pageData, reasonCd, reasonDetail]);

  // 화면에 표시할 반품 예정 금액 카드 데이터를 계산합니다.
  const previewAmountColumnList = useMemo(() => {
    if (!pageData) {
      return [];
    }
    return createOrderReturnPickupCompleteAmountColumnList(
      pageData,
      previewResult.shippingAdjustmentAmt,
      previewResult.expectedRefundAmt,
    );
  }, [pageData, previewResult.expectedRefundAmt, previewResult.shippingAdjustmentAmt]);

  // 닫기 버튼과 백드롭 클릭 시 모달을 닫습니다.
  const handleClose = useCallback(() => {
    resetModalState();
    onClose();
  }, [onClose, resetModalState]);

  // 반품완료 버튼은 우선 개발 예정 안내만 제공합니다.
  const handleComplete = useCallback(() => {
    if (!pageData) {
      return;
    }
    alert('회수완료 기능은 추후 개발 예정입니다.');
  }, [pageData]);

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <div className="modal-backdrop fade show" style={{ zIndex: 1060 }} onClick={handleClose} aria-hidden="true" />
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
              <h5 className="modal-title">반품 회수완료 검수</h5>
              <button type="button" className="btn-close btn-close-white" aria-label="닫기" onClick={handleClose} />
            </div>

            <div className="modal-body">
              {loading ? (
                <div className="text-center py-5">불러오는 중...</div>
              ) : error ? (
                <div className="alert alert-danger mb-0">{error}</div>
              ) : !pageData ? (
                <div className="alert alert-warning mb-0">반품 회수완료 검수 대상 데이터를 찾을 수 없습니다.</div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  <div>
                    <h6 className="fw-bold mb-2">클레임 정보</h6>
                    <AdminFormTable>
                      <tbody>
                        <tr>
                          <th>클레임번호</th>
                          <td>{displayValue(pageData.claim.clmNo)}</td>
                          <th>주문번호</th>
                          <td>{displayValue(pageData.claim.ordNo)}</td>
                        </tr>
                        <tr>
                          <th>신청일시</th>
                          <td colSpan={3}>{displayValue(pageData.claim.chgDt)}</td>
                        </tr>
                      </tbody>
                    </AdminFormTable>
                  </div>

                  <div className="card">
                    <div className="card-body">
                      <h6 className="mb-3 text-white">반품 신청 상품</h6>
                      <div className="ag-theme-alpine-dark header-center admin-order-return-grid-theme" style={{ width: '100%', height: '320px' }}>
                        <AgGridReact<OrderReturnManagePickupCompleteDetail>
                          columnDefs={columnDefs}
                          defaultColDef={defaultColDef}
                          rowData={pageData.detailList}
                          rowHeight={48}
                          suppressCellFocus
                          overlayNoRowsTemplate="반품 상품 데이터가 없습니다."
                          getRowId={(params) => String(params.data?.ordDtlNo ?? '')}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-body">
                      <h6 className="mb-3 text-white">반품 사유 변경</h6>

                      {pageData.mixedReasonYn ? (
                        <div className="alert alert-warning">
                          기존 반품 사유가 상품별로 달라 공통 반품 사유를 다시 선택해주세요.
                        </div>
                      ) : null}

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
                    <h6 className="fw-bold mb-2 text-white">반품 예정 금액</h6>
                    {previewResult.previewVisible ? (
                      <>
                        <OrderReturnAmountTable columnList={previewAmountColumnList} />
                        {!previewResult.canSubmit && previewResult.submitBlockMessage !== '' ? (
                          <div className="alert alert-danger mt-3 mb-0">{previewResult.submitBlockMessage}</div>
                        ) : null}
                      </>
                    ) : (
                      <div className="alert alert-info mb-0">{previewResult.submitBlockMessage}</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-primary" onClick={handleComplete} disabled={loading || !!error || !pageData}>
                반품완료
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleClose} disabled={loading}>
                닫기
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderReturnPickupCompleteModal;
