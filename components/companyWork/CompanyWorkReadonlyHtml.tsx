'use client';

import React from 'react';

interface CompanyWorkReadonlyHtmlProps {
  // 읽기 전용으로 표시할 본문 값입니다.
  value: string;
  // 본문이 비어 있을 때 표시할 안내 문구입니다.
  emptyText: string;
  // 외부에서 주입할 래퍼 클래스명입니다.
  className?: string;
}

// HTML 마크업이 포함된 문자열인지 판단합니다.
const hasHtmlMarkup = (value: string): boolean => {
  // 태그 형태가 보이면 HTML 본문으로 간주합니다.
  return /<\s*[a-z][^>]*>/i.test(value);
};

// 읽기 전용 HTML 또는 텍스트 본문을 렌더링합니다.
const CompanyWorkReadonlyHtml = ({ value, emptyText, className }: CompanyWorkReadonlyHtmlProps) => {
  // 값이 없으면 안내 문구를 표시합니다.
  if (!value.trim()) {
    return (
      <div className={className}>
        <div className="text-muted">{emptyText}</div>
      </div>
    );
  }

  // HTML 마크업이 있으면 그대로 렌더링하고, 아니면 줄바꿈을 유지합니다.
  if (hasHtmlMarkup(value)) {
    return <div className={className} dangerouslySetInnerHTML={{ __html: value }} />;
  }

  return <div className={className} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{value}</div>;
};

export default CompanyWorkReadonlyHtml;
