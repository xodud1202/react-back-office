import React from 'react';
import AdminSearchPanel from '@/components/common/AdminSearchPanel';

interface CommonCodeSearchFormProps {
  // 검색 구분 값입니다.
  searchGb: 'grpCd' | 'grpCdNm';
  // 검색어 값입니다.
  searchValue: string;
  // 조회 중 여부입니다.
  loading: boolean;
  // 검색 구분 변경 처리입니다.
  onChangeSearchGb: (value: 'grpCd' | 'grpCdNm') => void;
  // 검색어 변경 처리입니다.
  onChangeSearchValue: (value: string) => void;
  // 검색 제출 처리입니다.
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  // 검색 초기화 처리입니다.
  onReset: () => void;
}

// 공통코드 검색 폼을 렌더링합니다.
const CommonCodeSearchForm = ({
  searchGb,
  searchValue,
  loading,
  onChangeSearchGb,
  onChangeSearchValue,
  onSubmit,
  onReset,
}: CommonCodeSearchFormProps) => {
  return (
    <AdminSearchPanel loading={loading} onSubmit={onSubmit} onReset={onReset} resetType="button">
      <tr>
        <th scope="row">검색조건</th>
        <td colSpan={5}>
          <div className="admin-search-inline">
            <select
              className="form-select admin-search-gb-select"
              value={searchGb}
              onChange={(event) => onChangeSearchGb(event.target.value as 'grpCd' | 'grpCdNm')}
            >
              <option value="grpCd">그룹코드</option>
              <option value="grpCdNm">그룹코드명</option>
            </select>
            <input
              type="text"
              className="form-control admin-search-keyword"
              value={searchValue}
              onChange={(event) => onChangeSearchValue(event.target.value)}
              maxLength={searchGb === 'grpCd' ? 20 : 50}
              placeholder="검색어를 입력하세요"
            />
          </div>
        </td>
      </tr>
    </AdminSearchPanel>
  );
};

export default CommonCodeSearchForm;
