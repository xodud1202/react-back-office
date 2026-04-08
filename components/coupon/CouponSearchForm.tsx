import React, { useCallback } from 'react';
import AdminSearchPanel from '@/components/common/AdminSearchPanel';
import AdminDateInput from '@/components/common/AdminDateInput';
import type { CommonCode } from '@/components/goods/types';
import type { CouponSearchParams } from '@/components/coupon/types';
import { DEFAULT_COUPON_SEARCH_PARAMS } from '@/components/coupon/types';

interface CouponSearchFormProps {
  // 쿠폰 상태 코드 목록입니다.
  cpnStatList: CommonCode[];
  // 쿠폰 종류 코드 목록입니다.
  cpnGbList: CommonCode[];
  // 쿠폰 타겟 코드 목록입니다.
  cpnTargetList: CommonCode[];
  // 검색 중 여부입니다.
  loading: boolean;
  // 검색 실행 함수입니다.
  onSearch: (params: CouponSearchParams) => void;
}

// 쿠폰 검색 조건 폼을 렌더링합니다.
const CouponSearchForm = ({
  cpnStatList,
  cpnGbList,
  cpnTargetList,
  loading,
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

  // 검색 초기화 시 기본 조회 조건으로 되돌립니다.
  const handleReset = useCallback(() => {
    onSearch({ ...DEFAULT_COUPON_SEARCH_PARAMS });
  }, [onSearch]);

  return (
    <AdminSearchPanel loading={loading} onSubmit={handleSubmit} onReset={handleReset}>
      <tr>
        <th scope="row">검색조건</th>
        <td colSpan={3}>
          <div className="admin-search-inline">
            <select name="searchGb" className="form-select admin-search-gb-select" defaultValue="CPN_NO">
              <option value="CPN_NO">쿠폰번호</option>
              <option value="CPN_NM">쿠폰명</option>
            </select>
            <input
              type="text"
              name="searchValue"
              className="form-control admin-search-keyword"
              placeholder="검색어를 입력하세요"
            />
          </div>
        </td>
        <th scope="row">기간</th>
        <td>
          <div className="admin-search-inline">
            <select name="dateGb" className="form-select admin-search-date-select" defaultValue="REG_DT">
              <option value="REG_DT">등록기간</option>
              <option value="DOWN_DT">다운로드가능기간</option>
            </select>
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
      <tr>
        <th scope="row">쿠폰 상태</th>
        <td>
          <select name="cpnStatCd" className="form-select admin-search-control" defaultValue="">
            <option value="">전체</option>
            {cpnStatList.map((item) => (
              <option key={item.cd} value={item.cd}>{item.cdNm}</option>
            ))}
          </select>
        </td>
        <th scope="row">쿠폰 종류</th>
        <td>
          <select name="cpnGbCd" className="form-select admin-search-control" defaultValue="">
            <option value="">전체</option>
            {cpnGbList.map((item) => (
              <option key={item.cd} value={item.cd}>{item.cdNm}</option>
            ))}
          </select>
        </td>
        <th scope="row">쿠폰 타겟</th>
        <td>
          <div className="admin-search-inline">
            <select name="cpnTargetCd" className="form-select admin-search-control" defaultValue="">
              <option value="">전체</option>
              {cpnTargetList.map((item) => (
                <option key={item.cd} value={item.cd}>{item.cdNm}</option>
              ))}
            </select>
            <select name="cpnDownAbleYn" className="form-select admin-search-control" defaultValue="">
              <option value="">다운로드 전체</option>
              <option value="Y">다운로드 Y</option>
              <option value="N">다운로드 N</option>
            </select>
          </div>
        </td>
      </tr>
    </AdminSearchPanel>
  );
};

export default CouponSearchForm;
