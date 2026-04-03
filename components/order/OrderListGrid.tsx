import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { AgGridReact } from '@/components/common/agGrid/AgGridReact';
import type {
  ColDef,
  GridApi,
  GridReadyEvent,
  IDatasource,
  IGetRowsParams,
  ICellRendererParams,
} from 'ag-grid-community';
import api from '@/utils/axios/axios';
import type { OrderGridRow, OrderListResponse, OrderListRow, OrderSearchParams } from '@/components/order/types';
import { ORDER_LIST_PAGE_SIZE } from '@/components/order/types';

interface OrderListGridProps {
  // 주문 목록 조회 조건입니다.
  searchParams: OrderSearchParams;
  // 주문번호 클릭 함수입니다.
  onOrderClick: (ordNo: string) => void;
  // 로딩 상태 전달 함수입니다.
  onLoadingChange?: (loading: boolean) => void;
}

// 금액을 천 단위 구분 문자열로 변환합니다.
const formatAmount = (value?: number | null): string => {
  // 빈 값은 0으로 표시합니다.
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '0';
  }
  return value.toLocaleString('ko-KR');
};

// 금액 컬럼 정의를 공통 생성합니다.
const createAmountColumn = (headerName: string, field: keyof OrderGridRow, width = 120): ColDef<OrderGridRow> => ({
  headerName,
  field,
  width,
  valueFormatter: (params) => formatAmount(params.value as number | null | undefined),
});

// 현재 조회 블록 기준으로 주문번호 병합 메타데이터를 계산합니다.
const buildOrderGridRows = (list: OrderListRow[]): OrderGridRow[] => {
  // 같은 주문번호 건수를 현재 블록 기준으로 집계합니다.
  const ordNoCountMap = new Map<string, number>();
  list.forEach((item) => {
    ordNoCountMap.set(item.ordNo, (ordNoCountMap.get(item.ordNo) ?? 0) + 1);
  });

  // 각 주문번호의 첫 행만 표시하도록 메타데이터를 구성합니다.
  const renderedOrdNoSet = new Set<string>();
  return list.map((item) => {
    const isFirstRow = !renderedOrdNoSet.has(item.ordNo);
    renderedOrdNoSet.add(item.ordNo);

    return {
      ...item,
      ordNoRowSpan: isFirstRow ? ordNoCountMap.get(item.ordNo) ?? 1 : 1,
      ordNoDisplay: isFirstRow ? item.ordNo : '',
    };
  });
};

