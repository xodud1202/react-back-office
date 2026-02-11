import React, { useCallback, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef, RowClickedEvent, RowDragEndEvent } from 'ag-grid-community';
import type { BannerImageInfo } from '@/components/banner/types';

interface BannerImageGridProps {
  // 이미지 배너 목록 데이터입니다.
  rows: BannerImageInfo[];
  // 정렬 변경 처리 함수입니다.
  onOrderChange: (rows: BannerImageInfo[]) => void;
  // 행 선택 처리 함수입니다.
  onSelectRow: (row: BannerImageInfo) => void;
}

// 이미지 배너 목록 그리드를 렌더링합니다.
const BannerImageGrid = ({ rows, onOrderChange, onSelectRow }: BannerImageGridProps) => {
  // 컬럼 정보를 정의합니다.
  const columnDefs = useMemo<ColDef<BannerImageInfo>[]>(() => ([
    { headerName: '이동', rowDrag: true, width: 70 },
    { headerName: '순서', field: 'dispOrd', width: 80 },
    {
      headerName: '배너 이미지명',
      field: 'bannerNm',
      width: 220,
      cellClass: 'text-start',
      valueFormatter: (params) => params.value || '(미입력)',
    },
    { headerName: '노출여부', field: 'showYn', width: 100 },
    { headerName: '노출시작', field: 'dispStartDt', width: 170 },
    { headerName: '노출종료', field: 'dispEndDt', width: 170 },
    { headerName: '이미지경로', field: 'imgPath', width: 260, cellClass: 'text-start' },
  ]), []);

  // 공통 컬럼 옵션을 정의합니다.
  const defaultColDef = useMemo<ColDef>(() => ({
    resizable: true,
    sortable: false,
    editable: false,
    cellClass: 'text-center',
  }), []);

  // 드래그 종료 시 노출 순서를 재계산합니다.
  const handleRowDragEnd = useCallback((event: RowDragEndEvent<BannerImageInfo>) => {
    const api = event.api;
    const rowCount = api.getDisplayedRowCount();
    const nextRows: BannerImageInfo[] = [];
    for (let i = 0; i < rowCount; i += 1) {
      const node = api.getDisplayedRowAtIndex(i);
      if (node?.data) {
        nextRows.push({ ...node.data, dispOrd: i + 1 });
      }
    }
    onOrderChange(nextRows);
  }, [onOrderChange]);

  // 행 클릭 시 편집 대상을 선택합니다.
  const handleRowClicked = useCallback((event: RowClickedEvent<BannerImageInfo>) => {
    if (!event.data) {
      return;
    }
    onSelectRow(event.data);
  }, [onSelectRow]);

  return (
    <div className="ag-theme-alpine-dark header-center" style={{ width: '100%', height: '260px' }}>
      <AgGridReact<BannerImageInfo>
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        rowData={rows}
        rowDragManaged
        animateRows
        overlayNoRowsTemplate="데이터가 없습니다."
        getRowId={(params) => String(params.data.imageBannerNo ?? params.data.rowKey ?? '')}
        onRowDragEnd={handleRowDragEnd}
        onRowClicked={handleRowClicked}
      />
    </div>
  );
};

export default BannerImageGrid;
