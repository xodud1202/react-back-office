'use client';

import React, { useMemo } from 'react';
import type { CommonCode } from '@/components/goods/types';
import { AgGridReact } from '@/components/common/agGrid/AgGridReact';
import {
  createCompanyWorkColumnDefs,
  createCompanyWorkDefaultColDef,
} from '@/components/companyWork/companyWorkGridColumns';
import type { CompanyWorkListRow, CompanyWorkOpenDetailHandler, CompanyWorkSaveEditableRowHandler } from '@/components/companyWork/types';

interface CompanyWorkSectionGridProps {
  // 상태 영역 제목입니다.
  title: string;
  // 상태 영역 행 목록입니다.
  rowData: CompanyWorkListRow[];
  // 상태 공통코드 목록입니다.
  workStatList: CommonCode[];
  // 우선순위 공통코드 목록입니다.
  workPriorList: CommonCode[];
  // 즉시 저장 처리 함수입니다.
  onSaveEditableRow: CompanyWorkSaveEditableRowHandler;
  // 상세 팝업 열기 처리 함수입니다.
  onOpenDetail: CompanyWorkOpenDetailHandler;
}

// 회사 업무 상태 영역 그리드를 렌더링합니다.
const CompanyWorkSectionGrid = ({
  title,
  rowData,
  workStatList,
  workPriorList,
  onSaveEditableRow,
  onOpenDetail,
}: CompanyWorkSectionGridProps) => {
  // 우선순위 공통코드 기준 컬럼 정의를 구성합니다.
  const columnDefs = useMemo(() => createCompanyWorkColumnDefs({
    workPriorList,
    workStatList,
    onSaveEditableRow,
    onOpenDetail,
  }), [onOpenDetail, onSaveEditableRow, workPriorList, workStatList]);

  // 공통 기본 컬럼 옵션을 구성합니다.
  const defaultColDef = useMemo(() => createCompanyWorkDefaultColDef(), []);

  // 목록이 없으면 렌더링하지 않습니다.
  if (rowData.length === 0) {
    return null;
  }

  return (
    <div className="row">
      <div className="col-lg-12 grid-margin">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">{title}</h5>
          <span className="text-muted small">총 {rowData.length}건</span>
        </div>
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
      </div>
    </div>
  );
};

export default CompanyWorkSectionGrid;
