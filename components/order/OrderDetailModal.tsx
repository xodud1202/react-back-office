import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef, GridReadyEvent } from 'ag-grid-community';
import api from '@/utils/axios/axios';
import AdminFormTable from '@/components/common/AdminFormTable';
import type { OrderDetailResponse, OrderDetailRow, OrderMasterInfo } from '@/components/order/types';

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

// 주문 상세 ag-grid 컬럼을 정의합니다.
const createDetailColumnDefs = (): ColDef<OrderDetailRow>[] => [
  { headerName: '주문상세번호', field: 'ordDtlNo', width: 130 },
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

  // ag-grid 컬럼 정의를 메모이제이션합니다.
  const columnDefs = useMemo(() => createDetailColumnDefs(), []);

  // 공통 컬럼 속성을 정의합니다.
  const defaultColDef = useMemo<ColDef<OrderDetailRow>>(() => ({
    resizable: true,
    sortable: false,
    editable: false,
    cellClass: 'text-center',
  }), []);

  // ag-grid 인스턴스 참조입니다.
  const gridApiRef = useRef<import('ag-grid-community').GridApi<OrderDetailRow> | null>(null);

  // 그리드 준비 시 인스턴스를 저장합니다.
  const handleGridReady = useCallback((event: GridReadyEvent<OrderDetailRow>) => {
    gridApiRef.current = event.api;
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

  if (!isOpen) {
    return null;
  }

  return (
    <>
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
                className="btn-close"
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
                  <h6 className="mt-4 mb-2 fw-bold">주문 상세 목록</h6>
                  <div
                    className="ag-theme-alpine-dark header-center"
                    style={{ width: '100%', height: '300px' }}
                  >
                    <AgGridReact<OrderDetailRow>
                      columnDefs={columnDefs}
                      defaultColDef={defaultColDef}
                      rowData={detailData.list}
                      rowHeight={42}
                      overlayNoRowsTemplate="주문 상세 데이터가 없습니다."
                      getRowId={(params) => String(params.data?.ordDtlNo ?? '')}
                      onGridReady={handleGridReady}
                    />
                  </div>
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
