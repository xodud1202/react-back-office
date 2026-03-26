import React, { useCallback } from 'react';
import AdminSearchPanel from '@/components/common/AdminSearchPanel';

interface ResumeSearchFormProps {
  // 검색 중 여부입니다.
  loading: boolean;
  // 검색 실행 함수입니다.
  onSearch: (params: Record<string, FormDataEntryValue>) => void;
}

// 이력서 목록 검색 폼을 렌더링합니다.
const ResumeSearchForm = ({ loading, onSearch }: ResumeSearchFormProps) => {
  // 검색 제출 시 입력값을 조회 파라미터로 변환합니다.
  const handleSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // 폼 데이터를 조회 파라미터 객체로 변환합니다.
    const formData = new FormData(event.currentTarget);
    const nextParams = Object.fromEntries(formData.entries());
    onSearch(nextParams);
  }, [onSearch]);

  // 검색 초기화 시 조회 파라미터를 비웁니다.
  const handleReset = useCallback(() => {
    onSearch({});
  }, [onSearch]);

  return (
    <AdminSearchPanel loading={loading} onSubmit={handleSubmit} onReset={handleReset}>
      <tr>
        <th scope="row">검색조건</th>
        <td colSpan={3}>
          <div className="admin-search-inline">
            <select name="searchGb" defaultValue="loginId" className="form-select admin-search-gb-select">
              <option value="loginId">사용자계정</option>
              <option value="usrNo">사용자번호</option>
              <option value="userNm">사용자명</option>
            </select>
            <input
              type="text"
              name="searchValue"
              className="form-control admin-search-keyword"
              placeholder="검색어를 입력하세요"
            />
          </div>
        </td>
      </tr>
    </AdminSearchPanel>
  );
};

export default ResumeSearchForm;
