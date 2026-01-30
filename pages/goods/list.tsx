import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { GetServerSideProps, GetServerSidePropsContext } from 'next';
import api from '@/utils/axios/axios';
import { dateFormatter } from '@/utils/common';
import type { ColDef, GridApi, GridReadyEvent, IDatasource, IGetRowsParams, ICellRendererParams } from 'ag-grid-community';
import GoodsSearchForm from '@/components/goods/GoodsSearchForm';
import GoodsListGrid from '@/components/goods/GoodsListGrid';
import GoodsEditModal from '@/components/goods/GoodsEditModal';
import type { CategoryOption, CommonCode, GoodsData, GoodsListResponse, GoodsMerch } from '@/components/goods/types';
import { fetchSSRList } from '@/utils/ssrFetch';

interface GoodsListPageProps {
  goodsStatList: CommonCode[];
  goodsDivList: CommonCode[];
  goodsMerchList: GoodsMerch[];
  categoryLevel1Options: CategoryOption[];
}

// SSR에서 공통 데이터를 조회합니다.
export const getServerSideProps: GetServerSideProps<GoodsListPageProps> = async (ctx: GetServerSidePropsContext) => {
  const [goodsStatList, goodsDivList, goodsMerchList, categoryLevel1Options] = await Promise.all([
    fetchSSRList<CommonCode>(ctx, `/api/admin/common/code?grpCd=${encodeURIComponent('GOODS_STAT')}`),
    fetchSSRList<CommonCode>(ctx, `/api/admin/common/code?grpCd=${encodeURIComponent('GOODS_DIV')}`),
    fetchSSRList<GoodsMerch>(ctx, '/api/admin/goods/merch/list'),
    fetchSSRList<CategoryOption>(ctx, '/api/admin/category/list?categoryLevel=1'),
  ]);

  return {
    props: {
      goodsStatList,
      goodsDivList,
      goodsMerchList,
      categoryLevel1Options,
    },
  };
};

