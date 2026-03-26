import React from 'react';
import AdminSearchPanel from '@/components/common/AdminSearchPanel';
import type { CommonCode } from '@/components/board/types';

interface BoardSearchFormProps {
  // 게시판 상세 구분 코드 목록입니다.
  detailDivList: CommonCode[];
  // 검색 중 여부입니다.
  loading: boolean;
  // 검색 제출 처리입니다.
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  // 검색 초기화 처리입니다.
  onReset: () => void;
}

// 게시판 검색 폼을 렌더링합니다.
const BoardSearchForm = ({ detailDivList, loading, onSubmit, onReset }: BoardSearchFormProps) => {
  return (
    <AdminSearchPanel loading={loading} onSubmit={onSubmit} onReset={onReset}>
      <tr>
        <th scope="row">게시판 상세 구분</th>
        <td>
          <select name="boardDetailDivCd" defaultValue="" className="form-select admin-search-control">
            <option value="">전체</option>
            {detailDivList.map((code) => (
              <option key={code.cd} value={code.cd}>{code.cdNm}</option>
            ))}
          </select>
        </td>
        <th scope="row">타이틀</th>
        <td colSpan={3}>
          <input
            type="text"
            name="title"
            className="form-control"
            placeholder="타이틀을 입력하세요"
          />
        </td>
      </tr>
    </AdminSearchPanel>
  );
};

export default BoardSearchForm;
