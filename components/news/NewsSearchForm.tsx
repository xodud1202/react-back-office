import React from 'react';
import AdminSearchPanel from '@/components/common/AdminSearchPanel';

export interface NewsPressOption {
  // 언론사 번호입니다.
  pressNo: string;
  // 언론사명입니다.
  pressNm: string;
}

export interface NewsCategoryOption {
  // 카테고리 코드입니다.
  categoryCd: string;
  // 카테고리명입니다.
  categoryNm: string;
}

interface NewsSearchFormProps {
  // 언론사 선택 목록입니다.
  pressOptions: NewsPressOption[];
  // 카테고리 선택 목록입니다.
  categoryOptions: NewsCategoryOption[];
  // 선택된 언론사 번호입니다.
  selectedPressNo: string;
  // 선택된 카테고리 코드입니다.
  selectedCategoryCd: string;
  // 언론사 변경 처리입니다.
  onChangePressNo: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  // 카테고리 변경 처리입니다.
  onChangeCategoryCd: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  // 현재 선택값으로 재조회합니다.
  onSearch: (event: React.FormEvent<HTMLFormElement>) => void;
  // 기본 스냅샷으로 초기화합니다.
  onReset: () => void;
}

// 뉴스 목록 검색 폼을 렌더링합니다.
const NewsSearchForm = ({
  pressOptions,
  categoryOptions,
  selectedPressNo,
  selectedCategoryCd,
  onChangePressNo,
  onChangeCategoryCd,
  onSearch,
  onReset,
}: NewsSearchFormProps) => {
  return (
    <AdminSearchPanel onSubmit={onSearch} onReset={onReset} resetType="button">
      <tr>
        <th scope="row">언론사</th>
        <td>
          <select
            name="pressNo"
            className="form-select admin-search-control"
            value={selectedPressNo}
            onChange={onChangePressNo}
          >
            {pressOptions.map((press) => (
              <option key={press.pressNo} value={press.pressNo}>
                {press.pressNm}
              </option>
            ))}
          </select>
        </td>
        <th scope="row">카테고리</th>
        <td>
          <select
            name="categoryCd"
            className="form-select admin-search-control"
            value={selectedCategoryCd}
            onChange={onChangeCategoryCd}
            disabled={!selectedPressNo}
          >
            {categoryOptions.map((category) => (
              <option key={category.categoryCd} value={category.categoryCd}>
                {category.categoryNm}
              </option>
            ))}
          </select>
        </td>
      </tr>
    </AdminSearchPanel>
  );
};

export default NewsSearchForm;
