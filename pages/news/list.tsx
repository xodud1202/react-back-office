import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef, GridApi, GridReadyEvent, ICellRendererParams, IDatasource, IGetRowsParams } from 'ag-grid-community';
import api from '@/utils/axios/axios';
import { dateFormatter } from '@/utils/common';
import NewsImagePreviewModal from '@/components/common/NewsImagePreviewModal';

// 언론사 선택 옵션 데이터 타입
interface NewsPressOption {
  pressNo: number;
  pressNm: string;
}

// 카테고리 선택 옵션 데이터 타입
interface NewsCategoryOption {
  categoryCd: string;
  categoryNm: string;
}

// 뉴스 목록 행 데이터 타입
interface NewsListRow {
  articleNo: number;
  pressNm: string;
  categoryNm: string;
  articleTitle: string;
  articleUrl: string;
  thumbnailUrl?: string | null;
  rankScore: number;
  collectedDt: string;
}

// 뉴스 목록 API 응답 데이터 타입
interface NewsListResponse {
  list: NewsListRow[];
  totalCount: number;
  page: number;
  pageSize: number;
}

// 뉴스 목록 화면 컴포넌트
const NewsListPage = () => {
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [searchParams, setSearchParams] = useState<Record<string, any>>({});
  const gridApiRef = useRef<GridReadyEvent<NewsListRow>['api'] | null>(null);
  const [pressOptions, setPressOptions] = useState<NewsPressOption[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<NewsCategoryOption[]>([]);
  const [selectedPressNo, setSelectedPressNo] = useState<string>('');
  const [selectedCategoryCd, setSelectedCategoryCd] = useState<string>('');
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

  // 언론사 목록 조회
  const fetchPressOptions = useCallback(async () => {
    try {
      // 언론사 목록 호출
      const response = await api.get('/api/admin/news/press/list');
      setPressOptions(response.data || []);
    } catch {
      // 오류 메시지 출력
      console.error('언론사 목록을 불러오지 못했습니다.');
      alert('언론사 목록을 불러오지 못했습니다.');
    }
  }, []);

  // 카테고리 목록 조회
  const fetchCategoryOptions = useCallback(async (pressNo: number) => {
    try {
      // 언론사 기준 카테고리 조회
      const response = await api.get('/api/admin/news/category/list', {
        params: { pressNo },
      });
      setCategoryOptions(response.data || []);
    } catch {
      // 오류 메시지 출력
      console.error('카테고리 목록을 불러오지 못했습니다.');
      alert('카테고리 목록을 불러오지 못했습니다.');
    }
  }, []);

  // 언론사 선택 변경 처리
  const handlePressChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    // 선택된 언론사 값 갱신
    const nextPressNo = event.target.value;
    setSelectedPressNo(nextPressNo);

    // 카테고리 초기화
    setSelectedCategoryCd('');
    setCategoryOptions([]);

    // 선택된 언론사 기준 카테고리 재조회
    if (nextPressNo) {
      fetchCategoryOptions(Number(nextPressNo));
    }
  }, [fetchCategoryOptions]);

  // 카테고리 선택 변경 처리
  const handleCategoryChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    // 선택된 카테고리 값 갱신
    setSelectedCategoryCd(event.target.value);
  }, []);

  // 조회 버튼 처리
  const handleSearch = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    // 기본 동작 방지
    event.preventDefault();

    // 폼 데이터 수집
    const form = event.currentTarget;
    const formData = new FormData(form);
    const nextParams = Object.fromEntries(formData.entries());

    // 조회 파라미터 갱신
    setSearchParams(nextParams);
  }, []);

  // 초기화 버튼 처리
  const handleReset = useCallback(() => {
    // 선택 값 초기화
    setSelectedPressNo('');
    setSelectedCategoryCd('');
    setCategoryOptions([]);

    // 조회 파라미터 초기화
    setSearchParams({});
  }, []);

  // 이미지 미리보기 열기
  const handleOpenImageModal = useCallback((imageUrl: string) => {
    // 선택 이미지 설정
    setSelectedImageUrl(imageUrl);
    setIsImageModalOpen(true);
  }, []);

  // 이미지 미리보기 닫기
  const handleCloseImageModal = useCallback(() => {
    // 모달 닫기 및 선택 이미지 제거
    setIsImageModalOpen(false);
    setSelectedImageUrl(null);
  }, []);

  // 뉴스 타이틀 렌더링
  const renderTitleCell = useCallback((params: ICellRendererParams<NewsListRow>) => {
    // 타이틀 및 링크 정보 확인
    const title = params.data?.articleTitle || '';
    const url = params.data?.articleUrl || '';

    // 링크가 없으면 텍스트만 표시
    if (!url) {
      return <span>{title}</span>;
    }

    // 링크가 있으면 새 창으로 이동
    return (
      <a href={url} target="_blank" rel="noopener noreferrer">
        {title}
      </a>
    );
  }, []);

  // 타이틀 이미지 렌더링
  const renderThumbnailCell = useCallback((params: ICellRendererParams<NewsListRow>) => {
    // 이미지 URL 확인
    const thumbnailUrl = params.data?.thumbnailUrl;
    if (!thumbnailUrl) {
      return null;
    }

    // 이미지 클릭 시 모달 오픈
    return (
      <button
        type="button"
        className="btn btn-link p-0"
        onClick={() => handleOpenImageModal(thumbnailUrl)}
        style={{ lineHeight: 0 }}
      >
        <img
          src={thumbnailUrl}
          alt="뉴스 타이틀 이미지"
          style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }}
        />
      </button>
    );
  }, [handleOpenImageModal]);

  // 그리드 컬럼 정의
  const columnDefs = useMemo<ColDef<NewsListRow>[]>(() => [
    { headerName: '언론사', field: 'pressNm', width: 140 },
    { headerName: '카테고리', field: 'categoryNm', width: 140 },
    {
      headerName: '뉴스 타이틀',
      field: 'articleTitle',
      flex: 1,
      cellClass: 'text-start',
      cellStyle: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
      },
      cellRenderer: renderTitleCell,
    },
    {
      headerName: '타이틀 이미지',
      field: 'thumbnailUrl',
      width: 140,
      cellRenderer: renderThumbnailCell,
    },
    {
      headerName: '랭크 점수',
      field: 'rankScore',
      width: 120,
    },
    {
      headerName: '수집 일시',
      field: 'collectedDt',
      width: 180,
      valueFormatter: (params) => dateFormatter({ value: params.value } as any),
    },
  ], [renderThumbnailCell, renderTitleCell]);

  // 기본 컬럼 속성 정의
  const defaultColDef = useMemo<ColDef>(() => ({
    resizable: true,
    sortable: false,
    cellClass: 'text-center',
    cellStyle: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
  }), []);

  // 서버 사이드 데이터 소스 생성
  const createDataSource = useCallback((): IDatasource => ({
    getRows: async (params: IGetRowsParams) => {
      // 페이지 정보 계산
      const pageSize = 20;
      const startRow = params.startRow ?? 0;
      const page = Math.floor(startRow / pageSize) + 1;

      setLoading(true);
      try {
        // 뉴스 목록 조회 요청
        const response = await api.get('/api/admin/news/list', {
          params: {
            ...searchParams,
            page,
            pageSize,
          },
        });

        // 결과 반영
        const data = (response.data || {}) as NewsListResponse;
        params.successCallback(data.list || [], data.totalCount || 0);
      } catch {
        // 오류 처리
        console.error('뉴스 목록을 불러오지 못했습니다.');
        params.failCallback();
      } finally {
        setLoading(false);
      }
    },
  }), [searchParams]);

  // 그리드 데이터 소스 적용
  const applyDatasource = useCallback((apiRef: GridApi<NewsListRow>, datasource: IDatasource) => {
    // 버전별 API 처리
    if (typeof (apiRef as any).setGridOption === 'function') {
      (apiRef as any).setGridOption('datasource', datasource);
      return;
    }
    if (typeof (apiRef as any).setDatasource === 'function') {
      (apiRef as any).setDatasource(datasource);
    }
  }, []);

  // 그리드 초기화 처리
  const handleGridReady = useCallback((event: GridReadyEvent<NewsListRow>) => {
    // 그리드 API 저장
    gridApiRef.current = event.api;
    applyDatasource(event.api, createDataSource());
  }, [applyDatasource, createDataSource]);

  // 언론사 목록 초기 조회
  useEffect(() => {
    fetchPressOptions();
  }, [fetchPressOptions]);

  // 조회 조건 변경 시 데이터 소스 갱신
  useEffect(() => {
    if (!gridApiRef.current) {
      return;
    }
    applyDatasource(gridApiRef.current, createDataSource());
  }, [applyDatasource, createDataSource]);

  return (
    <>
      <div className="page-header">
        <h3 className="page-title">뉴스 목록</h3>
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><a href="#">뉴스</a></li>
            <li className="breadcrumb-item active" aria-current="page">뉴스 목록</li>
          </ol>
        </nav>
      </div>

      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card">
            <div className="card-body">
              <form ref={formRef} onSubmit={handleSearch} onReset={handleReset} className="forms-sample">
                <div className="row">
                  <div className="col-md-3">
                    <div className="form-group">
                      <label>언론사</label>
                      <select
                        name="pressNo"
                        className="form-select"
                        value={selectedPressNo}
                        onChange={handlePressChange}
                      >
                        <option value="">선택</option>
                        {pressOptions.map((press) => (
                          <option key={press.pressNo} value={press.pressNo}>
                            {press.pressNm}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="form-group">
                      <label>카테고리</label>
                      <select
                        name="categoryCd"
                        className="form-select"
                        value={selectedCategoryCd}
                        onChange={handleCategoryChange}
                        disabled={!selectedPressNo}
                      >
                        <option value="">선택</option>
                        {categoryOptions.map((category) => (
                          <option key={category.categoryCd} value={category.categoryCd}>
                            {category.categoryNm}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="form-group">
                      <label>수집 일시 시작</label>
                      <input
                        type="date"
                        name="collectedFrom"
                        className="form-control"
                      />
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="form-group">
                      <label>수집 일시 종료</label>
                      <input
                        type="date"
                        name="collectedTo"
                        className="form-control"
                      />
                    </div>
                  </div>
                </div>
                <div className="d-flex justify-content-center gap-2">
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? '조회중..' : '조회'}
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

      <div className="row">
        <div className="col-lg-12 grid-margin stretch-card">
          <div className="card">
            <div className="card-body">
              <h4 className="card-title">뉴스 목록</h4>
              <p className="card-description">조회 결과가 표시됩니다.</p>
              <div className="ag-theme-alpine-dark header-center" style={{ width: '100%' }}>
                <AgGridReact<NewsListRow>
                  columnDefs={columnDefs}
                  defaultColDef={defaultColDef}
                  domLayout="autoHeight"
                  overlayNoRowsTemplate="조회 결과가 없습니다."
                  rowModelType="infinite"
                  cacheBlockSize={20}
                  pagination
                  paginationPageSize={20}
                  rowHeight={70}
                  getRowId={(params) => String(params.data?.articleNo ?? '')}
                  onGridReady={handleGridReady}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <NewsImagePreviewModal
        isOpen={isImageModalOpen}
        imageUrl={selectedImageUrl}
        onClose={handleCloseImageModal}
      />
    </>
  );
};

export default NewsListPage;