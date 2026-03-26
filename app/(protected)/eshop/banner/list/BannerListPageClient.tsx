'use client';

import React from 'react';
import type { ComponentProps } from 'react';
import BannerListClientPage from '@/app/(protected)/eshop/banner/list/BannerListClientPage';

type BannerListPageClientProps = ComponentProps<typeof BannerListClientPage>;

// 배너 관리 클라이언트 경계 컴포넌트를 렌더링합니다.
const BannerListPageClient = (props: BannerListPageClientProps) => {
  return <BannerListClientPage {...props} />;
};

export default BannerListPageClient;
