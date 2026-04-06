import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AgGridReact } from '@/components/common/agGrid/AgGridReact';
import OrderReturnPickupCompleteModal from '@/components/order/OrderReturnPickupCompleteModal';
import type {
  CellStyle,
  ColDef,
  GridApi,
  GridReadyEvent,
  ICellRendererParams,
  IHeaderParams,
  RowSelectedEvent,
} from 'ag-grid-community';
import api from '@/utils/axios/axios';
import type { CommonCode } from '@/components/goods/types';
import type {
  AdminOrderReturnManageStatusResponse,
  AdminOrderReturnPickupRequest,
  AdminOrderReturnPickupStartRequest,
  OrderReturnManageGridRow,
  OrderReturnManageListResponse,
  OrderReturnManageRow,
  OrderReturnManageSearchParams,
} from '@/components/order/returnManageTypes';
import {
  ORDER_RETURN_MANAGE_INVOICE_NO_MAX_LENGTH,
  ORDER_RETURN_MANAGE_PAGE_SIZE,
  isOrderReturnManageEditableStatus,
  isOrderReturnManagePickupCompletePendingStatus,
  isOrderReturnManagePickupStartStatus,
  sanitizeOrderReturnManageInvoiceNo,
} from '@/components/order/utils/orderReturnManageUtils';

interface OrderReturnManageGridProps {
  // 반품 회수 관리 조회 조건입니다.
  searchParams: OrderReturnManageSearchParams;
  // 택배사 코드 목록입니다.
  deliveryCompanyList: CommonCode[];
  // 로딩 상태 전달 함수입니다.
  onLoadingChange?: (loading: boolean) => void;
}

type OrderReturnManageProcessingAction = 'save' | 'start' | null;

interface ClaimEditableValuePatch {
  // 회수 택배사 코드입니다.
  delvCompCd?: string;
  // 회수 택배사명입니다.
  delvCompNm?: string;
  // 회수 송장번호입니다.
  invoiceNo?: string;
}

interface ClaimSelectionHeaderProps extends IHeaderParams<OrderReturnManageGridRow> {
  // 전체 선택 여부입니다.
  checked: boolean;
  // 일부 선택 여부입니다.
  indeterminate: boolean;
  // 헤더 체크박스 비활성 여부입니다.
  disabled: boolean;
  // 체크 상태 변경 함수입니다.
  onToggle: (checked: boolean) => void;
}

const ORDER_RETURN_MANAGE_CHECKBOX_COL_ID = '__claimSelection__';
const ORDER_RETURN_MANAGE_PAGE_BUTTON_COUNT = 5;

// 헤더 전체 선택 체크박스를 렌더링합니다.
const ClaimSelectionHeader = ({
  checked,
  indeterminate,
  disabled,
  onToggle,
}: ClaimSelectionHeaderProps) => {
  const checkboxRef = useRef<HTMLInputElement>(null);

  // 헤더 체크박스의 indeterminate 상태를 동기화합니다.
  useEffect(() => {
    if (!checkboxRef.current) {
      return;
    }
    checkboxRef.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <div className="d-flex align-items-center justify-content-center w-100 h-100">
      <input
        ref={checkboxRef}
        type="checkbox"
        className="form-check-input m-0"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onToggle(event.target.checked)}
      />
    </div>
  );
};

// 값이 없으면 '-'로 표시합니다.
const displayValue = (value?: string | null): string => {
  if (!value) {
    return '-';
  }
  return value;
};

// 반품 회수 관리 액션 API 오류 메시지를 안전하게 추출합니다.
const resolveOrderReturnManageActionErrorMessage = (error: unknown, fallbackMessage: string): string => {
  const errorResponse = error as { response?: { data?: { message?: string } } };
  const message = errorResponse.response?.data?.message;
  if (typeof message === 'string' && message.trim()) {
    return message;
  }
  return fallbackMessage;
};

// 현재 페이지 데이터에 클레임 병합 메타데이터를 부여합니다.
const buildOrderReturnManageGridRows = (list: OrderReturnManageRow[]): OrderReturnManageGridRow[] => {
  const claimCountMap = new Map<string, number>();
  list.forEach((item) => {
    claimCountMap.set(item.clmNo, (claimCountMap.get(item.clmNo) ?? 0) + 1);
  });

  const renderedClaimSet = new Set<string>();
  return list.map((item) => {
    const isFirstRow = !renderedClaimSet.has(item.clmNo);
    renderedClaimSet.add(item.clmNo);

    return {
      ...item,
      claimGroupFirstRowYn: isFirstRow,
      claimGroupRowSpan: isFirstRow ? claimCountMap.get(item.clmNo) ?? 1 : 1,
      clmNoDisplay: isFirstRow ? item.clmNo : '',
    };
  });
};

