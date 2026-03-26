'use client';

import React from 'react';
import type { ComponentProps } from 'react';
import GoodsRegiClientPage from '@/app/(protected)/goods/regi/GoodsRegiClientPage';

type GoodsRegiPageClientProps = ComponentProps<typeof GoodsRegiClientPage>;

// 상품 등록 클라이언트 경계 컴포넌트를 렌더링합니다.
const GoodsRegiPageClient = (props: GoodsRegiPageClientProps) => {
  return <GoodsRegiClientPage {...props} />;
};

export default GoodsRegiPageClient;
