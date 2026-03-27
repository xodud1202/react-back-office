'use client';

import React, { useState } from 'react';
import type { CommonCode } from '@/components/goods/types';
import OrderSearchForm from '@/components/order/OrderSearchForm';
import OrderListGrid from '@/components/order/OrderListGrid';
import OrderDetailModal from '@/components/order/OrderDetailModal';
import type { OrderSearchParams } from '@/components/order/types';
import { createDefaultOrderSearchParams } from '@/components/order/types';

export interface OrderListClientPageProps {
  // 주문상세 상태 코드 목록입니다.
  ordDtlStatList: CommonCode[];
  // 클레임상세 상태 코드 목록입니다.
  chgDtlStatList: CommonCode[];
}

// 주문 목록 화면을 렌더링합니다.
const OrderListClientPage = ({ ordDtlStatList, chgDtlStatList }: OrderListClientPageProps) => {
  const [searchParams, setSearchParams] = useState<OrderSearchParams>(() => createDefaultOrderSearchParams());
  const [loading, setLoading] = useState(false);
  // 주문 상세 레이어팝업 대상 주문번호 상태입니다.
  const [detailOrdNo, setDetailOrdNo] = useState<string | null>(null);

  // 검색 조건을 갱신합니다.
  const handleSearch = (params: OrderSearchParams) => {
    setSearchParams(params);
  };

  // 주문번호 클릭 시 상세 레이어팝업을 오픈합니다.
  const handleOpenOrderDetail = (ordNo: string) => {
    setDetailOrdNo(ordNo);
  };

  // 주문 상세 레이어팝업을 닫습니다.
  const handleCloseOrderDetail = () => {
    setDetailOrdNo(null);
  };

  return (
    <>
      <div className="page-header">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><a href="#">order</a></li>
            <li className="breadcrumb-item active" aria-current="page">주문관리</li>
          </ol>
        </nav>
      </div>

      <OrderSearchForm
        ordDtlStatList={ordDtlStatList}
        chgDtlStatList={chgDtlStatList}
        loading={loading}
        onSearch={handleSearch}
      />

      <div className="card">
        <div className="card-body">
          {loading ? (
            <div className="text-center mb-3">주문 목록을 불러오는 중입니다.</div>
          ) : null}
          <OrderListGrid
            searchParams={searchParams}
            onOrderClick={handleOpenOrderDetail}
            onLoadingChange={setLoading}
          />
        </div>
      </div>

      {/* 주문 상세 레이어팝업입니다. */}
      <OrderDetailModal
        isOpen={detailOrdNo !== null}
        ordNo={detailOrdNo}
        onClose={handleCloseOrderDetail}
      />
    </>
  );
};

export default OrderListClientPage;
