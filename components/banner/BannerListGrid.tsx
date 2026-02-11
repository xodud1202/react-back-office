import React, { useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef } from 'ag-grid-community';
import type { BannerItem } from '@/components/banner/types';

interface BannerListGridProps {
  // 배너 목록 데이터입니다.
  rows: BannerItem[];
  // 수정 버튼 클릭 처리 함수입니다.
  onEdit: (bannerNo: number) => void;
}

// 배너 목록 그리드를 렌더링합니다.
const BannerListGrid = ({ rows, onEdit }: BannerListGridProps) => {
  // 그리드 컬럼을 정의합니다.
  const columnDefs = useMemo<ColDef<BannerItem>[]>(() => ([
    { headerName: '배너번호', field: 'bannerNo', width: 110 },
    { headerName: '배너구분', field: 'bannerDivNm', width: 160 },
    { headerName: '배너명', field: 'bannerNm', width: 240, cellClass: 'text-start' },
    { headerName: '노출시작', field: 'dispStartDt', width: 170 },
    { headerName: '노출종료', field: 'dispEndDt', width: 170 },
    { headerName: '노출순서', field: 'dispOrd', width: 120 },
    { headerName: '노출여부', field: 'showYn', width: 110 },
    { headerName: '등록일시', field: 'regDt', width: 170 },
    { headerName: '수정일시', field: 'udtDt', width: 170 },
    {
      headerName: '수정',
      width: 100,
      cellRenderer: (params: { data?: BannerItem }) => {
        // 수정 버튼 클릭 시 상세 편집을 실행합니다.
        if (!params.data?.bannerNo) {
          return null;
        }
        return (
          <button
            type="button"
            className="btn btn-outline-primary btn-sm"
            onClick={() => onEdit(params.data!.bannerNo)}
          >
            수정
          </button>
        );
      },
    },
  ]), [onEdit]);

  // 공통 컬럼 옵션을 정의합니다.
  const defaultColDef = useMemo<ColDef>(() => ({
    resizable: true,
    sortable: false,
    editable: false,
    cellClass: 'text-center',
  }), []);

  return (
    <div className="ag-theme-alpine-dark header-center" style={{ width: '100%', height: '520px' }}>
      <AgGridReact<BannerItem>
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

export default BannerListGrid;
