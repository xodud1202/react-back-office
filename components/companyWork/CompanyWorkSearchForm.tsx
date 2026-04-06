'use client';

import React, { useCallback } from 'react';
import AdminSearchPanel from '@/components/common/AdminSearchPanel';
import type {
  CompanyWorkCompanyOption,
  CompanyWorkProjectOption,
  CompanyWorkSearchFormState,
} from '@/components/companyWork/types';

interface CompanyWorkSearchFormProps {
  // 회사 목록입니다.
  companyList: CompanyWorkCompanyOption[];
  // 프로젝트 목록입니다.
  projectList: CompanyWorkProjectOption[];
  // 검색 폼 상태입니다.
  formState: CompanyWorkSearchFormState;
  // 검색 중 여부입니다.
  loading: boolean;
  // 프로젝트 목록 조회 중 여부입니다.
  projectLoading: boolean;
  // 회사 선택 변경 처리입니다.
  onChangeWorkCompanySeq: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  // 프로젝트 선택 변경 처리입니다.
  onChangeWorkCompanyProjectSeq: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  // 타이틀 입력 변경 처리입니다.
  onChangeTitle: (event: React.ChangeEvent<HTMLInputElement>) => void;
  // 검색 실행 처리입니다.
  onSearch: () => void;
  // 검색 초기화 처리입니다.
  onReset: () => void;
}

// 프로젝트 선택 플레이스홀더 문구를 반환합니다.
const resolveProjectPlaceholderText = (formState: CompanyWorkSearchFormState, projectLoading: boolean): string => {
  // 회사 선택 여부와 로딩 상태에 따라 안내 문구를 분기합니다.
  if (!formState.workCompanySeq) {
    return '회사를 먼저 선택하세요';
  }
  if (projectLoading) {
    return '프로젝트를 불러오는 중입니다.';
  }
  return '프로젝트를 선택하세요';
};

// 회사 업무 검색 폼을 렌더링합니다.
const CompanyWorkSearchForm = ({
  companyList,
  projectList,
  formState,
  loading,
  projectLoading,
  onChangeWorkCompanySeq,
  onChangeWorkCompanyProjectSeq,
  onChangeTitle,
  onSearch,
  onReset,
}: CompanyWorkSearchFormProps) => {
  // 검색 폼 제출 시 현재 상태 기준 조회를 요청합니다.
  const handleSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearch();
  }, [onSearch]);

  // 검색 조건을 기본 상태로 초기화합니다.
  const handleReset = useCallback(() => {
    onReset();
  }, [onReset]);

  // 프로젝트 선택 안내 문구를 계산합니다.
  const projectPlaceholderText = resolveProjectPlaceholderText(formState, projectLoading);

  return (
    <AdminSearchPanel
      loading={loading}
      onSubmit={handleSubmit}
      onReset={handleReset}
      resetType="button"
      loadingLabel="조회중..."
      submitLabel="검색"
    >
      <tr>
        <th scope="row" colSpan={1}>회사/프로젝트</th>
        <td colSpan={5}>
          <div className="d-flex flex-wrap align-items-center gap-2">
            <select
              className="form-select admin-search-control"
              style={{ maxWidth: '240px' }}
              value={formState.workCompanySeq}
              onChange={onChangeWorkCompanySeq}
            >
              <option value="" disabled>회사를 선택하세요</option>
              {companyList.map((companyItem) => (
                <option key={companyItem.workCompanySeq} value={companyItem.workCompanySeq}>
                  {companyItem.workCompanyNm}
                </option>
              ))}
            </select>
            <select
              className="form-select admin-search-control"
              style={{ maxWidth: '260px' }}
              value={formState.workCompanyProjectSeq}
              onChange={onChangeWorkCompanyProjectSeq}
              disabled={!formState.workCompanySeq || projectLoading}
            >
              <option value="" disabled>{projectPlaceholderText}</option>
              {projectList.map((projectItem) => (
                <option key={projectItem.workCompanyProjectSeq} value={projectItem.workCompanyProjectSeq}>
                  {projectItem.workCompanyProjectNm}
                </option>
              ))}
            </select>
          </div>
        </td>
      </tr>
      <tr>
        <th scope="row" colSpan={1}>타이틀</th>
        <td colSpan={5}>
          <input
            type="text"
            className="form-control admin-search-keyword"
            value={formState.title}
            onChange={onChangeTitle}
            placeholder="타이틀 검색어를 입력하세요"
          />
        </td>
      </tr>
    </AdminSearchPanel>
  );
};

export default CompanyWorkSearchForm;
