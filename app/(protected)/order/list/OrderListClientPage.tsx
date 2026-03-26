'use client';

import React, { useState } from 'react';
import type { CommonCode } from '@/components/goods/types';
import OrderSearchForm from '@/components/order/OrderSearchForm';
import OrderListGrid from '@/components/order/OrderListGrid';
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

  // 검색 조건을 갱신합니다.
  const handleSearch = (params: OrderSearchParams) => {
    setSearchParams(params);
  };

  // 추후 주문 상세 레이어팝업 연동을 위한 진입점을 유지합니다.
  const handleOpenOrderDetail = (ordNo: string) => {
    // 현재 단계에서는 클릭 진입점만 유지합니다.
    console.info('주문 상세 레이어팝업 연동 예정입니다.', ordNo);
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
    </>
  );
};

export default OrderListClientPage;
