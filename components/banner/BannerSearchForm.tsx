import React, { useCallback } from 'react';
import type { CommonCode } from '@/components/goods/types';
import type { BannerSearchParams } from '@/components/banner/types';

interface BannerSearchFormProps {
  // 배너 구분 목록입니다.
  bannerDivList: CommonCode[];
  // 검색 처리 함수입니다.
  onSearch: (params: BannerSearchParams) => void;
}

// 배너 검색 조건 폼을 렌더링합니다.
const BannerSearchForm = ({ bannerDivList, onSearch }: BannerSearchFormProps) => {
  // 검색 버튼 클릭 시 검색 조건을 전달합니다.
  const handleSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    onSearch({
      bannerDivCd: String(formData.get('bannerDivCd') || ''),
      showYn: String(formData.get('showYn') || ''),
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
            <label>배너구분</label>
            <select name="bannerDivCd" className="form-select" defaultValue="">
              <option value="">전체</option>
              {bannerDivList.map((item) => (
                <option key={item.cd} value={item.cd}>{item.cdNm}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="col-md-4">
          <div className="form-group">
            <label>검색어(배너명)</label>
            <input type="text" name="searchValue" className="form-control" placeholder="검색어를 입력하세요" />
          </div>
        </div>
        <div className="col-md-2">
          <div className="form-group">
            <label>노출여부</label>
            <select name="showYn" className="form-select" defaultValue="Y">
              <option value="Y">Y</option>
              <option value="N">N</option>
            </select>
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

export default BannerSearchForm;
