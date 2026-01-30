import React from 'react';
import { AgGridReact } from 'ag-grid-react';
import type { CellEditingStoppedEvent, CellFocusedEvent, CellValueChangedEvent, ColDef, RowDragEndEvent } from 'ag-grid-community';
import type { GoodsSizeRow } from '@/components/goods/types';

interface GoodsSizeGridProps {
  goodsSizeRows: GoodsSizeRow[];
  goodsSizeLoading: boolean;
  sizeColumnDefs: ColDef<GoodsSizeRow>[];
  defaultColDef: ColDef;
  onAddRow: () => void;
  onRowDragEnd: (event: RowDragEndEvent<GoodsSizeRow>) => void;
  onCellValueChanged: (event: CellValueChangedEvent<GoodsSizeRow>) => void;
  onCellEditingStopped: (event: CellEditingStoppedEvent<GoodsSizeRow>) => void;
  onCellFocused: (event: CellFocusedEvent) => void;
}

// 사이즈 및 재고 그리드를 렌더링합니다.
const GoodsSizeGrid = ({
  goodsSizeRows,
  goodsSizeLoading,
  sizeColumnDefs,
  defaultColDef,
  onAddRow,
  onRowDragEnd,
  onCellValueChanged,
  onCellEditingStopped,
  onCellFocused,
}: GoodsSizeGridProps) => (
  <div className="mt-4">
    <div className="d-flex align-items-center justify-content-between mb-2">
      <h5 className="mb-0">사이즈 및 재고</h5>
      <div className="d-flex gap-2">
        <button type="button" className="btn btn-sm btn-secondary" onClick={onAddRow}>
          사이즈 추가
        </button>
      </div>
    </div>
    {goodsSizeLoading ? (
      <div className="text-center">사이즈 로딩중...</div>
    ) : (
      <div className="ag-theme-alpine-dark header-center" style={{ width: '100%', height: '150px' }}>
        <AgGridReact<GoodsSizeRow>
          columnDefs={sizeColumnDefs}
          defaultColDef={defaultColDef}
          rowData={goodsSizeRows}
          domLayout="normal"
          overlayNoRowsTemplate="데이터가 없습니다."
          getRowId={(params) => String(params.data?.rowKey ?? '')}
          rowDragManaged
          animateRows
          stopEditingWhenCellsLoseFocus
          onRowDragEnd={onRowDragEnd}
          onCellValueChanged={onCellValueChanged}
          onCellEditingStopped={onCellEditingStopped}
          onCellFocused={onCellFocused}
        />
      </div>
    )}
  </div>
);

export default GoodsSizeGrid;
