import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AgGridReact } from '@/components/common/agGrid/AgGridReact';
import type {
  ColDef,
  GridApi,
  GridReadyEvent,
  IHeaderParams,
  ICellRendererParams,
  IDatasource,
  IGetRowsParams,
} from 'ag-grid-community';
import api from '@/utils/axios/axios';
import type { CommonCode } from '@/components/goods/types';
import type {
  AdminOrderStartDeliveryPrepareRequest,
  AdminOrderStartDeliveryStatusRequest,
  AdminOrderStartDeliveryStatusResponse,
  OrderStartDeliveryListResponse,
  OrderStartDeliveryRow,
  OrderStartDeliverySearchParams,
} from '@/components/order/startDeliveryTypes';
import {
  getOrderStartDeliveryActionEndpoint,
  getOrderStartDeliveryActionLabel,
  getOrderStartDeliveryActionSuccessMessage,
  isOrderStartDeliveryPrepareEditableStatus,
  ORDER_START_DELIVERY_INVOICE_NO_MAX_LENGTH,
  ORDER_START_DELIVERY_PAGE_SIZE,
  sanitizeOrderStartDeliveryInvoiceNo,
} from '@/components/order/utils/orderStartDeliveryUtils';

interface OrderStartDeliveryGridProps {
  // 배송 시작 관리 조회 조건입니다.
  searchParams: OrderStartDeliverySearchParams;
  // 배송업체 코드 목록입니다.
  deliveryCompanyList: CommonCode[];
  // 로딩 상태 전달 함수입니다.
  onLoadingChange?: (loading: boolean) => void;
}

// 값이 없을 때 '-'로 표시합니다.
const displayValue = (value?: string | null): string => {
  if (!value) {
    return '-';
  }
  return value;
};

// 배송 시작 관리 액션 API 오류 메시지를 안전하게 추출합니다.
const resolveOrderStartDeliveryActionErrorMessage = (error: unknown, fallbackMessage: string): string => {
  const errorResponse = error as { response?: { data?: { message?: string } } };
  const message = errorResponse.response?.data?.message;
  if (typeof message === 'string' && message.trim()) {
    return message;
  }
  return fallbackMessage;
};

type OrderStartDeliveryHeaderCheckboxProps = IHeaderParams<OrderStartDeliveryRow>;

