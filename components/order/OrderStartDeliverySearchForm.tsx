import React, { useState } from 'react';
import AdminSearchPanel from '@/components/common/AdminSearchPanel';
import type { CommonCode } from '@/components/goods/types';
import type { OrderStartDeliverySearchParams } from '@/components/order/startDeliveryTypes';
import { createDefaultOrderStartDeliverySearchParams } from '@/components/order/utils/orderStartDeliveryUtils';

interface OrderStartDeliverySearchFormProps {
  // 주문상세 상태 코드 목록입니다.
  ordDtlStatList: CommonCode[];
  // 검색 중 여부입니다.
  loading: boolean;
  // 검색 실행 함수입니다.
  onSearch: (params: OrderStartDeliverySearchParams) => void;
}

// 배송 시작 관리 검색 조건 폼을 렌더링합니다.
const OrderStartDeliverySearchForm = ({
  ordDtlStatList,
  loading,
  onSearch,
}: OrderStartDeliverySearchFormProps) => {
  const [formState, setFormState] = useState<OrderStartDeliverySearchParams>(() => createDefaultOrderStartDeliverySearchParams());

  // 폼 필드 값을 갱신합니다.
  const updateField = <K extends keyof OrderStartDeliverySearchParams>(
    field: K,
    value: OrderStartDeliverySearchParams[K],
  ) => {
    // 이전 상태를 기준으로 변경된 필드만 반영합니다.
    setFormState((prevState) => ({
      ...prevState,
      [field]: value,
    }));
  };

  // 검색 폼 제출 시 현재 조건으로 조회를 요청합니다.
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearch(formState);
  };

  // 검색 조건을 기본값으로 초기화하고 즉시 재조회합니다.
  const handleReset = () => {
    // 기본 검색 조건을 다시 생성합니다.
    const defaultParams = createDefaultOrderStartDeliverySearchParams();
    setFormState(defaultParams);
    onSearch(defaultParams);
  };

  return (
    <AdminSearchPanel
      loading={loading}
      onSubmit={handleSubmit}
      onReset={handleReset}
      resetType="button"
    >
      <tr>
        <th scope="row">상품상태</th>
        <td>
          {/* 배송 시작 관리는 상품 상태를 항상 한 가지로 선택하도록 고정합니다. */}
          <div className="admin-search-inline">
            <select
              className="form-select admin-search-control"
              value={formState.ordDtlStatCd}
              onChange={(event) => updateField('ordDtlStatCd', event.target.value as OrderStartDeliverySearchParams['ordDtlStatCd'])}
            >
              {ordDtlStatList.map((item) => (
                <option key={item.cd} value={item.cd}>{item.cdNm}</option>
              ))}
            </select>
          </div>
        </td>
      </tr>
    </AdminSearchPanel>
  );
};

export default OrderStartDeliverySearchForm;
