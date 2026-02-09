import React, { useMemo } from 'react';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import type { CommonCodeRow, UserRow } from '@/components/user/types';

interface UserListGridProps {
  rowData: UserRow[];
  usrGradeOptions: CommonCodeRow[];
  usrStatOptions: CommonCodeRow[];
  onEdit: (row: UserRow) => void;
  onCreate: () => void;
}

// 사용자 목록 그리드 컴포넌트를 렌더링합니다.
const UserListGrid = ({ rowData, usrGradeOptions, usrStatOptions, onEdit, onCreate }: UserListGridProps) => {
  // 사용자 등급 코드-코드명 매핑 정보를 생성합니다.
  const usrGradeNameMap = useMemo(() => (
    Object.fromEntries(usrGradeOptions.map((item) => [item.cd, item.cdNm]))
  ), [usrGradeOptions]);

  // 사용자 상태 코드-코드명 매핑 정보를 생성합니다.
  const usrStatNameMap = useMemo(() => (
    Object.fromEntries(usrStatOptions.map((item) => [item.cd, item.cdNm]))
  ), [usrStatOptions]);

  // 사용자 그리드 컬럼을 정의합니다.
  const userColumnDefs = useMemo<ColDef<UserRow>[]>(() => [
    {
      headerName: 'ID',
      field: 'loginId',
      width: 160,
      cellRenderer: (params: ICellRendererParams<UserRow>) => {
        const row = params.data;
        if (!row) {
          return params.value ?? '';
        }
        return (
          <button
            type="button"
            className="btn p-0 fw-bold text-start text-primary"
            onClick={() => onEdit(row)}
          >
            {params.value}
          </button>
        );
      },
    },
    { headerName: '사용자이름', field: 'userNm', width: 140, cellClass: 'text-start' },
    {
      headerName: '등급',
      field: 'usrGradeCd',
      width: 110,
      valueGetter: (params) => {
        const code = params.data?.usrGradeCd || '';
        return usrGradeNameMap[code] || code;
      },
    },
    {
      headerName: '상태',
      field: 'usrStatCd',
      width: 110,
      valueGetter: (params) => {
        const code = params.data?.usrStatCd || '';
        return usrStatNameMap[code] || code;
      },
    },
    { headerName: '휴대폰번호', field: 'hPhoneNo', width: 150 },
    { headerName: 'EMAIL', field: 'email', width: 220, cellClass: 'text-start' },
    { headerName: '마지막로그인일시', field: 'accessDt', width: 180 },
    { headerName: '로그인실패횟수', field: 'loginFailCnt', width: 140 },
    { headerName: '등록일', field: 'regDt', width: 180 },
  ], [onEdit, usrGradeNameMap, usrStatNameMap]);

  // ag-grid 기본 컬럼 옵션을 정의합니다.
  const defaultColDef = useMemo<ColDef>(() => ({
    resizable: true,
    sortable: false,
    cellClass: 'text-center',
  }), []);

  return (
    <div className="row">
      <div className="col-12 grid-margin stretch-card">
        <div className="card">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h5 className="mb-0">사용자 목록</h5>
              <button type="button" className="btn btn-primary btn-sm" onClick={onCreate}>
                사용자 등록
              </button>
            </div>
            <div className="ag-theme-alpine-dark header-center" style={{ width: '100%', height: '560px' }}>
              <AgGridReact<UserRow>
                rowData={rowData}
                columnDefs={userColumnDefs}
                defaultColDef={defaultColDef}
                overlayNoRowsTemplate="데이터가 없습니다."
                getRowId={(params) => String(params.data?.usrNo || '')}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserListGrid;
