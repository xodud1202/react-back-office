'use client';

import React, { useState } from 'react';
import type { CommonCode } from '@/components/goods/types';
import OrderStartDeliverySearchForm from '@/components/order/OrderStartDeliverySearchForm';
import OrderStartDeliveryGrid from '@/components/order/OrderStartDeliveryGrid';
import type { OrderStartDeliverySearchParams } from '@/components/order/startDeliveryTypes';
import { createDefaultOrderStartDeliverySearchParams } from '@/components/order/utils/orderStartDeliveryUtils';

export interface OrderStartDeliveryClientPageProps {
  // 주문상세 상태 코드 목록입니다.
  ordDtlStatList: CommonCode[];
  // 배송업체 코드 목록입니다.
  deliveryCompanyList: CommonCode[];
}

// 배송 시작 관리 화면을 렌더링합니다.
const OrderStartDeliveryClientPage = ({
  ordDtlStatList,
  deliveryCompanyList,
}: OrderStartDeliveryClientPageProps) => {
  const [searchParams, setSearchParams] = useState<OrderStartDeliverySearchParams>(() => createDefaultOrderStartDeliverySearchParams());
  const [loading, setLoading] = useState(false);

  // 검색 조건을 갱신합니다.
  const handleSearch = (params: OrderStartDeliverySearchParams) => {
    setSearchParams(params);
  };

  return (
    <>
      <div className="page-header">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><a href="#">order</a></li>
            <li className="breadcrumb-item active" aria-current="page">배송 시작 관리</li>
          </ol>
        </nav>
      </div>

      <OrderStartDeliverySearchForm
        ordDtlStatList={ordDtlStatList}
        loading={loading}
        onSearch={handleSearch}
      />

      <div className="card">
        <div className="card-body">
          {loading ? (
            <div className="text-center mb-3">배송 시작 관리 목록을 불러오는 중입니다.</div>
          ) : null}
          <OrderStartDeliveryGrid
            searchParams={searchParams}
            deliveryCompanyList={deliveryCompanyList}
            onLoadingChange={setLoading}
          />
        </div>
      </div>
    </>
  );
};

export default OrderStartDeliveryClientPage;
