import React from 'react';
import AdminSearchPanel from '@/components/common/AdminSearchPanel';
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
    <AdminSearchPanel loading={loading} onSubmit={onSearch} onReset={onReset} resetType="button">
      <tr>
        <th scope="row">카테고리</th>
        <td>
          <div className="admin-search-inline">
            <select
              name="categoryId"
              value={searchForm.categoryId}
              className="form-select admin-search-control"
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
        </td>
        <th scope="row">등록일시</th>
        <td colSpan={3}>
          <div className="admin-search-inline">
            <input
              type="date"
              name="createDtStart"
              className="form-control admin-search-date-input"
              value={searchForm.createDtStart}
              onChange={onChange}
            />
            <span className="admin-search-separator">~</span>
            <input
              type="date"
              name="createDtEnd"
              className="form-control admin-search-date-input"
              value={searchForm.createDtEnd}
              onChange={onChange}
            />
          </div>
        </td>
      </tr>
      <tr>
        <th scope="row">타이틀</th>
        <td colSpan={5}>
          <input
            type="text"
            name="title"
            className="form-control"
            placeholder="타이틀을 입력하세요"
            value={searchForm.title}
            onChange={onChange}
          />
        </td>
      </tr>
    </AdminSearchPanel>
  );
};

export default NotionSearchForm;
