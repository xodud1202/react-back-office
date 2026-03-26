'use client';

import React from 'react';
import type { ComponentProps } from 'react';
import CouponListClientPage from '@/app/(protected)/eshop/coupon/list/CouponListClientPage';

type CouponListPageClientProps = ComponentProps<typeof CouponListClientPage>;

// 쿠폰 관리 클라이언트 경계 컴포넌트를 렌더링합니다.
const CouponListPageClient = (props: CouponListPageClientProps) => {
  return <CouponListClientPage {...props} />;
};

export default CouponListPageClient;
