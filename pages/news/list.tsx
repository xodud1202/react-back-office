import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef, GridReadyEvent, ICellRendererParams } from 'ag-grid-community';
import { dateFormatter } from '@/utils/common';
import NewsImagePreviewModal from '@/components/common/NewsImagePreviewModal';
import { fetchNewsSnapshot, fetchTopArticleList } from '@/services/newsFileApi';

// 언론사 선택 옵션 데이터 타입입니다.
interface NewsPressOption {
  pressNo: string;
  pressNm: string;
}

// 카테고리 선택 옵션 데이터 타입입니다.
interface NewsCategoryOption {
  categoryCd: string;
  categoryNm: string;
}

// 뉴스 목록 행 데이터 타입입니다.
interface NewsListRow {
  articleId: string;
  pressNo: string;
  pressNm: string;
  categoryCd: string;
  categoryNm: string;
  articleTitle: string;
  articleUrl: string;
  thumbnailUrl?: string | null;
  rankScore: number;
  publishedDt: string;
}

/**
 * 언론사/카테고리/기사 목록으로 그리드 행 데이터를 생성합니다.
 * @param params 변환 입력 데이터
 * @returns 그리드 행 목록
 */
function mapArticleListToRows(params: {
  pressNo: string;
  pressNm: string;
  categoryCd: string;
  categoryNm: string;
  articleList: Array<{
    id: string;
    title: string;
    url: string;
    thumbnailUrl?: string;
    rankScore?: number;
    publishedDt?: string;
  }>;
}): NewsListRow[] {
  // 기사 목록을 화면 행 구조로 변환합니다.
  return (params.articleList || []).map((article, index) => ({
    articleId: article?.id || `${params.pressNo}-${params.categoryCd}-${index}`,
    pressNo: params.pressNo,
    pressNm: params.pressNm,
    categoryCd: params.categoryCd,
    categoryNm: params.categoryNm,
    articleTitle: article?.title || '',
    articleUrl: article?.url || '',
    thumbnailUrl: article?.thumbnailUrl || null,
    rankScore: Number.isFinite(article?.rankScore) ? Number(article.rankScore) : index + 1,
    publishedDt: article?.publishedDt || '',
  }));
}

