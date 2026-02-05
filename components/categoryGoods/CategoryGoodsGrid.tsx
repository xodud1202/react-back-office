import React, { useCallback, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef, RowDragEndEvent, SelectionChangedEvent } from 'ag-grid-community';
import type { CategoryGoodsItem } from '@/components/categoryGoods/types';

interface CategoryGoodsGridProps {
  rows: CategoryGoodsItem[];
  loading: boolean;
  onOrderChange: (rows: CategoryGoodsItem[]) => void;
  onSelectionChange: (goodsIds: string[]) => void;
}

// 카테고리별 상품 그리드를 렌더링합니다.
const CategoryGoodsGrid = ({
  rows,
  loading,
  onOrderChange,
  onSelectionChange,
}: CategoryGoodsGridProps) => {
  // 그리드 컬럼 정보를 구성합니다.
  const columnDefs = useMemo<ColDef<CategoryGoodsItem>[]>(() => ([
    {
      checkboxSelection: true,
      headerCheckboxSelection: true,
      width: 70,
    },
    {
      headerName: '이동',
      width: 70,
      rowDrag: true,
    },
    { headerName: '상품코드', field: 'goodsId', width: 150 },
    {
      headerName: '노출순서',
      field: 'dispOrd',
      width: 120,
    },
    {
      headerName: '이미지',
      field: 'imgUrl',
      width: 90,
      cellRenderer: (params: { data: { imgUrl: any; }; }) => {
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
    { headerName: '상품명', field: 'goodsNm', width: 320, cellClass: 'text-start' },
    { headerName: 'ERP품번코드', field: 'erpStyleCd', width: 140 },
    { headerName: '상품상태', field: 'goodsStatNm', width: 120 },
    { headerName: '상품구분', field: 'goodsDivNm', width: 120 },
  ]), []);

  // 공통 컬럼 옵션을 정의합니다.
  const defaultColDef = useMemo<ColDef>(() => ({
    resizable: true,
    sortable: false,
    editable: false,
    cellClass: 'text-center',
  }), []);

  // 드래그 종료 시 정렬 순서를 갱신합니다.
  const handleRowDragEnd = useCallback((event: RowDragEndEvent<CategoryGoodsItem>) => {
    const api = event.api;
    const rowCount = api.getDisplayedRowCount();
    const nextRows: CategoryGoodsItem[] = [];
    // 표시된 순서대로 정렬 순서를 재계산합니다.
    for (let i = 0; i < rowCount; i += 1) {
      const node = api.getDisplayedRowAtIndex(i);
      if (node?.data) {
        nextRows.push({ ...node.data, dispOrd: i + 1 });
      }
    }
    onOrderChange(nextRows);
  }, [onOrderChange]);

  // 선택 변경 시 선택된 상품코드를 전달합니다.
  const handleSelectionChanged = useCallback((event: SelectionChangedEvent<CategoryGoodsItem>) => {
    const selected = event.api.getSelectedRows() || [];
    const goodsIds = selected.map((item) => item.goodsId).filter((value) => value);
    onSelectionChange(goodsIds);
  }, [onSelectionChange]);

  return (
    <>
      {loading ? (
        <div className="text-center">카테고리 상품을 불러오는 중입니다.</div>
      ) : (
        <div className="ag-theme-alpine-dark header-center" style={{ width: '100%', height: '520px' }}>
          <AgGridReact<CategoryGoodsItem>
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            rowData={rows}
            rowSelection="multiple"
            rowDragManaged
            animateRows
            overlayNoRowsTemplate="데이터가 없습니다."
            getRowId={(params) => String(params.data?.goodsId ?? '')}
            rowHeight={50}
            onRowDragEnd={handleRowDragEnd}
            onSelectionChanged={handleSelectionChanged}
          />
        </div>
      )}
    </>
  );
};

export default CategoryGoodsGrid;
