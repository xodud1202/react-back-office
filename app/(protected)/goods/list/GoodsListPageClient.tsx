'use client';

import React from 'react';
import type { ComponentProps } from 'react';
import GoodsListClientPage from '@/app/(protected)/goods/list/GoodsListClientPage';

type GoodsListPageClientProps = ComponentProps<typeof GoodsListClientPage>;

// 상품 목록 클라이언트 경계 컴포넌트를 렌더링합니다.
const GoodsListPageClient = (props: GoodsListPageClientProps) => {
  return <GoodsListClientPage {...props} />;
};

export default GoodsListPageClient;
