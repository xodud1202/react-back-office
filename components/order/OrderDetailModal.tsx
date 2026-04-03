import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AgGridReact } from '@/components/common/agGrid/AgGridReact';
import type { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';
import api from '@/utils/axios/axios';
import AdminFormTable from '@/components/common/AdminFormTable';
import type {
  AdminOrderReturnWithdrawRequest,
  AdminOrderReturnWithdrawResponse,
  AdminOrderDetailStatusUpdateRequest,
  AdminOrderDetailStatusUpdateResponse,
  OrderClaimRow,
  OrderDetailResponse,
  OrderDetailRow,
  OrderMasterInfo,
  OrderPaymentRow,
} from '@/components/order/types';
import OrderCancelModal from '@/components/order/OrderCancelModal';
import OrderReturnModal from '@/components/order/OrderReturnModal';
import {
  isAdminOrderCancelableStatus,
  isAdminOrderPreparingAvailableStatus,
  isAdminOrderReturnApplicableStatus,
} from '@/components/order/utils/orderDetailStatusUtils';

interface OrderDetailModalProps {
  // 모달 오픈 여부입니다.
  isOpen: boolean;
  // 조회할 주문번호입니다.
  ordNo: string | null;
  // 모달 닫기 콜백입니다.
  onClose: () => void;
}

// 금액을 천 단위 구분 문자열로 변환합니다.
const formatAmount = (value?: number | null): string => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '0';
  }
  return value.toLocaleString('ko-KR');
};

// 값이 없을 때 '-'로 표시합니다.
const displayValue = (value?: string | null): string => {
  if (!value) return '-';
  return value;
};

// 주문 상세 액션 API 오류 메시지를 안전하게 추출합니다.
const resolveOrderDetailActionErrorMessage = (error: unknown, fallbackMessage: string): string => {
  const errorResponse = error as { response?: { data?: { message?: string } } };
  const message = errorResponse.response?.data?.message;
  if (typeof message === 'string' && message.trim()) {
    return message;
  }
  return fallbackMessage;
};

// 주문 클레임 행이 관리자 반품 철회 가능한 상태인지 반환합니다.
const isAdminOrderReturnWithdrawableClaimRow = (claimRow: OrderClaimRow): boolean => {
  return claimRow.chgDtlGbCd === 'CHG_DTL_GB_02' && claimRow.chgDtlStatCd === 'CHG_DTL_STAT_11';
};

// 주문 상세 ag-grid 컬럼을 정의합니다.
const createDetailColumnDefs = (): ColDef<OrderDetailRow>[] => [
  {
    headerCheckboxSelection: true,
    checkboxSelection: true,
    width: 50,
    resizable: false,
    sortable: false,
  },
  { headerName: '주문상세번호', field: 'ordDtlNo', width: 130 },
  { headerName: '주문상세상태', field: 'ordDtlStatNm', width: 140 },
  { headerName: '상품코드', field: 'goodsId', width: 140 },
  { headerName: '사이즈', field: 'sizeId', width: 100 },
  { headerName: '주문수량', field: 'ordQty', width: 100 },
  { headerName: '취소수량', field: 'cncQty', width: 100 },
  { headerName: '잔여수량', field: 'rmnQty', width: 100 },
  {
    headerName: '공급가',
    field: 'supplyAmt',
    width: 110,
    valueFormatter: (params) => formatAmount(params.value as number | null),
  },
  {
    headerName: '판매가(개당)',
    field: 'saleAmt',
    width: 120,
    valueFormatter: (params) => formatAmount(params.value as number | null),
  },
  {
    headerName: '상품쿠폰할인',
    field: 'goodsCpnDcAmt',
    width: 120,
    valueFormatter: (params) => formatAmount(params.value as number | null),
  },
  {
    headerName: '장바구니쿠폰할인',
    field: 'cartCpnDcAmt',
    width: 140,
    valueFormatter: (params) => formatAmount(params.value as number | null),
  },
  {
    headerName: '포인트할인',
    field: 'pointUseAmt',
    width: 110,
    valueFormatter: (params) => formatAmount(params.value as number | null),
  },
  {
    headerName: '실결제금액',
    field: 'finalPayAmt',
    width: 120,
    valueFormatter: (params) => formatAmount(params.value as number | null),
  },
];

