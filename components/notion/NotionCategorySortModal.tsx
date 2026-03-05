import React, { useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import type {
  ColDef,
  GridReadyEvent,
  RowDragEndEvent,
  SelectionChangedEvent,
} from 'ag-grid-community';
import type { NotionCategorySortRow } from '@/components/notion/types';

interface NotionCategorySortModalProps {
  // 팝업 오픈 여부입니다.
  isOpen: boolean;
  // 정렬 행 목록입니다.
  sortRows: NotionCategorySortRow[];
  // 저장 중 여부입니다.
  sortSaving: boolean;
  // 팝업 닫기 처리입니다.
  onClose: () => void;
  // 저장 처리입니다.
  onSave: () => void;
  // 위/아래 이동 처리입니다.
  onMoveRow: (direction: 'up' | 'down') => void;
  // 정렬 그리드 준비 처리입니다.
  onGridReady: (event: GridReadyEvent<NotionCategorySortRow>) => void;
  // 선택 변경 처리입니다.
  onSelectionChanged: (event: SelectionChangedEvent<NotionCategorySortRow>) => void;
  // 드래그 종료 처리입니다.
  onRowDragEnd: (event: RowDragEndEvent<NotionCategorySortRow>) => void;
}

// Notion 카테고리 순서 변경 팝업을 렌더링합니다.
const NotionCategorySortModal = ({
  isOpen,
  sortRows,
  sortSaving,
  onClose,
  onSave,
  onMoveRow,
  onGridReady,
  onSelectionChanged,
  onRowDragEnd,
}: NotionCategorySortModalProps) => {
  // 팝업 정렬 그리드 컬럼을 정의합니다.
  const columnDefs = useMemo<ColDef<NotionCategorySortRow>[]>(() => ([
    {
      headerName: '이동',
      width: 70,
      rowDrag: true,
    },
    {
      headerName: '카테고리명',
      field: 'categoryNm',
      flex: 1,
      minWidth: 220,
      cellClass: 'text-start',
    },
  ]), []);

  // ag-grid 공통 컬럼 옵션을 정의합니다.
  const defaultColDef = useMemo<ColDef>(() => ({
    resizable: true,
    sortable: false,
    editable: false,
    cellClass: 'text-center',
  }), []);

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <div
        className="modal fade show"
        style={{
          display: 'flex',
          position: 'fixed',
          inset: 0,
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1060,
        }}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-dialog" style={{ margin: 0, width: '370px', maxWidth: '92vw' }}>
          <div className="modal-content" style={{ maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-body" style={{ overflowY: 'auto', flex: 1 }}>
              <div className="ag-theme-alpine-dark header-center" style={{ width: '100%', height: '360px' }}>
                <AgGridReact<NotionCategorySortRow>
                  rowData={sortRows}
                  columnDefs={columnDefs}
                  defaultColDef={defaultColDef}
                  rowSelection="single"
                  rowDragManaged
                  animateRows
                  overlayNoRowsTemplate="데이터가 없습니다."
                  getRowId={(params) => params.data.rowId}
                  onGridReady={onGridReady}
                  onSelectionChanged={onSelectionChanged}
                  onRowDragEnd={onRowDragEnd}
                />
              </div>
              <div>
                <button type="button" className="btn btn-light" onClick={() => onMoveRow('up')}>
                  <i className="mdi mdi-arrow-up-bold me-1" aria-hidden="true"></i>
                  위로
                </button>
                <button type="button" className="btn btn-light m-2" onClick={() => onMoveRow('down')}>
                  <i className="mdi mdi-arrow-down-bold me-1" aria-hidden="true"></i>
                  아래로
                </button>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-primary" disabled={sortSaving} onClick={onSave}>
                {sortSaving ? '저장중...' : '저장'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                닫기
              </button>
            </div>
          </div>
        </div>
      </div>
      <div
        className="modal-backdrop fade show"
        style={{ position: 'fixed', inset: 0, zIndex: 1055 }}
        onClick={onClose}
      ></div>
    </>
  );
};

export default NotionCategorySortModal;
