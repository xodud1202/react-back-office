'use client';

import React, { useState } from 'react';
import type { CommonCode } from '@/components/goods/types';
import OrderReturnManageSearchForm from '@/components/order/OrderReturnManageSearchForm';
import OrderReturnManageGrid from '@/components/order/OrderReturnManageGrid';
import type { OrderReturnManageSearchParams } from '@/components/order/returnManageTypes';
import { createDefaultOrderReturnManageSearchParams } from '@/components/order/utils/orderReturnManageUtils';

export interface OrderReturnManageClientPageProps {
  // 반품 상세 상태 코드 목록입니다.
  chgDtlStatList: CommonCode[];
  // 택배사 코드 목록입니다.
  deliveryCompanyList: CommonCode[];
}

// 반품 회수 관리 화면을 렌더링합니다.
const OrderReturnManageClientPage = ({
  chgDtlStatList,
  deliveryCompanyList,
}: OrderReturnManageClientPageProps) => {
  const [searchParams, setSearchParams] = useState<OrderReturnManageSearchParams>(() => createDefaultOrderReturnManageSearchParams());
  const [loading, setLoading] = useState(false);

  // 검색 조건을 갱신합니다.
  const handleSearch = (params: OrderReturnManageSearchParams) => {
    setSearchParams(params);
  };

  return (
    <>
      <div className="page-header">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><a href="#">order</a></li>
            <li className="breadcrumb-item active" aria-current="page">반품 회수 관리</li>
          </ol>
        </nav>
      </div>

      <OrderReturnManageSearchForm
        chgDtlStatList={chgDtlStatList}
        loading={loading}
        onSearch={handleSearch}
      />

      <div className="card">
        <div className="card-body">
          {loading ? (
            <div className="text-center mb-3">반품 회수 관리 목록을 불러오는 중입니다.</div>
          ) : null}
          <OrderReturnManageGrid
            searchParams={searchParams}
            deliveryCompanyList={deliveryCompanyList}
            onLoadingChange={setLoading}
          />
        </div>
      </div>
    </>
  );
};

export default OrderReturnManageClientPage;
