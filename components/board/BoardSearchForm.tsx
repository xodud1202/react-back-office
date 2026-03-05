import React from 'react';
import type { CommonCode } from '@/components/board/types';

interface BoardSearchFormProps {
  // 게시판 상세 구분 코드 목록입니다.
  detailDivList: CommonCode[];
  // 검색 중 여부입니다.
  loading: boolean;
  // 검색 제출 처리입니다.
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

// 게시판 검색 폼을 렌더링합니다.
const BoardSearchForm = ({ detailDivList, loading, onSubmit }: BoardSearchFormProps) => {
  return (
    <div className="row">
      <div className="col-12 grid-margin stretch-card">
        <div className="card">
          <div className="card-body">
            <form onSubmit={onSubmit} className="forms-sample">
              <div className="row">
                <div className="col-md-3">
                  <div className="form-group">
                    <label>게시판 상세 구분</label>
                    <select name="boardDetailDivCd" defaultValue="" className="form-select btn-outline-secondary">
                      <option value="">전체</option>
                      {detailDivList.map((code) => (
                        <option key={code.cd} value={code.cd}>{code.cdNm}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="col-md-9">
                  <div className="form-group">
                    <label>타이틀</label>
                    <input
                      type="text"
                      name="title"
                      className="form-control"
                      placeholder="타이틀을 입력하세요"
                    />
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
};

export default BoardSearchForm;
