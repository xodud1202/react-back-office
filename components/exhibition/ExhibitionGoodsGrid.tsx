import React, { useCallback, useMemo } from 'react';
import Image from 'next/image';
import type { ColDef, RowDragEndEvent } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import type { ExhibitionGoodsItem } from '@/components/exhibition/types';

interface ExhibitionGoodsGridProps {
  // 상품 목록 데이터입니다.
  rows: ExhibitionGoodsItem[];
  // 편집 가능 여부입니다.
  isEditable: boolean;
  // 정렬이 변경되면 호출됩니다.
  onRowsChange: (rows: ExhibitionGoodsItem[]) => void;
  // 선택 변경 시 호출됩니다.
  onSelectionChange: (rowKeys: string[]) => void;
}

// 기획전 탭 상품 그리드를 렌더링합니다.
const ExhibitionGoodsGrid = ({
  rows,
  isEditable,
  onRowsChange,
  onSelectionChange,
}: ExhibitionGoodsGridProps) => {
  // 컬럼을 정의합니다.
  const columnDefs = useMemo<ColDef<ExhibitionGoodsItem>[]>(() => ([
    {
      headerName: '선택',
      width: 70,
      checkboxSelection: true,
      headerCheckboxSelection: true,
    },
    {
      headerName: '이동',
      rowDrag: true,
      width: 80,
    },
    {
      headerName: '상품이미지',
      field: 'imgUrl',
      width: 110,
      editable: false,
      cellRenderer: (params: any) => {
        const imageUrl = String(params.value || '').trim();
        if (!imageUrl) {
          return '-';
        }
        return (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Image
              src={imageUrl}
              alt="상품이미지"
              width={48}
              height={48}
              unoptimized
              style={{ objectFit: 'cover', borderRadius: '4px' }}
            />
          </div>
        );
      },
    },
    { headerName: '상품코드', field: 'goodsId', width: 150 },
    { headerName: 'ERP품번코드', field: 'erpStyleCd', width: 140 },
    { headerName: '상품명', field: 'goodsNm', width: 260, cellClass: 'text-start' },
    {
      headerName: '노출순서',
      field: 'dispOrd',
      width: 110,
    },
    {
      headerName: '노출여부',
      field: 'showYn',
      width: 120,
      editable: isEditable,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: isEditable ? {
        values: ['Y', 'N'],
      } : undefined,
    },
  ]), [isEditable]);

  // 공통 옵션입니다.
  const defaultColDef = useMemo<ColDef>(() => ({
    resizable: true,
    sortable: false,
    editable: false,
    cellClass: 'text-center',
  }), []);

  // 행 순서를 재계산합니다.
  const handleRowDragEnd = useCallback((event: RowDragEndEvent<ExhibitionGoodsItem>) => {
    const nextRows: ExhibitionGoodsItem[] = [];
    const rowCount = event.api.getDisplayedRowCount();
    for (let index = 0; index < rowCount; index += 1) {
      const node = event.api.getDisplayedRowAtIndex(index);
      if (!node?.data) {
        continue;
      }
      const row = node.data;
      if (!row.rowKey) {
        continue;
      }
      nextRows.push({
        ...row,
        dispOrd: index + 1,
      });
    }
    onRowsChange(nextRows);
  }, [onRowsChange]);

  return (
    <div className="ag-theme-alpine-dark header-center" style={{ width: '100%', height: '340px' }}>
      <AgGridReact<ExhibitionGoodsItem>
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        rowData={rows}
        rowHeight={60}
        rowSelection="multiple"
        rowDragManaged
        animateRows
        overlayNoRowsTemplate="상품이 없습니다."
        getRowId={(params) => String(params.data.rowKey || `${params.data.goodsId}-${params.data.dispOrd}`)}
        onRowDragEnd={handleRowDragEnd}
        onSelectionChanged={(event) => {
          const selected = event.api.getSelectedRows();
          onSelectionChange(selected.map((item) => String(item.rowKey || `${item.goodsId}-${item.dispOrd}`)));
        }}
      />
    </div>
  );
};

export default ExhibitionGoodsGrid;