const GoodsList = ({
  goodsStatList: initialGoodsStatList,
  goodsDivList: initialGoodsDivList,
  goodsMerchList: initialGoodsMerchList,
  categoryLevel1Options: initialCategoryLevel1Options,
}: GoodsListPageProps) => {
  const [goodsStatList, setGoodsStatList] = useState<CommonCode[]>(initialGoodsStatList || []);
  const [goodsDivList, setGoodsDivList] = useState<CommonCode[]>(initialGoodsDivList || []);
  const [goodsMerchList, setGoodsMerchList] = useState<GoodsMerch[]>(initialGoodsMerchList || []);
  const [loading, setLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedGoodsId, setSelectedGoodsId] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [searchParams, setSearchParams] = useState<Record<string, any>>({});
  const gridApiRef = useRef<GridReadyEvent<GoodsData>['api'] | null>(null);

  // 상품 상태 공통코드를 조회합니다.
  const fetchGoodsStatList = useCallback(async () => {
    try {
      const response = await api.get('/api/admin/common/code', {
        params: { grpCd: 'GOODS_STAT' },
      });
      setGoodsStatList(response.data || []);
    } catch (e) {
      console.error('상품 상태 코드를 불러오는 데 실패했습니다.');
      alert('상품 상태 코드를 불러오는 데 실패했습니다.');
    }
  }, []);

  // 상품 분류 공통코드를 조회합니다.
  const fetchGoodsDivList = useCallback(async () => {
    try {
      const response = await api.get('/api/admin/common/code', {
        params: { grpCd: 'GOODS_DIV' },
      });
      setGoodsDivList(response.data || []);
    } catch (e) {
      console.error('상품 분류 코드를 불러오는 데 실패했습니다.');
      alert('상품 분류 코드를 불러오는 데 실패했습니다.');
    }
  }, []);

  // 상품 분류 목록을 조회합니다.
  const fetchGoodsMerchList = useCallback(async () => {
    try {
      const response = await api.get('/api/admin/goods/merch/list');
      setGoodsMerchList(response.data || []);
    } catch (e) {
      console.error('상품 분류 목록을 불러오는 데 실패했습니다.');
      alert('상품 분류 목록을 불러오는 데 실패했습니다.');
    }
  }, []);

  // 검색 폼 제출 시 조회 파라미터를 갱신합니다.
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const nextParams = Object.fromEntries(formData.entries());
    setSearchParams(nextParams);
  };

  // 검색 초기화 시 조회 파라미터를 초기화합니다.
  const handleReset = () => {
    setSearchParams({});
  };

  // 수정 팝업을 열고 대상 상품을 지정합니다.
  const openEditModal = useCallback((goodsId: string) => {
    setSelectedGoodsId(goodsId);
    setIsEditModalOpen(true);
  }, []);

  // 수정 팝업을 닫고 상태를 초기화합니다.
  const closeEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setSelectedGoodsId(null);
  }, []);

  // 상품 목록 그리드 컬럼을 정의합니다.
  const columnDefs = useMemo<ColDef<GoodsData>[]>(() => [
    { headerName: '상품코드', field: 'goodsId', width: 150 },
    { headerName: '품번코드', field: 'erpStyleCd', width: 120 },
    {
      headerName: '상품명',
      field: 'goodsNm',
      width: 450,
      cellRenderer: (params: ICellRendererParams<GoodsData>) => {
        const goodsId = params.data?.goodsId;
        if (!goodsId) {
          return params.value ?? '';
        }
        return (
          <button
            type="button"
            className="btn btn-link p-0 text-start"
            onClick={() => openEditModal(goodsId)}
          >
            {params.value}
          </button>
        );
      },
    },
    { headerName: '상품상태', field: 'goodsStatNm', width: 120 },
    { headerName: '상품분류', field: 'goodsDivNm', width: 120 },
    { headerName: '노출여부', field: 'showYn', width: 100 },
    {
      headerName: '등록일',
      field: 'regDt',
      width: 170,
      valueFormatter: (params) => dateFormatter({ value: params.value } as any),
    },
    {
      headerName: '수정일',
      field: 'udtDt',
      width: 170,
      valueFormatter: (params) => dateFormatter({ value: params.value } as any),
    },
  ], [openEditModal]);

  // 그리드 기본 컬럼 속성을 정의합니다.
  const defaultColDef = useMemo<ColDef>(() => ({
    resizable: true,
    sortable: false,
    cellClass: 'text-center',
  }), []);

  // 상품 목록 그리드 데이터소스를 생성합니다.
  const createDataSource = useCallback((): IDatasource => ({
    getRows: async (params: IGetRowsParams) => {
      const pageSize = 20;
      const startRow = params.startRow ?? 0;
      const page = Math.floor(startRow / pageSize) + 1;

      setLoading(true);
      try {
        const response = await api.get('/api/admin/goods/list', {
          params: {
            ...searchParams,
            page,
          },
        });
        const data = (response.data || {}) as GoodsListResponse;
        params.successCallback(data.list || [], data.totalCount || 0);
      } catch (e) {
        console.error('상품 목록을 불러오는 데 실패했습니다.');
        params.failCallback();
      } finally {
        setLoading(false);
      }
    },
  }), [searchParams]);

  // 그리드 데이터소스를 안전하게 설정합니다.
  const applyDatasource = useCallback((apiInstance: GridApi<GoodsData>, datasource: IDatasource) => {
    if (typeof (apiInstance as any).setGridOption === 'function') {
      (apiInstance as any).setGridOption('datasource', datasource);
      return;
    }
    if (typeof (apiInstance as any).setDatasource === 'function') {
      (apiInstance as any).setDatasource(datasource);
    }
  }, []);

  // 상품 목록 그리드를 초기화합니다.
  const handleGridReady = useCallback((event: GridReadyEvent<GoodsData>) => {
    gridApiRef.current = event.api;
    applyDatasource(event.api, createDataSource());
  }, [applyDatasource, createDataSource]);

  // 수정 완료 후 목록을 갱신합니다.
  const handleUpdated = useCallback(() => {
    if (gridApiRef.current && typeof (gridApiRef.current as any).refreshInfiniteCache === 'function') {
      (gridApiRef.current as any).refreshInfiniteCache();
      return;
    }
    if (gridApiRef.current) {
      applyDatasource(gridApiRef.current, createDataSource());
    }
  }, [applyDatasource, createDataSource]);

  // 초기 로딩 시 공통코드를 조회합니다.
  useEffect(() => {
    if (goodsStatList.length === 0) {
      fetchGoodsStatList();
    }
    if (goodsDivList.length === 0) {
      fetchGoodsDivList();
    }
    if (goodsMerchList.length === 0) {
      fetchGoodsMerchList();
    }
  }, [fetchGoodsDivList, fetchGoodsMerchList, fetchGoodsStatList, goodsDivList.length, goodsMerchList.length, goodsStatList.length]);

  // 검색 조건 변경 시 그리드 데이터를 다시 조회합니다.
  useEffect(() => {
    if (!gridApiRef.current) {
      return;
    }
    applyDatasource(gridApiRef.current, createDataSource());
  }, [applyDatasource, createDataSource]);

  return (
    <>
      <div className="page-header">
        <h3 className="page-title"> 상품 목록 </h3>
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><a href="#">상품</a></li>
            <li className="breadcrumb-item active" aria-current="page">목록</li>
          </ol>
        </nav>
      </div>

      <GoodsSearchForm
        goodsStatList={goodsStatList}
        goodsDivList={goodsDivList}
        loading={loading}
        formRef={formRef}
        onSearch={handleSearch}
        onReset={handleReset}
      />

      <GoodsListGrid
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        onGridReady={handleGridReady}
      />

      <GoodsEditModal
        isOpen={isEditModalOpen}
        goodsId={selectedGoodsId}
        goodsStatList={goodsStatList}
        goodsDivList={goodsDivList}
        goodsMerchList={goodsMerchList}
        initialCategoryLevel1Options={initialCategoryLevel1Options}
        onClose={closeEditModal}
        onUpdated={handleUpdated}
      />
    </>
  );
};

export default GoodsList;
