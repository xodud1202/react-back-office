import React, { useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef, GridReadyEvent, ICellRendererParams } from 'ag-grid-community';
import type { NotionListRow } from '@/components/notion/types';

interface NotionListGridProps {
  // 그리드 준비 처리입니다.
  onGridReady: (event: GridReadyEvent<NotionListRow>) => void;
}

// Notion 저장 목록 그리드를 렌더링합니다.
const NotionListGrid = ({ onGridReady }: NotionListGridProps) => {
  // 입력된 URL을 새 탭으로 엽니다.
  const openUrlInNewTab = (url?: string | null) => {
    const targetUrl = (url || '').trim();
    if (!targetUrl) {
      return;
    }
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  // 목록 그리드 컬럼을 정의합니다.
  const columnDefs = useMemo<ColDef<NotionListRow>[]>(() => ([
    {
      headerName: '카테고리',
      field: 'categoryNm',
      width: 120,
      valueGetter: (params) => params.data?.categoryNm || '-',
    },
    {
      headerName: '타이틀',
      field: 'title',
      minWidth: 400,
      flex: 1,
      cellClass: 'text-start',
      valueGetter: (params) => params.data?.title || '',
    },
    {
      headerName: '본문',
      field: 'notes',
      minWidth: 100,
      flex: 2,
      cellClass: 'text-start',
      valueGetter: (params) => params.data?.notes || '',
    },
    {
      headerName: 'URL',
      field: 'url',
      width: 250,
      cellClass: 'text-start',
      cellStyle: { display: 'flex', alignItems: 'center' },
      cellRenderer: (params: ICellRendererParams<NotionListRow>) => {
        const url = params.data?.url || '';
        if (!url) {
          return <span>-</span>;
        }
        return (
          <button
            type="button"
            className="btn p-0 text-decoration-underline text-start"
            style={{ display: 'block', width: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
            title={url}
            onClick={() => openUrlInNewTab(url)}
          >
            {url}
          </button>
        );
      },
    },
    {
      headerName: 'NOTION URL',
      field: 'notionUrl',
      width: 250,
      cellClass: 'text-start',
      cellStyle: { display: 'flex', alignItems: 'center' },
      cellRenderer: (params: ICellRendererParams<NotionListRow>) => {
        const url = params.data?.notionUrl || '';
        if (!url) {
          return <span>-</span>;
        }
        return (
          <button
            type="button"
            className="btn p-0 text-decoration-underline text-start"
            style={{ display: 'block', width: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
            title={url}
            onClick={() => openUrlInNewTab(url)}
          >
            {url}
          </button>
        );
      },
    },
    {
      headerName: '등록일시',
      field: 'createDt',
      width: 180,
      valueGetter: (params) => params.data?.createDt || '',
    },
  ]), []);

  // ag-grid 공통 컬럼 옵션을 정의합니다.
  const defaultColDef = useMemo<ColDef>(() => ({
    resizable: true,
    sortable: false,
    editable: false,
    cellClass: 'text-center',
  }), []);

  return (
    <div className="row">
      <div className="col-lg-12 grid-margin stretch-card">
        <div className="card">
          <div className="card-body">
            <div className="ag-theme-alpine-dark header-center" style={{ width: '100%' }}>
              <AgGridReact<NotionListRow>
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                domLayout="autoHeight"
                overlayNoRowsTemplate="데이터가 없습니다."
                rowModelType="infinite"
                cacheBlockSize={20}
                pagination
                paginationPageSize={20}
                getRowId={(params) => String(params.data?.id ?? '')}
                onGridReady={onGridReady}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotionListGrid;
