import React, { useCallback } from 'react';
import AdminSearchPanel from '@/components/common/AdminSearchPanel';
import type { CommonCodeRow, SearchGb } from '@/components/user/types';

interface UserSearchFormProps {
  searchGb: SearchGb;
  searchValue: string;
  usrStatCd: string;
  usrGradeCd: string;
  usrStatOptions: CommonCodeRow[];
  usrGradeOptions: CommonCodeRow[];
  isLoading: boolean;
  onChangeSearchGb: (value: SearchGb) => void;
  onChangeSearchValue: (value: string) => void;
  onChangeUsrStatCd: (value: string) => void;
  onChangeUsrGradeCd: (value: string) => void;
  onSearch: () => void;
  onReset: () => void;
}

// 사용자 검색 폼 컴포넌트를 렌더링합니다.
const UserSearchForm = ({
  searchGb,
  searchValue,
  usrStatCd,
  usrGradeCd,
  usrStatOptions,
  usrGradeOptions,
  isLoading,
  onChangeSearchGb,
  onChangeSearchValue,
  onChangeUsrStatCd,
  onChangeUsrGradeCd,
  onSearch,
  onReset,
}: UserSearchFormProps) => {
  // 검색 폼 제출 이벤트를 처리합니다.
  const handleSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearch();
  }, [onSearch]);

  return (
    <AdminSearchPanel loading={isLoading} onSubmit={handleSubmit} onReset={onReset} resetType="button">
      <tr>
        <th scope="row">검색조건</th>
        <td colSpan={3}>
          <div className="admin-search-inline">
            <select
              className="form-select admin-search-gb-select"
              value={searchGb}
              onChange={(event) => onChangeSearchGb(event.target.value as SearchGb)}
            >
              <option value="loginId">ID</option>
              <option value="userNm">이름</option>
            </select>
            <input
              type="text"
              className="form-control admin-search-keyword"
              value={searchValue}
              onChange={(event) => onChangeSearchValue(event.target.value)}
              placeholder="검색어를 입력하세요"
            />
          </div>
        </td>
        <th scope="row">상태</th>
        <td>
          <select
            className="form-select admin-search-control"
            value={usrStatCd}
            onChange={(event) => onChangeUsrStatCd(event.target.value)}
          >
            <option value="">전체</option>
            {usrStatOptions.map((item) => (
              <option key={item.cd} value={item.cd}>{item.cdNm}</option>
            ))}
          </select>
        </td>
      </tr>
      <tr>
        <th scope="row">등급</th>
        <td>
          <select
            className="form-select admin-search-control"
            value={usrGradeCd}
            onChange={(event) => onChangeUsrGradeCd(event.target.value)}
          >
            <option value="">전체</option>
            {usrGradeOptions.map((item) => (
              <option key={item.cd} value={item.cd}>{item.cdNm}</option>
            ))}
          </select>
        </td>
        <td colSpan={4} />
      </tr>
    </AdminSearchPanel>
  );
};

export default UserSearchForm;
