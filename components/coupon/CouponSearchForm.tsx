import React, { useCallback } from 'react';
import type { CommonCode } from '@/components/goods/types';
import type { CouponSearchParams } from '@/components/coupon/types';

interface CouponSearchFormProps {
  // 쿠폰 상태 코드 목록입니다.
  cpnStatList: CommonCode[];
  // 쿠폰 종류 코드 목록입니다.
  cpnGbList: CommonCode[];
  // 쿠폰 타겟 코드 목록입니다.
  cpnTargetList: CommonCode[];
  // 검색 실행 함수입니다.
  onSearch: (params: CouponSearchParams) => void;
}

// 쿠폰 검색 조건 폼을 렌더링합니다.
const CouponSearchForm = ({
  cpnStatList,
  cpnGbList,
  cpnTargetList,
  onSearch,
}: CouponSearchFormProps) => {
  // 검색 버튼 클릭 시 검색 조건을 상위로 전달합니다.
  const handleSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    onSearch({
      searchGb: String(formData.get('searchGb') || 'CPN_NO'),
      searchValue: String(formData.get('searchValue') || ''),
      dateGb: String(formData.get('dateGb') || 'REG_DT'),
      searchStartDt: String(formData.get('searchStartDt') || ''),
      searchEndDt: String(formData.get('searchEndDt') || ''),
      cpnStatCd: String(formData.get('cpnStatCd') || ''),
      cpnGbCd: String(formData.get('cpnGbCd') || ''),
      cpnTargetCd: String(formData.get('cpnTargetCd') || ''),
      cpnDownAbleYn: String(formData.get('cpnDownAbleYn') || ''),
    });
  }, [onSearch]);

  return (
    <form className="forms-sample mb-3" onSubmit={handleSubmit}>
      <div className="row">
        <div className="col-md-2">
          <div className="form-group">
            <label>검색구분</label>
            <select name="searchGb" className="form-select" defaultValue="CPN_NO">
              <option value="CPN_NO">쿠폰번호</option>
              <option value="CPN_NM">쿠폰명</option>
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
            <label>기간구분</label>
            <select name="dateGb" className="form-select" defaultValue="REG_DT">
              <option value="REG_DT">등록기간</option>
              <option value="DOWN_DT">다운로드가능기간</option>
            </select>
          </div>
        </div>
        <div className="col-md-2">
          <div className="form-group">
            <label>시작일</label>
            <input type="date" name="searchStartDt" className="form-control" />
          </div>
        </div>
        <div className="col-md-2">
          <div className="form-group">
            <label>종료일</label>
            <input type="date" name="searchEndDt" className="form-control" />
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-md-3">
          <div className="form-group">
            <label>쿠폰 상태</label>
            <select name="cpnStatCd" className="form-select" defaultValue="">
              <option value="">전체</option>
              {cpnStatList.map((item) => (
                <option key={item.cd} value={item.cd}>{item.cdNm}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="col-md-3">
          <div className="form-group">
            <label>쿠폰 종류</label>
            <select name="cpnGbCd" className="form-select" defaultValue="">
              <option value="">전체</option>
              {cpnGbList.map((item) => (
                <option key={item.cd} value={item.cd}>{item.cdNm}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="col-md-3">
          <div className="form-group">
            <label>쿠폰 타겟</label>
            <select name="cpnTargetCd" className="form-select" defaultValue="">
              <option value="">전체</option>
              {cpnTargetList.map((item) => (
                <option key={item.cd} value={item.cd}>{item.cdNm}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="col-md-3">
          <div className="form-group">
            <label>고객 다운로드 가능 여부</label>
            <select name="cpnDownAbleYn" className="form-select" defaultValue="">
              <option value="">전체</option>
              <option value="Y">Y</option>
              <option value="N">N</option>
            </select>
          </div>
        </div>
      </div>

      <div className="d-flex justify-content-center gap-2">
        <button type="submit" className="btn btn-primary">검색</button>
      </div>
    </form>
  );
};

export default CouponSearchForm;
