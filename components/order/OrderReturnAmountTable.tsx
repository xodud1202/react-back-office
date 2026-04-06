import React from 'react';

export interface OrderReturnAmountItem {
  // 항목 키입니다.
  key: string;
  // 라벨입니다.
  label: string;
  // 표시 텍스트입니다.
  valueText: string;
  // 강조 여부입니다.
  isStrong?: boolean;
}

export interface OrderReturnAmountColumn {
  // 컬럼 키입니다.
  key: string;
  // 컬럼 제목입니다.
  title: string;
  // 컬럼 항목 목록입니다.
  itemList: OrderReturnAmountItem[];
}

interface OrderReturnAmountTableProps {
  // 금액 컬럼 목록입니다.
  columnList: OrderReturnAmountColumn[];
}

// 금액을 천 단위 구분 문자열로 변환합니다.
export const formatOrderAmount = (value: number): string => value.toLocaleString('ko-KR');

// 부호 포함 금액 문자열을 변환합니다.
export const formatSignedOrderAmount = (value: number): string => {
  if (value > 0) {
    return `+${formatOrderAmount(value)}`;
  }
  if (value < 0) {
    return `-${formatOrderAmount(Math.abs(value))}`;
  }
  return '0';
};

// 반품 금액 요약 공통 UI를 렌더링합니다.
const OrderReturnAmountTable = ({ columnList }: OrderReturnAmountTableProps) => {
  return (
    <div className="admin-order-return-amount-table">
      {columnList.map((columnItem) => (
        <section key={columnItem.key} className="admin-order-return-amount-column">
          <h6 className="admin-order-return-amount-title">{columnItem.title}</h6>
          <div className="admin-order-return-amount-item-list">
            {columnItem.itemList.map((amountItem) => (
              <div key={amountItem.key} className="admin-order-return-amount-item">
                <span className="admin-order-return-amount-label">{amountItem.label}</span>
                <span
                  className={
                    amountItem.isStrong
                      ? 'admin-order-return-amount-value admin-order-return-amount-value-strong'
                      : 'admin-order-return-amount-value'
                  }
                >
                  {amountItem.valueText}
                </span>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

export default OrderReturnAmountTable;
