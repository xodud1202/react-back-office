import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { AgGridReact } from '@/components/common/agGrid/AgGridReact';
import type {
  ColDef,
  GridApi,
  GridReadyEvent,
  IDatasource,
  IGetRowsParams,
} from 'ag-grid-community';
import api from '@/utils/axios/axios';
import type { CouponItem, CouponListResponse, CouponSearchParams } from '@/components/coupon/types';

interface CouponListGridProps {
  // 쿠폰 조회 조건입니다.
  searchParams: CouponSearchParams;
  // 쿠폰 수정 팝업 오픈 함수입니다.
  onEdit: (cpnNo: number) => void;
  // 로딩 상태 전달 함수입니다.
  onLoadingChange?: (loading: boolean) => void;
  // 외부 강제 재조회 토큰입니다.
  reloadToken?: number;
}

// 쿠폰 목록 그리드를 렌더링합니다.
const CouponListGrid = ({ searchParams, onEdit, onLoadingChange, reloadToken = 0 }: CouponListGridProps) => {
  const gridApiRef = useRef<GridApi<CouponItem> | null>(null);

  // 로딩 상태를 상위로 전달합니다.
  const notifyLoading = useCallback((loading: boolean) => {
    if (onLoadingChange) {
      onLoadingChange(loading);
    }
  }, [onLoadingChange]);

  // 쿠폰 목록 컬럼을 정의합니다.
  const columnDefs = useMemo<ColDef<CouponItem>[]>(() => ([
    { headerName: '쿠폰번호', field: 'cpnNo', width: 120 },
    {
      headerName: '쿠폰명',
      field: 'cpnNm',
      width: 220,
      cellClass: 'text-start',
      cellRenderer: (params: { data?: CouponItem; value?: string }) => {
        // 쿠폰명 클릭 시 수정 팝업을 오픈합니다.
        if (!params.data?.cpnNo) {
          return params.value || '';
        }
        return (
          <button
            type="button"
            className="btn btn-link p-0 text-start"
            onClick={() => onEdit(params.data!.cpnNo)}
          >
            {params.value || ''}
          </button>
        );
      },
    },
    { headerName: '쿠폰상태명', field: 'cpnStatNm', width: 130 },
    { headerName: '쿠폰종류명', field: 'cpnGbNm', width: 130 },
    { headerName: '쿠폰타겟명', field: 'cpnTargetNm', width: 130 },
    { headerName: '다운로드시작일시', field: 'cpnDownStartDt', width: 170 },
    { headerName: '다운로드종료일시', field: 'cpnDownEndDt', width: 170 },
    { headerName: '고객 다운로드 가능 여부', field: 'cpnDownAbleYn', width: 170 },
    { headerName: '상태 중지 일시', field: 'statStopDt', width: 160 },
  ]), [onEdit]);

  // 공통 컬럼 속성을 정의합니다.
  const defaultColDef = useMemo<ColDef>(() => ({
    resizable: true,
    sortable: false,
    editable: false,
    cellClass: 'text-center',
  }), []);

  // 쿠폰 목록 조회 데이터소스를 생성합니다.
  const createDataSource = useCallback((): IDatasource => ({
    getRows: async (params: IGetRowsParams) => {
      // ag-grid 요청 범위를 페이지 번호로 변환합니다.
      const pageSize = 20;
      const startRow = params.startRow ?? 0;
      const page = Math.floor(startRow / pageSize) + 1;

      notifyLoading(true);
      try {
        // 검색 조건 기반으로 쿠폰 목록을 조회합니다.
        const response = await api.get('/api/admin/coupon/list', {
          params: {
            ...searchParams,
            page,
            pageSize,
          },
        });
        const data = (response.data || {}) as CouponListResponse;
        params.successCallback(data.list || [], data.totalCount || 0);
      } catch (error) {
        console.error('쿠폰 목록 조회에 실패했습니다.', error);
        params.failCallback();
      } finally {
        notifyLoading(false);
      }
    },
  }), [notifyLoading, searchParams]);

  // ag-grid 버전에 맞춰 데이터소스를 연결합니다.
  const applyDatasource = useCallback((apiInstance: GridApi<CouponItem>, datasource: IDatasource) => {
    if (typeof (apiInstance as any).setGridOption === 'function') {
      (apiInstance as any).setGridOption('datasource', datasource);
      return;
    }
    if (typeof (apiInstance as any).setDatasource === 'function') {
      (apiInstance as any).setDatasource(datasource);
    }
  }, []);

  // 그리드 준비 시 초기 데이터소스를 연결합니다.
  const handleGridReady = useCallback((event: GridReadyEvent<CouponItem>) => {
    gridApiRef.current = event.api;
    applyDatasource(event.api, createDataSource());
  }, [applyDatasource, createDataSource]);

  // 검색 조건 변경 시 목록을 재조회합니다.
  useEffect(() => {
    if (!gridApiRef.current) {
      return;
    }
    applyDatasource(gridApiRef.current, createDataSource());
  }, [applyDatasource, createDataSource, reloadToken]);

  return (
    <div className="ag-theme-alpine-dark header-center" style={{ width: '100%', height: '520px' }}>
      <AgGridReact<CouponItem>
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        rowModelType="infinite"
        cacheBlockSize={20}
        pagination
        paginationPageSize={20}
        overlayNoRowsTemplate="데이터가 없습니다."
        getRowId={(params) => String(params.data?.cpnNo ?? '')}
        onGridReady={handleGridReady}
      />
    </div>
  );
};

export default CouponListGrid;