// 주문 클레임 ag-grid 컬럼을 정의합니다.
const createClaimColumnDefs = (): ColDef<OrderClaimRow>[] => [
  {
    headerCheckboxSelection: true,
    checkboxSelection: true,
    width: 50,
    resizable: false,
    sortable: false,
  },
  { headerName: '클레임번호', field: 'clmNo', width: 160 },
  { headerName: '클레임 상세 구분', field: 'chgDtlGbNm', width: 130 },
  { headerName: '주문번호', field: 'ordNo', width: 170 },
  { headerName: '주문상세번호', field: 'ordDtlNo', width: 130 },
  { headerName: '클레임 상세 상태', field: 'chgDtlStatNm', width: 130 },
  { headerName: '상품코드', field: 'goodsId', width: 140 },
  { headerName: '사이즈', field: 'sizeId', width: 100 },
  {
    headerName: '클레임 사유',
    field: 'chgReasonNm',
    width: 140,
    valueFormatter: (params) => displayValue(params.value as string | null),
  },
  {
    headerName: '클레임 사유 상세',
    field: 'chgReasonDtl',
    width: 180,
    cellClass: 'text-start',
    valueFormatter: (params) => displayValue(params.value as string | null),
  },
  {
    headerName: '상품명',
    field: 'goodsNm',
    width: 220,
    cellClass: 'text-start',
    valueFormatter: (params) => displayValue(params.value as string | null),
  },
  { headerName: '클레임수량', field: 'qty', width: 100 },
  {
    headerName: '판매가(개당)',
    field: 'saleAmt',
    width: 120,
    valueFormatter: (params) => formatAmount(params.value as number | null),
  },
  {
    headerName: '상품쿠폰환불',
    field: 'goodsCpnDcAmt',
    width: 130,
    valueFormatter: (params) => formatAmount(params.value as number | null),
  },
  {
    headerName: '장바구니쿠폰환불',
    field: 'cartCpnDcAmt',
    width: 150,
    valueFormatter: (params) => formatAmount(params.value as number | null),
  },
  {
    headerName: '포인트환불',
    field: 'pointDcAmt',
    width: 120,
    valueFormatter: (params) => formatAmount(params.value as number | null),
  },
  {
    headerName: '환불예정금액',
    field: 'expectedRefundAmt',
    width: 130,
    valueFormatter: (params) => formatAmount(params.value as number | null),
  },
];

// 주문 결제 ag-grid 컬럼을 정의합니다.
const createPaymentColumnDefs = (): ColDef<OrderPaymentRow>[] => [
  { headerName: '주문번호', field: 'ordNo', width: 170 },
  {
    headerName: '클레임번호',
    field: 'clmNo',
    width: 150,
    valueFormatter: (params) => displayValue(params.value as string | null),
  },
  { headerName: '결제상태', field: 'payStatNm', width: 130 },
  { headerName: '결제수단', field: 'payMethodNm', width: 130 },
  {
    headerName: '금액',
    field: 'payAmt',
    width: 120,
    valueFormatter: (params) => formatAmount(params.value as number | null),
  },
  {
    headerName: '거래번호',
    field: 'tradeNo',
    width: 180,
    valueFormatter: (params) => displayValue(params.value as string | null),
  },
  {
    headerName: '결과',
    field: 'rspCode',
    width: 120,
    valueFormatter: (params) => displayValue(params.value as string | null),
  },
  {
    headerName: '결과메세지',
    field: 'rspMsg',
    width: 220,
    cellClass: 'text-start',
    valueFormatter: (params) => displayValue(params.value as string | null),
  },
  {
    headerName: '무통장입금 계좌',
    field: 'bankNm',
    width: 160,
    valueFormatter: (params) => displayValue(params.value as string | null),
  },
  {
    headerName: '무통장입금 계좌번호',
    field: 'bankNo',
    width: 180,
    valueFormatter: (params) => displayValue(params.value as string | null),
  },
  {
    headerName: '환불은행',
    field: 'refundBankCd',
    width: 140,
    valueFormatter: (params) => displayValue(params.value as string | null),
  },
  {
    headerName: '환불계좌번호',
    field: 'refundBankNo',
    width: 180,
    valueFormatter: (params) => displayValue(params.value as string | null),
  },
  {
    headerName: '처리일시',
    field: 'processDt',
    width: 180,
    valueFormatter: (params) => displayValue(params.value as string | null),
  },
];

