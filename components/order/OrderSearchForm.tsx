import React, { useState } from 'react';
import AdminSearchPanel from '@/components/common/AdminSearchPanel';
import AdminDateInput from '@/components/common/AdminDateInput';
import type { CommonCode } from '@/components/goods/types';
import type { OrderSearchParams } from '@/components/order/types';
import { createDefaultOrderSearchParams } from '@/components/order/types';

interface OrderSearchFormProps {
  // 주문상세 상태 코드 목록입니다.
  ordDtlStatList: CommonCode[];
  // 클레임상세 상태 코드 목록입니다.
  chgDtlStatList: CommonCode[];
  // 검색 중 여부입니다.
  loading: boolean;
  // 검색 실행 함수입니다.
  onSearch: (params: OrderSearchParams) => void;
}

// 주문 목록 검색 조건 폼을 렌더링합니다.
const OrderSearchForm = ({
  ordDtlStatList,
  chgDtlStatList,
  loading,
  onSearch,
}: OrderSearchFormProps) => {
  const [formState, setFormState] = useState<OrderSearchParams>(() => createDefaultOrderSearchParams());

  // 폼 필드 값을 갱신합니다.
  const updateField = <K extends keyof OrderSearchParams>(field: K, value: OrderSearchParams[K]) => {
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
    const defaultParams = createDefaultOrderSearchParams();
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
        <th scope="row">기간검색</th>
        <td colSpan={3} className="order-search-half-cell">
          {/* 기간 조건은 좌측 절반 영역에서 한 번에 조정할 수 있도록 배치합니다. */}
          <div className="admin-search-inline order-search-wide-inline">
            <select
              className="form-select admin-search-date-select"
              value={formState.dateGb}
              onChange={(event) => updateField('dateGb', event.target.value as OrderSearchParams['dateGb'])}
            >
              <option value="ORDER_DT">주문기간</option>
              <option value="PAY_DT">결제기간</option>
            </select>
            <AdminDateInput
              className="form-control"
              wrapperClassName="admin-search-date-input"
              value={formState.searchStartDt}
              onChange={(event) => updateField('searchStartDt', event.target.value)}
            />
            <span className="admin-search-separator">~</span>
            <AdminDateInput
              className="form-control"
              wrapperClassName="admin-search-date-input"
              value={formState.searchEndDt}
              onChange={(event) => updateField('searchEndDt', event.target.value)}
            />
          </div>
        </td>
        <th scope="row">검색조건</th>
        <td colSpan={3} className="order-search-half-cell">
          {/* 검색 구분과 입력어를 우측 절반 영역에 배치해 주문번호와 상품코드를 함께 지원합니다. */}
          <div className="admin-search-inline order-search-wide-inline">
            <select
              className="form-select admin-search-gb-select"
              value={formState.searchGb}
              onChange={(event) => updateField('searchGb', event.target.value as OrderSearchParams['searchGb'])}
            >
              <option value="ordNo">주문번호</option>
              <option value="goodsId">상품코드</option>
            </select>
            <input
              type="text"
              className="form-control admin-search-keyword"
              value={formState.searchValue}
              placeholder={formState.searchGb === 'ordNo' ? '주문번호를 입력하세요' : '상품코드를 입력하세요'}
              onChange={(event) => updateField('searchValue', event.target.value)}
            />
          </div>
        </td>
      </tr>
      <tr>
        <th scope="row">주문상세상태</th>
        <td className="order-search-quarter-cell">
          {/* 주문 상세 상태는 하단 좌측 25% 영역에서 단일 선택으로 제공합니다. */}
          <select
            className="form-select admin-search-control order-search-narrow-control"
            value={formState.ordDtlStatCd}
            onChange={(event) => updateField('ordDtlStatCd', event.target.value)}
          >
            <option value="">전체</option>
            {ordDtlStatList.map((item) => (
              <option key={item.cd} value={item.cd}>{item.cdNm}</option>
            ))}
          </select>
        </td>
        <th scope="row">클레임상세상태</th>
        <td className="order-search-quarter-cell">
          {/* 클레임 상세 상태는 하단 중앙 25% 영역에서 바로 선택할 수 있도록 유지합니다. */}
          <select
            className="form-select admin-search-control order-search-narrow-control"
            value={formState.chgDtlStatCd}
            onChange={(event) => updateField('chgDtlStatCd', event.target.value)}
          >
            <option value="">전체</option>
            {chgDtlStatList.map((item) => (
              <option key={item.cd} value={item.cd}>{item.cdNm}</option>
            ))}
          </select>
        </td>
        <td colSpan={4} className="order-search-empty-cell" aria-hidden="true" />
      </tr>
    </AdminSearchPanel>
  );
};

export default OrderSearchForm;
