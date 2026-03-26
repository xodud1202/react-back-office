'use client';

import React from 'react';
import type { ComponentProps } from 'react';
import CategoryGoodsClientPage from '@/app/(protected)/category/goods/CategoryGoodsClientPage';

type CategoryGoodsPageClientProps = ComponentProps<typeof CategoryGoodsClientPage>;

// 카테고리별 상품 관리 클라이언트 경계 컴포넌트를 렌더링합니다.
const CategoryGoodsPageClient = (props: CategoryGoodsPageClientProps) => {
  return <CategoryGoodsClientPage {...props} />;
};

export default CategoryGoodsPageClient;
