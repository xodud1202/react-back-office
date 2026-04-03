import React from 'react';
import { AgGridReact, AgGridReactProps } from '@/components/common/agGrid/AgGridReact';

/*interface CommonGridProps extends AgGridReactProps {
  // 추가적인 공통 props가 필요하다면 여기에 정의할 수 있습니다.
}*/
type CommonGridProps = AgGridReactProps

// AG Grid v32.2+ 공통 다중 선택 옵션입니다.
const commonRowSelection = {
  mode: 'multiRow' as const,
  enableClickSelection: 'enableDeselection' as const,
};

const CommonGrid: React.FC<CommonGridProps> = (props) => {
  return (
    <div className="ag-theme-alpine" style={{ height: 500, width: '100%' }}>
      <AgGridReact
        // 기본 공통 옵션 설정
        pagination={true}
        paginationPageSize={20}
        rowSelection={commonRowSelection}
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
