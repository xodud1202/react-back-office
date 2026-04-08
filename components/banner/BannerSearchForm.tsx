import React, { useCallback } from 'react';
import AdminSearchPanel from '@/components/common/AdminSearchPanel';
import AdminDateInput from '@/components/common/AdminDateInput';
import type { CommonCode } from '@/components/goods/types';
import type { BannerSearchParams } from '@/components/banner/types';
import { DEFAULT_BANNER_SEARCH_PARAMS } from '@/components/banner/types';

interface BannerSearchFormProps {
  // 배너 구분 목록입니다.
  bannerDivList: CommonCode[];
  // 검색 중 여부입니다.
  loading: boolean;
  // 검색 처리 함수입니다.
  onSearch: (params: BannerSearchParams) => void;
}

// 배너 검색 조건 폼을 렌더링합니다.
const BannerSearchForm = ({ bannerDivList, loading, onSearch }: BannerSearchFormProps) => {
  // 검색 버튼 클릭 시 검색 조건을 전달합니다.
  const handleSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // 폼 데이터를 배너 조회 파라미터로 변환합니다.
    const formData = new FormData(event.currentTarget);
    onSearch({
      bannerDivCd: String(formData.get('bannerDivCd') || ''),
      showYn: String(formData.get('showYn') || ''),
      searchValue: String(formData.get('searchValue') || ''),
      searchStartDt: String(formData.get('searchStartDt') || ''),
      searchEndDt: String(formData.get('searchEndDt') || ''),
    });
  }, [onSearch]);

  // 검색 초기화 시 기본 조회 조건으로 되돌립니다.
  const handleReset = useCallback(() => {
    onSearch({ ...DEFAULT_BANNER_SEARCH_PARAMS });
  }, [onSearch]);

  return (
    <AdminSearchPanel loading={loading} onSubmit={handleSubmit} onReset={handleReset}>
      <tr>
        <th scope="row">배너구분</th>
        <td>
          <select name="bannerDivCd" className="form-select admin-search-control" defaultValue="">
            <option value="">전체</option>
            {bannerDivList.map((item) => (
              <option key={item.cd} value={item.cd}>{item.cdNm}</option>
            ))}
          </select>
        </td>
        <th scope="row">노출여부</th>
        <td>
          <select name="showYn" className="form-select admin-search-control" defaultValue="Y">
            <option value="Y">Y</option>
            <option value="N">N</option>
          </select>
        </td>
        <th scope="row">검색어</th>
        <td>
          <input
            type="text"
            name="searchValue"
            className="form-control"
            placeholder="배너명을 입력하세요"
          />
        </td>
      </tr>
      <tr>
        <th scope="row">노출기간</th>
        <td colSpan={5}>
          <div className="admin-search-inline">
            <AdminDateInput
              name="searchStartDt"
              className="form-control"
              wrapperClassName="admin-search-date-input"
            />
            <span className="admin-search-separator">~</span>
            <AdminDateInput
              name="searchEndDt"
              className="form-control"
              wrapperClassName="admin-search-date-input"
            />
          </div>
        </td>
      </tr>
    </AdminSearchPanel>
  );
};

export default BannerSearchForm;
