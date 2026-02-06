import React, { useCallback } from 'react';
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
    <div className="row">
      <div className="col-12 grid-margin stretch-card">
        <div className="card">
          <div className="card-body">
            <form onSubmit={handleSubmit} className="forms-sample">
              <div className="row">
                <div className="col-md-2">
                  <div className="form-group">
                    <label>검색 구분</label>
                    <select
                      className="form-select"
                      value={searchGb}
                      onChange={(event) => onChangeSearchGb(event.target.value as SearchGb)}
                    >
                      <option value="loginId">ID</option>
                      <option value="userNm">이름</option>
                    </select>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group">
                    <label>검색어</label>
                    <input
                      type="text"
                      className="form-control"
                      value={searchValue}
                      onChange={(event) => onChangeSearchValue(event.target.value)}
                      placeholder="검색어를 입력하세요"
                    />
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="form-group">
                    <label>상태</label>
                    <select
                      className="form-select"
                      value={usrStatCd}
                      onChange={(event) => onChangeUsrStatCd(event.target.value)}
                    >
                      <option value="">전체</option>
                      {usrStatOptions.map((item) => (
                        <option key={item.cd} value={item.cd}>{item.cdNm}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="form-group">
                    <label>등급</label>
                    <select
                      className="form-select"
                      value={usrGradeCd}
                      onChange={(event) => onChangeUsrGradeCd(event.target.value)}
                    >
                      <option value="">전체</option>
                      {usrGradeOptions.map((item) => (
                        <option key={item.cd} value={item.cd}>{item.cdNm}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="d-flex justify-content-center gap-2">
                <button type="submit" className="btn btn-primary" disabled={isLoading}>
                  {isLoading ? '검색중...' : '검색'}
                </button>
                <button type="button" className="btn btn-dark" onClick={onReset}>
                  초기화
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSearchForm;