// 배송 시작 관리 현재 페이지 전체 선택 체크박스를 렌더링합니다.
const OrderStartDeliveryHeaderCheckbox = ({ api }: OrderStartDeliveryHeaderCheckboxProps) => {
  const checkboxRef = useRef<HTMLInputElement | null>(null);
  const [checked, setChecked] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [indeterminate, setIndeterminate] = useState(false);

  // 현재 페이지 기준 전체 선택 상태를 다시 계산합니다.
  const syncHeaderCheckboxState = useCallback(() => {
    let selectableRowCount = 0;
    let selectedRowCount = 0;
    const displayedRowCount = api.getDisplayedRowCount();

    // 현재 페이지에 표시된 행만 순회해 선택 상태를 집계합니다.
    for (let rowIndex = 0; rowIndex < displayedRowCount; rowIndex += 1) {
      const rowNode = api.getDisplayedRowAtIndex(rowIndex);
      if (!rowNode?.data) {
        continue;
      }
      selectableRowCount += 1;
      if (rowNode.isSelected()) {
        selectedRowCount += 1;
      }
    }

    const hasSelectableRow = selectableRowCount > 0;
    const isChecked = hasSelectableRow && selectedRowCount === selectableRowCount;
    const isIndeterminate = selectedRowCount > 0 && selectedRowCount < selectableRowCount;

    // 계산된 체크/비활성/부분선택 상태를 React 상태에 반영합니다.
    setDisabled(!hasSelectableRow);
    setChecked(isChecked);
    setIndeterminate(isIndeterminate);

    // 실제 input indeterminate 속성도 함께 동기화합니다.
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = isIndeterminate;
    }
  }, [api]);

  // 그리드 선택/페이지/모델 변경 시 헤더 체크박스 상태를 동기화합니다.
  useEffect(() => {
    syncHeaderCheckboxState();

    // 현재 페이지 데이터 상태가 바뀌는 이벤트에 맞춰 체크 상태를 다시 계산합니다.
    api.addEventListener('selectionChanged', syncHeaderCheckboxState);
    api.addEventListener('modelUpdated', syncHeaderCheckboxState);
    api.addEventListener('paginationChanged', syncHeaderCheckboxState);

    return () => {
      api.removeEventListener('selectionChanged', syncHeaderCheckboxState);
      api.removeEventListener('modelUpdated', syncHeaderCheckboxState);
      api.removeEventListener('paginationChanged', syncHeaderCheckboxState);
    };
  }, [api, syncHeaderCheckboxState]);

  // 헤더 체크박스 클릭 시 현재 페이지 행을 전체 선택/해제합니다.
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const shouldSelect = event.target.checked;
    const displayedRowCount = api.getDisplayedRowCount();

    // 보이는 페이지의 각 행을 순회하며 선택 상태를 일괄 반영합니다.
    for (let rowIndex = 0; rowIndex < displayedRowCount; rowIndex += 1) {
      const rowNode = api.getDisplayedRowAtIndex(rowIndex);
      if (!rowNode?.data) {
        continue;
      }
      rowNode.setSelected(shouldSelect);
    }
    syncHeaderCheckboxState();
  };

  // ag-grid 기본 행 체크박스와 동일한 클래스 조합을 계산합니다.
  const checkboxWrapperClassName = [
    'ag-wrapper',
    'ag-input-wrapper',
    'ag-checkbox-input-wrapper',
    checked ? 'ag-checked' : '',
    indeterminate ? 'ag-indeterminate' : '',
    disabled ? 'ag-disabled' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className="d-flex justify-content-center align-items-center w-100 h-100">
      <div className="ag-selection-checkbox m-0" role="presentation">
        <div className="ag-checkbox ag-input-field" role="presentation">
          <div className={checkboxWrapperClassName} role="presentation">
            <input
              ref={checkboxRef}
              type="checkbox"
              className="ag-input-field-input ag-checkbox-input"
              checked={checked}
              disabled={disabled}
              tabIndex={-1}
              aria-checked={indeterminate ? 'mixed' : checked}
              onChange={handleChange}
              aria-label="현재 페이지 전체 선택"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// 배송 시작 관리 그리드를 렌더링합니다.
const OrderStartDeliveryGrid = ({
  searchParams,
  deliveryCompanyList,
  onLoadingChange,
}: OrderStartDeliveryGridProps) => {
  const gridApiRef = useRef<GridApi<OrderStartDeliveryRow> | null>(null);
  const [processing, setProcessing] = useState(false);

  // 배송업체 코드를 이름으로 빠르게 변환하기 위한 맵입니다.
  const deliveryCompanyNameMap = useMemo(() => (
    new Map(deliveryCompanyList.map((item) => [item.cd, item.cdNm]))
  ), [deliveryCompanyList]);

  // 현재 조회 상태에 따라 배송정보 편집 가능 여부를 계산합니다.
  const isPrepareMode = useMemo(
    () => isOrderStartDeliveryPrepareEditableStatus(searchParams.ordDtlStatCd),
    [searchParams.ordDtlStatCd],
  );

  // 현재 조회 상태에 맞는 액션 버튼 정보를 계산합니다.
  const actionLabel = useMemo(
    () => getOrderStartDeliveryActionLabel(searchParams.ordDtlStatCd),
    [searchParams.ordDtlStatCd],
  );
  const actionEndpoint = useMemo(
    () => getOrderStartDeliveryActionEndpoint(searchParams.ordDtlStatCd),
    [searchParams.ordDtlStatCd],
  );
  const actionSuccessMessage = useMemo(
    () => getOrderStartDeliveryActionSuccessMessage(searchParams.ordDtlStatCd),
    [searchParams.ordDtlStatCd],
  );

  // 상위 컴포넌트에 로딩 상태를 전달합니다.
  const notifyLoading = useCallback((loading: boolean) => {
    if (onLoadingChange) {
      onLoadingChange(loading);
    }
  }, [onLoadingChange]);

  // 배송업체 셀을 렌더링합니다.
  const renderDeliveryCompanyCell = useCallback((params: ICellRendererParams<OrderStartDeliveryRow>) => {
    const rowData = params.data;
    const currentCompanyCode = rowData?.delvCompCd ?? '';

    // 상품 준비중이 아니면 현재 저장된 배송업체명만 읽기 전용으로 표시합니다.
    if (!isPrepareMode || !rowData) {
      const currentCompanyName = deliveryCompanyNameMap.get(currentCompanyCode) ?? rowData?.delvCompNm ?? '';
      return <span>{displayValue(currentCompanyName)}</span>;
    }

    // 상품 준비중 조회에서는 셀 안에서 바로 배송업체를 선택할 수 있게 제공합니다.
    return (
      <select
        className="form-select form-select-sm"
        value={currentCompanyCode}
        onChange={(event) => {
          const nextCompanyCode = event.target.value;
          params.node.setDataValue('delvCompCd', nextCompanyCode);
          if (rowData) {
            rowData.delvCompNm = deliveryCompanyNameMap.get(nextCompanyCode) ?? '';
          }
        }}
      >
        <option value="">배송업체 선택</option>
        {deliveryCompanyList.map((item) => (
          <option key={`delivery-company-${rowData.ordNo}-${rowData.ordDtlNo}-${item.cd}`} value={item.cd}>
            {item.cdNm}
          </option>
        ))}
      </select>
    );
  }, [deliveryCompanyList, deliveryCompanyNameMap, isPrepareMode]);

  // 송장번호 셀을 렌더링합니다.
  const renderInvoiceNoCell = useCallback((params: ICellRendererParams<OrderStartDeliveryRow>) => {
    const currentInvoiceNo = params.data?.invoiceNo ?? '';

    // 상품 준비중이 아니면 현재 저장된 송장번호를 읽기 전용으로 표시합니다.
    if (!isPrepareMode || !params.data) {
      return <span>{displayValue(currentInvoiceNo)}</span>;
    }

    // 상품 준비중 조회에서는 숫자만 입력 가능한 송장번호 입력창을 제공합니다.
    return (
      <input
        type="text"
        className="form-control form-control-sm"
        inputMode="numeric"
        maxLength={ORDER_START_DELIVERY_INVOICE_NO_MAX_LENGTH}
        value={currentInvoiceNo}
        onChange={(event) => {
          const sanitizedInvoiceNo = sanitizeOrderStartDeliveryInvoiceNo(event.target.value);
          params.node.setDataValue('invoiceNo', sanitizedInvoiceNo);
        }}
      />
    );
  }, [isPrepareMode]);

  // 배송 시작 관리 컬럼을 정의합니다.
  const columnDefs = useMemo<ColDef<OrderStartDeliveryRow>[]>(() => ([
    {
      headerName: '',
      headerComponent: OrderStartDeliveryHeaderCheckbox,
      checkboxSelection: true,
      width: 60,
      resizable: false,
      sortable: false,
    },
    { headerName: '주문번호', field: 'ordNo', width: 180 },
    { headerName: '주문상세번호', field: 'ordDtlNo', width: 130 },
    { headerName: '상품명', field: 'goodsNm', width: 260, cellClass: 'text-start' },
    { headerName: '상품코드', field: 'goodsId', width: 140 },
    { headerName: '사이즈코드', field: 'sizeId', width: 110 },
    {
      headerName: '배송업체',
      field: 'delvCompCd',
      width: 180,
      cellRenderer: renderDeliveryCompanyCell,
    },
    {
      headerName: '송장번호',
      field: 'invoiceNo',
      width: 180,
      cellRenderer: renderInvoiceNoCell,
    },
    {
      headerName: '결제일',
      field: 'payDt',
      width: 180,
      valueFormatter: (params) => displayValue(params.value as string | null | undefined),
    },
  ]), [renderDeliveryCompanyCell, renderInvoiceNoCell]);

  // 공통 컬럼 속성을 정의합니다.
  const defaultColDef = useMemo<ColDef<OrderStartDeliveryRow>>(() => ({
    resizable: true,
    sortable: false,
    editable: false,
    cellClass: 'text-center',
  }), []);

  // 배송 시작 관리 목록 조회 데이터소스를 생성합니다.
  const createDataSource = useCallback((): IDatasource => ({
    getRows: async (params: IGetRowsParams) => {
      // ag-grid 요청 범위를 페이지 번호로 변환합니다.
      const startRow = params.startRow ?? 0;
      const page = Math.floor(startRow / ORDER_START_DELIVERY_PAGE_SIZE) + 1;

      notifyLoading(true);
      try {
        // 현재 검색 상태 기준으로 배송 시작 관리 목록을 조회합니다.
        const response = await api.get('/api/admin/order/start/delivery/list', {
          params: {
            ...searchParams,
            page,
            pageSize: ORDER_START_DELIVERY_PAGE_SIZE,
          },
        });
        const data = (response.data || {}) as OrderStartDeliveryListResponse;
        params.successCallback(data.list || [], data.totalCount || 0);
      } catch (error) {
        console.error('배송 시작 관리 목록 조회에 실패했습니다.', error);
        params.failCallback();
      } finally {
        notifyLoading(false);
      }
    },
  }), [notifyLoading, searchParams]);

  // ag-grid 버전에 맞춰 데이터소스를 연결합니다.
  const applyDatasource = useCallback((apiInstance: GridApi<OrderStartDeliveryRow>, datasource: IDatasource) => {
    if (typeof (apiInstance as any).setGridOption === 'function') {
      (apiInstance as any).setGridOption('datasource', datasource);
      return;
    }
    if (typeof (apiInstance as any).setDatasource === 'function') {
      (apiInstance as any).setDatasource(datasource);
    }
  }, []);

  // 그리드 준비 시 초기 데이터소스를 연결합니다.
  const handleGridReady = useCallback((event: GridReadyEvent<OrderStartDeliveryRow>) => {
    gridApiRef.current = event.api;
    applyDatasource(event.api, createDataSource());
  }, [applyDatasource, createDataSource]);

  // 현재 그리드에서 선택된 행 목록을 반환합니다.
  const getSelectedRows = useCallback((): OrderStartDeliveryRow[] => {
    return gridApiRef.current?.getSelectedRows() ?? [];
  }, []);

  // 배송 시작 관리 목록을 현재 검색 조건으로 다시 조회합니다.
  const refreshGrid = useCallback(() => {
    if (!gridApiRef.current) {
      return;
    }

    // 무한 스크롤 캐시를 새로고침할 수 있으면 현재 페이지 기준으로 다시 조회합니다.
    if (typeof (gridApiRef.current as any).refreshInfiniteCache === 'function') {
      (gridApiRef.current as any).refreshInfiniteCache();
      return;
    }

    // 캐시 새로고침 API가 없으면 데이터소스를 다시 연결합니다.
    applyDatasource(gridApiRef.current, createDataSource());
  }, [applyDatasource, createDataSource]);

  // 액션 버튼 클릭 시 현재 상태에 맞는 API를 호출합니다.
  const handleAction = useCallback(async () => {
    if (!actionEndpoint || !actionSuccessMessage) {
      return;
    }

    // 편집 중인 셀 값을 먼저 확정한 뒤 선택 데이터를 읽습니다.
    gridApiRef.current?.stopEditing();
    const selectedRows = getSelectedRows();
    if (selectedRows.length < 1) {
      alert('선택된 주문건이 없습니다.');
      return;
    }

    let requestBody: AdminOrderStartDeliveryPrepareRequest | AdminOrderStartDeliveryStatusRequest;
    if (isPrepareMode) {
      const prepareRows = selectedRows.map((row) => ({
        ...row,
        invoiceNo: sanitizeOrderStartDeliveryInvoiceNo(row.invoiceNo || ''),
      }));

      // 배송 준비중 변경 시 배송업체와 송장번호를 모두 확인합니다.
      if (prepareRows.some((row) => !row.delvCompCd)) {
        alert('배송업체를 선택해주세요.');
        return;
      }
      if (prepareRows.some((row) => !row.invoiceNo)) {
        alert('송장번호를 입력해주세요.');
        return;
      }

      requestBody = {
        itemList: prepareRows.map((row) => ({
          ordNo: row.ordNo,
          ordDtlNo: row.ordDtlNo,
          delvCompCd: row.delvCompCd,
          invoiceNo: row.invoiceNo,
        })),
      };
    } else {
      // 배송중/배송완료는 복합키만 전달해 상태만 변경합니다.
      requestBody = {
        itemList: selectedRows.map((row) => ({
          ordNo: row.ordNo,
          ordDtlNo: row.ordDtlNo,
        })),
      };
    }

    setProcessing(true);
    try {
      await api.post<AdminOrderStartDeliveryStatusResponse>(actionEndpoint, requestBody);
      gridApiRef.current?.deselectAll();
      refreshGrid();
      alert(actionSuccessMessage);
    } catch (error) {
      alert(resolveOrderStartDeliveryActionErrorMessage(error, `${actionLabel} 처리 중 오류가 발생했습니다.`));
    } finally {
      setProcessing(false);
    }
  }, [
    actionEndpoint,
    actionLabel,
    actionSuccessMessage,
    getSelectedRows,
    isPrepareMode,
    refreshGrid,
  ]);

  // 검색 조건이 바뀌면 목록을 다시 조회합니다.
  useEffect(() => {
    if (!gridApiRef.current) {
      return;
    }

    // 조회 상태 변경 시 기존 선택을 해제하고 최신 데이터소스를 다시 바인딩합니다.
    gridApiRef.current.deselectAll();
    applyDatasource(gridApiRef.current, createDataSource());
  }, [applyDatasource, createDataSource]);

  return (
    <>
      <div className="d-flex justify-content-start mb-3">
        <button
          type="button"
          className="btn btn-primary"
          disabled={processing || !actionLabel}
          onClick={handleAction}
        >
          {processing ? `${actionLabel} 처리중...` : actionLabel}
        </button>
      </div>

      <div className="ag-theme-alpine-dark header-center order-start-delivery-grid-theme" style={{ width: '100%', height: '560px' }}>
        <AgGridReact<OrderStartDeliveryRow>
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          rowModelType="infinite"
          cacheBlockSize={ORDER_START_DELIVERY_PAGE_SIZE}
          pagination
          paginationPageSize={ORDER_START_DELIVERY_PAGE_SIZE}
          rowSelection="multiple"
          rowHeight={48}
          suppressRowClickSelection
          overlayNoRowsTemplate="데이터가 없습니다."
          getRowId={(params) => `${params.data?.ordNo ?? ''}-${params.data?.ordDtlNo ?? ''}`}
          onGridReady={handleGridReady}
        />
      </div>
    </>
  );
};

export default OrderStartDeliveryGrid;
