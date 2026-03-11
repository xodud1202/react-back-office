import React, { useCallback, useMemo } from 'react';
import type { ColDef, SelectionChangedEvent } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import type { CouponTargetRow } from '@/components/coupon/types';

interface CouponTargetGridProps {
  // 대상 그리드 타입입니다.
  gridType: 'GOODS' | 'BRAND' | 'EXHIBITION' | 'CATEGORY' | 'EMPTY';
  // 대상 행 목록입니다.
  rows: CouponTargetRow[];
  // 선택 행 변경 함수입니다.
  onSelectionChange?: (targetValueList: string[]) => void;
  // 그리드 높이입니다.
  height?: string;
  // 데이터 없음 문구입니다.
  emptyMessage?: string;
}

// 쿠폰 대상 그리드를 렌더링합니다.
const CouponTargetGrid = ({
  gridType,
  rows,
  onSelectionChange,
  height = '240px',
  emptyMessage = '데이터가 없습니다.',
}: CouponTargetGridProps) => {
  // 그리드 타입별 컬럼을 생성합니다.
  const columnDefs = useMemo<ColDef<CouponTargetRow>[]>(() => {
    if (gridType === 'GOODS') {
      return [
        { headerName: '상품코드', field: 'goodsId', width: 160, valueGetter: (params) => params.data?.goodsId || params.data?.targetValue || '' },
        { headerName: 'ERP품번코드', field: 'erpStyleCd', width: 160 },
        { headerName: '상품명', field: 'goodsNm', width: 340, cellClass: 'text-start' },
      ];
    }
    if (gridType === 'BRAND') {
      return [
        { headerName: '브랜드번호', field: 'brandNo', width: 160, valueGetter: (params) => String(params.data?.brandNo || params.data?.targetValue || '') },
        { headerName: '브랜드명', field: 'brandNm', width: 360, cellClass: 'text-start', valueGetter: (params) => params.data?.brandNm || params.data?.targetNm || '' },
      ];
    }
    if (gridType === 'EXHIBITION') {
      return [
        { headerName: '기획전번호', field: 'exhibitionNo', width: 160, valueGetter: (params) => String(params.data?.exhibitionNo || params.data?.targetValue || '') },
        { headerName: '기획전명', field: 'exhibitionNm', width: 360, cellClass: 'text-start', valueGetter: (params) => params.data?.exhibitionNm || params.data?.targetNm || '' },
      ];
    }
    if (gridType === 'CATEGORY') {
      return [
        { headerName: '카테고리ID', field: 'categoryId', width: 160, valueGetter: (params) => params.data?.categoryId || params.data?.targetValue || '' },
        { headerName: '카테고리명', field: 'categoryNm', width: 320, cellClass: 'text-start', valueGetter: (params) => params.data?.categoryNm || params.data?.targetNm || '' },
        { headerName: '레벨', field: 'categoryLevel', width: 120 },
      ];
    }
    return [
      { headerName: '대상값', field: 'targetValue', width: 200 },
    ];
  }, [gridType]);

  // 공통 컬럼 속성을 정의합니다.
  const defaultColDef = useMemo<ColDef>(() => ({
    resizable: true,
    sortable: false,
    editable: false,
    cellClass: 'text-center',
  }), []);

  // AG Grid v32.2+ 선택 옵션을 구성합니다.
  const rowSelection = useMemo(() => ({
    mode: 'multiRow' as const,
    checkboxes: true,
    headerCheckbox: true,
    enableClickSelection: false,
  }), []);

  // 선택된 대상값 목록을 상위로 전달합니다.
  const handleSelectionChanged = useCallback((event: SelectionChangedEvent<CouponTargetRow>) => {
    if (!onSelectionChange) {
      return;
    }
    const selectedRows = event.api.getSelectedRows() || [];
    const selectedTargetValueList = selectedRows
      .map((item) => String(item.targetValue || '').trim())
      .filter((item) => item.length > 0);
    onSelectionChange(selectedTargetValueList);
  }, [onSelectionChange]);

  return (
    <div className="ag-theme-alpine-dark header-center" style={{ width: '100%', height }}>
      <AgGridReact<CouponTargetRow>
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        rowData={rows}
        rowSelection={rowSelection}
        selectionColumnDef={{ width: 70, resizable: false }}
        overlayNoRowsTemplate={emptyMessage}
        getRowId={(params) => String(params.data?.targetValue ?? '')}
        onSelectionChanged={handleSelectionChanged}
      />
    </div>
  );
};

export default CouponTargetGrid;
