import React, { useCallback, useEffect, useState } from 'react';
import type { GetServerSideProps, GetServerSidePropsContext } from 'next';
import api from '@/utils/axios/axios';
import { fetchSSRList } from '@/utils/ssrFetch';
import BannerSearchForm from '@/components/banner/BannerSearchForm';
import BannerListGrid from '@/components/banner/BannerListGrid';
import BannerEditModal from '@/components/banner/BannerEditModal';
import type { BannerItem, BannerListResponse, BannerSearchParams } from '@/components/banner/types';
import type { BrandOption, CategoryOption, CommonCode, GoodsMerch } from '@/components/goods/types';

interface BannerListPageProps {
  // 배너 구분 코드 목록입니다.
  bannerDivList: CommonCode[];
  // 상품 상태 코드 목록입니다.
  goodsStatList: CommonCode[];
  // 상품 구분 코드 목록입니다.
  goodsDivList: CommonCode[];
  // 상품 분류 목록입니다.
  goodsMerchList: GoodsMerch[];
  // 브랜드 목록입니다.
  brandList: BrandOption[];
  // 카테고리 옵션 목록입니다.
  categoryOptions: CategoryOption[];
}

// SSR에서 화면 초기 공통 데이터를 조회합니다.
export const getServerSideProps: GetServerSideProps<BannerListPageProps> = async (ctx: GetServerSidePropsContext) => {
  const [bannerDivList, goodsStatList, goodsDivList, goodsMerchList, brandList, categoryOptions] = await Promise.all([
    fetchSSRList<CommonCode>(ctx, `/api/admin/common/code?grpCd=${encodeURIComponent('BANNER_DIV')}`),
    fetchSSRList<CommonCode>(ctx, `/api/admin/common/code?grpCd=${encodeURIComponent('GOODS_STAT')}`),
    fetchSSRList<CommonCode>(ctx, `/api/admin/common/code?grpCd=${encodeURIComponent('GOODS_DIV')}`),
    fetchSSRList<GoodsMerch>(ctx, '/api/admin/goods/merch/list'),
    fetchSSRList<BrandOption>(ctx, '/api/admin/brand/list'),
    fetchSSRList<CategoryOption>(ctx, '/api/admin/category/list?categoryLevel=3'),
  ]);

  return {
    props: {
      bannerDivList,
      goodsStatList,
      goodsDivList,
      goodsMerchList,
      brandList,
      categoryOptions,
    },
  };
};

// 배너 등록/수정 목록 화면을 렌더링합니다.
const BannerListPage = ({
  bannerDivList,
  goodsStatList,
  goodsDivList,
  goodsMerchList,
  brandList,
  categoryOptions,
}: BannerListPageProps) => {
  const [rows, setRows] = useState<BannerItem[]>([]);
  const [searchParams, setSearchParams] = useState<BannerSearchParams>({
    bannerDivCd: '',
    showYn: 'Y',
    searchValue: '',
    searchStartDt: '',
    searchEndDt: '',
  });
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBannerNo, setSelectedBannerNo] = useState<number | null>(null);

  // 목록을 조회합니다.
  const fetchBannerList = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/admin/banner/list', {
        params: {
          ...searchParams,
          page: 1,
          pageSize: 200,
        },
      });
      const data = (response.data || {}) as BannerListResponse;
      setRows(data.list || []);
    } catch (error) {
      console.error('배너 목록 조회에 실패했습니다.', error);
      alert('배너 목록 조회에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  // 검색 조건을 반영합니다.
  const handleSearch = useCallback((params: BannerSearchParams) => {
    setSearchParams(params);
  }, []);

  // 등록 팝업을 엽니다.
  const handleOpenCreateModal = useCallback(() => {
    setSelectedBannerNo(null);
    setIsModalOpen(true);
  }, []);

  // 수정 팝업을 엽니다.
  const handleOpenEditModal = useCallback((bannerNo: number) => {
    setSelectedBannerNo(bannerNo);
    setIsModalOpen(true);
  }, []);

  // 저장 완료 후 목록을 갱신합니다.
  const handleSaved = useCallback(async () => {
    setIsModalOpen(false);
    setSelectedBannerNo(null);
    await fetchBannerList();
  }, [fetchBannerList]);

  // 모달을 닫습니다.
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedBannerNo(null);
  }, []);

  // 검색 조건 변경 시 목록을 재조회합니다.
  useEffect(() => {
    fetchBannerList();
  }, [fetchBannerList]);

  return (
    <>
      <div className="page-header">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><a href="#">eshop</a></li>
            <li className="breadcrumb-item active" aria-current="page">배너</li>
          </ol>
        </nav>
      </div>

      <BannerSearchForm bannerDivList={bannerDivList} onSearch={handleSearch} />

      <div className="card">
        <div className="card-body">
          <div className="d-flex justify-content-end mb-3">
            <button type="button" className="btn btn-primary btn-sm" onClick={handleOpenCreateModal}>
              배너 등록
            </button>
          </div>
          {loading ? (
            <div className="text-center">배너 목록을 불러오는 중입니다.</div>
          ) : (
            <BannerListGrid rows={rows} onEdit={handleOpenEditModal} />
          )}
        </div>
      </div>

      <BannerEditModal
        isOpen={isModalOpen}
        bannerNo={selectedBannerNo}
        bannerDivList={bannerDivList}
        goodsStatList={goodsStatList}
        goodsDivList={goodsDivList}
        goodsMerchList={goodsMerchList}
        brandList={brandList}
        categoryOptions={categoryOptions}
        onClose={handleCloseModal}
        onSaved={handleSaved}
      />
    </>
  );
};

export default BannerListPage;
