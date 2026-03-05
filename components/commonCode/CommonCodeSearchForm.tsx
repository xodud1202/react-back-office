import React from 'react';

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
    <div className="row">
      <div className="col-lg-12 grid-margin stretch-card">
        <div className="card">
          <div className="card-body">
            <form onSubmit={onSubmit} className="forms-sample">
              <div className="row">
                <div className="col-md-3">
                  <div className="form-group">
                    <label>검색 구분</label>
                    <select
                      className="form-select"
                      value={searchGb}
                      onChange={(event) => onChangeSearchGb(event.target.value as 'grpCd' | 'grpCdNm')}
                    >
                      <option value="grpCd">그룹코드</option>
                      <option value="grpCdNm">그룹코드명</option>
                    </select>
                  </div>
                </div>
                <div className="col-md-9">
                  <div className="form-group">
                    <label>검색어</label>
                    <input
                      type="text"
                      className="form-control"
                      value={searchValue}
                      onChange={(event) => onChangeSearchValue(event.target.value)}
                      maxLength={searchGb === 'grpCd' ? 20 : 50}
                      placeholder="검색어를 입력하세요"
                    />
                  </div>
                </div>
              </div>
              <div className="d-flex justify-content-center gap-2">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? '검색중...' : '검색'}
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

export default CommonCodeSearchForm;
