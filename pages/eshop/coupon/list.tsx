import React, { useCallback, useState } from 'react';
import type { GetServerSideProps, GetServerSidePropsContext } from 'next';
import { fetchSSRList } from '@/utils/ssrFetch';
import CouponSearchForm from '@/components/coupon/CouponSearchForm';
import CouponListGrid from '@/components/coupon/CouponListGrid';
import CouponEditModal from '@/components/coupon/CouponEditModal';
import type { CouponSearchParams } from '@/components/coupon/types';
import { DEFAULT_COUPON_SEARCH_PARAMS } from '@/components/coupon/types';
import type { BrandOption, CategoryOption, CommonCode, GoodsMerch } from '@/components/goods/types';

interface CouponListPageProps {
  // 쿠폰 상태 코드 목록입니다.
  cpnStatList: CommonCode[];
  // 쿠폰 종류 코드 목록입니다.
  cpnGbList: CommonCode[];
  // 쿠폰 타겟 코드 목록입니다.
  cpnTargetList: CommonCode[];
  // 쿠폰 사용기간 코드 목록입니다.
  cpnUseDtList: CommonCode[];
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

// 쿠폰 목록 화면 진입 시 공통 코드를 조회합니다.
export const getServerSideProps: GetServerSideProps<CouponListPageProps> = async (
  ctx: GetServerSidePropsContext,
) => {
  const [cpnStatList, cpnGbList, cpnTargetList, cpnUseDtList, goodsStatList, goodsDivList, goodsMerchList, brandList, categoryOptions] = await Promise.all([
    fetchSSRList<CommonCode>(ctx, '/api/admin/common/code?grpCd=CPN_STAT'),
    fetchSSRList<CommonCode>(ctx, '/api/admin/common/code?grpCd=CPN_GB'),
    fetchSSRList<CommonCode>(ctx, '/api/admin/common/code?grpCd=CPN_TARGET'),
    fetchSSRList<CommonCode>(ctx, '/api/admin/common/code?grpCd=CPN_USE_DT'),
    fetchSSRList<CommonCode>(ctx, '/api/admin/common/code?grpCd=GOODS_STAT'),
    fetchSSRList<CommonCode>(ctx, '/api/admin/common/code?grpCd=GOODS_DIV'),
    fetchSSRList<GoodsMerch>(ctx, '/api/admin/goods/merch/list'),
    fetchSSRList<BrandOption>(ctx, '/api/admin/brand/list'),
    fetchSSRList<CategoryOption>(ctx, '/api/admin/category/list'),
  ]);

  return {
    props: {
      cpnStatList,
      cpnGbList,
      cpnTargetList,
      cpnUseDtList,
      goodsStatList,
      goodsDivList,
      goodsMerchList,
      brandList,
      categoryOptions,
    },
  };
};

// 쿠폰 목록 화면을 렌더링합니다.
const CouponListPage = ({
  cpnStatList,
  cpnGbList,
  cpnTargetList,
  cpnUseDtList,
  goodsStatList,
  goodsDivList,
  goodsMerchList,
  brandList,
  categoryOptions,
}: CouponListPageProps) => {
  const [searchParams, setSearchParams] = useState<CouponSearchParams>(DEFAULT_COUPON_SEARCH_PARAMS);
  const [loading, setLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editMode, setEditMode] = useState<'CREATE' | 'EDIT'>('CREATE');
  const [selectedCouponNo, setSelectedCouponNo] = useState<number | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  // 검색 조건을 갱신합니다.
  const handleSearch = useCallback((params: CouponSearchParams) => {
    setSearchParams(params);
  }, []);

  // 쿠폰 등록 안내 모달을 엽니다.
  const handleOpenCreateModal = useCallback(() => {
    setEditMode('CREATE');
    setSelectedCouponNo(null);
    setIsEditModalOpen(true);
  }, []);

  // 쿠폰 수정 안내 모달을 엽니다.
  const handleOpenEditModal = useCallback((cpnNo: number) => {
    setEditMode('EDIT');
    setSelectedCouponNo(cpnNo);
    setIsEditModalOpen(true);
  }, []);

  // 쿠폰 안내 모달을 닫습니다.
  const handleCloseEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setSelectedCouponNo(null);
  }, []);

  // 쿠폰 저장 완료 후 목록을 갱신합니다.
  const handleSaved = useCallback((nextCouponNo?: number | null) => {
    setReloadToken((prev) => prev + 1);
    if (editMode === 'CREATE' && nextCouponNo) {
      // 등록 완료 시 수정모드로 재오픈해 대상 탭을 활성화합니다.
      setIsEditModalOpen(false);
      setSelectedCouponNo(null);
      setTimeout(() => {
        setEditMode('EDIT');
        setSelectedCouponNo(nextCouponNo);
        setIsEditModalOpen(true);
      }, 0);
      return;
    }
    setIsEditModalOpen(false);
    setSelectedCouponNo(null);
  }, [editMode]);

  return (
    <>
      <div className="page-header">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><a href="#">eshop</a></li>
            <li className="breadcrumb-item active" aria-current="page">쿠폰</li>
          </ol>
        </nav>
      </div>

      <CouponSearchForm
        cpnStatList={cpnStatList}
        cpnGbList={cpnGbList}
        cpnTargetList={cpnTargetList}
        onSearch={handleSearch}
      />

      <div className="card">
        <div className="card-body">
          <div className="d-flex justify-content-end mb-3">
            <button type="button" className="btn btn-primary btn-sm" onClick={handleOpenCreateModal}>
              쿠폰 등록
            </button>
          </div>
          {loading ? (
            <div className="text-center mb-3">쿠폰 목록을 불러오는 중입니다.</div>
          ) : null}
          <CouponListGrid
            searchParams={searchParams}
            onEdit={handleOpenEditModal}
            onLoadingChange={setLoading}
            reloadToken={reloadToken}
          />
        </div>
      </div>

      <CouponEditModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        mode={editMode}
        cpnNo={selectedCouponNo}
        cpnStatList={cpnStatList}
        cpnGbList={cpnGbList}
        cpnTargetList={cpnTargetList}
        cpnUseDtList={cpnUseDtList}
        goodsStatList={goodsStatList}
        goodsDivList={goodsDivList}
        goodsMerchList={goodsMerchList}
        brandList={brandList}
        categoryOptions={categoryOptions}
        onSaved={handleSaved}
      />
    </>
  );
};

export default CouponListPage;
