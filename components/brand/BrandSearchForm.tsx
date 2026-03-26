import React, { useCallback } from 'react';
import AdminSearchPanel from '@/components/common/AdminSearchPanel';

interface BrandSearchFormProps {
  loading: boolean;
  onSearch: (params: Record<string, any>) => void;
}

// 브랜드 검색 폼을 렌더링합니다.
const BrandSearchForm = ({ loading, onSearch }: BrandSearchFormProps) => {
  // 검색 제출 시 입력값을 조회 파라미터로 변환합니다.
  const handleSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    // 기본 submit 동작을 막습니다.
    e.preventDefault();
    // 폼 데이터를 조회 파라미터로 변환합니다.
    const form = e.currentTarget;
    const formData = new FormData(form);
    const nextParams = Object.fromEntries(formData.entries());
    onSearch(nextParams);
  }, [onSearch]);

  // 검색 초기화 시 조회 파라미터를 비웁니다.
  const handleReset = useCallback(() => {
    // 검색 조건을 초기화합니다.
    onSearch({});
  }, [onSearch]);

  return (
    <AdminSearchPanel loading={loading} onSubmit={handleSubmit} onReset={handleReset}>
      <tr>
        <th scope="row">브랜드번호</th>
        <td>
          <input
            type="text"
            name="brandNo"
            className="form-control"
            placeholder="브랜드번호를 입력하세요"
          />
        </td>
        <th scope="row">브랜드명</th>
        <td colSpan={3}>
          <input
            type="text"
            name="brandNm"
            className="form-control"
            placeholder="브랜드명을 입력하세요"
          />
        </td>
      </tr>
    </AdminSearchPanel>
  );
};

export default BrandSearchForm;
