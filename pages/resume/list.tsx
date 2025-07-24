import React, { useState, useEffect, useCallback } from 'react';
import CommonGrid from '../../components/common/CommonGrid';
import { ColDef } from 'ag-grid-community';

// 이력서 데이터 타입 정의
interface ResumeData {
  loginId: string;
  usrNo: string;
  userNm: string;
  subTitle: string;
  regDt: string;
}

const ResumeList = () => {
  // 상태 관리
  const [searchGb, setSearchGb] = useState('loginId');
  const [searchValue, setSearchValue] = useState('');
  const [rowData, setRowData] = useState<ResumeData[]>([]);
  const [loading, setLoading] = useState(false);

  // 그리드 컬럼 정의
  const [columnDefs] = useState<ColDef<ResumeData>[]>([
    { headerName: '사용자 번호', field: 'usrNo', checkboxSelection: true, headerCheckboxSelection: true },
    { headerName: '사용자 계정', field: 'loginId' },
    { headerName: '사용자명', field: 'userNm' },
    { headerName: '제목', field: 'subTitle', flex: 1 },
    { headerName: '등록일', field: 'regDt' },
  ]);

  // 데이터 조회 함수
  const fetchResumes = useCallback(async (params: Record<string, string> = {}) => {
    setLoading(true);
    try {
      const requestUri = '/api/admin/resume/list';
      const requestParam = { 
        method: 'GET',
        ...params 
      };

      const response = await fetch('/api/backend-api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestUri, requestParam })
      });

      if (response.ok) {
        const data = await response.json();
        setRowData(data || []); // 백엔드 응답 구조에 따라 .list가 필요할 수 있습니다.
      } else {
        console.error('Failed to fetch resume list');
        alert('이력서 목록을 불러오는 데 실패했습니다.');
      }
    } catch (error) {
      console.error('Error fetching resume list:', error);
      alert('데이터 조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  // 검색 버튼 핸들러
  const handleSearch = () => {
    const params = searchValue ? { [searchGb]: searchValue } : {};
    fetchResumes(params);
  };

  // 컴포넌트 마운트 시 초기 데이터 로드
  useEffect(() => {
    fetchResumes();
  }, [fetchResumes]);

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-4">이력서 관리</h1>
      
      {/* 검색 영역 */}
      <div className="search-bar mb-4 p-4 border rounded-lg bg-gray-50">
        <div className="flex items-center space-x-2">
          <select 
            value={searchGb}
            onChange={e => setSearchGb(e.target.value)}
            className="p-2 border border-gray-300 rounded"
          >
            <option value="loginId">사용자계정</option>
            <option value="usrNo">사용자번호</option>
            <option value="userNm">사용자명</option>
          </select>
          <input 
            type="text"
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="p-2 border border-gray-300 rounded w-full"
            placeholder="검색어를 입력하세요..."
          />
          <button 
            onClick={handleSearch}
            disabled={loading}
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 whitespace-nowrap"
          >
            {loading ? '검색중...' : '검색'}
          </button>
        </div>
      </div>

      {/* 그리드 영역 */}
      <CommonGrid
        rowData={rowData}
        columnDefs={columnDefs}
        overlayLoadingTemplate={'<span class="ag-overlay-loading-center">데이터를 불러오는 중입니다...</span>'}
        overlayNoRowsTemplate={'<span class="ag-overlay-no-rows-center">데이터가 없습니다.</span>'}
        {...(loading && { overlayLoadingTemplate: '<span class="ag-overlay-loading-center">데이터를 불러오는 중입니다...</span>'})}
      />
    </div>
  );
};

export default ResumeList;