// 전체 클레임 건수 기준 총 페이지 수를 계산합니다.
const resolveOrderReturnManageTotalPageCount = (totalCount: number): number => {
  if (totalCount < 1) {
    return 1;
  }
  return Math.max(1, Math.ceil(totalCount / ORDER_RETURN_MANAGE_PAGE_SIZE));
};

// 현재 페이지 기준 페이지 번호 목록을 계산합니다.
const resolveOrderReturnManagePageNumberList = (currentPage: number, totalPageCount: number): number[] => {
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPageCount);
  const halfRange = Math.floor(ORDER_RETURN_MANAGE_PAGE_BUTTON_COUNT / 2);
  const startPage = Math.max(1, safeCurrentPage - halfRange);
  const endPage = Math.min(totalPageCount, startPage + ORDER_RETURN_MANAGE_PAGE_BUTTON_COUNT - 1);
  const pageNumberList: number[] = [];
  for (let pageNo = Math.max(1, endPage - ORDER_RETURN_MANAGE_PAGE_BUTTON_COUNT + 1); pageNo <= endPage; pageNo += 1) {
    pageNumberList.push(pageNo);
  }
  return pageNumberList;
};

// 병합 셀 표시용 인라인 스타일을 계산합니다.
const resolveMergedCellStyle = (rowData?: OrderReturnManageGridRow | null): CellStyle => {
  if (!rowData?.claimGroupFirstRowYn) {
    return {
      backgroundColor: 'transparent',
      borderTop: '0',
      borderBottom: '0',
    };
  }

  const result: CellStyle = {
    backgroundColor: 'var(--ag-background-color)',
    zIndex: 1,
  };
  if (rowData.claimGroupRowSpan > 1) {
    result.borderBottom = 'var(--ag-row-border-width, 1px) solid var(--ag-row-border-color, var(--ag-border-color))';
  }
  return result;
};

// 클레임 묶음의 첫 행 여부를 반환합니다.
const isClaimGroupFirstRow = (rowData?: OrderReturnManageGridRow | null): boolean => {
  return rowData?.claimGroupFirstRowYn === true;
};

