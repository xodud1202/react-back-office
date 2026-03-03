import React, { useCallback, useMemo } from 'react';
import type { ColDef, CellValueChangedEvent, RowClickedEvent, RowDragEndEvent } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import type { ExhibitionTabItem } from '@/components/exhibition/types';

interface ExhibitionTabGridProps {
  // 탭 데이터입니다.
  rows: ExhibitionTabItem[];
  // 선택된 탭 행 키입니다.
  selectedRowKey: string;
  // 탭 편집 가능 여부입니다.
  isEditable: boolean;
  // 탭 목록 변경 처리 함수입니다.
  onRowsChange: (nextRows: ExhibitionTabItem[]) => void;
  // 탭 선택 처리 함수입니다.
  onSelect: (rowKey: string) => void;
  // 탭 삭제 처리 함수입니다.
  onDelete: (rowKey: string) => void;
}

// 기획전 탭 정보를 렌더링합니다.
const ExhibitionTabGrid = ({
  rows,
  selectedRowKey,
  isEditable,
  onRowsChange,
  onSelect,
  onDelete,
}: ExhibitionTabGridProps) => {
  // 컬럼을 정의합니다.
  const columnDefs = useMemo<ColDef<ExhibitionTabItem>[]>(() => ([
    {
      headerName: '순서',
      field: 'dispOrd',
      width: 90,
    },
    {
      headerName: '드래그',
      rowDrag: true,
      width: 80,
      suppressSizeToFit: true,
    },
    {
      headerName: '탭명',
      field: 'tabNm',
      width: 240,
      editable: isEditable,
      cellClass: 'text-start',
    },
    {
      headerName: '노출여부',
      field: 'showYn',
      width: 120,
      editable: isEditable,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: isEditable ? {
        values: ['Y', 'N'],
      } : undefined,
    },
    {
      headerName: '삭제',
      field: 'rowKey',
      width: 110,
      cellRenderer: (params: { data?: ExhibitionTabItem }) => {
        // 삭제 버튼을 노출합니다.
        if (!isEditable) {
          return null;
        }
        return (
          <button
            type="button"
            className="btn btn-sm btn-danger"
            onClick={() => onDelete(params.data?.rowKey || '')}
          >
            삭제
          </button>
        );
      },
    },
  ]), [isEditable, onDelete]);

  // 공통 그리드 옵션입니다.
  const defaultColDef = useMemo<ColDef>(() => ({
    resizable: true,
    sortable: false,
    editable: false,
    cellClass: 'text-center',
  }), []);

  // 행 순서가 변경되면 노출순서를 재계산합니다.
  const handleRowDragEnd = useCallback((event: RowDragEndEvent<ExhibitionTabItem>) => {
    if (!isEditable) {
      return;
    }
    const nextRows: ExhibitionTabItem[] = [];
    const rowCount = event.api.getDisplayedRowCount();
    for (let index = 0; index < rowCount; index += 1) {
      const node = event.api.getDisplayedRowAtIndex(index);
      if (!node?.data?.rowKey) {
        continue;
      }
      nextRows.push({
        ...node.data,
        dispOrd: index + 1,
      });
    }
    onRowsChange(nextRows);
  }, [isEditable, onRowsChange]);

  // 셀 편집값이 변경되면 행을 갱신합니다.
  const handleCellValueChanged = useCallback((event: CellValueChangedEvent<ExhibitionTabItem>) => {
    const nextData = event.data;
    if (!nextData?.rowKey) {
      return;
    }
    onRowsChange(rows.map((row) => (
      row.rowKey === nextData.rowKey ? { ...row, ...nextData } : row
    )));
  }, [onRowsChange, rows]);

  // 선택된 탭을 상단 영역에 반영합니다.
  const handleRowClicked = useCallback((event: RowClickedEvent<ExhibitionTabItem>) => {
    if (!event.data?.rowKey) {
      return;
    }
    onSelect(event.data.rowKey);
  }, [onSelect]);

  // 초기 행 선택을 기본 처리합니다.
  const getRowClass = useCallback((params: { data?: ExhibitionTabItem }) => {
    if (!params.data?.rowKey || !selectedRowKey) {
      return '';
    }
    return params.data.rowKey === selectedRowKey ? 'ag-row-selected' : '';
  }, [selectedRowKey]);

  return (
    <div className="ag-theme-alpine-dark header-center" style={{ width: '100%', height: '220px' }}>
      <AgGridReact<ExhibitionTabItem>
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        rowData={rows}
        rowSelection="single"
        rowDragManaged
        animateRows
        suppressRowClickSelection={false}
        overlayNoRowsTemplate="탭이 없습니다."
        getRowId={(params) => String(params.data.rowKey || '')}
        onRowDragEnd={handleRowDragEnd}
        onCellValueChanged={isEditable ? handleCellValueChanged : undefined}
        onRowClicked={handleRowClicked}
        getRowClass={getRowClass}
      />
    </div>
  );
};

export default ExhibitionTabGrid;
