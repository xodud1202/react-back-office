'use client';

import React from 'react';
import type { ComponentProps } from 'react';
import ExhibitionListClientPage from '@/app/(protected)/eshop/exhibition/list/ExhibitionListClientPage';

type ExhibitionListPageClientProps = ComponentProps<typeof ExhibitionListClientPage>;

// 기획전 관리 클라이언트 경계 컴포넌트를 렌더링합니다.
const ExhibitionListPageClient = (props: ExhibitionListPageClientProps) => {
  return <ExhibitionListClientPage {...props} />;
};

export default ExhibitionListPageClient;