// 뉴스 목록 화면 컴포넌트입니다.
const NewsListPage = () => {
  const [pressOptions, setPressOptions] = useState<NewsPressOption[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<NewsCategoryOption[]>([]);
  const [selectedPressNo, setSelectedPressNo] = useState<string>('');
  const [selectedCategoryCd, setSelectedCategoryCd] = useState<string>('');
  const [allRowData, setAllRowData] = useState<NewsListRow[]>([]);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const requestSequenceRef = useRef(0);

  /**
   * 스냅샷 응답을 화면 상태로 반영합니다.
   * @param snapshot 스냅샷 응답
   */
  const applySnapshotState = useCallback((snapshot: Awaited<ReturnType<typeof fetchNewsSnapshot>>) => {
    // 언론사 선택 목록을 상태로 반영합니다.
    const nextPressOptions = (snapshot.pressList || []).map((press) => ({
      pressNo: String(press.id ?? ''),
      pressNm: String(press.name ?? ''),
    }));
    setPressOptions(nextPressOptions);

    // 카테고리 선택 목록을 상태로 반영합니다.
    const nextCategoryOptions = (snapshot.categoryList || []).map((category) => ({
      categoryCd: String(category.id ?? ''),
      categoryNm: String(category.name ?? ''),
    }));
    setCategoryOptions(nextCategoryOptions);

    // 선택 언론사/카테고리를 상태로 반영합니다.
    const resolvedPressNo = String(snapshot.selectedPressId ?? '');
    const resolvedCategoryCd = String(snapshot.selectedCategoryId ?? '');
    setSelectedPressNo(resolvedPressNo);
    setSelectedCategoryCd(resolvedCategoryCd);

    // 선택된 언론사/카테고리명으로 기사 목록을 그리드 행으로 변환합니다.
    const selectedPress = nextPressOptions.find((press) => press.pressNo === resolvedPressNo);
    const selectedCategory = nextCategoryOptions.find((category) => category.categoryCd === resolvedCategoryCd);
    const nextRowData = mapArticleListToRows({
      pressNo: resolvedPressNo,
      pressNm: selectedPress?.pressNm || '',
      categoryCd: resolvedCategoryCd,
      categoryNm: selectedCategory?.categoryNm || '',
      articleList: (snapshot.articleList || []).map((article) => ({
        id: String(article.id ?? ''),
        title: String(article.title ?? ''),
        url: String(article.url ?? ''),
        thumbnailUrl: article.thumbnailUrl,
        rankScore: article.rankScore,
        publishedDt: article.publishedDt || article.collectedDt,
      })),
    });
    setAllRowData(nextRowData);
  }, []);

  /**
   * 초기 진입/언론사 변경 스냅샷을 조회합니다.
   * @param params 스냅샷 조회 파라미터
   */
  const loadNewsSnapshot = useCallback(async (params: { pressId?: string; categoryId?: string } = {}) => {
    // 최신 요청만 반영하기 위해 요청 시퀀스를 갱신합니다.
    requestSequenceRef.current += 1;
    const requestSequence = requestSequenceRef.current;

    try {
      // 메타/샤드 기반 스냅샷을 조회합니다.
      const snapshot = await fetchNewsSnapshot(params);

      // 이전 요청 응답이면 반영하지 않습니다.
      if (requestSequence !== requestSequenceRef.current) {
        return;
      }
      applySnapshotState(snapshot);
    } catch (error) {
      // 조회 실패 시 경고를 표시합니다.
      console.error('뉴스 스냅샷을 불러오지 못했습니다.', error);
      alert('뉴스 스냅샷을 불러오지 못했습니다.');
    } finally {
      // 최신 요청 완료 시 응답 반영 여부만 유지합니다.
      if (requestSequence !== requestSequenceRef.current) {
        return;
      }
    }
  }, [applySnapshotState]);

  /**
   * 카테고리 변경 시 기사 목록을 조회합니다.
   * @param pressNo 언론사 번호
   * @param categoryCd 카테고리 코드
   */
  const loadTopArticlesByCategory = useCallback(async (pressNo: string, categoryCd: string) => {
    // 조회 조건이 없으면 목록을 비웁니다.
    if (!pressNo || !categoryCd) {
      setAllRowData([]);
      return;
    }

    // 최신 요청만 반영하기 위해 요청 시퀀스를 갱신합니다.
    requestSequenceRef.current += 1;
    const requestSequence = requestSequenceRef.current;

    try {
      // 언론사 shard 기반 상위 기사 목록을 조회합니다.
      const articleList = await fetchTopArticleList(pressNo, categoryCd);

      // 이전 요청 응답이면 반영하지 않습니다.
      if (requestSequence !== requestSequenceRef.current) {
        return;
      }

      // 선택값에 맞춰 기사 목록을 행 데이터로 변환합니다.
      const selectedPress = pressOptions.find((press) => press.pressNo === pressNo);
      const selectedCategory = categoryOptions.find((category) => category.categoryCd === categoryCd);
      const nextRows = mapArticleListToRows({
        pressNo,
        pressNm: selectedPress?.pressNm || '',
        categoryCd,
        categoryNm: selectedCategory?.categoryNm || '',
        articleList: articleList.map((article) => ({
          id: String(article.id ?? ''),
          title: String(article.title ?? ''),
          url: String(article.url ?? ''),
          thumbnailUrl: article.thumbnailUrl,
          rankScore: article.rankScore,
          publishedDt: article.publishedDt || article.collectedDt,
        })),
      });
      setAllRowData(nextRows);
    } catch (error) {
      // 조회 실패 시 경고를 표시합니다.
      console.error('기사 목록을 불러오지 못했습니다.', error);
      alert('기사 목록을 불러오지 못했습니다.');
    } finally {
      // 최신 요청 완료 시 응답 반영 여부만 유지합니다.
      if (requestSequence !== requestSequenceRef.current) {
        return;
      }
    }
  }, [categoryOptions, pressOptions]);

  /**
   * 언론사 선택 변경을 처리합니다.
   * @param event select 변경 이벤트
   */
  const handlePressChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    // 선택 언론사를 즉시 반영하고 카테고리/기사 목록을 초기화합니다.
    const nextPressNo = event.target.value;
    setSelectedPressNo(nextPressNo);
    setSelectedCategoryCd('');
    setCategoryOptions([]);
    setAllRowData([]);

    // 언론사 변경 시 스냅샷을 다시 조회합니다.
    if (nextPressNo) {
      loadNewsSnapshot({ pressId: nextPressNo });
      return;
    }
    loadNewsSnapshot();
  }, [loadNewsSnapshot]);

  /**
   * 카테고리 선택 변경을 처리합니다.
   * @param event select 변경 이벤트
   */
  const handleCategoryChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    // 선택 카테고리를 반영하고 기사 목록을 조회합니다.
    const nextCategoryCd = event.target.value;
    setSelectedCategoryCd(nextCategoryCd);
    loadTopArticlesByCategory(selectedPressNo, nextCategoryCd);
  }, [loadTopArticlesByCategory, selectedPressNo]);

  /**
   * 이미지 미리보기 모달을 엽니다.
   * @param imageUrl 이미지 URL
   */
  const handleOpenImageModal = useCallback((imageUrl: string) => {
    // 선택 이미지를 반영하고 모달을 표시합니다.
    setSelectedImageUrl(imageUrl);
    setIsImageModalOpen(true);
  }, []);

  /**
   * 이미지 미리보기 모달을 닫습니다.
   */
  const handleCloseImageModal = useCallback(() => {
    // 모달과 선택 이미지를 초기화합니다.
    setIsImageModalOpen(false);
    setSelectedImageUrl(null);
  }, []);

  /**
   * 뉴스 타이틀 셀 렌더러를 반환합니다.
   * @param params 그리드 셀 파라미터
   * @returns 셀 렌더링 결과
   */
  const renderTitleCell = useCallback((params: ICellRendererParams<NewsListRow>) => {
    // 제목과 링크를 추출합니다.
    const title = params.data?.articleTitle || '';
    const url = params.data?.articleUrl || '';
    // 뉴스 타이틀 공통 텍스트 스타일을 정의합니다.
    const titleTextStyle: React.CSSProperties = {
      fontSize: '20px',
      color: 'white',
      textDecoration: 'none',
      fontWeight: 'bold',
    };

    // 링크가 없으면 텍스트만 표시합니다.
    if (!url) {
      return <span style={titleTextStyle}>{title}</span>;
    }

    // 링크가 있으면 새 창 이동 링크를 표시합니다.
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" style={titleTextStyle}>
        {title}
      </a>
    );
  }, []);

  /**
   * 타이틀 이미지 셀 렌더러를 반환합니다.
   * @param params 그리드 셀 파라미터
   * @returns 셀 렌더링 결과
   */
  const renderThumbnailCell = useCallback((params: ICellRendererParams<NewsListRow>) => {
    // 이미지 URL이 없으면 렌더링하지 않습니다.
    const thumbnailUrl = params.data?.thumbnailUrl;
    if (!thumbnailUrl) {
      return null;
    }

    // 이미지 클릭 시 모달을 열어 원본을 확인합니다.
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

  /**
   * 그리드 컬럼 정의를 생성합니다.
   */
  const columnDefs = useMemo<ColDef<NewsListRow>[]>(() => [
    {
      headerName: '뉴스 보도 일시',
      field: 'publishedDt',
      width: 180,
      suppressSizeToFit: true,
      valueFormatter: (params) => dateFormatter({ value: params.value } as any),
    },
    {
      headerName: '타이틀 이미지',
      field: 'thumbnailUrl',
      width: 120,
      suppressSizeToFit: true,
      cellRenderer: renderThumbnailCell,
    },
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
  ], [renderThumbnailCell, renderTitleCell]);

  /**
   * 기본 컬럼 속성을 생성합니다.
   */
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

  /**
   * 그리드 초기화 시 처리합니다.
   * @param event 그리드 준비 이벤트
   */
  const handleGridReady = useCallback((event: GridReadyEvent<NewsListRow>) => {
    // 데이터 로딩 후 컬럼 너비를 자동 맞춤합니다.
    event.api.sizeColumnsToFit();
  }, []);

  /**
   * 페이지 초기 진입 시 기본 스냅샷을 조회합니다.
   */
  useEffect(() => {
    // 최초 진입 시 뉴스 스냅샷을 불러옵니다.
    loadNewsSnapshot();
  }, [loadNewsSnapshot]);

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
              <form className="forms-sample">
                <div className="row">
                  <div className="col-md-2">
                    <div className="form-group">
                      <label>언론사</label>
                      <select
                        name="pressNo"
                        className="form-select"
                        value={selectedPressNo}
                        onChange={handlePressChange}
                      >
                        {pressOptions.map((press) => (
                          <option key={press.pressNo} value={press.pressNo}>
                            {press.pressNm}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="col-md-2">
                    <div className="form-group">
                      <label>카테고리</label>
                      <select
                        name="categoryCd"
                        className="form-select"
                        value={selectedCategoryCd}
                        onChange={handleCategoryChange}
                        disabled={!selectedPressNo}
                      >
                        {categoryOptions.map((category) => (
                          <option key={category.categoryCd} value={category.categoryCd}>
                            {category.categoryNm}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
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
              <div className="ag-theme-alpine-dark header-center" style={{ width: '100%' }}>
                <AgGridReact<NewsListRow>
                  columnDefs={columnDefs}
                  defaultColDef={defaultColDef}
                  rowData={allRowData}
                  domLayout="autoHeight"
                  overlayNoRowsTemplate="조회 결과가 없습니다."
                  pagination
                  paginationPageSize={20}
                  rowHeight={70}
                  getRowId={(params) => String(params.data?.articleId ?? '')}
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
