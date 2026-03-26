import React, { useCallback } from 'react';
import AdminSearchPanel from '@/components/common/AdminSearchPanel';
import type { ExhibitionSearchParams } from '@/components/exhibition/types';
import { DEFAULT_EXHIBITION_SEARCH_PARAMS } from '@/components/exhibition/types';

interface ExhibitionSearchFormProps {
  // 검색 중 여부입니다.
  loading: boolean;
  // 검색 처리 함수입니다.
  onSearch: (params: ExhibitionSearchParams) => void;
}

// 기획전 조회 조건 폼을 렌더링합니다.
const ExhibitionSearchForm = ({ loading, onSearch }: ExhibitionSearchFormProps) => {
  // 검색 버튼 클릭 시 조건을 전달합니다.
  const handleSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // 폼 데이터를 기획전 조회 파라미터로 변환합니다.
    const formData = new FormData(event.currentTarget);
    onSearch({
      searchGb: String(formData.get('searchGb') || 'NM'),
      searchValue: String(formData.get('searchValue') || ''),
      searchStartDt: String(formData.get('searchStartDt') || ''),
      searchEndDt: String(formData.get('searchEndDt') || ''),
    });
  }, [onSearch]);

  // 검색 초기화 시 기본 조회 조건으로 되돌립니다.
  const handleReset = useCallback(() => {
    onSearch({ ...DEFAULT_EXHIBITION_SEARCH_PARAMS });
  }, [onSearch]);

  return (
    <AdminSearchPanel loading={loading} onSubmit={handleSubmit} onReset={handleReset}>
      <tr>
        <th scope="row">검색조건</th>
        <td colSpan={3}>
          <div className="admin-search-inline">
            <select name="searchGb" className="form-select admin-search-gb-select" defaultValue="NM">
              <option value="NO">기획전번호</option>
              <option value="NM">기획전명</option>
            </select>
            <input
              type="text"
              name="searchValue"
              className="form-control admin-search-keyword"
              placeholder="검색어를 입력하세요"
            />
          </div>
        </td>
        <th scope="row">노출기간</th>
        <td>
          <div className="admin-search-inline">
            <input type="date" name="searchStartDt" className="form-control admin-search-date-input" />
            <span className="admin-search-separator">~</span>
            <input type="date" name="searchEndDt" className="form-control admin-search-date-input" />
          </div>
        </td>
      </tr>
    </AdminSearchPanel>
  );
};

export default ExhibitionSearchForm;
