import React, { useMemo } from 'react';
import { AgGridReact } from '@/components/common/agGrid/AgGridReact';
import type {
  CellValueChangedEvent,
  ColDef,
  GridReadyEvent,
  RowDragEndEvent,
  SelectionChangedEvent,
} from 'ag-grid-community';
import type { NewsCategoryRow } from '@/components/news/rss/types';

interface CategoryGridPanelProps {
  // 카테고리 행 목록입니다.
  rows: NewsCategoryRow[];
  // 선택된 언론사 번호입니다.
  selectedPressNo: number | null;
  // 조회 중 여부입니다.
  loading: boolean;
  // 저장 중 여부입니다.
  saving: boolean;
  // 추가 처리입니다.
  onAddRow: () => void;
  // 저장 처리입니다.
  onSaveRows: () => void;
  // 삭제 처리입니다.
  onDeleteRows: () => void;
  // 그리드 준비 처리입니다.
  onGridReady: (event: GridReadyEvent<NewsCategoryRow>) => void;
  // 선택 변경 처리입니다.
  onSelectionChanged: (event: SelectionChangedEvent<NewsCategoryRow>) => void;
  // 셀 변경 처리입니다.
  onCellValueChanged: (event: CellValueChangedEvent<NewsCategoryRow>) => void;
  // 드래그 종료 처리입니다.
  onRowDragEnd: (event: RowDragEndEvent<NewsCategoryRow>) => void;
}

// 뉴스 RSS 카테고리 그리드 패널을 렌더링합니다.
const CategoryGridPanel = ({
  rows,
  selectedPressNo,
  loading,
  saving,
  onAddRow,
  onSaveRows,
  onDeleteRows,
  onGridReady,
  onSelectionChanged,
  onCellValueChanged,
  onRowDragEnd,
}: CategoryGridPanelProps) => {
  // ag-grid 기본 컬럼 옵션을 정의합니다.
  const defaultColDef = useMemo<ColDef>(() => ({
    resizable: true,
    sortable: false,
    cellClass: 'text-center',
  }), []);

  // 멀티 선택 체크박스 행 선택 옵션을 정의합니다.
  const multiRowSelection = useMemo(() => ({
    mode: 'multiRow' as const,
    checkboxes: true,
    headerCheckbox: true,
  }), []);

  // 카테고리 그리드 컬럼을 정의합니다.
  const columnDefs = useMemo<ColDef<NewsCategoryRow>[]>(() => ([
    {
      headerName: '이동',
      width: 60,
      rowDrag: true,
    },
    {
      headerName: '카테고리코드',
      field: 'categoryCd',
      width: 150,
      editable: (params) => params.data?.rowId.startsWith('category-new-') ?? false,
      cellClass: 'text-start',
    },
    {
      headerName: '카테고리명',
      field: 'categoryNm',
      width: 180,
      editable: true,
      cellClass: 'text-start',
    },
    {
      headerName: '사용여부',
      field: 'useYn',
      width: 100,
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: ['Y', 'N'],
      },
    },
    {
      headerName: '소스명',
      field: 'sourceNm',
      width: 180,
      editable: true,
      cellClass: 'text-start',
    },
    {
      headerName: 'RSS URL',
      field: 'rssUrl',
      width: 500,
      editable: true,
      cellClass: 'text-start',
    },
    {
      headerName: '순서',
      field: 'sortSeq',
      width: 90,
    },
  ]), []);

  return (
    <div style={{ flex: '0 0 70%', maxWidth: '70%' }}>
      <div className="card">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h5 className="mb-0">카테고리 목록</h5>
            <div className="d-flex gap-2">
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onAddRow}>추가</button>
              <button type="button" className="btn btn-primary btn-sm" onClick={onSaveRows} disabled={saving}>
                {saving ? '저장중...' : '저장'}
              </button>
              <button type="button" className="btn btn-danger btn-sm" onClick={onDeleteRows}>삭제</button>
            </div>
          </div>
          {loading && <div className="text-muted small mb-2">조회 중...</div>}
          <div className="ag-theme-alpine-dark header-center" style={{ width: '100%', height: '560px' }}>
            <AgGridReact<NewsCategoryRow>
              rowData={rows}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              rowSelection={multiRowSelection}
              rowDragManaged
              animateRows
              overlayNoRowsTemplate={selectedPressNo ? '데이터가 없습니다.' : '언론사를 선택해주세요.'}
              getRowId={(params) => params.data.rowId}
              onGridReady={onGridReady}
              onSelectionChanged={onSelectionChanged}
              onCellValueChanged={onCellValueChanged}
              onRowDragEnd={onRowDragEnd}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryGridPanel;