// 반품 회수 관리 그리드를 렌더링합니다.
const OrderReturnManageGrid = ({
  searchParams,
  deliveryCompanyList,
  onLoadingChange,
}: OrderReturnManageGridProps) => {
  const gridApiRef = useRef<GridApi<OrderReturnManageGridRow> | null>(null);
  const selectionSyncingRef = useRef(false);
  const lastSearchParamsRef = useRef(searchParams);
  const [rowData, setRowData] = useState<OrderReturnManageGridRow[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedClaimNoSet, setSelectedClaimNoSet] = useState<Set<string>>(() => new Set());
  const [processingAction, setProcessingAction] = useState<OrderReturnManageProcessingAction>(null);
  const [pickupCompleteClaimNo, setPickupCompleteClaimNo] = useState<string | null>(null);

  // 택배사 코드를 이름으로 빠르게 변환하기 위한 맵입니다.
  const deliveryCompanyNameMap = useMemo(() => (
    new Map(deliveryCompanyList.map((item) => [item.cd, item.cdNm]))
  ), [deliveryCompanyList]);

  // 현재 조회 상태에 따라 송장 수정 가능 여부를 계산합니다.
  const isEditableMode = useMemo(
    () => isOrderReturnManageEditableStatus(searchParams.chgDtlStatCd),
    [searchParams.chgDtlStatCd],
  );

  // 현재 조회 상태에 따라 회수중 처리 가능 여부를 계산합니다.
  const isPickupStartMode = useMemo(
    () => isOrderReturnManagePickupStartStatus(searchParams.chgDtlStatCd),
    [searchParams.chgDtlStatCd],
  );

  // 현재 조회 상태에 따라 회수완료 버튼 활성 여부를 계산합니다.
  const isPickupCompletePendingMode = useMemo(
    () => isOrderReturnManagePickupCompletePendingStatus(searchParams.chgDtlStatCd),
    [searchParams.chgDtlStatCd],
  );

  // 현재 페이지에 로드된 고유 클레임 수를 계산합니다.
  const currentPageClaimCount = useMemo(() => {
    const claimNoSet = new Set<string>();
    rowData.forEach((item) => {
      if (item.clmNo) {
        claimNoSet.add(item.clmNo);
      }
    });
    return claimNoSet.size;
  }, [rowData]);

  // 전체 선택 헤더 체크박스의 checked 상태를 계산합니다.
  const isAllClaimsSelected = useMemo(() => (
    currentPageClaimCount > 0 && selectedClaimNoSet.size === currentPageClaimCount
  ), [currentPageClaimCount, selectedClaimNoSet]);

  // 전체 선택 헤더 체크박스의 indeterminate 상태를 계산합니다.
  const isClaimSelectionIndeterminate = useMemo(() => (
    selectedClaimNoSet.size > 0 && selectedClaimNoSet.size < currentPageClaimCount
  ), [currentPageClaimCount, selectedClaimNoSet]);

  // 총 페이지 수를 계산합니다.
  const totalPageCount = useMemo(
    () => resolveOrderReturnManageTotalPageCount(totalCount),
    [totalCount],
  );

  // 페이지 번호 버튼 목록을 계산합니다.
  const pageNumberList = useMemo(
    () => resolveOrderReturnManagePageNumberList(currentPage, totalPageCount),
    [currentPage, totalPageCount],
  );

  // 상위 컴포넌트로 로딩 상태를 전달합니다.
  const notifyLoading = useCallback((loading: boolean) => {
    if (onLoadingChange) {
      onLoadingChange(loading);
    }
  }, [onLoadingChange]);

  // AG Grid 다중 선택 옵션을 정의합니다.
  const rowSelection = useMemo(() => ({
    mode: 'multiRow' as const,
    checkboxes: false,
    headerCheckbox: false,
    enableClickSelection: false,
  }), []);

  // 현재 선택 상태를 클레임 번호 기준 집합으로 동기화합니다.
  const syncSelectionState = useCallback(() => {
    if (!gridApiRef.current) {
      setSelectedClaimNoSet(new Set());
      return;
    }

    const nextSelectedClaimNoSet = new Set<string>();
    for (const selectedRow of gridApiRef.current.getSelectedRows()) {
      if (selectedRow.clmNo) {
        nextSelectedClaimNoSet.add(selectedRow.clmNo);
      }
    }

    setSelectedClaimNoSet(nextSelectedClaimNoSet);
    gridApiRef.current.refreshCells({
      force: true,
      columns: [ORDER_RETURN_MANAGE_CHECKBOX_COL_ID],
    });
    gridApiRef.current.refreshHeader();
  }, []);

  // 같은 클레임번호를 가진 현재 페이지 행들의 선택 상태를 맞춥니다.
  const syncClaimRowSelection = useCallback((clmNo: string, selected: boolean) => {
    if (!gridApiRef.current || !clmNo) {
      return;
    }

    selectionSyncingRef.current = true;
    try {
      gridApiRef.current.forEachNode((node) => {
        if (node.data?.clmNo !== clmNo || node.isSelected() === selected) {
          return;
        }
        node.setSelected(selected);
      });
    } finally {
      selectionSyncingRef.current = false;
    }

    syncSelectionState();
  }, [syncSelectionState]);

  // 현재 페이지 전체 클레임의 선택 상태를 한 번에 변경합니다.
  const toggleSelectAllClaims = useCallback((checked: boolean) => {
    if (!gridApiRef.current) {
      return;
    }

    selectionSyncingRef.current = true;
    try {
      gridApiRef.current.forEachNode((node) => {
        if (node.isSelected() === checked) {
          return;
        }
        node.setSelected(checked);
      });
    } finally {
      selectionSyncingRef.current = false;
    }

    syncSelectionState();
  }, [syncSelectionState]);

  // 같은 클레임번호를 가진 현재 페이지 행들의 입력 값을 맞춥니다.
  const syncClaimEditableValues = useCallback((clmNo: string, valuePatch: ClaimEditableValuePatch) => {
    if (!gridApiRef.current || !clmNo) {
      return;
    }

    gridApiRef.current.forEachNode((node) => {
      if (node.data?.clmNo !== clmNo) {
        return;
      }

      if (valuePatch.delvCompCd !== undefined) {
        node.setDataValue('delvCompCd', valuePatch.delvCompCd);
      }
      if (valuePatch.delvCompNm !== undefined) {
        node.setDataValue('delvCompNm', valuePatch.delvCompNm);
      }
      if (valuePatch.invoiceNo !== undefined) {
        node.setDataValue('invoiceNo', valuePatch.invoiceNo);
      }
    });
  }, []);

  // 반품 회수 관리 목록을 클레임 페이지 기준으로 조회합니다.
  const fetchOrderReturnManageList = useCallback(async (page: number) => {
    notifyLoading(true);
    try {
      const response = await api.get('/api/admin/order/return/manage/list', {
        params: {
          ...searchParams,
          page,
          pageSize: ORDER_RETURN_MANAGE_PAGE_SIZE,
        },
      });
      const data = (response.data || {}) as OrderReturnManageListResponse;
      const nextTotalCount = Math.max(0, data.totalCount || 0);
      const nextTotalPageCount = resolveOrderReturnManageTotalPageCount(nextTotalCount);

      // 상태 변경 직후 마지막 페이지가 줄어들면 유효한 마지막 페이지로 이동합니다.
      if (page > nextTotalPageCount) {
        setCurrentPage(nextTotalPageCount);
        return;
      }

      setRowData(buildOrderReturnManageGridRows(data.list || []));
      setTotalCount(nextTotalCount);
      gridApiRef.current?.deselectAll();
      setSelectedClaimNoSet(new Set());
    } catch (error) {
      console.error('반품 회수 관리 목록 조회에 실패했습니다.', error);
      setRowData([]);
      setTotalCount(0);
      gridApiRef.current?.deselectAll();
      setSelectedClaimNoSet(new Set());
    } finally {
      notifyLoading(false);
    }
  }, [notifyLoading, searchParams]);

  // 검색 실행 시 첫 페이지로 되돌리고, 이미 첫 페이지라면 즉시 재조회합니다.
  useEffect(() => {
    if (lastSearchParamsRef.current !== searchParams) {
      lastSearchParamsRef.current = searchParams;

      if (currentPage !== 1) {
        setCurrentPage(1);
        return;
      }
    }

    void fetchOrderReturnManageList(currentPage);
  }, [currentPage, fetchOrderReturnManageList, searchParams]);

  // 그리드 준비가 끝나면 API 레퍼런스를 저장합니다.
  const handleGridReady = useCallback((event: GridReadyEvent<OrderReturnManageGridRow>) => {
    gridApiRef.current = event.api;
    syncSelectionState();
  }, [syncSelectionState]);

  // 선택 변경 시 같은 클레임번호 묶음으로 선택을 맞춥니다.
  const handleRowSelected = useCallback((event: RowSelectedEvent<OrderReturnManageGridRow>) => {
    if (selectionSyncingRef.current) {
      return;
    }

    if (!event.data?.clmNo) {
      syncSelectionState();
      return;
    }

    syncClaimRowSelection(event.data.clmNo, event.node.isSelected() === true);
  }, [syncClaimRowSelection, syncSelectionState]);

  // 현재 선택된 행 목록을 반환합니다.
  const getSelectedRows = useCallback((): OrderReturnManageGridRow[] => {
    return gridApiRef.current?.getSelectedRows() ?? [];
  }, []);

  // 현재 선택된 행을 클레임번호 기준으로 중복 제거합니다.
  const getDistinctSelectedClaimRows = useCallback((): OrderReturnManageGridRow[] => {
    const claimRowMap = new Map<string, OrderReturnManageGridRow>();
    for (const row of getSelectedRows()) {
      if (!row?.clmNo || claimRowMap.has(row.clmNo)) {
        continue;
      }
      claimRowMap.set(row.clmNo, row);
    }
    return Array.from(claimRowMap.values());
  }, [getSelectedRows]);

  // 특정 페이지로 이동합니다.
  const handleMovePage = useCallback((page: number) => {
    const safePage = Math.min(Math.max(page, 1), totalPageCount);
    setCurrentPage(safePage);
  }, [totalPageCount]);

  // 현재 페이지 데이터를 다시 조회합니다.
  const refreshGrid = useCallback(async () => {
    await fetchOrderReturnManageList(currentPage);
  }, [currentPage, fetchOrderReturnManageList]);

  // 병합된 체크박스 셀을 렌더링합니다.
  const renderSelectionCell = useCallback((params: ICellRendererParams<OrderReturnManageGridRow>) => {
    const row = params.data;
    if (!isClaimGroupFirstRow(row)) {
      return null;
    }
    if (!row) {
      return null;
    }

    return (
      <div className="d-flex align-items-center justify-content-center w-100 h-100">
        <input
          type="checkbox"
          className="form-check-input m-0"
          checked={params.node.isSelected() === true}
          onChange={(event) => {
            event.stopPropagation();
            syncClaimRowSelection(row.clmNo, event.target.checked);
          }}
          onClick={(event) => event.stopPropagation()}
        />
      </div>
    );
  }, [syncClaimRowSelection]);

  // 병합된 클레임번호 셀을 렌더링합니다.
  const renderClaimNoCell = useCallback((params: ICellRendererParams<OrderReturnManageGridRow>) => {
    if (!isClaimGroupFirstRow(params.data)) {
      return null;
    }
    return (
      <div className="d-flex align-items-center justify-content-center w-100 h-100">
        <span>{displayValue(params.data?.clmNoDisplay)}</span>
      </div>
    );
  }, []);

  // 회수 택배사 셀을 렌더링합니다.
  const renderDeliveryCompanyCell = useCallback((params: ICellRendererParams<OrderReturnManageGridRow>) => {
    const rowData = params.data;
    if (!rowData || !isClaimGroupFirstRow(rowData)) {
      return null;
    }

    const currentCompanyCode = rowData.delvCompCd ?? '';
    const currentCompanyName = deliveryCompanyNameMap.get(currentCompanyCode) ?? rowData.delvCompNm ?? '';

    if (!isEditableMode) {
      return (
        <div className="d-flex align-items-center justify-content-center w-100 h-100">
          <span>{displayValue(currentCompanyName)}</span>
        </div>
      );
    }

    return (
      <div className="d-flex align-items-center justify-content-center w-100 h-100">
        <select
          className="form-select form-select-sm"
          value={currentCompanyCode}
          onChange={(event) => {
            const nextCompanyCode = event.target.value;
            syncClaimEditableValues(rowData.clmNo, {
              delvCompCd: nextCompanyCode,
              delvCompNm: deliveryCompanyNameMap.get(nextCompanyCode) ?? '',
            });
          }}
        >
          <option value="">택배사 선택</option>
          {deliveryCompanyList.map((item) => (
            <option key={`return-delivery-company-${rowData.clmNo}-${item.cd}`} value={item.cd}>
              {item.cdNm}
            </option>
          ))}
        </select>
      </div>
    );
  }, [deliveryCompanyList, deliveryCompanyNameMap, isEditableMode, syncClaimEditableValues]);

  // 회수 송장번호 셀을 렌더링합니다.
  const renderInvoiceNoCell = useCallback((params: ICellRendererParams<OrderReturnManageGridRow>) => {
    const rowData = params.data;
    if (!rowData || !isClaimGroupFirstRow(rowData)) {
      return null;
    }

    const currentInvoiceNo = rowData.invoiceNo ?? '';
    if (!isEditableMode) {
      return (
        <div className="d-flex align-items-center justify-content-center w-100 h-100">
          <span>{displayValue(currentInvoiceNo)}</span>
        </div>
      );
    }

    return (
      <div className="d-flex align-items-center justify-content-center w-100 h-100">
        <input
          type="text"
          className="form-control form-control-sm"
          inputMode="numeric"
          maxLength={ORDER_RETURN_MANAGE_INVOICE_NO_MAX_LENGTH}
          value={currentInvoiceNo}
          onChange={(event) => {
            const sanitizedInvoiceNo = sanitizeOrderReturnManageInvoiceNo(event.target.value);
            syncClaimEditableValues(rowData.clmNo, { invoiceNo: sanitizedInvoiceNo });
          }}
        />
      </div>
    );
  }, [isEditableMode, syncClaimEditableValues]);

  // 반품 회수 관리 컬럼을 정의합니다.
  const columnDefs = useMemo<ColDef<OrderReturnManageGridRow>[]>(() => ([
    {
      colId: ORDER_RETURN_MANAGE_CHECKBOX_COL_ID,
      headerName: '',
      width: 60,
      minWidth: 60,
      maxWidth: 60,
      resizable: false,
      sortable: false,
      suppressNavigable: true,
      rowSpan: (params) => params.data?.claimGroupRowSpan ?? 1,
      cellStyle: (params) => resolveMergedCellStyle(params.data),
      headerComponent: ClaimSelectionHeader,
      headerComponentParams: {
        checked: isAllClaimsSelected,
        indeterminate: isClaimSelectionIndeterminate,
        disabled: processingAction !== null || currentPageClaimCount < 1,
        onToggle: toggleSelectAllClaims,
      },
      cellRenderer: renderSelectionCell,
    },
    {
      headerName: '클레임번호',
      field: 'clmNoDisplay',
      width: 180,
      rowSpan: (params) => params.data?.claimGroupRowSpan ?? 1,
      cellStyle: (params) => resolveMergedCellStyle(params.data),
      cellRenderer: renderClaimNoCell,
    },
    { headerName: '주문번호', field: 'ordNo', width: 180 },
    { headerName: '상세번호', field: 'ordDtlNo', width: 110 },
    { headerName: '상품코드', field: 'goodsId', width: 140 },
    { headerName: '사이즈', field: 'sizeId', width: 110 },
    { headerName: '수량', field: 'qty', width: 90 },
    { headerName: '상품명', field: 'goodsNm', width: 260, cellClass: 'text-start' },
    {
      headerName: '회수 택배사 명',
      field: 'delvCompCd',
      width: 180,
      rowSpan: (params) => params.data?.claimGroupRowSpan ?? 1,
      cellStyle: (params) => resolveMergedCellStyle(params.data),
      cellRenderer: renderDeliveryCompanyCell,
    },
    {
      headerName: '회수 송장번호',
      field: 'invoiceNo',
      width: 180,
      rowSpan: (params) => params.data?.claimGroupRowSpan ?? 1,
      cellStyle: (params) => resolveMergedCellStyle(params.data),
      cellRenderer: renderInvoiceNoCell,
    },
    {
      headerName: '클레임 신청 일시',
      field: 'chgDt',
      width: 180,
      valueFormatter: (params) => displayValue(params.value as string | null | undefined),
    },
  ]), [
    currentPageClaimCount,
    isAllClaimsSelected,
    isClaimSelectionIndeterminate,
    processingAction,
    renderClaimNoCell,
    renderDeliveryCompanyCell,
    renderInvoiceNoCell,
    renderSelectionCell,
    toggleSelectAllClaims,
  ]);

  // 공통 컬럼 속성을 정의합니다.
  const defaultColDef = useMemo<ColDef<OrderReturnManageGridRow>>(() => ({
    resizable: true,
    sortable: false,
    editable: false,
    cellClass: 'text-center',
  }), []);

  // 송장저장 액션을 처리합니다.
  const handleSavePickupRequest = useCallback(async () => {
    if (!isEditableMode) {
      return;
    }

    gridApiRef.current?.stopEditing();
    const selectedClaimRows = getDistinctSelectedClaimRows();
    if (selectedClaimRows.length < 1) {
      alert('선택된 반품건이 없습니다.');
      return;
    }

    if (selectedClaimRows.some((row) => !row.delvCompCd)) {
      alert('택배사를 선택해주세요.');
      return;
    }
    if (selectedClaimRows.some((row) => !sanitizeOrderReturnManageInvoiceNo(row.invoiceNo || ''))) {
      alert('송장번호를 입력해주세요.');
      return;
    }

    const requestBody: AdminOrderReturnPickupRequest = {
      itemList: selectedClaimRows.map((row) => ({
        clmNo: row.clmNo,
        delvCompCd: row.delvCompCd,
        invoiceNo: sanitizeOrderReturnManageInvoiceNo(row.invoiceNo || ''),
      })),
    };

    setProcessingAction('save');
    try {
      await api.post<AdminOrderReturnManageStatusResponse>('/api/admin/order/return/manage/pickup/request', requestBody);
      alert('반품회수신청으로 변경되었습니다.');
      await refreshGrid();
    } catch (error) {
      alert(resolveOrderReturnManageActionErrorMessage(error, '송장저장 처리 중 오류가 발생했습니다.'));
    } finally {
      setProcessingAction(null);
    }
  }, [getDistinctSelectedClaimRows, isEditableMode, refreshGrid]);

  // 회수중 액션을 처리합니다.
  const handlePickupStart = useCallback(async () => {
    if (!isPickupStartMode) {
      return;
    }

    const selectedClaimRows = getDistinctSelectedClaimRows();
    if (selectedClaimRows.length < 1) {
      alert('선택된 반품건이 없습니다.');
      return;
    }

    const requestBody: AdminOrderReturnPickupStartRequest = {
      itemList: selectedClaimRows.map((row) => ({
        clmNo: row.clmNo,
      })),
    };

    setProcessingAction('start');
    try {
      await api.post<AdminOrderReturnManageStatusResponse>('/api/admin/order/return/manage/pickup/start', requestBody);
      alert('반품회수중으로 변경되었습니다.');
      await refreshGrid();
    } catch (error) {
      alert(resolveOrderReturnManageActionErrorMessage(error, '회수중 처리 중 오류가 발생했습니다.'));
    } finally {
      setProcessingAction(null);
    }
  }, [getDistinctSelectedClaimRows, isPickupStartMode, refreshGrid]);

  // 회수완료 검수 팝업을 닫습니다.
  const handleClosePickupCompleteModal = useCallback(() => {
    setPickupCompleteClaimNo(null);
  }, []);

  // 회수완료 저장 성공 후 팝업을 닫고 목록을 다시 조회합니다.
  const handleCompletedPickupCompleteModal = useCallback(() => {
    setPickupCompleteClaimNo(null);
    void refreshGrid();
  }, [refreshGrid]);

  // 회수완료 버튼 클릭 시 단건 검수 팝업을 엽니다.
  const handlePickupCompletePending = useCallback(() => {
    if (!isPickupCompletePendingMode) {
      return;
    }

    const selectedClaimRows = getDistinctSelectedClaimRows();
    if (selectedClaimRows.length !== 1) {
      alert('회수완료 처리할 반품건을 1건 선택해주세요.');
      return;
    }

    setPickupCompleteClaimNo(selectedClaimRows[0].clmNo);
  }, [getDistinctSelectedClaimRows, isPickupCompletePendingMode]);

  return (
    <>
      <OrderReturnPickupCompleteModal
        isOpen={pickupCompleteClaimNo !== null}
        clmNo={pickupCompleteClaimNo}
        onClose={handleClosePickupCompleteModal}
        onCompleted={handleCompletedPickupCompleteModal}
      />

      <div className="d-flex justify-content-end gap-2 mb-3">
        <button
          type="button"
          className="btn btn-primary"
          disabled={processingAction !== null || !isEditableMode}
          onClick={handleSavePickupRequest}
        >
          {processingAction === 'save' ? '송장저장 처리중..' : '송장저장'}
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={processingAction !== null || !isPickupStartMode}
          onClick={handlePickupStart}
        >
          {processingAction === 'start' ? '회수중 처리중..' : '회수중'}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={processingAction !== null || !isPickupCompletePendingMode}
          onClick={handlePickupCompletePending}
        >
          회수완료
        </button>
      </div>

      <div className="ag-theme-alpine-dark header-center order-start-delivery-grid-theme" style={{ width: '100%', height: '560px' }}>
        <AgGridReact<OrderReturnManageGridRow>
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          rowSelection={rowSelection}
          suppressRowTransform
          overlayNoRowsTemplate="데이터가 없습니다."
          getRowId={(params) => `${params.data?.clmNo ?? ''}-${params.data?.ordDtlNo ?? ''}`}
          onGridReady={handleGridReady}
          onRowSelected={handleRowSelected}
        />
      </div>

      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mt-3">
        <div className="text-muted">
          총 {totalCount.toLocaleString('ko-KR')}건
        </div>
        <div className="btn-group" role="group" aria-label="반품 회수 관리 페이지 이동">
          <button
            type="button"
            className="btn btn-outline-primary"
            disabled={currentPage <= 1}
            onClick={() => handleMovePage(currentPage - 1)}
          >
            이전
          </button>
          {pageNumberList.map((pageNo) => (
            <button
              key={`return-manage-page-${pageNo}`}
              type="button"
              className={`btn ${pageNo === currentPage ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => handleMovePage(pageNo)}
            >
              {pageNo}
            </button>
          ))}
          <button
            type="button"
            className="btn btn-outline-primary"
            disabled={currentPage >= totalPageCount}
            onClick={() => handleMovePage(currentPage + 1)}
          >
            다음
          </button>
        </div>
      </div>
    </>
  );
};

export default OrderReturnManageGrid;
