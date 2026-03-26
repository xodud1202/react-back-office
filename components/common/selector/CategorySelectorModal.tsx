import React, { useCallback, useMemo, useState } from 'react';
import type { ColDef, SelectionChangedEvent } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import Modal from '@/components/common/Modal';
import AdminSearchPanel from '@/components/common/AdminSearchPanel';
import type { CategoryOption } from '@/components/goods/types';
import { notifyError } from '@/utils/ui/feedback';

interface CategorySelectorModalProps {
  // 모달 오픈 여부입니다.
  isOpen: boolean;
  // 모달 닫기 함수입니다.
  onClose: () => void;
  // 카테고리 옵션 목록입니다.
  categoryOptions: CategoryOption[];
  // 선택 반영 함수입니다.
  onApply: (selectedRows: CategoryOption[]) => void;
}

// 공통 카테고리 선택 모달을 렌더링합니다.
const CategorySelectorModal = ({
  isOpen,
  onClose,
  categoryOptions,
  onApply,
}: CategorySelectorModalProps) => {
  const [selectedRows, setSelectedRows] = useState<CategoryOption[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [categoryLevel, setCategoryLevel] = useState<string>('');

  // 검색 결과 컬럼을 정의합니다.
  const columnDefs = useMemo<ColDef<CategoryOption>[]>(() => ([
    { headerName: '카테고리ID', field: 'categoryId', width: 180 },
    { headerName: '카테고리명', field: 'categoryNm', width: 320, cellClass: 'text-start' },
    { headerName: '레벨', field: 'categoryLevel', width: 120 },
  ]), []);

  // 공통 컬럼 속성을 정의합니다.
  const defaultColDef = useMemo<ColDef>(() => ({
    resizable: true,
    sortable: false,
    editable: false,
    cellClass: 'text-center',
  }), []);

  // AG Grid 선택 옵션을 구성합니다.
  const rowSelection = useMemo(() => ({
    mode: 'multiRow' as const,
    checkboxes: true,
    headerCheckbox: true,
    enableClickSelection: false,
  }), []);

  // 검색 조건으로 카테고리 목록을 필터링합니다.
  const filteredRows = useMemo(() => {
    const normalizedSearchValue = searchValue.trim().toLowerCase();
    return categoryOptions.filter((item) => {
      const isLevelMatched = categoryLevel === '' || String(item.categoryLevel) === categoryLevel;
      if (!isLevelMatched) {
        return false;
      }
      if (!normalizedSearchValue) {
        return true;
      }
      return String(item.categoryId || '').toLowerCase().includes(normalizedSearchValue)
        || String(item.categoryNm || '').toLowerCase().includes(normalizedSearchValue);
    });
  }, [categoryLevel, categoryOptions, searchValue]);

  // 선택된 카테고리 행을 갱신합니다.
  const handleSelectionChanged = useCallback((event: SelectionChangedEvent<CategoryOption>) => {
    setSelectedRows(event.api.getSelectedRows() || []);
  }, []);

  // 선택한 카테고리를 상위로 전달합니다.
  const handleApply = useCallback(() => {
    if (selectedRows.length === 0) {
      notifyError('추가할 카테고리를 선택해주세요.');
      return;
    }
    onApply(selectedRows);
  }, [onApply, selectedRows]);

  // 검색 폼 제출을 처리합니다.
  const handleSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  }, []);

  // 검색 조건을 기본값으로 초기화합니다.
  const handleReset = useCallback(() => {
    setCategoryLevel('');
    setSearchValue('');
  }, []);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="카테고리 선택"
      width="75vw"
      contentHeight="78vh"
      footerActions={(
        <button type="button" className="btn btn-primary" onClick={handleApply}>
          선택 적용
        </button>
      )}
    >
      <AdminSearchPanel onSubmit={handleSubmit} onReset={handleReset} resetType="button">
        <tr>
          <th scope="row">레벨</th>
          <td>
            <select className="form-select admin-search-control" value={categoryLevel} onChange={(event) => setCategoryLevel(event.target.value)}>
              <option value="">전체</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
            </select>
          </td>
          <th scope="row">검색어</th>
          <td colSpan={3}>
            <input
              type="text"
              className="form-control"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="카테고리ID 또는 카테고리명을 입력하세요"
            />
          </td>
        </tr>
      </AdminSearchPanel>

      <div className="ag-theme-alpine-dark header-center" style={{ width: '100%', height: '470px' }}>
        <AgGridReact<CategoryOption>
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          rowSelection={rowSelection}
          selectionColumnDef={{ width: 70, resizable: false }}
          rowData={filteredRows}
          pagination
          paginationPageSize={20}
          overlayNoRowsTemplate="데이터가 없습니다."
          getRowId={(params) => String(params.data?.categoryId ?? '')}
          onSelectionChanged={handleSelectionChanged}
        />
      </div>
    </Modal>
  );
};

export default CategorySelectorModal;
