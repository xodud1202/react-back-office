import React from 'react';
import type { CommonCode } from '@/components/goods/types';

interface GoodsSearchFormProps {
  goodsStatList: CommonCode[];
  goodsDivList: CommonCode[];
  loading: boolean;
  formRef: React.RefObject<HTMLFormElement | null>;
  onSearch: (e: React.FormEvent<HTMLFormElement>) => void;
  onReset: () => void;
}

// 상품 검색 폼을 렌더링합니다.
const GoodsSearchForm = ({ goodsStatList, goodsDivList, loading, formRef, onSearch, onReset }: GoodsSearchFormProps) => (
  <div className="row">
    <div className="col-12 grid-margin stretch-card">
      <div className="card">
        <div className="card-body">
          <form ref={formRef} onSubmit={onSearch} onReset={onReset} className="forms-sample">
            <div className="row">
              <div className="col-md-2">
                <div className="form-group">
                  <label>검색 구분</label>
                  <select name="searchGb" defaultValue="goodsId" className="form-select">
                    <option value="goodsId">상품코드</option>
                    <option value="erpStyleCd">ERP품번코드</option>
                    <option value="goodsNm">상품명</option>
                  </select>
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-group">
                  <label>검색어</label>
                  <input
                    type="text"
                    name="searchValue"
                    className="form-control"
                    placeholder="검색어를 입력하세요"
                  />
                </div>
              </div>
              <div className="col-md-2">
                <div className="form-group">
                  <label>상품상태</label>
                  <select name="goodsStatCd" defaultValue="" className="form-select">
                    <option value="">전체</option>
                    {goodsStatList.map((item) => (
                      <option key={item.cd} value={item.cd}>{item.cdNm}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="col-md-2">
                <div className="form-group">
                  <label>상품분류</label>
                  <select name="goodsDivCd" defaultValue="" className="form-select">
                    <option value="">전체</option>
                    {goodsDivList.map((item) => (
                      <option key={item.cd} value={item.cd}>{item.cdNm}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="col-md-2">
                <div className="form-group">
                  <label>노출여부</label>
                  <select name="showYn" defaultValue="" className="form-select">
                    <option value="">전체</option>
                    <option value="Y">Y</option>
                    <option value="N">N</option>
                  </select>
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

export default GoodsSearchForm;
