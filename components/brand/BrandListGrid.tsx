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
import type { BrandListItem, BrandListResponse } from '@/components/brand/types';

interface BrandListGridProps {
  searchParams: Record<string, any>;
  onEdit: (brandNo: number) => void;
  onLoadingChange?: (loading: boolean) => void;
  onDelete: (brandNo: number) => void;
}

export interface BrandListGridHandle {
  refresh: () => void;
}

// 브랜드 목록 그리드를 렌더링합니다.
const BrandListGrid = forwardRef<BrandListGridHandle, BrandListGridProps>(({
  searchParams,
  onEdit,
  onLoadingChange,
  onDelete,
}, ref) => {
  const gridApiRef = useRef<GridApi<BrandListItem> | null>(null);

  // 로딩 상태를 상위로 알립니다.
  const notifyLoading = useCallback((loading: boolean) => {
    // 상위 로딩 핸들러가 있을 때만 호출합니다.
    if (onLoadingChange) {
      onLoadingChange(loading);
    }
  }, [onLoadingChange]);

  // 브랜드 목록 그리드 컬럼을 정의합니다.
  const columnDefs = useMemo<ColDef<BrandListItem>[]>(() => [
    { headerName: '브랜드번호', field: 'brandNo', width: 120 },
    {
      headerName: '브랜드명',
      field: 'brandNm',
      width: 220,
      cellClass: 'text-start',
      cellRenderer: (params: ICellRendererParams<BrandListItem>) => {
        // 데이터가 없으면 기본 텍스트를 반환합니다.
        const brandNo = params.data?.brandNo;
        if (!brandNo) {
          return params.value ?? '';
        }
        return (
          <button
            type="button"
            className="btn p-0 fw-bold"
            onClick={() => onEdit(brandNo)}
          >
            {params.value}
          </button>
        );
      },
    },
    { headerName: '노출여부', field: 'useYn', width: 100 },
    { headerName: '정렬순서', field: 'dispOrd', width: 110 },
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
      field: 'deleteAction',
      width: 100,
      cellRenderer: (params) => {
        const brandNo = params.data?.brandNo;
        if (!brandNo) {
          return null;
        }
        return (
          <button
            type="button"
            className="btn btn-outline-danger btn-sm"
            onClick={() => onDelete(brandNo)}
          >
            삭제
          </button>
        );
      },
    },
  ], [onDelete, onEdit]);

  // 그리드 기본 컬럼 옵션을 정의합니다.
  const defaultColDef = useMemo<ColDef>(() => ({
    resizable: true,
    sortable: false,
    cellClass: 'text-center',
  }), []);

  // 브랜드 목록 그리드 데이터소스를 생성합니다.
  const createDataSource = useCallback((): IDatasource => ({
    getRows: async (params: IGetRowsParams) => {
      // 페이지 기준을 계산합니다.
      const pageSize = 20;
      const startRow = params.startRow ?? 0;
      const page = Math.floor(startRow / pageSize) + 1;

      notifyLoading(true);
      try {
        const response = await api.get('/api/admin/brand/admin/list', {
          params: {
            ...searchParams,
            page,
          },
        });
        const data = (response.data || {}) as BrandListResponse;
        params.successCallback(data.list || [], data.totalCount || 0);
      } catch (e) {
        console.error('브랜드 목록을 불러오는 데 실패했습니다.');
        params.failCallback();
      } finally {
        notifyLoading(false);
      }
    },
  }), [notifyLoading, searchParams]);

  // 그리드 데이터소스를 안정적으로 설정합니다.
  const applyDatasource = useCallback((apiInstance: GridApi<BrandListItem>, datasource: IDatasource) => {
    // ag-grid 버전에 따라 API가 달라 분기 처리합니다.
    if (typeof (apiInstance as any).setGridOption === 'function') {
      (apiInstance as any).setGridOption('datasource', datasource);
      return;
    }
    if (typeof (apiInstance as any).setDatasource === 'function') {
      (apiInstance as any).setDatasource(datasource);
    }
  }, []);

  // 브랜드 목록 그리드를 초기화합니다.
  const handleGridReady = useCallback((event: GridReadyEvent<BrandListItem>) => {
    // 그리드 API를 저장하고 데이터소스를 연결합니다.
    gridApiRef.current = event.api;
    applyDatasource(event.api, createDataSource());
  }, [applyDatasource, createDataSource]);

  // 검색 조건 변경 시 그리드 데이터를 다시 조회합니다.
  useEffect(() => {
    // 그리드가 준비되지 않았으면 종료합니다.
    if (!gridApiRef.current) {
      return;
    }
    applyDatasource(gridApiRef.current, createDataSource());
  }, [applyDatasource, createDataSource]);

  // 외부에서 호출 가능한 그리드 갱신 함수를 제공합니다.
  const refreshGrid = useCallback(() => {
    // 그리드 API가 없으면 종료합니다.
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
              <AgGridReact<BrandListItem>
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                domLayout="autoHeight"
                overlayNoRowsTemplate="데이터가 없습니다."
                rowModelType="infinite"
                cacheBlockSize={20}
                pagination
                paginationPageSize={20}
                getRowId={(params) => String(params.data?.brandNo ?? '')}
                onGridReady={handleGridReady}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default BrandListGrid;