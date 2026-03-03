import React, { useCallback } from 'react';
import type { ExhibitionSearchParams } from '@/components/exhibition/types';

interface ExhibitionSearchFormProps {
  // 검색 처리 함수입니다.
  onSearch: (params: ExhibitionSearchParams) => void;
}

// 기획전 조회 조건 폼을 렌더링합니다.
const ExhibitionSearchForm = ({ onSearch }: ExhibitionSearchFormProps) => {
  // 검색 버튼 클릭 시 조건을 전달합니다.
  const handleSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    onSearch({
      searchGb: String(formData.get('searchGb') || 'NM'),
      searchValue: String(formData.get('searchValue') || ''),
      searchStartDt: String(formData.get('searchStartDt') || ''),
      searchEndDt: String(formData.get('searchEndDt') || ''),
    });
  }, [onSearch]);

  return (
    <form className="forms-sample mb-3" onSubmit={handleSubmit}>
      <div className="row">
        <div className="col-md-2">
          <div className="form-group">
            <label>구분</label>
            <select name="searchGb" className="form-select" defaultValue="NM">
              <option value="NO">기획전번호</option>
              <option value="NM">기획전명</option>
            </select>
          </div>
        </div>
        <div className="col-md-4">
          <div className="form-group">
            <label>검색어</label>
            <input type="text" name="searchValue" className="form-control" placeholder="검색어를 입력하세요" />
          </div>
        </div>
        <div className="col-md-2">
          <div className="form-group">
            <label>노출기간 시작</label>
            <input type="date" name="searchStartDt" className="form-control" />
          </div>
        </div>
        <div className="col-md-2">
          <div className="form-group">
            <label>노출기간 종료</label>
            <input type="date" name="searchEndDt" className="form-control" />
          </div>
        </div>
      </div>
      <div className="d-flex justify-content-center gap-2">
        <button type="submit" className="btn btn-primary">검색</button>
      </div>
    </form>
  );
};

export default ExhibitionSearchForm;
