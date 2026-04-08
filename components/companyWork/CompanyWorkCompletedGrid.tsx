'use client';

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import type { CommonCode } from '@/components/goods/types';
import type {
  GridApi,
  GridReadyEvent,
  IDatasource,
  IGetRowsParams,
} from 'ag-grid-community';
import { AgGridReact } from '@/components/common/agGrid/AgGridReact';
import {
  createCompanyWorkColumnDefs,
  createCompanyWorkDefaultColDef,
} from '@/components/companyWork/companyWorkGridColumns';
import type {
  CompanyWorkListRow,
  CompanyWorkOpenDetailHandler,
  CompanyWorkOpenReplyViewHandler,
  CompanyWorkSaveEditableRowHandler,
  CompanyWorkSearchParams,
} from '@/components/companyWork/types';
import type { CompanyWorkCompletedListResponse } from '@/components/companyWork/types';
import { fetchCompanyWorkCompletedList } from '@/services/companyWorkApi';
import { notifyError } from '@/utils/ui/feedback';

interface CompanyWorkCompletedGridProps {
  // 전체 건수입니다.
  totalCount: number;
  // 페이지 크기입니다.
  pageSize: number;
  // 완료 목록 검색 조건입니다.
  searchParams: CompanyWorkSearchParams | null;
  // 완료 목록 조회 중 여부입니다.
  loading: boolean;
  // 상태 공통코드 목록입니다.
  workStatList: CommonCode[];
  // 우선순위 공통코드 목록입니다.
  workPriorList: CommonCode[];
  // 완료 목록 응답 반영 처리입니다.
  onLoaded: (response: CompanyWorkCompletedListResponse) => void;
  // 완료 목록 로딩 상태 변경 처리입니다.
  onLoadingChange: (loading: boolean) => void;
  // 즉시 저장 처리 함수입니다.
  onSaveEditableRow: CompanyWorkSaveEditableRowHandler;
  // 상세 팝업 열기 처리 함수입니다.
  onOpenDetail: CompanyWorkOpenDetailHandler;
  // 댓글 조회 팝업 열기 처리 함수입니다.
  onOpenReplyView: CompanyWorkOpenReplyViewHandler;
}

export interface CompanyWorkCompletedGridHandle {
  // 현재 그리드의 완료 목록 캐시를 새로고칩니다.
  refresh: () => void;
}

// 회사 업무 완료 목록 그리드를 렌더링합니다.
const CompanyWorkCompletedGrid = forwardRef<CompanyWorkCompletedGridHandle, CompanyWorkCompletedGridProps>(({
  totalCount,
  pageSize,
  searchParams,
  loading,
  workStatList,
  workPriorList,
  onLoaded,
  onLoadingChange,
  onSaveEditableRow,
  onOpenDetail,
  onOpenReplyView,
}, ref) => {
  const gridApiRef = useRef<GridApi<CompanyWorkListRow> | null>(null);

  // 우선순위 공통코드 기준 컬럼 정의를 구성합니다.
  const columnDefs = useMemo(() => createCompanyWorkColumnDefs({
    workPriorList,
    workStatList,
    onSaveEditableRow,
    onOpenDetail,
    onOpenReplyView,
  }), [onOpenDetail, onOpenReplyView, onSaveEditableRow, workPriorList, workStatList]);

  // 공통 기본 컬럼 옵션을 구성합니다.
  const defaultColDef = useMemo(() => createCompanyWorkDefaultColDef(), []);

  // 그리드 데이터소스를 안전하게 설정합니다.
  const applyDatasource = useCallback((apiInstance: GridApi<CompanyWorkListRow>, datasource: IDatasource) => {
    if (typeof (apiInstance as any).setGridOption === 'function') {
      (apiInstance as any).setGridOption('datasource', datasource);
      return;
    }
    if (typeof (apiInstance as any).setDatasource === 'function') {
      (apiInstance as any).setDatasource(datasource);
    }
  }, []);

  // 완료 목록 그리드 데이터소스를 생성합니다.
  const createDataSource = useCallback((): IDatasource => ({
    getRows: async (params: IGetRowsParams) => {
      // 검색 조건이 없으면 빈 데이터로 초기화합니다.
      if (!searchParams) {
        params.successCallback([], 0);
        onLoaded({
          list: [],
          totalCount: 0,
          page: 1,
          pageSize,
        });
        return;
      }

      const startRow = params.startRow ?? 0;
      const page = Math.floor(startRow / pageSize) + 1;

      onLoadingChange(true);
      try {
        // ag-grid 현재 페이지 시작 행 기준으로 완료 목록을 조회합니다.
        const response = await fetchCompanyWorkCompletedList({
          ...searchParams,
          page,
          pageSize,
        });
        params.successCallback(response.list || [], response.totalCount || 0);
        onLoaded(response);
      } catch (error) {
        // 페이지 조회 실패 시 현재 그리드 페이지를 유지하고 오류를 안내합니다.
        console.error('회사 업무 완료 목록 조회에 실패했습니다.', error);
        notifyError('완료 목록 조회에 실패했습니다.');
        params.failCallback();
      } finally {
        onLoadingChange(false);
      }
    },
  }), [onLoaded, onLoadingChange, pageSize, searchParams]);

  // 완료 목록 그리드를 초기화합니다.
  const handleGridReady = useCallback((event: GridReadyEvent<CompanyWorkListRow>) => {
    gridApiRef.current = event.api;
    applyDatasource(event.api, createDataSource());
  }, [applyDatasource, createDataSource]);

  // 검색 조건이 바뀌면 그리드 데이터소스를 다시 바인딩합니다.
  useEffect(() => {
    if (!gridApiRef.current) {
      return;
    }
    applyDatasource(gridApiRef.current, createDataSource());
  }, [applyDatasource, createDataSource]);

  // 외부에서 호출 가능한 완료 목록 갱신 함수를 제공합니다.
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

  // 완료 목록이 없으면 렌더링하지 않습니다.
  if (totalCount < 1) {
    return null;
  }

  return (
    <div className="row">
      <div className="col-lg-12 grid-margin">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">완료</h5>
          <span className="text-muted small">총 {totalCount}건</span>
        </div>
        {loading ? (
          <div className="text-end text-muted small mb-2">완료 목록을 불러오는 중입니다.</div>
        ) : null}
        <div className="ag-theme-alpine-dark header-center company-work-grid-theme" style={{ width: '100%' }}>
          <AgGridReact<CompanyWorkListRow>
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            domLayout="autoHeight"
            overlayNoRowsTemplate="조회 결과가 없습니다."
            rowModelType="infinite"
            cacheBlockSize={pageSize}
            pagination
            paginationPageSize={pageSize}
            getRowId={(params) => String(params.data?.workSeq ?? '')}
            rowHeight={46}
            onGridReady={handleGridReady}
          />
        </div>
      </div>
    </div>
  );
});

CompanyWorkCompletedGrid.displayName = 'CompanyWorkCompletedGrid';
export default CompanyWorkCompletedGrid;
