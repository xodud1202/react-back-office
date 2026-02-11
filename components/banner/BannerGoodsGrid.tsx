import React, { useCallback, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef, RowDragEndEvent, SelectionChangedEvent } from 'ag-grid-community';
import type { BannerGoodsItem } from '@/components/banner/types';

interface BannerGoodsGridProps {
  // 배너 상품 목록 데이터입니다.
  rows: BannerGoodsItem[];
  // 정렬 변경 처리 함수입니다.
  onOrderChange: (rows: BannerGoodsItem[]) => void;
  // 선택 변경 처리 함수입니다.
  onSelectionChange: (rowKeys: string[]) => void;
}

// 배너 상품 그리드를 렌더링합니다.
const BannerGoodsGrid = ({ rows, onOrderChange, onSelectionChange }: BannerGoodsGridProps) => {
  // 컬럼 정보를 정의합니다.
  const columnDefs = useMemo<ColDef<BannerGoodsItem>[]>(() => ([
    { checkboxSelection: true, headerCheckboxSelection: true, width: 70 },
    { headerName: '이동', rowDrag: true, width: 70 },
    { headerName: '상품코드', field: 'goodsId', width: 130 },
    { headerName: 'ERP품번코드', field: 'erpStyleCd', width: 130 },
    { headerName: '상품명', field: 'goodsNm', width: 260, cellClass: 'text-start' },
    { headerName: '상품상태', field: 'goodsStatNm', width: 120 },
    { headerName: '상품구분', field: 'goodsDivNm', width: 120 },
    { headerName: '노출순서', field: 'dispOrd', width: 110 },
  ]), []);

  // 공통 컬럼 옵션을 정의합니다.
  const defaultColDef = useMemo<ColDef>(() => ({
    resizable: true,
    sortable: false,
    editable: false,
    cellClass: 'text-center',
  }), []);

  // 드래그 종료 시 노출 순서를 재계산합니다.
  const handleRowDragEnd = useCallback((event: RowDragEndEvent<BannerGoodsItem>) => {
    const api = event.api;
    const rowCount = api.getDisplayedRowCount();
    const nextRows: BannerGoodsItem[] = [];
    for (let i = 0; i < rowCount; i += 1) {
      const node = api.getDisplayedRowAtIndex(i);
      if (node?.data) {
        nextRows.push({ ...node.data, dispOrd: i + 1 });
      }
    }
    onOrderChange(nextRows);
  }, [onOrderChange]);

  // 선택 변경 시 선택된 행 키를 전달합니다.
  const handleSelectionChanged = useCallback((event: SelectionChangedEvent<BannerGoodsItem>) => {
    const selected = event.api.getSelectedRows() || [];
    onSelectionChange(selected.map((item) => item.rowKey));
  }, [onSelectionChange]);

  return (
    <div className="ag-theme-alpine-dark header-center" style={{ width: '100%', height: '320px' }}>
      <AgGridReact<BannerGoodsItem>
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        rowData={rows}
        rowSelection="multiple"
        rowDragManaged
        animateRows
        overlayNoRowsTemplate="데이터가 없습니다."
        getRowId={(params) => params.data.rowKey}
        onRowDragEnd={handleRowDragEnd}
        onSelectionChanged={handleSelectionChanged}
      />
    </div>
  );
};

export default BannerGoodsGrid;