// 주문 마스터 정보 테이블을 렌더링합니다.
const OrderMasterTable = ({ master }: { master: OrderMasterInfo }) => (
  <AdminFormTable>
    <tbody>
      <tr>
        <th>주문번호</th>
        <td>{displayValue(master.ordNo)}</td>
        <th>주문일시</th>
        <td>{displayValue(master.orderDt)}</td>
        <th>결제일시</th>
        <td>{displayValue(master.orderConfirmDt)}</td>
      </tr>
      <tr>
        <th>주문고객명</th>
        <td>{displayValue(master.custNm)}</td>
        <th>고객 휴대폰번호</th>
        <td>{displayValue(master.custPhoneNumber)}</td>
        <th>고객 이메일</th>
        <td>{displayValue(master.custEmail)}</td>
      </tr>
      <tr>
        <th>주문자명</th>
        <td>{displayValue(master.custNm)}</td>
        <th>받는사람 휴대폰번호</th>
        <td>{displayValue(master.custPhoneNumber)}</td>
        <th>받는사람 이메일</th>
        <td>{displayValue(master.custEmail)}</td>
      </tr>
      <tr>
        <th>받는사람 배송지</th>
        <td colSpan={5}>
          {/* 우편번호와 주소베이스를 같은 줄에, 상세주소를 다음 줄에 표시합니다. */}
          <span>
            [{displayValue(master.rcvPostNo)}] {displayValue(master.rcvAddrBase)}
          </span>
          <br />
          <span>{displayValue(master.rcvAddrDtl)}</span>
        </td>
      </tr>
      <tr>
        <th>배송비</th>
        <td>{formatAmount(master.ordDelvAmt)}</td>
        <th>배송비쿠폰할인</th>
        <td>{formatAmount(master.delvCpnDcAmt)}</td>
        <td colSpan={2} />
      </tr>
    </tbody>
  </AdminFormTable>
);

