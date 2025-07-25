import React from 'react';
import { AgGridReact, AgGridReactProps } from 'ag-grid-react';

interface CommonGridProps extends AgGridReactProps {
  // 추가적인 공통 props가 필요하다면 여기에 정의할 수 있습니다.
}

const CommonGrid: React.FC<CommonGridProps> = (props) => {
  return (
    <div className="ag-theme-alpine" style={{ height: 500, width: '100%' }}>
      <AgGridReact
        // 기본 공통 옵션 설정
        pagination={true}
        paginationPageSize={20}
        suppressRowClickSelection={true}
        rowSelection={'multiple'}
        defaultColDef={{
          sortable: true,
          resizable: true,
          filter: true,
          headerClass: 'header-center',
        }}
        {...props} // 부모 컴포넌트에서 받은 props를 그대로 전달
      />
    </div>
  );
};

export default CommonGrid;
