import React from 'react';
import type { NotionCategoryOption, NotionSearchForm as NotionSearchFormType } from '@/components/notion/types';

interface NotionSearchFormProps {
  // 검색 폼 상태입니다.
  searchForm: NotionSearchFormType;
  // 카테고리 조회 중 여부입니다.
  categoryLoading: boolean;
  // 카테고리 옵션 목록입니다.
  categoryOptions: NotionCategoryOption[];
  // 목록 조회 중 여부입니다.
  loading: boolean;
  // 입력 변경 처리입니다.
  onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  // 검색 처리입니다.
  onSearch: (event: React.FormEvent<HTMLFormElement>) => void;
  // 초기화 처리입니다.
  onReset: () => void;
  // 순서 변경 팝업 오픈 처리입니다.
  onOpenSortModal: () => void;
}

// Notion 저장 목록 검색 폼을 렌더링합니다.
const NotionSearchForm = ({
  searchForm,
  categoryLoading,
  categoryOptions,
  loading,
  onChange,
  onSearch,
  onReset,
  onOpenSortModal,
}: NotionSearchFormProps) => {
  return (
    <div className="row">
      <div className="col-12 grid-margin stretch-card">
        <div className="card">
          <div className="card-body">
            <form className="forms-sample" onSubmit={onSearch}>
              <div className="row">
                <div className="col-md-3">
                  <div className="form-group">
                    <label>카테고리</label>
                    <div className="d-flex gap-2">
                      <select
                        name="categoryId"
                        value={searchForm.categoryId}
                        className="form-select btn-outline-secondary"
                        onChange={onChange}
                        disabled={categoryLoading}
                      >
                        <option value="">전체</option>
                        {categoryOptions.map((item) => (
                          <option key={item.categoryId} value={item.categoryId}>{item.categoryNm}</option>
                        ))}
                      </select>
                      <button type="button" className="btn btn-outline-primary" onClick={onOpenSortModal}>
                        순서 변경
                      </button>
                    </div>
                  </div>
                </div>
                <div className="col-md-2">
                  <div className="form-group">
                    <label>등록일시 시작</label>
                    <input
                      type="date"
                      name="createDtStart"
                      className="form-control"
                      value={searchForm.createDtStart}
                      onChange={onChange}
                    />
                  </div>
                </div>
                <div className="col-md-2">
                  <div className="form-group">
                    <label>등록일시 종료</label>
                    <input
                      type="date"
                      name="createDtEnd"
                      className="form-control"
                      value={searchForm.createDtEnd}
                      onChange={onChange}
                    />
                  </div>
                </div>
                <div className="col-md-5">
                  <div className="form-group">
                    <label>타이틀</label>
                    <input
                      type="text"
                      name="title"
                      className="form-control"
                      placeholder="타이틀을 입력하세요"
                      value={searchForm.title}
                      onChange={onChange}
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

export default NotionSearchForm;