// 주문 상세 레이어팝업을 렌더링합니다.
const OrderDetailModal = ({ isOpen, ordNo, onClose }: OrderDetailModalProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<OrderDetailResponse | null>(null);
  // 취소 신청 모달 오픈 여부입니다.
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  // 취소 모달에 넘길 기본 선택 주문상세번호 목록입니다.
  const [selectedCancelOrdDtlNoList, setSelectedCancelOrdDtlNoList] = useState<number[]>([]);
  // 반품 신청 모달 오픈 여부입니다.
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  // 반품 모달에 넘길 기본 선택 주문상세번호 목록입니다.
  const [selectedReturnOrdDtlNoList, setSelectedReturnOrdDtlNoList] = useState<number[]>([]);
  // 상품 준비중 처리 진행 여부입니다.
  const [preparing, setPreparing] = useState(false);
  // 반품 철회 처리 진행 여부입니다.
  const [withdrawingReturn, setWithdrawingReturn] = useState(false);

  // ag-grid 컬럼 정의를 메모이제이션합니다.
  const columnDefs = useMemo(() => createDetailColumnDefs(), []);
  const claimColumnDefs = useMemo(() => createClaimColumnDefs(), []);
  const paymentColumnDefs = useMemo(() => createPaymentColumnDefs(), []);

  // 공통 컬럼 속성을 정의합니다.
  const defaultColDef = useMemo<ColDef>(() => ({
    resizable: true,
    sortable: false,
    editable: false,
    cellClass: 'text-center',
  }), []);

  // ag-grid 인스턴스 참조입니다.
  const gridApiRef = useRef<GridApi<OrderDetailRow> | null>(null);
  // 주문 클레임 grid 인스턴스 참조입니다.
  const claimGridApiRef = useRef<GridApi<OrderClaimRow> | null>(null);

  // 그리드 준비 시 인스턴스를 저장합니다.
  const handleGridReady = useCallback((event: GridReadyEvent<OrderDetailRow>) => {
    gridApiRef.current = event.api;
  }, []);

  // 주문 클레임 grid 준비 시 인스턴스를 저장합니다.
  const handleClaimGridReady = useCallback((event: GridReadyEvent<OrderClaimRow>) => {
    claimGridApiRef.current = event.api;
  }, []);

  // 현재 그리드에서 선택된 주문상세 행 목록을 반환합니다.
  const getSelectedDetailRows = useCallback((): OrderDetailRow[] => {
    return gridApiRef.current?.getSelectedRows() ?? [];
  }, []);

  // 현재 주문 클레임 grid에서 선택된 행 목록을 반환합니다.
  const getSelectedClaimRows = useCallback((): OrderClaimRow[] => {
    return claimGridApiRef.current?.getSelectedRows() ?? [];
  }, []);

  // 주문 상세 정보를 조회합니다.
  const fetchOrderDetail = useCallback(async (targetOrdNo: string) => {
    setLoading(true);
    setError(null);
    setDetailData(null);
    try {
      const response = await api.get('/api/admin/order/detail', {
        params: { ordNo: targetOrdNo },
      });
      setDetailData(response.data as OrderDetailResponse);
    } catch (err) {
      setError('주문 상세 정보를 불러오는 데 실패했습니다.');
      console.error('주문 상세 조회에 실패했습니다.', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 모달 오픈 시 주문 상세를 조회합니다.
  useEffect(() => {
    if (!isOpen || !ordNo) {
      return;
    }
    fetchOrderDetail(ordNo);
  }, [isOpen, ordNo, fetchOrderDetail]);

  // 취소 성공 시 상세 정보를 재조회합니다.
  const handleCancelSuccess = useCallback(() => {
    setIsCancelModalOpen(false);
    setSelectedCancelOrdDtlNoList([]);
    if (ordNo) {
      fetchOrderDetail(ordNo);
    }
  }, [ordNo, fetchOrderDetail]);

  // 취소 신청 모달을 닫고 기본 선택 상태를 초기화합니다.
  const handleCloseCancelModal = useCallback(() => {
    setIsCancelModalOpen(false);
    setSelectedCancelOrdDtlNoList([]);
  }, []);

  // 반품 신청 모달을 닫고 기본 선택 상태를 초기화합니다.
  const handleCloseReturnModal = useCallback(() => {
    setIsReturnModalOpen(false);
    setSelectedReturnOrdDtlNoList([]);
  }, []);

  // 반품 신청 성공 시 상세 정보를 재조회합니다.
  const handleReturnSuccess = useCallback(() => {
    setIsReturnModalOpen(false);
    setSelectedReturnOrdDtlNoList([]);
    if (ordNo) {
      fetchOrderDetail(ordNo);
    }
  }, [ordNo, fetchOrderDetail]);

  // 선택한 결제완료/상품준비중 주문만 대상으로 취소 신청 모달을 엽니다.
  const handleOpenCancelModal = useCallback(() => {
    const selectedRows = getSelectedDetailRows();
    if (selectedRows.length < 1 || selectedRows.some((row) => !isAdminOrderCancelableStatus(row.ordDtlStatCd))) {
      alert('취소 가능한 주문이 없습니다.');
      return;
    }

    setSelectedCancelOrdDtlNoList(selectedRows.map((row) => row.ordDtlNo));
    setIsCancelModalOpen(true);
  }, [getSelectedDetailRows]);

  // 선택한 배송완료 주문만 대상으로 반품 신청 모달을 엽니다.
  const handleOpenReturnModal = useCallback(() => {
    const selectedRows = getSelectedDetailRows();
    if (
      selectedRows.length < 1 ||
      selectedRows.some(
        (row) => !isAdminOrderReturnApplicableStatus(row.ordDtlStatCd) || row.returnApplyableYn !== true,
      )
    ) {
      alert('반품 신청 가능한 주문이 없습니다.');
      return;
    }

    setSelectedReturnOrdDtlNoList(selectedRows.map((row) => row.ordDtlNo));
    setIsReturnModalOpen(true);
  }, [getSelectedDetailRows]);

  // 선택한 반품 신청 클레임만 대상으로 반품 철회를 수행합니다.
  const handleWithdrawSelectedClaim = useCallback(async () => {
    if (!ordNo) {
      return;
    }

    const selectedClaimRows = getSelectedClaimRows();
    if (selectedClaimRows.length < 1) {
      alert('철회할 반품건을 선택해주세요.');
      return;
    }
    if (selectedClaimRows.some((claimRow) => !isAdminOrderReturnWithdrawableClaimRow(claimRow))) {
      alert('반품 신청건만 철회가 가능합니다.');
      return;
    }

    // 선택된 클레임 행만 관리자 반품 철회 요청 본문으로 변환합니다.
    const requestBody: AdminOrderReturnWithdrawRequest = {
      ordNo,
      claimItemList: selectedClaimRows.map((claimRow) => ({
        clmNo: claimRow.clmNo,
        ordDtlNo: claimRow.ordDtlNo,
      })),
    };

    setWithdrawingReturn(true);
    try {
      await api.post<AdminOrderReturnWithdrawResponse>('/api/admin/order/return/withdraw', requestBody);
      claimGridApiRef.current?.deselectAll();
      await fetchOrderDetail(ordNo);
      alert('반품 철회가 완료되었습니다.');
    } catch (actionError) {
      alert(resolveOrderDetailActionErrorMessage(actionError, '반품 철회 처리 중 오류가 발생했습니다.'));
    } finally {
      setWithdrawingReturn(false);
    }
  }, [ordNo, getSelectedClaimRows, fetchOrderDetail]);

  // 선택한 결제완료 주문을 상품 준비중 상태로 변경합니다.
  const handlePrepareSelected = useCallback(async () => {
    if (!ordNo) {
      return;
    }

    const selectedRows = getSelectedDetailRows();
    if (selectedRows.length < 1 || selectedRows.some((row) => !isAdminOrderPreparingAvailableStatus(row.ordDtlStatCd))) {
      alert('결제 완료 주문건만 선택해주세요.');
      return;
    }

    const requestBody: AdminOrderDetailStatusUpdateRequest = {
      ordNo,
      ordDtlNoList: selectedRows.map((row) => row.ordDtlNo),
    };

    setPreparing(true);
    try {
      await api.post<AdminOrderDetailStatusUpdateResponse>('/api/admin/order/detail/prepare', requestBody);
      gridApiRef.current?.deselectAll();
      await fetchOrderDetail(ordNo);
      alert('상품 준비중으로 변경되었습니다.');
    } catch (actionError) {
      alert(resolveOrderDetailActionErrorMessage(actionError, '상품 준비중 처리 중 오류가 발생했습니다.'));
    } finally {
      setPreparing(false);
    }
  }, [ordNo, getSelectedDetailRows, fetchOrderDetail]);

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* 취소 신청 레이어팝업입니다. */}
      {ordNo && (
        <OrderCancelModal
          isOpen={isCancelModalOpen}
          ordNo={ordNo}
          selectedOrdDtlNoList={selectedCancelOrdDtlNoList}
          onClose={handleCloseCancelModal}
          onSuccess={handleCancelSuccess}
        />
      )}
      {/* 반품 신청 레이어팝업입니다. */}
      {ordNo && (
        <OrderReturnModal
          isOpen={isReturnModalOpen}
          ordNo={ordNo}
          customerPhoneNumber={detailData?.master.custPhoneNumber ?? ''}
          selectedOrdDtlNoList={selectedReturnOrdDtlNoList}
          onClose={handleCloseReturnModal}
          onSuccess={handleReturnSuccess}
        />
      )}

      {/* 백드롭 영역입니다. */}
      <div
        className="modal-backdrop fade show"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="modal fade show d-block"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-dialog modal-xl modal-dialog-scrollable" role="document">
          <div className="modal-content">
            {/* 모달 헤더입니다. */}
            <div className="modal-header">
              <h5 className="modal-title">주문 상세</h5>
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
                  주문 상세 정보를 불러오는 중입니다.
                </div>
              )}

              {error && !loading && (
                <div className="alert alert-danger">{error}</div>
              )}

              {detailData && !loading && (
                <>
                  {/* 주문 마스터 정보 섹션입니다. */}
                  <h6 className="mb-2 fw-bold">주문 정보</h6>
                  <OrderMasterTable master={detailData.master} />

                  {/* 주문 상세 그리드 섹션입니다. */}
                  <div className="d-flex justify-content-between align-items-center mt-4 mb-2">
                    <h6 className="fw-bold mb-0">주문 상세 목록</h6>
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={handleOpenReturnModal}
                        disabled={loading || preparing}
                      >
                        반품 신청
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={handlePrepareSelected}
                        disabled={loading || preparing}
                      >
                        {preparing ? '처리 중...' : '상품 준비중'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={handleOpenCancelModal}
                        disabled={loading || preparing}
                      >
                        주문 취소
                      </button>
                    </div>
                  </div>
                  <div
                    className="ag-theme-alpine-dark header-center"
                    style={{ width: '100%', height: '170px' }}
                  >
                    <AgGridReact<OrderDetailRow>
                      columnDefs={columnDefs}
                      defaultColDef={defaultColDef}
                      rowData={detailData.list}
                      rowHeight={42}
                      rowSelection="multiple"
                      overlayNoRowsTemplate="주문 상세 데이터가 없습니다."
                      getRowId={(params) => String(params.data?.ordDtlNo ?? '')}
                      onGridReady={handleGridReady}
                    />
                  </div>

                  {/* 주문 클레임 목록은 데이터가 있는 경우에만 노출합니다. */}
                  {(detailData.claimList?.length ?? 0) > 0 && (
                    <>
                      <div className="d-flex justify-content-between align-items-center mt-4 mb-2">
                        <h6 className="fw-bold mb-0">주문 클레임 목록</h6>
                        <button
                          type="button"
                          className="btn btn-sm btn-warning"
                          onClick={handleWithdrawSelectedClaim}
                          disabled={loading || withdrawingReturn}
                        >
                          {withdrawingReturn ? '처리 중...' : '반품 철회'}
                        </button>
                      </div>
                      <div
                        className="ag-theme-alpine-dark header-center"
                        style={{ width: '100%', height: '240px' }}
                      >
                        <AgGridReact<OrderClaimRow>
                          columnDefs={claimColumnDefs}
                          defaultColDef={defaultColDef}
                          rowData={detailData.claimList}
                          rowHeight={42}
                          rowSelection="multiple"
                          overlayNoRowsTemplate="주문 클레임 데이터가 없습니다."
                          getRowId={(params) => `${params.data?.clmNo ?? ''}-${params.data?.ordDtlNo ?? ''}-${params.data?.chgDtlGbCd ?? ''}`}
                          onGridReady={handleClaimGridReady}
                        />
                      </div>
                    </>
                  )}
                  {(detailData.paymentList?.length ?? 0) > 0 && (
                    <>
                      <h6 className="fw-bold mb-2 mt-4">결제 정보</h6>
                      <div
                        className="ag-theme-alpine-dark header-center"
                        style={{ width: '100%', height: '220px' }}
                      >
                        <AgGridReact<OrderPaymentRow>
                          columnDefs={paymentColumnDefs}
                          defaultColDef={defaultColDef}
                          rowData={detailData.paymentList}
                          rowHeight={42}
                          overlayNoRowsTemplate="결제 데이터가 없습니다."
                          getRowId={(params) =>
                            [
                              params.data?.ordNo ?? '',
                              params.data?.clmNo ?? '',
                              params.data?.tradeNo ?? '',
                              params.data?.payStatCd ?? '',
                              params.data?.processDt ?? '',
                            ].join('-')
                          }
                        />
                      </div>
                    </>
                  )}
                </>
              )}
            </div>

            {/* 모달 푸터입니다. */}
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                aria-label="닫기"
                onClick={onClose}
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

export default OrderDetailModal;
