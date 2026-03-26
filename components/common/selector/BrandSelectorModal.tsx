import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { ColDef, SelectionChangedEvent } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import Modal from '@/components/common/Modal';
import AdminSearchPanel from '@/components/common/AdminSearchPanel';
import type { BrandOption } from '@/components/goods/types';
import { notifyError } from '@/utils/ui/feedback';

interface BrandSelectorModalProps {
  // 모달 오픈 여부입니다.
  isOpen: boolean;
  // 모달 닫기 함수입니다.
  onClose: () => void;
  // 브랜드 목록입니다.
  brandList: BrandOption[];
  // 선택 반영 함수입니다.
  onApply: (selectedRows: BrandOption[]) => void;
}

// 공통 브랜드 선택 모달을 렌더링합니다.
const BrandSelectorModal = ({
  isOpen,
  onClose,
  brandList,
  onApply,
}: BrandSelectorModalProps) => {
  const [selectedRows, setSelectedRows] = useState<BrandOption[]>([]);
  const [searchGb, setSearchGb] = useState<'NO' | 'NM'>('NM');
  const [searchValue, setSearchValue] = useState('');

  // 검색 결과 컬럼을 정의합니다.
  const columnDefs = useMemo<ColDef<BrandOption>[]>(() => ([
    { headerName: '브랜드번호', field: 'brandNo', width: 160 },
    { headerName: '브랜드명', field: 'brandNm', width: 360, cellClass: 'text-start' },
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

  // 검색 조건으로 브랜드 목록을 필터링합니다.
  const filteredRows = useMemo(() => {
    const normalizedSearchValue = searchValue.trim().toLowerCase();
    if (!normalizedSearchValue) {
      return brandList;
    }
    return brandList.filter((item) => {
      if (searchGb === 'NO') {
        return String(item.brandNo || '').includes(normalizedSearchValue);
      }
      return String(item.brandNm || '').toLowerCase().includes(normalizedSearchValue);
    });
  }, [brandList, searchGb, searchValue]);

  // 선택된 브랜드 행을 갱신합니다.
  const handleSelectionChanged = useCallback((event: SelectionChangedEvent<BrandOption>) => {
    setSelectedRows(event.api.getSelectedRows() || []);
  }, []);

  // 선택한 브랜드를 상위로 전달합니다.
  const handleApply = useCallback(() => {
    if (selectedRows.length === 0) {
      notifyError('추가할 브랜드를 선택해주세요.');
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
    setSearchGb('NM');
    setSearchValue('');
  }, []);

  // 모달이 닫히면 상태를 초기화합니다.
  useEffect(() => {
    if (isOpen) {
      return;
    }
    setSelectedRows([]);
    setSearchGb('NM');
    setSearchValue('');
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="브랜드 선택"
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
          <th scope="row">검색조건</th>
          <td colSpan={5}>
            <div className="admin-search-inline">
              <select className="form-select admin-search-gb-select" value={searchGb} onChange={(event) => setSearchGb(event.target.value as 'NO' | 'NM')}>
                <option value="NO">브랜드번호</option>
                <option value="NM">브랜드명</option>
              </select>
              <input
                type="text"
                className="form-control admin-search-keyword"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="브랜드번호 또는 브랜드명을 입력하세요"
              />
            </div>
          </td>
        </tr>
      </AdminSearchPanel>

      <div className="ag-theme-alpine-dark header-center" style={{ width: '100%', height: '470px' }}>
        <AgGridReact<BrandOption>
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          rowSelection={rowSelection}
          selectionColumnDef={{ width: 70, resizable: false }}
          rowData={filteredRows}
          pagination
          paginationPageSize={20}
          overlayNoRowsTemplate="데이터가 없습니다."
          getRowId={(params) => String(params.data?.brandNo ?? '')}
          onSelectionChanged={handleSelectionChanged}
        />
      </div>
    </Modal>
  );
};

export default BrandSelectorModal;
