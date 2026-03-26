import React, { useCallback } from 'react';
import AdminSearchPanel from '@/components/common/AdminSearchPanel';
import type { BrandOption, CommonCode } from '@/components/goods/types';

interface GoodsSearchFormProps {
  goodsStatList: CommonCode[];
  goodsDivList: CommonCode[];
  brandList: BrandOption[];
  loading: boolean;
  onSearch: (params: Record<string, any>) => void;
}

// 상품 검색 폼을 렌더링합니다.
const GoodsSearchForm = ({ goodsStatList, goodsDivList, brandList, loading, onSearch }: GoodsSearchFormProps) => {
  // 검색 제출 시 입력값을 조회 파라미터로 변환합니다.
  const handleSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const nextParams = Object.fromEntries(formData.entries());
    onSearch(nextParams);
  }, [onSearch]);

  // 검색 초기화 시 조회 파라미터를 비웁니다.
  const handleReset = useCallback(() => {
    onSearch({});
  }, [onSearch]);

  return (
    <AdminSearchPanel loading={loading} onSubmit={handleSubmit} onReset={handleReset}>
      <tr>
        <th scope="row">브랜드</th>
        <td>
          <select name="brandNo" defaultValue="" className="form-select admin-search-control">
            <option value="">전체</option>
            {brandList.map((item) => (
              <option key={item.brandNo} value={item.brandNo}>{item.brandNm}</option>
            ))}
          </select>
        </td>
        <th scope="row">상품상태</th>
        <td>
          <select name="goodsStatCd" defaultValue="" className="form-select admin-search-control">
            <option value="">전체</option>
            {goodsStatList.map((item) => (
              <option key={item.cd} value={item.cd}>{item.cdNm}</option>
            ))}
          </select>
        </td>
        <th scope="row">상품분류</th>
        <td>
          <select name="goodsDivCd" defaultValue="" className="form-select admin-search-control">
            <option value="">전체</option>
            {goodsDivList.map((item) => (
              <option key={item.cd} value={item.cd}>{item.cdNm}</option>
            ))}
          </select>
        </td>
      </tr>
      <tr>
        <th scope="row">노출여부</th>
        <td>
          <select name="showYn" defaultValue="" className="form-select admin-search-control">
            <option value="">전체</option>
            <option value="Y">Y</option>
            <option value="N">N</option>
          </select>
        </td>
        <th scope="row">검색조건</th>
        <td colSpan={3}>
          <div className="admin-search-inline">
            <select name="searchGb" defaultValue="goodsId" className="form-select admin-search-gb-select">
              <option value="goodsId">상품코드</option>
              <option value="erpStyleCd">ERP품번코드</option>
              <option value="goodsNm">상품명</option>
            </select>
            <input
              type="text"
              name="searchValue"
              className="form-control admin-search-keyword"
              placeholder="검색어를 입력하세요"
            />
          </div>
        </td>
      </tr>
    </AdminSearchPanel>
  );
};

export default GoodsSearchForm;
