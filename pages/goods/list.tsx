import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { GetServerSideProps, GetServerSidePropsContext } from 'next';
import api from '@/utils/axios/axios';
import GoodsSearchForm from '@/components/goods/GoodsSearchForm';
import GoodsListGrid, { type GoodsListGridHandle } from '@/components/goods/GoodsListGrid';
import GoodsEditModal from '@/components/goods/GoodsEditModal';
import type { BrandOption, CategoryOption, CommonCode, GoodsMerch } from '@/components/goods/types';
import { fetchSSRList } from '@/utils/ssrFetch';

interface GoodsListPageProps {
  goodsStatList: CommonCode[];
  goodsDivList: CommonCode[];
  goodsMerchList: GoodsMerch[];
  brandList: BrandOption[];
  categoryLevel1Options: CategoryOption[];
}

// SSR에서 공통 데이터를 조회합니다.
export const getServerSideProps: GetServerSideProps<GoodsListPageProps> = async (ctx: GetServerSidePropsContext) => {
  const [goodsStatList, goodsDivList, goodsMerchList, brandList, categoryLevel1Options] = await Promise.all([
    fetchSSRList<CommonCode>(ctx, `/api/admin/common/code?grpCd=${encodeURIComponent('GOODS_STAT')}`),
    fetchSSRList<CommonCode>(ctx, `/api/admin/common/code?grpCd=${encodeURIComponent('GOODS_DIV')}`),
    fetchSSRList<GoodsMerch>(ctx, '/api/admin/goods/merch/list'),
    fetchSSRList<BrandOption>(ctx, '/api/admin/brand/list'),
    fetchSSRList<CategoryOption>(ctx, '/api/admin/category/list?categoryLevel=1'),
  ]);

  return {
    props: {
      goodsStatList,
      goodsDivList,
      goodsMerchList,
      brandList,
      categoryLevel1Options,
    },
  };
};

// 상품 목록 화면을 렌더링합니다.
const GoodsList = ({
  goodsStatList: initialGoodsStatList,
  goodsDivList: initialGoodsDivList,
  goodsMerchList: initialGoodsMerchList,
  brandList: initialBrandList,
  categoryLevel1Options: initialCategoryLevel1Options,
}: GoodsListPageProps) => {
  const [goodsStatList, setGoodsStatList] = useState<CommonCode[]>(initialGoodsStatList || []);
  const [goodsDivList, setGoodsDivList] = useState<CommonCode[]>(initialGoodsDivList || []);
  const [goodsMerchList, setGoodsMerchList] = useState<GoodsMerch[]>(initialGoodsMerchList || []);
  const [brandList, setBrandList] = useState<BrandOption[]>(initialBrandList || []);
  const [loading, setLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedGoodsId, setSelectedGoodsId] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useState<Record<string, any>>({});
  const gridRef = useRef<GoodsListGridHandle | null>(null);

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

  // 브랜드 목록을 조회합니다.
  const fetchBrandList = useCallback(async () => {
    try {
      const response = await api.get('/api/admin/brand/list');
      setBrandList(response.data || []);
    } catch (e) {
      console.error('브랜드 목록을 불러오는 데 실패했습니다.');
      alert('브랜드 목록을 불러오는 데 실패했습니다.');
    }
  }, []);

  // 검색 조건을 갱신합니다.
  const handleSearch = useCallback((params: Record<string, any>) => {
    setSearchParams(params);
  }, []);

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

  // 수정 완료 후 목록을 갱신합니다.
  const handleUpdated = useCallback(() => {
    if (gridRef.current) {
      gridRef.current.refresh();
    }
  }, []);

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
    if (brandList.length === 0) {
      fetchBrandList();
    }
  }, [brandList.length, fetchBrandList, fetchGoodsDivList, fetchGoodsMerchList, fetchGoodsStatList, goodsDivList.length, goodsMerchList.length, goodsStatList.length]);

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
        brandList={brandList}
        loading={loading}
        onSearch={handleSearch}
      />

      <GoodsListGrid
        ref={gridRef}
        searchParams={searchParams}
        onEdit={openEditModal}
        onLoadingChange={setLoading}
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
