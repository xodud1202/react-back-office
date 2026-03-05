import React from 'react';
import dynamic from 'next/dynamic';

// ref 전달을 지원하는 Quill 에디터를 동적으로 로드합니다.
const LazyQuillEditor = dynamic(
  async () => {
    // Quill 컴포넌트를 동적으로 로딩합니다.
    const mod = await import('react-quill-new');
    const Component = mod.default;
    const ForwardedQuill = React.forwardRef<any, React.ComponentProps<typeof Component>>((props, ref) => (
      <Component ref={ref} {...props} />
    ));
    ForwardedQuill.displayName = 'LazyQuillEditor';
    return ForwardedQuill;
  },
  { ssr: false }
);

export default LazyQuillEditor;
