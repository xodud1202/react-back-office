import React, { useCallback, useState } from 'react';
import type { GetServerSideProps, GetServerSidePropsContext } from 'next';
import { fetchSSRList } from '@/utils/ssrFetch';
import CouponSearchForm from '@/components/coupon/CouponSearchForm';
import CouponListGrid from '@/components/coupon/CouponListGrid';
import CouponPendingModal from '@/components/coupon/CouponPendingModal';
import type { CouponSearchParams } from '@/components/coupon/types';
import { DEFAULT_COUPON_SEARCH_PARAMS } from '@/components/coupon/types';
import type { CommonCode } from '@/components/goods/types';

interface CouponListPageProps {
  // 쿠폰 상태 코드 목록입니다.
  cpnStatList: CommonCode[];
  // 쿠폰 종류 코드 목록입니다.
  cpnGbList: CommonCode[];
  // 쿠폰 타겟 코드 목록입니다.
  cpnTargetList: CommonCode[];
}

// 쿠폰 목록 화면 진입 시 공통 코드를 조회합니다.
export const getServerSideProps: GetServerSideProps<CouponListPageProps> = async (
  ctx: GetServerSidePropsContext,
) => {
  const [cpnStatList, cpnGbList, cpnTargetList] = await Promise.all([
    fetchSSRList<CommonCode>(ctx, '/api/admin/common/code?grpCd=CPN_STAT'),
    fetchSSRList<CommonCode>(ctx, '/api/admin/common/code?grpCd=CPN_GB'),
    fetchSSRList<CommonCode>(ctx, '/api/admin/common/code?grpCd=CPN_TARGET'),
  ]);

  return {
    props: {
      cpnStatList,
      cpnGbList,
      cpnTargetList,
    },
  };
};

// 쿠폰 목록 화면을 렌더링합니다.
const CouponListPage = ({ cpnStatList, cpnGbList, cpnTargetList }: CouponListPageProps) => {
  const [searchParams, setSearchParams] = useState<CouponSearchParams>(DEFAULT_COUPON_SEARCH_PARAMS);
  const [loading, setLoading] = useState(false);
  const [isPendingModalOpen, setIsPendingModalOpen] = useState(false);
  const [pendingMode, setPendingMode] = useState<'CREATE' | 'EDIT'>('CREATE');
  const [selectedCouponNo, setSelectedCouponNo] = useState<number | null>(null);

  // 검색 조건을 갱신합니다.
  const handleSearch = useCallback((params: CouponSearchParams) => {
    setSearchParams(params);
  }, []);

  // 쿠폰 등록 안내 모달을 엽니다.
  const handleOpenCreateModal = useCallback(() => {
    setPendingMode('CREATE');
    setSelectedCouponNo(null);
    setIsPendingModalOpen(true);
  }, []);

  // 쿠폰 수정 안내 모달을 엽니다.
  const handleOpenEditModal = useCallback((cpnNo: number) => {
    setPendingMode('EDIT');
    setSelectedCouponNo(cpnNo);
    setIsPendingModalOpen(true);
  }, []);

  // 쿠폰 안내 모달을 닫습니다.
  const handleClosePendingModal = useCallback(() => {
    setIsPendingModalOpen(false);
    setSelectedCouponNo(null);
  }, []);

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
          />
        </div>
      </div>

      <CouponPendingModal
        isOpen={isPendingModalOpen}
        onClose={handleClosePendingModal}
        mode={pendingMode}
        cpnNo={selectedCouponNo}
      />
    </>
  );
};

export default CouponListPage;
