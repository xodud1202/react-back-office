import React, { useState } from 'react';
import AdminSearchPanel from '@/components/common/AdminSearchPanel';
import type { CommonCode } from '@/components/goods/types';
import type { OrderReturnManageSearchParams } from '@/components/order/returnManageTypes';
import { createDefaultOrderReturnManageSearchParams } from '@/components/order/utils/orderReturnManageUtils';

interface OrderReturnManageSearchFormProps {
  // 반품 상세 상태 코드 목록입니다.
  chgDtlStatList: CommonCode[];
  // 검색 중 여부입니다.
  loading: boolean;
  // 검색 실행 함수입니다.
  onSearch: (params: OrderReturnManageSearchParams) => void;
}

// 반품 회수 관리 검색 조건 폼을 렌더링합니다.
const OrderReturnManageSearchForm = ({
  chgDtlStatList,
  loading,
  onSearch,
}: OrderReturnManageSearchFormProps) => {
  const [formState, setFormState] = useState<OrderReturnManageSearchParams>(() => createDefaultOrderReturnManageSearchParams());

  // 폼 필드 값을 갱신합니다.
  const updateField = <K extends keyof OrderReturnManageSearchParams>(
    field: K,
    value: OrderReturnManageSearchParams[K],
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
    onSearch({ ...formState });
  };

  // 검색 조건을 기본값으로 초기화하고 즉시 재조회합니다.
  const handleReset = () => {
    // 기본 검색 조건을 다시 생성합니다.
    const defaultParams = createDefaultOrderReturnManageSearchParams();
    setFormState(defaultParams);
    onSearch({ ...defaultParams });
  };

  return (
    <AdminSearchPanel
      loading={loading}
      onSubmit={handleSubmit}
      onReset={handleReset}
      resetType="button"
    >
      <tr>
        <th scope="row">반품상태</th>
        <td>
          {/* 반품 회수 관리는 상태 1건만 선택하도록 고정합니다. */}
          <div className="admin-search-inline">
            <select
              className="form-select admin-search-control"
              value={formState.chgDtlStatCd}
              onChange={(event) => updateField('chgDtlStatCd', event.target.value as OrderReturnManageSearchParams['chgDtlStatCd'])}
            >
              {chgDtlStatList.map((item) => (
                <option key={item.cd} value={item.cd}>{item.cdNm}</option>
              ))}
            </select>
          </div>
        </td>
      </tr>
    </AdminSearchPanel>
  );
};

export default OrderReturnManageSearchForm;
