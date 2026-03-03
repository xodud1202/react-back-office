import React, { useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef } from 'ag-grid-community';
import type { ExhibitionItem } from '@/components/exhibition/types';

interface ExhibitionListGridProps {
  // 기획전 목록 데이터입니다.
  rows: ExhibitionItem[];
  // 수정 모달 오픈 처리 함수입니다.
  onEdit: (exhibitionNo: number) => void;
}

// 기획전 목록 그리드를 렌더링합니다.
const ExhibitionListGrid = ({ rows, onEdit }: ExhibitionListGridProps) => {
  // 컬럼을 정의합니다.
  const columnDefs = useMemo<ColDef<ExhibitionItem>[]>(() => ([
    { headerName: '기획전번호', field: 'exhibitionNo', width: 120 },
    {
      headerName: '기획전명',
      field: 'exhibitionNm',
      width: 260,
      cellClass: 'text-start',
      cellRenderer: (params: { data?: ExhibitionItem; value?: string }) => {
        // 기획전명을 클릭해 수정을 오픈합니다.
        if (!params.data?.exhibitionNo) {
          return params.value || '';
        }
        return (
          <button
            type="button"
            className="btn btn-link p-0 text-start"
            onClick={() => onEdit(params.data!.exhibitionNo)}
          >
            {params.value || ''}
          </button>
        );
      },
    },
    { headerName: '노출시작일시', field: 'dispStartDt', width: 170 },
    { headerName: '노출종료일시', field: 'dispEndDt', width: 170 },
    { headerName: '리스트노출여부', field: 'listShowYn', width: 120 },
    { headerName: '노출여부', field: 'showYn', width: 100 },
    { headerName: '등록일시', field: 'regDt', width: 170 },
    { headerName: '수정일시', field: 'udtDt', width: 170 },
    {
      headerName: '수정',
      width: 90,
      cellRenderer: (params: { data?: ExhibitionItem }) => {
        // 수정 버튼을 제공합니다.
        if (!params.data?.exhibitionNo) {
          return null;
        }
        return (
          <button
            type="button"
            className="btn btn-outline-primary btn-sm"
            onClick={() => onEdit(params.data!.exhibitionNo)}
          >
            수정
          </button>
        );
      },
    },
  ]), [onEdit]);

  // 공통 그리드 옵션입니다.
  const defaultColDef = useMemo<ColDef>(() => ({
    resizable: true,
    sortable: false,
    editable: false,
    cellClass: 'text-center',
  }), []);

  return (
    <div className="ag-theme-alpine-dark header-center" style={{ width: '100%', height: '520px' }}>
      <AgGridReact<ExhibitionItem>
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        rowData={rows}
        pagination
        paginationPageSize={20}
        overlayNoRowsTemplate="데이터가 없습니다."
      />
    </div>
  );
};

export default ExhibitionListGrid;
