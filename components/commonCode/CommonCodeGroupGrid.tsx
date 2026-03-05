import React, { useMemo } from 'react';
import type { ColDef, ICellRendererParams, SelectionChangedEvent } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import type { CommonCodeRow } from '@/components/commonCode/types';

interface CommonCodeGroupGridProps {
  // 상위 그룹코드 목록입니다.
  rows: CommonCodeRow[];
  // 조회 중 여부입니다.
  loading: boolean;
  // 추가 버튼 처리입니다.
  onCreate: () => void;
  // 행 선택 처리입니다.
  onSelectionChanged: (event: SelectionChangedEvent<CommonCodeRow>) => void;
  // 수정 버튼 처리입니다.
  onEdit: (row: CommonCodeRow) => void;
}

// 상위 그룹코드 그리드를 렌더링합니다.
const CommonCodeGroupGrid = ({
  rows,
  loading,
  onCreate,
  onSelectionChanged,
  onEdit,
}: CommonCodeGroupGridProps) => {
  // 상위 그룹코드 그리드 컬럼을 정의합니다.
  const columnDefs = useMemo<ColDef<CommonCodeRow>[]>(() => [
    {
      headerName: '그룹코드',
      field: 'cd',
      width: 160,
      cellRenderer: (params: ICellRendererParams<CommonCodeRow>) => {
        const row = params.data;
        if (!row) {
          return params.value ?? '';
        }
        return (
          <button
            type="button"
            className="btn p-0 fw-bold text-start text-primary"
            onClick={() => onEdit(row)}
          >
            {params.value}
          </button>
        );
      },
    },
    {
      headerName: '그룹코드명',
      field: 'cdNm',
      flex: 1,
      cellClass: 'text-start',
    },
    { headerName: '사용여부', field: 'useYn', width: 100 },
    { headerName: '정렬순서', field: 'dispOrd', width: 110 },
  ], [onEdit]);

  // ag-grid 기본 컬럼 옵션을 정의합니다.
  const defaultColDef = useMemo<ColDef>(() => ({
    resizable: true,
    sortable: false,
    cellClass: 'text-center',
  }), []);

  return (
    <div className="col-lg-6 grid-margin stretch-card">
      <div className="card">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h5 className="mb-0">상위 그룹코드 목록</h5>
            <button type="button" className="btn btn-primary btn-sm" onClick={onCreate}>
              추가
            </button>
          </div>
          {loading && (
            <div className="text-muted small mb-2">조회 중...</div>
          )}
          <div className="ag-theme-alpine-dark header-center" style={{ width: '100%', height: '520px' }}>
            <AgGridReact<CommonCodeRow>
              rowData={rows}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              rowSelection="single"
              onSelectionChanged={onSelectionChanged}
              overlayNoRowsTemplate="데이터가 없습니다."
              getRowId={(params) => `${params.data?.grpCd || ''}__${params.data?.cd || ''}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommonCodeGroupGrid;
