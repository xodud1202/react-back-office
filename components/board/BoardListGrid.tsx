import React, { useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef, GridReadyEvent, ICellRendererParams } from 'ag-grid-community';
import { dateFormatter } from '@/utils/common';
import type { BoardData } from '@/components/board/types';

interface BoardListGridProps {
  // 그리드 준비 이벤트 처리입니다.
  onGridReady: (event: GridReadyEvent<BoardData>) => void;
  // 상세 열기 처리입니다.
  onOpenDetail: (boardNo: number) => void;
  // 삭제 처리입니다.
  onDeleteBoard: (boardNo?: number | null) => void;
}

// 게시판 목록 그리드를 렌더링합니다.
const BoardListGrid = ({ onGridReady, onOpenDetail, onDeleteBoard }: BoardListGridProps) => {
  // 게시글 목록 그리드 컬럼을 정의합니다.
  const columnDefs = useMemo<ColDef<BoardData>[]>(() => [
    { headerName: '번호', field: 'boardNo', width: 90 },
    {
      headerName: '게시판 상세 구분',
      field: 'boardDetailDivNm',
      width: 160,
      valueGetter: (params) => params.data?.boardDetailDivNm || params.data?.boardDetailDivCd,
    },
    {
      headerName: '타이틀',
      field: 'title',
      flex: 1,
      minWidth: 220,
      cellClass: 'text-start',
      cellRenderer: (params: ICellRendererParams<BoardData>) => (
        <button
          type="button"
          className="btn p-0 text-decoration-none fw-bold"
          onClick={() => params.data?.boardNo && onOpenDetail(params.data.boardNo)}
        >
          {params.data?.title || '제목 없음'}
        </button>
      ),
    },
    {
      headerName: '등록일',
      field: 'regDt',
      width: 170,
      valueFormatter: (params) => dateFormatter({ value: params.value } as any),
    },
    {
      headerName: '수정일',
      field: 'udtDt',
      width: 170,
      valueFormatter: (params) => dateFormatter({ value: params.value } as any),
    },
    {
      headerName: '삭제',
      width: 90,
      cellRenderer: (params: ICellRendererParams<BoardData>) => (
        <button
          type="button"
          className="btn btn-danger btn-sm"
          onClick={() => onDeleteBoard(params.data?.boardNo)}
        >
          삭제
        </button>
      ),
    },
  ], [onDeleteBoard, onOpenDetail]);

  // 그리드 기본 컬럼 속성을 정의합니다.
  const defaultColDef = useMemo<ColDef>(() => ({
    resizable: true,
    sortable: false,
    cellClass: 'text-center',
  }), []);

  return (
    <div className="row">
      <div className="col-lg-12 grid-margin stretch-card">
        <div className="card">
          <div className="card-body">
            <div className="ag-theme-alpine-dark header-center" style={{ width: '100%' }}>
              <AgGridReact<BoardData>
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                domLayout="autoHeight"
                overlayNoRowsTemplate="데이터가 없습니다."
                rowModelType="infinite"
                cacheBlockSize={20}
                pagination
                paginationPageSize={20}
                getRowId={(params) => String(params.data?.boardNo ?? '')}
                onGridReady={onGridReady}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoardListGrid;
