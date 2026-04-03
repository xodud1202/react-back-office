import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { ColDef, SelectionChangedEvent } from 'ag-grid-community';
import { AgGridReact } from '@/components/common/agGrid/AgGridReact';
import api from '@/utils/axios/axios';
import Modal from '@/components/common/Modal';
import AdminSearchPanel from '@/components/common/AdminSearchPanel';
import type { ExhibitionItem, ExhibitionListResponse } from '@/components/exhibition/types';
import { notifyError } from '@/utils/ui/feedback';

interface ExhibitionSelectorModalProps {
  // 모달 오픈 여부입니다.
  isOpen: boolean;
  // 모달 닫기 함수입니다.
  onClose: () => void;
  // 선택 반영 함수입니다.
  onApply: (selectedRows: ExhibitionItem[]) => void;
}

// 공통 기획전 선택 모달을 렌더링합니다.
const ExhibitionSelectorModal = ({ isOpen, onClose, onApply }: ExhibitionSelectorModalProps) => {
  const [rows, setRows] = useState<ExhibitionItem[]>([]);
  const [selectedRows, setSelectedRows] = useState<ExhibitionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchGb, setSearchGb] = useState<'NO' | 'NM'>('NM');
  const [searchValue, setSearchValue] = useState('');

  // 검색 결과 컬럼을 정의합니다.
  const columnDefs = useMemo<ColDef<ExhibitionItem>[]>(() => ([
    { headerName: '기획전번호', field: 'exhibitionNo', width: 150 },
    { headerName: '기획전명', field: 'exhibitionNm', width: 340, cellClass: 'text-start' },
    { headerName: '노출시작일시', field: 'dispStartDt', width: 170 },
    { headerName: '노출종료일시', field: 'dispEndDt', width: 170 },
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

  // 기획전 목록을 조회합니다.
  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/admin/exhibition/list', {
        params: {
          page: 1,
          pageSize: 200,
          searchGb,
          searchValue,
        },
      });
      const data = (response.data || {}) as ExhibitionListResponse;
      setRows(data.list || []);
      if ((data.totalCount || 0) > 200) {
        notifyError('검색 결과가 많습니다. 검색 조건을 추가해주세요.');
      }
    } catch (error) {
      console.error('기획전 목록 조회에 실패했습니다.', error);
      notifyError('기획전 목록 조회에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [searchGb, searchValue]);

  // 검색을 수행합니다.
  const handleSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void fetchList();
  }, [fetchList]);

  // 검색 조건을 기본값으로 초기화합니다.
  const handleReset = useCallback(() => {
    setSearchGb('NM');
    setSearchValue('');
  }, []);

  // 선택된 기획전 행을 갱신합니다.
  const handleSelectionChanged = useCallback((event: SelectionChangedEvent<ExhibitionItem>) => {
    setSelectedRows(event.api.getSelectedRows() || []);
  }, []);

  // 선택한 기획전을 상위로 전달합니다.
  const handleApply = useCallback(() => {
    if (selectedRows.length === 0) {
      notifyError('추가할 기획전을 선택해주세요.');
      return;
    }
    onApply(selectedRows);
  }, [onApply, selectedRows]);

  // 모달 오픈 시 기본 목록을 조회합니다.
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    void fetchList();
  }, [fetchList, isOpen]);

  // 모달 닫힘 시 상태를 초기화합니다.
  useEffect(() => {
    if (isOpen) {
      return;
    }
    setRows([]);
    setSelectedRows([]);
    setSearchGb('NM');
    setSearchValue('');
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="기획전 선택"
      width="80vw"
      contentHeight="80vh"
      footerActions={(
        <button type="button" className="btn btn-primary" onClick={handleApply}>
          선택 적용
        </button>
      )}
    >
      <AdminSearchPanel onSubmit={handleSubmit} onReset={handleReset} loading={loading} resetType="button">
        <tr>
          <th scope="row">검색조건</th>
          <td colSpan={3}>
            <div className="admin-search-inline">
              <select className="form-select admin-search-gb-select" value={searchGb} onChange={(event) => setSearchGb(event.target.value as 'NO' | 'NM')}>
                <option value="NO">기획전번호</option>
                <option value="NM">기획전명</option>
              </select>
              <input
                type="text"
                className="form-control admin-search-keyword"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="검색어를 입력하세요"
              />
            </div>
          </td>
        </tr>
      </AdminSearchPanel>

      <div className="ag-theme-alpine-dark header-center" style={{ width: '100%', height: '480px' }}>
        <AgGridReact<ExhibitionItem>
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          rowSelection={rowSelection}
          selectionColumnDef={{ width: 70, resizable: false }}
          rowData={rows}
          pagination
          paginationPageSize={20}
          overlayNoRowsTemplate="데이터가 없습니다."
          getRowId={(params) => String(params.data?.exhibitionNo ?? '')}
          onSelectionChanged={handleSelectionChanged}
        />
      </div>
    </Modal>
  );
};

export default ExhibitionSelectorModal;
