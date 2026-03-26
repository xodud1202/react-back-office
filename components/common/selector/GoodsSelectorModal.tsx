import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import type { ColDef, ICellRendererParams, SelectionChangedEvent } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import api from '@/utils/axios/axios';
import Modal from '@/components/common/Modal';
import type { BrandOption, CategoryOption, CommonCode, GoodsData, GoodsListResponse, GoodsMerch } from '@/components/goods/types';
import { notifyError } from '@/utils/ui/feedback';

interface GoodsSelectorModalProps {
  // 모달 오픈 여부입니다.
  isOpen: boolean;
  // 모달 닫기 처리입니다.
  onClose: () => void;
  // 카테고리 옵션 목록입니다.
  categoryOptions: CategoryOption[];
  // 브랜드 목록입니다.
  brandList: BrandOption[];
  // 상품 상태 코드 목록입니다.
  goodsStatList: CommonCode[];
  // 상품 구분 코드 목록입니다.
  goodsDivList: CommonCode[];
  // 상품 분류 목록입니다.
  goodsMerchList: GoodsMerch[];
  // 선택 반영 처리입니다.
  onApply: (selectedGoods: GoodsData[]) => void;
}

// 공통 상품 선택 검색 팝업을 렌더링합니다.
const GoodsSelectorModal = ({
  isOpen,
  onClose,
  categoryOptions,
  brandList,
  goodsStatList,
  goodsDivList,
  goodsMerchList,
  onApply,
}: GoodsSelectorModalProps) => {
  const [searchParams, setSearchParams] = useState<Record<string, any>>({});
  const [selectedGoodsRows, setSelectedGoodsRows] = useState<GoodsData[]>([]);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<GoodsData[]>([]);

  // 그리드 컬럼 정보를 구성합니다.
  const columnDefs = useMemo<ColDef<GoodsData>[]>(() => ([
    { headerName: '상품코드', field: 'goodsId', width: 150 },
    {
      headerName: '이미지',
      field: 'imgUrl',
      width: 90,
      cellRenderer: (params: ICellRendererParams<GoodsData>) => {
        // 상품 이미지가 있으면 노출합니다.
        const imgUrl = params.data?.imgUrl;
        if (!imgUrl) {
          return null;
        }
        return (
          <Image
            src={imgUrl}
            alt="상품 이미지"
            width={50}
            height={50}
            unoptimized
            style={{ objectFit: 'cover' }}
          />
        );
      },
    },
    { headerName: 'ERP품번코드', field: 'erpStyleCd', width: 140 },
    { headerName: '상품명', field: 'goodsNm', width: 320, cellClass: 'text-start' },
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

  // AG Grid 선택 옵션을 구성합니다.
  const rowSelection = useMemo(() => ({
    mode: 'multiRow' as const,
    checkboxes: true,
    headerCheckbox: true,
    enableClickSelection: false,
  }), []);

  // 검색 조건을 갱신합니다.
  const handleSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const nextParams = Object.fromEntries(formData.entries());
    setSearchParams(nextParams);
  }, []);

  // 검색 조건을 초기화합니다.
  const handleReset = useCallback(() => {
    setSearchParams({});
  }, []);

  // 상품 검색 결과를 조회합니다.
  const fetchGoodsList = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/admin/goods/list', {
        params: {
          ...searchParams,
          page: 1,
          pageSize: 200,
        },
      });
      const data = (response.data || {}) as GoodsListResponse;
      setRows(data.list || []);
      if ((data.totalCount || 0) > 200) {
        notifyError('검색 결과가 많습니다. 검색 조건을 추가해주세요.');
      }
    } catch (e) {
      console.error('상품 검색에 실패했습니다.', e);
      notifyError('상품 검색에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  // 선택된 상품을 갱신합니다.
  const handleSelectionChanged = useCallback((event: SelectionChangedEvent<GoodsData>) => {
    const selected = event.api.getSelectedRows() || [];
    setSelectedGoodsRows(selected);
  }, []);

  // 선택한 상품을 등록 대상으로 전달합니다.
  const handleApply = useCallback(() => {
    if (selectedGoodsRows.length === 0) {
      notifyError('등록할 상품을 선택해주세요.');
      return;
    }
    onApply(selectedGoodsRows);
  }, [onApply, selectedGoodsRows]);

  // 팝업 닫힘 시 선택 상태를 초기화합니다.
  useEffect(() => {
    if (isOpen) {
      return;
    }
    setSelectedGoodsRows([]);
    setSearchParams({});
    setRows([]);
  }, [isOpen]);

  // 검색 조건 변경 시 목록을 갱신합니다.
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    fetchGoodsList();
  }, [fetchGoodsList, isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="상품 선택"
      footerActions={(
        <button type="button" className="btn btn-primary" onClick={handleApply}>
          선택 적용
        </button>
      )}
      width="85vw"
      contentHeight="80vh"
    >
      <form onSubmit={handleSubmit} onReset={handleReset} className="forms-sample mb-3">
        <div className="row">
          <div className="col-md-2">
            <div className="form-group">
              <label>브랜드</label>
              <select name="brandNo" defaultValue="" className="form-select">
                <option value="">전체</option>
                {brandList.map((item) => (
                  <option key={item.brandNo} value={item.brandNo}>{item.brandNm}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="col-md-2">
            <div className="form-group">
              <label>카테고리</label>
              <select name="categoryId" defaultValue="" className="form-select">
                <option value="">전체</option>
                {categoryOptions.map((item) => (
                  <option key={item.categoryId} value={item.categoryId}>
                    {item.categoryNm}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="col-md-2">
            <div className="form-group">
              <label>상품상태</label>
              <select name="goodsStatCd" defaultValue="" className="form-select">
                <option value="">전체</option>
                {goodsStatList.map((item) => (
                  <option key={item.cd} value={item.cd}>{item.cdNm}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="col-md-2">
            <div className="form-group">
              <label>상품구분</label>
              <select name="goodsDivCd" defaultValue="" className="form-select">
                <option value="">전체</option>
                {goodsDivList.map((item) => (
                  <option key={item.cd} value={item.cd}>{item.cdNm}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="col-md-2">
            <div className="form-group">
              <label>상품분류</label>
              <select name="goodsMerchId" defaultValue="" className="form-select">
                <option value="">전체</option>
                {goodsMerchList.map((item) => (
                  <option key={item.goodsMerchId} value={item.goodsMerchId}>{item.goodsMerchNm}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="col-md-2">
            <div className="form-group">
              <label>노출여부</label>
              <select name="showYn" defaultValue="" className="form-select">
                <option value="">전체</option>
                <option value="Y">Y</option>
                <option value="N">N</option>
              </select>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-md-3">
            <div className="form-group">
              <label>검색구분</label>
              <select name="searchGb" defaultValue="goodsId" className="form-select">
                <option value="goodsId">상품코드</option>
                <option value="erpStyleCd">ERP품번코드</option>
                <option value="goodsNm">상품명</option>
              </select>
            </div>
          </div>
          <div className="col-md-9">
            <div className="form-group">
              <label>검색어</label>
              <input type="text" name="searchValue" className="form-control" placeholder="검색어를 입력하세요" />
            </div>
          </div>
        </div>
        <div className="d-flex justify-content-center gap-2">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? '검색중...' : '검색'}
          </button>
          <button type="reset" className="btn btn-dark">
            초기화
          </button>
        </div>
      </form>
      <div className="ag-theme-alpine-dark header-center" style={{ width: '100%', height: '420px' }}>
        <AgGridReact<GoodsData>
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          rowSelection={rowSelection}
          selectionColumnDef={{ width: 70, resizable: false }}
          rowData={rows}
          pagination
          paginationPageSize={20}
          overlayNoRowsTemplate="데이터가 없습니다."
          getRowId={(params) => String(params.data?.goodsId ?? '')}
          rowHeight={50}
          onSelectionChanged={handleSelectionChanged}
        />
      </div>
    </Modal>
  );
};

export default GoodsSelectorModal;