// 주문 목록 그리드를 렌더링합니다.
const OrderListGrid = ({ searchParams, onOrderClick, onLoadingChange }: OrderListGridProps) => {
  const gridApiRef = useRef<GridApi<OrderGridRow> | null>(null);

  // 상위 컴포넌트에 로딩 상태를 전달합니다.
  const notifyLoading = useCallback((loading: boolean) => {
    if (onLoadingChange) {
      onLoadingChange(loading);
    }
  }, [onLoadingChange]);

  // 주문 목록 컬럼을 정의합니다.
  const columnDefs = useMemo<ColDef<OrderGridRow>[]>(() => ([
    {
      headerName: '주문번호',
      field: 'ordNoDisplay',
      width: 180,
      cellClass: (params) => {
        // placeholder 셀(병합 영역 내 빈 행)은 별도 클래스 적용합니다.
        if (!params.data?.ordNoDisplay) {
          return 'order-no-merged-cell order-no-placeholder-cell text-center';
        }
        // rowSpan > 1 인 병합 셀만 하단 구분선 클래스를 추가합니다.
        const isSpanned = (params.data?.ordNoRowSpan ?? 1) > 1;
        return `order-no-merged-cell order-no-parent-cell${isSpanned ? ' order-no-spanned-cell' : ''} text-center`;
      },
      rowSpan: (params) => params.data?.ordNoRowSpan ?? 1,
      cellRenderer: (params: ICellRendererParams<OrderGridRow, string>) => {
        // 병합 셀의 첫 행에서만 버튼을 렌더링합니다.
        if (!params.data?.ordNoDisplay) {
          return '';
        }

        return (
          <button
            type="button"
            className="btn btn-link p-0"
            onClick={() => onOrderClick(params.data!.ordNo)}
          >
            {params.data.ordNoDisplay}
          </button>
        );
      },
    },
    { headerName: '주문상세번호', field: 'ordDtlNo', width: 130 },
    { headerName: '주문일시', field: 'orderDt', width: 180 },
    { headerName: '주문상세상태', field: 'ordDtlStatNm', width: 150 },
    { headerName: '상품코드', field: 'goodsId', width: 140 },
    { headerName: '사이즈코드', field: 'sizeId', width: 120 },
    createAmountColumn('공급가', 'supplyAmt'),
    createAmountColumn('판매가', 'saleAmt'),
    createAmountColumn('실결제가', 'finalPayAmt'),
    createAmountColumn('상품쿠폰', 'goodsCouponDiscountAmt'),
    createAmountColumn('장바구니쿠폰', 'cartCouponDiscountAmt', 140),
    createAmountColumn('포인트사용', 'pointUseAmt', 130),
    createAmountColumn('배송비금액', 'deliveryFeeAmt', 130),
  ]), [onOrderClick]);

  // 공통 컬럼 속성을 정의합니다.
  const defaultColDef = useMemo<ColDef<OrderGridRow>>(() => ({
    resizable: true,
    sortable: false,
    editable: false,
    cellClass: 'text-center',
  }), []);

  // 주문 목록 조회 데이터소스를 생성합니다.
  const createDataSource = useCallback((): IDatasource => ({
    getRows: async (params: IGetRowsParams) => {
      // ag-grid 요청 범위를 페이지 번호로 변환합니다.
      const startRow = params.startRow ?? 0;
      const page = Math.floor(startRow / ORDER_LIST_PAGE_SIZE) + 1;

      notifyLoading(true);
      try {
        // 검색 조건 기반으로 주문 목록을 조회합니다.
        const response = await api.get('/api/admin/order/list', {
          params: {
            ...searchParams,
            page,
            pageSize: ORDER_LIST_PAGE_SIZE,
          },
        });
        const data = (response.data || {}) as OrderListResponse;
        params.successCallback(buildOrderGridRows(data.list || []), data.totalCount || 0);
      } catch (error) {
        console.error('주문 목록 조회에 실패했습니다.', error);
        params.failCallback();
      } finally {
        notifyLoading(false);
      }
    },
  }), [notifyLoading, searchParams]);

  // ag-grid 버전에 맞춰 데이터소스를 연결합니다.
  const applyDatasource = useCallback((apiInstance: GridApi<OrderGridRow>, datasource: IDatasource) => {
    if (typeof (apiInstance as any).setGridOption === 'function') {
      (apiInstance as any).setGridOption('datasource', datasource);
      return;
    }
    if (typeof (apiInstance as any).setDatasource === 'function') {
      (apiInstance as any).setDatasource(datasource);
    }
  }, []);

  // 그리드 준비 시 초기 데이터소스를 연결합니다.
  const handleGridReady = useCallback((event: GridReadyEvent<OrderGridRow>) => {
    gridApiRef.current = event.api;
    applyDatasource(event.api, createDataSource());
  }, [applyDatasource, createDataSource]);

  // 검색 조건이 바뀌면 목록을 다시 조회합니다.
  useEffect(() => {
    if (!gridApiRef.current) {
      return;
    }

    // 현재 그리드 인스턴스에 최신 데이터소스를 다시 바인딩합니다.
    applyDatasource(gridApiRef.current, createDataSource());
  }, [applyDatasource, createDataSource]);

  return (
    <div className="ag-theme-alpine-dark header-center order-list-grid-theme" style={{ width: '100%', height: '560px' }}>
      <AgGridReact<OrderGridRow>
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        rowModelType="infinite"
        cacheBlockSize={ORDER_LIST_PAGE_SIZE}
        pagination
        paginationPageSize={ORDER_LIST_PAGE_SIZE}
        rowHeight={42}
        suppressRowTransform
        overlayNoRowsTemplate="데이터가 없습니다."
        getRowId={(params) => `${params.data?.ordNo ?? ''}-${params.data?.ordDtlNo ?? ''}`}
        onGridReady={handleGridReady}
      />
    </div>
  );
};

export default OrderListGrid;
