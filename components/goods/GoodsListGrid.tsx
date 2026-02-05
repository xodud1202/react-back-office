import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import { AgGridReact } from 'ag-grid-react';
import type {
  ColDef,
  GridApi,
  GridReadyEvent,
  ICellRendererParams,
  IDatasource,
  IGetRowsParams,
} from 'ag-grid-community';
import api from '@/utils/axios/axios';
import { dateFormatter } from '@/utils/common';
import type { GoodsData, GoodsListResponse } from '@/components/goods/types';

interface GoodsListGridProps {
  searchParams: Record<string, any>;
  onEdit: (goodsId: string) => void;
  onLoadingChange?: (loading: boolean) => void;
}

export interface GoodsListGridHandle {
  refresh: () => void;
}

// 상품 목록 그리드를 렌더링합니다.
const GoodsListGrid = forwardRef<GoodsListGridHandle, GoodsListGridProps>(({
  searchParams,
  onEdit,
  onLoadingChange,
}, ref) => {
  const gridApiRef = useRef<GridApi<GoodsData> | null>(null);

  // 로딩 상태를 상위로 전달합니다.
  const notifyLoading = useCallback((loading: boolean) => {
    if (onLoadingChange) {
      onLoadingChange(loading);
    }
  }, [onLoadingChange]);

  // 상품 목록 그리드 컬럼을 정의합니다.
  const columnDefs = useMemo<ColDef<GoodsData>[]>(() => [
    { headerName: '상품코드', field: 'goodsId', width: 150 },
    {
      headerName: '이미지',
      field: 'imgUrl',
      width: 90,
      cellRenderer: (params: ICellRendererParams<GoodsData>) => {
        // 상품 이미지가 있으면 노출합니다.
        const imgUrl = params.data?.imgUrl;
        if (!imgUrl) {
          return null;
        }
        return (
          <img
            src={imgUrl}
            alt="상품 이미지"
            style={{ width: '50px', height: '50px', objectFit: 'cover' }}
          />
        );
      },
    },
    { headerName: '품번코드', field: 'erpStyleCd', width: 120 },
    {
      headerName: '상품명',
      cellClass: 'text-start',
      field: 'goodsNm',
      width: 450,
      cellRenderer: (params: ICellRendererParams<GoodsData>) => {
        const goodsId = params.data?.goodsId;
        if (!goodsId) {
          return params.value ?? '';
        }
        return (
          <button
            type="button"
            className="btn p-0 fw-bold"
            onClick={() => onEdit(goodsId)}
          >
            {params.value}
          </button>
        );
      },
    },
    { headerName: '브랜드', field: 'brandNm', width: 140 },
    { headerName: '상품상태', field: 'goodsStatNm', width: 120 },
    { headerName: '상품분류', field: 'goodsDivNm', width: 120 },
    { headerName: '노출여부', field: 'showYn', width: 100 },
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
  ], [onEdit]);

  // 그리드 기본 컬럼 속성을 정의합니다.
  const defaultColDef = useMemo<ColDef>(() => ({
    resizable: true,
    sortable: false,
    cellClass: 'text-center',
  }), []);

  // 상품 목록 그리드 데이터소스를 생성합니다.
  const createDataSource = useCallback((): IDatasource => ({
    getRows: async (params: IGetRowsParams) => {
      const pageSize = 20;
      const startRow = params.startRow ?? 0;
      const page = Math.floor(startRow / pageSize) + 1;

      notifyLoading(true);
      try {
        const response = await api.get('/api/admin/goods/list', {
          params: {
            ...searchParams,
            page,
          },
        });
        const data = (response.data || {}) as GoodsListResponse;
        params.successCallback(data.list || [], data.totalCount || 0);
      } catch (e) {
        console.error('상품 목록을 불러오는 데 실패했습니다.');
        params.failCallback();
      } finally {
        notifyLoading(false);
      }
    },
  }), [notifyLoading, searchParams]);

  // 그리드 데이터소스를 안전하게 설정합니다.
  const applyDatasource = useCallback((apiInstance: GridApi<GoodsData>, datasource: IDatasource) => {
    if (typeof (apiInstance as any).setGridOption === 'function') {
      (apiInstance as any).setGridOption('datasource', datasource);
      return;
    }
    if (typeof (apiInstance as any).setDatasource === 'function') {
      (apiInstance as any).setDatasource(datasource);
    }
  }, []);

  // 상품 목록 그리드를 초기화합니다.
  const handleGridReady = useCallback((event: GridReadyEvent<GoodsData>) => {
    gridApiRef.current = event.api;
    applyDatasource(event.api, createDataSource());
  }, [applyDatasource, createDataSource]);

  // 검색 조건 변경 시 그리드 데이터를 다시 조회합니다.
  useEffect(() => {
    if (!gridApiRef.current) {
      return;
    }
    applyDatasource(gridApiRef.current, createDataSource());
  }, [applyDatasource, createDataSource]);

  // 외부에서 호출 가능한 그리드 갱신 함수를 제공합니다.
  const refreshGrid = useCallback(() => {
    if (!gridApiRef.current) {
      return;
    }
    if (typeof (gridApiRef.current as any).refreshInfiniteCache === 'function') {
      (gridApiRef.current as any).refreshInfiniteCache();
      return;
    }
    applyDatasource(gridApiRef.current, createDataSource());
  }, [applyDatasource, createDataSource]);

  useImperativeHandle(ref, () => ({
    refresh: refreshGrid,
  }), [refreshGrid]);

  return (
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
                rowHeight={50}
                onGridReady={handleGridReady}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default GoodsListGrid;
