'use client';

import React, { useMemo } from 'react';
import type { CommonCode } from '@/components/goods/types';
import { AgGridReact } from '@/components/common/agGrid/AgGridReact';
import {
  createCompanyWorkColumnDefs,
  createCompanyWorkDefaultColDef,
} from '@/components/companyWork/companyWorkGridColumns';
import type { CompanyWorkListRow, CompanyWorkOpenDetailHandler, CompanyWorkSaveEditableRowHandler } from '@/components/companyWork/types';

interface CompanyWorkCompletedGridProps {
  // 완료 업무 목록입니다.
  rowData: CompanyWorkListRow[];
  // 전체 건수입니다.
  totalCount: number;
  // 현재 페이지입니다.
  page: number;
  // 페이지 크기입니다.
  pageSize: number;
  // 완료 목록 조회 중 여부입니다.
  loading: boolean;
  // 상태 공통코드 목록입니다.
  workStatList: CommonCode[];
  // 우선순위 공통코드 목록입니다.
  workPriorList: CommonCode[];
  // 페이지 변경 처리입니다.
  onChangePage: (page: number) => void;
  // 즉시 저장 처리 함수입니다.
  onSaveEditableRow: CompanyWorkSaveEditableRowHandler;
  // 상세 팝업 열기 처리 함수입니다.
  onOpenDetail: CompanyWorkOpenDetailHandler;
}

// 완료 목록 총 페이지 수를 계산합니다.
const resolveTotalPageCount = (totalCount: number, pageSize: number): number => {
  // 페이지 크기가 0 이하이면 1페이지로 고정합니다.
  if (pageSize < 1) {
    return 1;
  }
  return Math.max(1, Math.ceil(totalCount / pageSize));
};

// 회사 업무 완료 목록 그리드를 렌더링합니다.
const CompanyWorkCompletedGrid = ({
  rowData,
  totalCount,
  page,
  pageSize,
  loading,
  workStatList,
  workPriorList,
  onChangePage,
  onSaveEditableRow,
  onOpenDetail,
}: CompanyWorkCompletedGridProps) => {
  // 우선순위 공통코드 기준 컬럼 정의를 구성합니다.
  const columnDefs = useMemo(() => createCompanyWorkColumnDefs({
    workPriorList,
    workStatList,
    onSaveEditableRow,
    onOpenDetail,
  }), [onOpenDetail, onSaveEditableRow, workPriorList, workStatList]);

  // 공통 기본 컬럼 옵션을 구성합니다.
  const defaultColDef = useMemo(() => createCompanyWorkDefaultColDef(), []);

  // 전체 페이지 수를 계산합니다.
  const totalPageCount = resolveTotalPageCount(totalCount, pageSize);

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
            rowData={rowData}
            domLayout="autoHeight"
            overlayNoRowsTemplate="조회 결과가 없습니다."
            getRowId={(params) => String(params.data?.workSeq ?? '')}
            rowHeight={46}
          />
        </div>
        {totalPageCount > 1 ? (
          <div className="d-flex justify-content-end align-items-center gap-2 mt-3">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={() => onChangePage(page - 1)}
              disabled={loading || page <= 1}
            >
              이전
            </button>
            <span className="text-muted small">{page} / {totalPageCount}</span>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={() => onChangePage(page + 1)}
              disabled={loading || page >= totalPageCount}
            >
              다음
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default CompanyWorkCompletedGrid;
