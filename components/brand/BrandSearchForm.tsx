import React, { useCallback } from 'react';

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
    <div className="row">
      <div className="col-12 grid-margin stretch-card">
        <div className="card">
          <div className="card-body">
            <form onSubmit={handleSubmit} onReset={handleReset} className="forms-sample">
              <div className="row">
                <div className="col-md-3">
                  <div className="form-group">
                    <label>브랜드번호</label>
                    <input
                      type="text"
                      name="brandNo"
                      className="form-control"
                      placeholder="브랜드번호를 입력하세요"
                    />
                  </div>
                </div>
                <div className="col-md-9">
                  <div className="form-group">
                    <label>브랜드명</label>
                    <input
                      type="text"
                      name="brandNm"
                      className="form-control"
                      placeholder="브랜드명을 입력하세요"
                    />
                  </div>
                </div>
              </div>
              <div className="d-flex justify-content-center gap-2">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? '검색중...' : '검색'}
                </button>
                <button type="reset" className="btn btn-dark">
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

export default BrandSearchForm;
