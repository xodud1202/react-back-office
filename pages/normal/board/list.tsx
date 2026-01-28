import React, { useCallback, useEffect, useRef, useState } from 'react';
import api from '@/utils/axios/axios';
import { dateFormatter } from '@/utils/common';

interface BoardData {
  boardNo: number;
  boardDivNm: string | null;
  boardDetailDivCd: string | null;
  boardDetailDivNm: string | null;
  title: string | null;
  viewYn: string | null;
  readCnt: number | null;
  regDt: string | null;
  udtDt: string | null;
}

interface CommonCode {
  grpCd: string;
  cd: string;
  cdNm: string;
  dispOrd: number;
}

interface BoardListResponse {
  list: BoardData[];
  totalCount: number;
  page: number;
  pageSize: number;
}

const BoardList = () => {
  const [rowData, setRowData] = useState<BoardData[]>([]);
  const [detailDivList, setDetailDivList] = useState<CommonCode[]>([]);
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [searchParams, setSearchParams] = useState<Record<string, any>>({});
  const pageGroupSize = 10;

  const fetchBoardDetailDivList = useCallback(async () => {
    try {
      const response = await api.get('/api/admin/common/code', {
        params: { grpCd: 'BOARD_DETAIL_DIV' },
      });
      setDetailDivList(response.data || []);
    } catch (e) {
      console.error('게시판 상세 구분 코드를 불러오는 데 실패했습니다.');
      alert('게시판 상세 구분 코드를 불러오는 데 실패했습니다.');
    }
  }, []);

  const fetchBoardList = useCallback(async (params: Record<string, any> = {}) => {
    setLoading(true);
    try {
      const response = await api.get('/api/admin/board/list', { params });
      return response.data as BoardListResponse;
    } catch (e) {
      console.error('게시판 목록을 불러오는 데 실패했습니다.');
      alert('게시판 목록을 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const nextParams = Object.fromEntries(formData.entries());
    setSearchParams(nextParams);
    setPage(1);
    fetchBoardList({ ...nextParams, page: 1 }).then((r) => {
      setRowData(r?.list || []);
      setTotalCount(r?.totalCount || 0);
      setPageSize(r?.pageSize || 20);
    });
  };

  useEffect(() => {
    fetchBoardDetailDivList();
    fetchBoardList({ page: 1 }).then((r) => {
      setRowData(r?.list || []);
      setTotalCount(r?.totalCount || 0);
      setPageSize(r?.pageSize || 20);
    });
  }, [fetchBoardDetailDivList, fetchBoardList]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentGroup = Math.floor((page - 1) / pageGroupSize);
  const groupStart = currentGroup * pageGroupSize + 1;
  const groupEnd = Math.min(groupStart + pageGroupSize - 1, totalPages);
  const pageNumbers = Array.from({ length: groupEnd - groupStart + 1 }, (_, i) => groupStart + i);
  const hasPrevGroup = groupStart > 1;
  const hasNextGroup = groupEnd < totalPages;
  const disabledButtonStyle = {
    backgroundColor: '#777777',
    borderColor: '#777777',
    color: '#ffffff',
  };

  const handlePageChange = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages || nextPage === page) {
      return;
    }
    setPage(nextPage);
    fetchBoardList({ ...searchParams, page: nextPage }).then((r) => {
      setRowData(r?.list || []);
      setTotalCount(r?.totalCount || 0);
      setPageSize(r?.pageSize || 20);
    });
  };

  return (
    <>
      <div className="page-header">
        <h3 className="page-title"> 게시판 관리 </h3>
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><a href="#">게시판</a></li>
            <li className="breadcrumb-item active" aria-current="page">목록</li>
          </ol>
        </nav>
      </div>

      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card">
            <div className="card-body">
              <h4 className="card-title">검색 조건</h4>
              <p className="card-description">게시판 목록 조회 조건을 입력하세요.</p>
              <form ref={formRef} onSubmit={handleSearch} className="forms-sample">
                <div className="row">
                  <div className="col-md-3">
                    <div className="form-group">
                      <label>게시판 상세 구분</label>
                      <select name="boardDetailDivCd" defaultValue="" className="form-select">
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
                <button type="submit" className="btn btn-primary me-2" disabled={loading}>
                  {loading ? '검색중...' : '검색'}
                </button>
                <button type="reset" className="btn btn-dark">
                  초기화
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-12 grid-margin stretch-card">
          <div className="card">
            <div className="card-body">
              <h4 className="card-title">게시판 목록</h4>
              <p className="card-description">조회 결과 목록입니다.</p>
              <div className="table-responsive">
                <table className="table table-fixed text-center">
                  <thead>
                    <tr>
                      <th style={{ width: '90px' }}>번호</th>
                      <th style={{ width: '160px' }}>게시판 상세 구분</th>
                      <th>타이틀</th>
                      <th style={{ width: '90px' }}>노출</th>
                      <th style={{ width: '90px' }}>조회수</th>
                      <th style={{ width: '160px' }}>등록일</th>
                      <th style={{ width: '160px' }}>수정일</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rowData.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center">데이터가 없습니다.</td>
                      </tr>
                    )}
                    {rowData.map((row) => (
                      <tr key={row.boardNo}>
                        <td style={{ width: '90px' }}>{row.boardNo}</td>
                        <td style={{ width: '160px' }}>{row.boardDetailDivNm || row.boardDetailDivCd}</td>
                        <td className="text-start">{row.title}</td>
                        <td style={{ width: '90px' }}>{row.viewYn}</td>
                        <td style={{ width: '90px' }}>{row.readCnt}</td>
                        <td style={{ width: '160px' }}>{dateFormatter({ value: row.regDt } as any)}</td>
                        <td style={{ width: '160px' }}>{dateFormatter({ value: row.udtDt } as any)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3">
                <div className="mb-2">총 {totalCount}건</div>
                <nav aria-label="게시판 페이지" className="d-flex justify-content-center">
                  <ul className="pagination mb-0">
                    <li className={`page-item ${!hasPrevGroup ? 'disabled' : ''}`}>
                      <button
                        type="button"
                        className="page-link"
                        onClick={() => handlePageChange(groupStart - 1)}
                        disabled={!hasPrevGroup}
                        style={!hasPrevGroup ? disabledButtonStyle : undefined}
                      >
                        {'<<'}
                      </button>
                    </li>
                    <li className={`page-item ${page <= 1 ? 'disabled' : ''}`}>
                      <button
                        type="button"
                        className="page-link"
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page <= 1}
                        style={page <= 1 ? disabledButtonStyle : undefined}
                      >
                        이전
                      </button>
                    </li>
                    {pageNumbers.map((pageNo) => (
                      <li key={pageNo} className={`page-item ${pageNo === page ? 'active' : ''}`}>
                        <button
                          type="button"
                          className={`page-link ${pageNo === page ? 'fw-bold' : ''}`}
                          onClick={() => handlePageChange(pageNo)}
                        >
                          {pageNo}
                        </button>
                      </li>
                    ))}
                    <li className={`page-item ${page >= totalPages ? 'disabled' : ''}`}>
                      <button
                        type="button"
                        className="page-link"
                        onClick={() => handlePageChange(page + 1)}
                        disabled={page >= totalPages}
                        style={page >= totalPages ? disabledButtonStyle : undefined}
                      >
                        다음
                      </button>
                    </li>
                    <li className={`page-item ${!hasNextGroup ? 'disabled' : ''}`}>
                      <button
                        type="button"
                        className="page-link"
                        onClick={() => handlePageChange(groupEnd + 1)}
                        disabled={!hasNextGroup}
                        style={!hasNextGroup ? disabledButtonStyle : undefined}
                      >
                        {'>>'}
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BoardList;
