import React, { useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import type { CellEditingStoppedEvent, CellFocusedEvent, CellValueChangedEvent, ColDef, RowDragEndEvent } from 'ag-grid-community';
import type { GoodsSizeRow } from '@/components/goods/types';

interface GoodsSizeGridProps {
  goodsSizeRows: GoodsSizeRow[];
  goodsSizeLoading: boolean;
  sizeColumnDefs: ColDef<GoodsSizeRow>[];
  defaultColDef: ColDef;
  onAddRow: () => void;
  onSaveOrder: (rows: GoodsSizeRow[]) => void;
  setGoodsSizeRows: React.Dispatch<React.SetStateAction<GoodsSizeRow[]>>;
}

// 사이즈 및 재고 그리드를 렌더링합니다.
const GoodsSizeGrid = ({
  goodsSizeRows,
  goodsSizeLoading,
  sizeColumnDefs,
  defaultColDef,
  onAddRow,
  onSaveOrder,
  setGoodsSizeRows,
}: GoodsSizeGridProps) => (
  <GoodsSizeGridContent
    goodsSizeRows={goodsSizeRows}
    goodsSizeLoading={goodsSizeLoading}
    sizeColumnDefs={sizeColumnDefs}
    defaultColDef={defaultColDef}
    onAddRow={onAddRow}
    onSaveOrder={onSaveOrder}
    setGoodsSizeRows={setGoodsSizeRows}
  />
);

interface GoodsSizeGridContentProps extends GoodsSizeGridProps {}

// 사이즈 그리드 이벤트를 내부에서 처리합니다.
const GoodsSizeGridContent = ({
  goodsSizeRows,
  goodsSizeLoading,
  sizeColumnDefs,
  defaultColDef,
  onAddRow,
  onSaveOrder,
  setGoodsSizeRows,
}: GoodsSizeGridContentProps) => {
  const handleSizeRowDragEnd = useCallback((event: RowDragEndEvent<GoodsSizeRow>) => {
    const api = event.api;
    const rowCount = api.getDisplayedRowCount();
    const nextRows: GoodsSizeRow[] = [];
    for (let i = 0; i < rowCount; i += 1) {
      const node = api.getDisplayedRowAtIndex(i);
      if (node?.data) {
        nextRows.push({ ...node.data, dispOrd: i + 1 });
      }
    }
    setGoodsSizeRows(nextRows);
    onSaveOrder(nextRows);
  }, [onSaveOrder, setGoodsSizeRows]);

  const handleSizeCellValueChanged = useCallback((event: CellValueChangedEvent<GoodsSizeRow>) => {
    const rowKey = event.data?.rowKey;
    if (!rowKey) {
      return;
    }
    setGoodsSizeRows((prev) => prev.map((row) => (row.rowKey === rowKey ? { ...row, ...event.data } : row)));
  }, [setGoodsSizeRows]);

  const handleSizeCellEditingStopped = useCallback((event: CellEditingStoppedEvent<GoodsSizeRow>) => {
    event.api.refreshCells({
      rowNodes: [event.node],
      columns: [event.column.getColId()],
      force: true,
    });
  }, []);

  const handleSizeCellFocused = useCallback((event: CellFocusedEvent) => {
    if (event.rowIndex == null) {
      event.api.stopEditing();
      event.api.clearFocusedCell();
    }
  }, []);

  return (
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
            onRowDragEnd={handleSizeRowDragEnd}
            onCellValueChanged={handleSizeCellValueChanged}
            onCellEditingStopped={handleSizeCellEditingStopped}
            onCellFocused={handleSizeCellFocused}
          />
        </div>
      )}
    </div>
  );
};

export default GoodsSizeGrid;
