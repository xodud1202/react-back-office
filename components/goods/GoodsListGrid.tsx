import React from 'react';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef, GridReadyEvent } from 'ag-grid-community';
import type { GoodsData } from '@/components/goods/types';

interface GoodsListGridProps {
  columnDefs: ColDef<GoodsData>[];
  defaultColDef: ColDef;
  onGridReady: (event: GridReadyEvent<GoodsData>) => void;
}

// 상품 목록 그리드를 렌더링합니다.
const GoodsListGrid = ({ columnDefs, defaultColDef, onGridReady }: GoodsListGridProps) => (
  <div className="row">
    <div className="col-lg-12 grid-margin stretch-card">
      <div className="card">
        <div className="card-body">
          <div className="ag-theme-alpine-dark header-center" style={{ width: '100%' }}>
            <AgGridReact<GoodsData>
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              domLayout="autoHeight"
              overlayNoRowsTemplate="데이터가 없습니다."
              rowModelType="infinite"
              cacheBlockSize={20}
              pagination
              paginationPageSize={20}
              getRowId={(params) => String(params.data?.goodsId ?? '')}
              onGridReady={onGridReady}
            />
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default GoodsListGrid;
