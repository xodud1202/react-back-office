// 뉴스 메타 파일 메모리 캐시를 보관합니다.
let newsMetaFileCache: NewsMetaFile | null = null;
// 뉴스 메타 생성시각 캐시 버전을 보관합니다.
let newsMetaGeneratedAtCache = '';
// 언론사별 기사 shard 메모리 캐시를 보관합니다.
const newsArticleShardCacheByPressId = new Map<string, NewsArticleShardFile>();

// 뉴스 메타 파일 응답 구조입니다.
export interface NewsMetaFile {
  meta: {
    generatedAt: string;
    schemaVersion: string;
    source: string;
    targetCount: number;
    successTargetCount: number;
    failedTargetCount: number;
  };
  pressList: Array<{ id: string; name: string; sortSeq?: number; useYn?: string }>;
  categoryListByPressId: Record<string, Array<{ id: string; name: string; sortSeq?: number; useYn?: string; sourceNm?: string; rssUrl?: string }>>;
  defaultSelection: {
    defaultPressId: string;
    defaultCategoryIdByPressId: Record<string, string>;
  };
  articleFileByPressId: Record<string, string>;
}

// 언론사별 기사 shard 응답 구조입니다.
export interface NewsArticleShardFile {
  meta: {
    generatedAt: string;
    schemaVersion: string;
    pressId: string;
  };
  articleListByCategoryId: Record<string, Array<{
    id: string;
    title: string;
    url: string;
    publishedDt?: string;
    summary?: string;
    thumbnailUrl?: string;
    authorNm?: string;
    rankScore?: number;
    useYn?: string;
    collectedDt?: string;
  }>>;
  categoryOrder: string[];
}

// 화면용 스냅샷 응답 구조입니다.
export interface NewsSnapshot {
  pressList: Array<{ id: string; name: string; sortSeq?: number; useYn?: string }>;
  categoryList: Array<{ id: string; name: string; sortSeq?: number; useYn?: string; sourceNm?: string; rssUrl?: string }>;
  articleList: Array<{
    id: string;
    title: string;
    url: string;
    publishedDt?: string;
    summary?: string;
    thumbnailUrl?: string;
    authorNm?: string;
    rankScore?: number;
    useYn?: string;
    collectedDt?: string;
  }>;
  selectedPressId: string;
  selectedCategoryId: string;
  fallbackAppliedYn: 'Y' | 'N';
}

/**
 * 문자열 값을 trim 처리하고 빈 값은 빈 문자열로 정규화합니다.
 * @param value 원본 값
 * @returns 정규화된 문자열
 */
function normalizeString(value: unknown): string {
  // 문자열이 아니면 빈 문자열을 반환합니다.
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim();
}

/**
 * HTML 엔티티 문자열을 일반 문자열로 변환합니다.
 * @param value 변환 대상 문자열
 * @returns 디코딩된 문자열
 */
function decodeHtmlEntities(value: unknown): string {
  // 문자열이 아니면 빈 문자열을 반환합니다.
  if (typeof value !== 'string') {
    return '';
  }

  // SSR 환경에서는 정규식 기반으로 주요 엔티티만 디코딩합니다.
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return value
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&apos;/g, '\'')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');
  }

  // 브라우저 환경에서는 DOM 파서를 활용해 안전하게 디코딩합니다.
  const parser = new DOMParser();
  const documentNode = parser.parseFromString(value, 'text/html');
  return documentNode.documentElement.textContent || '';
}

/**
 * 기사 목록의 제목 HTML 엔티티를 디코딩합니다.
 * @param articleList 기사 목록
 * @returns 제목 디코딩이 반영된 기사 목록
 */
function decodeArticleTitleList(articleList: NewsSnapshot['articleList']): NewsSnapshot['articleList'] {
  // 배열이 아니면 빈 배열을 반환합니다.
  if (!Array.isArray(articleList)) {
    return [];
  }

  // 기사 제목에 HTML 엔티티 디코딩을 적용합니다.
  return articleList.map((article) => ({
    ...article,
    title: decodeHtmlEntities(article?.title),
  }));
}

/**
 * 언론사별 shard 캐시를 초기화합니다.
 */
function resetNewsArticleShardCache(): void {
  // 메타 버전 변경 시 shard 캐시를 초기화합니다.
  newsArticleShardCacheByPressId.clear();
}

/**
 * 메타 파일 응답을 기본 구조로 정규화합니다.
 * @param metaFile 원본 메타 파일 응답
 * @returns 정규화된 메타 파일
 */
function normalizeNewsMetaFile(metaFile: unknown): NewsMetaFile {
  // 객체 형식이 아니면 기본 구조를 반환합니다.
  if (!metaFile || typeof metaFile !== 'object') {
    return {
      meta: {
        generatedAt: '',
        schemaVersion: '',
        source: '',
        targetCount: 0,
        successTargetCount: 0,
        failedTargetCount: 0,
      },
      pressList: [],
      categoryListByPressId: {},
      defaultSelection: {
        defaultPressId: '',
        defaultCategoryIdByPressId: {},
      },
      articleFileByPressId: {},
    };
  }

  // 메타/목록/기본선택/파일맵을 안전한 기본값으로 정규화합니다.
  const resolvedMeta = (metaFile as any).meta && typeof (metaFile as any).meta === 'object' ? (metaFile as any).meta : {};
  const resolvedPressList = Array.isArray((metaFile as any).pressList) ? (metaFile as any).pressList : [];
  const resolvedCategoryListByPressId =
    (metaFile as any).categoryListByPressId && typeof (metaFile as any).categoryListByPressId === 'object'
      ? (metaFile as any).categoryListByPressId
      : {};
  const resolvedDefaultSelection =
    (metaFile as any).defaultSelection && typeof (metaFile as any).defaultSelection === 'object'
      ? (metaFile as any).defaultSelection
      : {};
  const resolvedArticleFileByPressId =
    (metaFile as any).articleFileByPressId && typeof (metaFile as any).articleFileByPressId === 'object'
      ? (metaFile as any).articleFileByPressId
      : {};

  return {
    meta: {
      generatedAt: normalizeString(resolvedMeta.generatedAt),
      schemaVersion: normalizeString(resolvedMeta.schemaVersion),
      source: normalizeString(resolvedMeta.source),
      targetCount: Number.isFinite(resolvedMeta.targetCount) ? resolvedMeta.targetCount : 0,
      successTargetCount: Number.isFinite(resolvedMeta.successTargetCount) ? resolvedMeta.successTargetCount : 0,
      failedTargetCount: Number.isFinite(resolvedMeta.failedTargetCount) ? resolvedMeta.failedTargetCount : 0,
    },
    pressList: resolvedPressList,
    categoryListByPressId: resolvedCategoryListByPressId,
    defaultSelection: {
      defaultPressId: normalizeString(resolvedDefaultSelection.defaultPressId),
      defaultCategoryIdByPressId:
        resolvedDefaultSelection.defaultCategoryIdByPressId && typeof resolvedDefaultSelection.defaultCategoryIdByPressId === 'object'
          ? resolvedDefaultSelection.defaultCategoryIdByPressId
          : {},
    },
    articleFileByPressId: resolvedArticleFileByPressId,
  };
}

/**
 * 언론사별 기사 shard 응답을 정규화합니다.
 * @param shardFile 원본 shard 응답
 * @returns 정규화된 shard 응답
 */
function normalizeNewsArticleShardFile(shardFile: unknown): NewsArticleShardFile {
  // 객체 형식이 아니면 기본 구조를 반환합니다.
  if (!shardFile || typeof shardFile !== 'object') {
    return {
      meta: {
        generatedAt: '',
        schemaVersion: '',
        pressId: '',
      },
      articleListByCategoryId: {},
      categoryOrder: [],
    };
  }

  // shard 메타/기사맵/카테고리순서를 정규화합니다.
  const resolvedMeta = (shardFile as any).meta && typeof (shardFile as any).meta === 'object' ? (shardFile as any).meta : {};
  const resolvedArticleListByCategoryId =
    (shardFile as any).articleListByCategoryId && typeof (shardFile as any).articleListByCategoryId === 'object'
      ? (shardFile as any).articleListByCategoryId
      : {};
  const resolvedCategoryOrder = Array.isArray((shardFile as any).categoryOrder) ? (shardFile as any).categoryOrder : [];

  // 카테고리별 기사 제목 디코딩을 적용합니다.
  const normalizedArticleListByCategoryId = Object.entries(resolvedArticleListByCategoryId).reduce(
    (accumulator: NewsArticleShardFile['articleListByCategoryId'], [categoryId, articleList]) => {
      accumulator[String(categoryId)] = decodeArticleTitleList(Array.isArray(articleList) ? (articleList as any) : []);
      return accumulator;
    },
    {}
  );

  return {
    meta: {
      generatedAt: normalizeString(resolvedMeta.generatedAt),
      schemaVersion: normalizeString(resolvedMeta.schemaVersion),
      pressId: normalizeString(resolvedMeta.pressId),
    },
    articleListByCategoryId: normalizedArticleListByCategoryId,
    categoryOrder: resolvedCategoryOrder.map((categoryId: unknown) => String(categoryId)),
  };
}

/**
 * 화면용 뉴스 스냅샷 응답을 정규화합니다.
 * @param snapshot 원본 스냅샷
 * @returns 정규화된 스냅샷
 */
function normalizeNewsSnapshot(snapshot: unknown): NewsSnapshot {
  // 객체 형식이 아니면 기본 스냅샷을 반환합니다.
  if (!snapshot || typeof snapshot !== 'object') {
    return {
      pressList: [],
      categoryList: [],
      articleList: [],
      selectedPressId: '',
      selectedCategoryId: '',
      fallbackAppliedYn: 'N',
    };
  }

  // 배열/문자열 필드를 안전한 기본값으로 정규화합니다.
  const resolvedPressList = Array.isArray((snapshot as any).pressList) ? (snapshot as any).pressList : [];
  const resolvedCategoryList = Array.isArray((snapshot as any).categoryList) ? (snapshot as any).categoryList : [];
  const resolvedArticleList = Array.isArray((snapshot as any).articleList)
    ? decodeArticleTitleList((snapshot as any).articleList)
    : [];

  return {
    pressList: resolvedPressList,
    categoryList: resolvedCategoryList,
    articleList: resolvedArticleList,
    selectedPressId: typeof (snapshot as any).selectedPressId === 'string' ? (snapshot as any).selectedPressId : '',
    selectedCategoryId: typeof (snapshot as any).selectedCategoryId === 'string' ? (snapshot as any).selectedCategoryId : '',
    fallbackAppliedYn: (snapshot as any).fallbackAppliedYn === 'Y' ? 'Y' : 'N',
  };
}

/**
 * JSON 응답을 조회합니다.
 * @param path 요청 경로
 * @returns JSON 파싱 결과
 */
async function fetchJson(path: string): Promise<any> {
  // 파일 API를 호출합니다.
  const response = await fetch(path);

  // 실패 응답은 예외로 전달합니다.
  if (!response.ok) {
    throw new Error(`요청 실패: ${response.status}`);
  }

  // 응답 본문을 텍스트로 먼저 읽어 JSON 여부를 검증합니다.
  const responseText = await response.text();
  const contentType = normalizeString(response.headers.get('content-type'));
  const isJsonContentType = contentType.toLowerCase().includes('application/json');
  const normalizedText = responseText.trim();
  const looksLikeJson = normalizedText.startsWith('{') || normalizedText.startsWith('[');

  // JSON 응답이 아니면 원인 파악 가능한 메시지로 예외를 반환합니다.
  if (!isJsonContentType && !looksLikeJson) {
    const previewText = normalizedText.slice(0, 120);
    throw new Error(`JSON 응답 아님 status=${response.status}, contentType=${contentType}, bodyPreview=${previewText}`);
  }

  // JSON 파싱 결과를 반환합니다.
  return JSON.parse(responseText);
}

/**
 * 뉴스 메타 JSON 파일을 조회합니다.
 * @returns 정규화된 메타 파일
 */
export async function fetchNewsMetaFile(): Promise<NewsMetaFile> {
  try {
    // 메타 파일을 조회합니다.
    const data = await fetchJson('/api/last/news/meta.json');
    const normalizedMetaFile = normalizeNewsMetaFile(data);

    // 메타 생성시각 변경 시 shard 캐시를 무효화합니다.
    if (
      newsMetaFileCache &&
      newsMetaGeneratedAtCache &&
      normalizedMetaFile.meta.generatedAt &&
      newsMetaGeneratedAtCache !== normalizedMetaFile.meta.generatedAt
    ) {
      resetNewsArticleShardCache();
    }

    // 메타 캐시를 갱신합니다.
    newsMetaFileCache = normalizedMetaFile;
    newsMetaGeneratedAtCache = normalizedMetaFile.meta.generatedAt;
    return normalizedMetaFile;
  } catch (error) {
    // 실패 시 캐시가 있으면 캐시를, 없으면 기본 구조를 반환합니다.
    console.error('뉴스 메타 파일 조회 실패:', error);
    if (newsMetaFileCache) {
      return newsMetaFileCache;
    }
    return normalizeNewsMetaFile(null);
  }
}

/**
 * 언론사별 shard 파일 경로를 생성합니다.
 * @param pressId 언론사 ID
 * @param articleFileByPressId 메타의 언론사별 파일 경로 맵
 * @returns shard 파일 경로
 */
function resolveNewsArticleShardFilePath(pressId: string, articleFileByPressId?: Record<string, string>): string {
  // 메타의 경로 맵이 있으면 우선 사용합니다.
  const mappedPath = normalizeString(articleFileByPressId?.[pressId]);
  if (mappedPath) {
    return mappedPath.startsWith('/') ? mappedPath : `/api/last/news/${mappedPath}`;
  }

  // 메타 경로가 없으면 규칙 기반 경로를 사용합니다.
  return `/api/last/news/articles/press-${encodeURIComponent(pressId)}.json`;
}

/**
 * 언론사별 기사 shard 파일을 조회합니다.
 * @param pressId 언론사 ID
 * @param options 메타 파일 경로 옵션
 * @returns 정규화된 shard 데이터
 */
export async function fetchNewsArticleShardByPressId(
  pressId: string,
  options: { articleFileByPressId?: Record<string, string> } = {}
): Promise<NewsArticleShardFile> {
  const normalizedPressId = normalizeString(pressId);

  // 언론사 ID가 비어 있으면 빈 shard를 반환합니다.
  if (!normalizedPressId) {
    return normalizeNewsArticleShardFile(null);
  }

  // 캐시에 존재하면 캐시를 반환합니다.
  const cachedShard = newsArticleShardCacheByPressId.get(normalizedPressId);
  if (cachedShard) {
    return cachedShard;
  }

  try {
    // 메타 경로 또는 규칙 경로로 shard 파일을 조회합니다.
    const shardFilePath = resolveNewsArticleShardFilePath(normalizedPressId, options.articleFileByPressId);
    const data = await fetchJson(shardFilePath);
    const normalizedShardFile = normalizeNewsArticleShardFile(data);

    // shard 메타 언론사 ID가 불일치하면 오염 응답으로 간주합니다.
    if (normalizedShardFile.meta.pressId && normalizedShardFile.meta.pressId !== normalizedPressId) {
      console.error('뉴스 기사 shard 언론사 불일치:', normalizedPressId, normalizedShardFile.meta.pressId);
      return normalizeNewsArticleShardFile(null);
    }

    // 정상 응답을 캐시에 저장합니다.
    newsArticleShardCacheByPressId.set(normalizedPressId, normalizedShardFile);
    return normalizedShardFile;
  } catch (error) {
    // 실패 시 캐시를 우선 사용하고, 없으면 빈 shard를 반환합니다.
    console.error('뉴스 기사 shard 조회 실패:', normalizedPressId, error);
    return newsArticleShardCacheByPressId.get(normalizedPressId) || normalizeNewsArticleShardFile(null);
  }
}

/**
 * 메타/기사 shard 파일을 화면 스냅샷으로 조합합니다.
 * @param params 스냅샷 생성 파라미터
 * @returns 화면용 뉴스 스냅샷
 */
function buildNewsSnapshotFromFiles(params: {
  metaFile?: NewsMetaFile;
  pressShardFile?: NewsArticleShardFile;
  requestedPressId?: string;
  requestedCategoryId?: string;
}): NewsSnapshot {
  const metaFile = normalizeNewsMetaFile(params?.metaFile);
  const pressShardFile = normalizeNewsArticleShardFile(params?.pressShardFile);
  const requestedPressId = normalizeString(params?.requestedPressId);
  const requestedCategoryId = normalizeString(params?.requestedCategoryId);

  // 메타 언론사 목록이 없으면 기본 스냅샷을 반환합니다.
  const pressList = Array.isArray(metaFile.pressList) ? metaFile.pressList : [];
  if (pressList.length === 0) {
    return normalizeNewsSnapshot(null);
  }

  // 언론사 선택값을 요청값 -> 메타 기본값 -> 첫 항목 순으로 결정합니다.
  const visiblePressIdSet = new Set(pressList.map((press) => String(press?.id ?? '')));
  let fallbackApplied: 'Y' | 'N' = 'N';
  let selectedPressId = requestedPressId;
  if (!selectedPressId || !visiblePressIdSet.has(selectedPressId)) {
    selectedPressId = normalizeString(metaFile.defaultSelection?.defaultPressId);
    if (!selectedPressId || !visiblePressIdSet.has(selectedPressId)) {
      selectedPressId = String(pressList[0]?.id ?? '');
    }
    if (requestedPressId) {
      fallbackApplied = 'Y';
    }
  }

  // 선택 언론사 카테고리 목록을 메타에서 조회합니다.
  const categoryList = Array.isArray(metaFile.categoryListByPressId?.[selectedPressId])
    ? metaFile.categoryListByPressId[selectedPressId]
    : [];

  // 카테고리 선택값을 요청값 -> 메타 기본값 -> 첫 항목 순으로 결정합니다.
  const visibleCategoryIdSet = new Set(categoryList.map((category) => String(category?.id ?? '')));
  let selectedCategoryId = requestedCategoryId;
  if (!selectedCategoryId || !visibleCategoryIdSet.has(selectedCategoryId)) {
    selectedCategoryId = normalizeString(metaFile.defaultSelection?.defaultCategoryIdByPressId?.[selectedPressId]);
    if (!selectedCategoryId || !visibleCategoryIdSet.has(selectedCategoryId)) {
      selectedCategoryId = String(categoryList[0]?.id ?? '');
    }
    if (requestedCategoryId) {
      fallbackApplied = 'Y';
    }
  }

  // 최종 선택 카테고리의 기사 목록을 shard에서 조회합니다.
  const articleList = Array.isArray(pressShardFile.articleListByCategoryId?.[selectedCategoryId])
    ? pressShardFile.articleListByCategoryId[selectedCategoryId]
    : [];

  return normalizeNewsSnapshot({
    pressList,
    categoryList,
    articleList,
    selectedPressId,
    selectedCategoryId,
    fallbackAppliedYn: fallbackApplied,
  });
}

/**
 * 뉴스 초기 진입/언론사 변경용 스냅샷을 조회합니다.
 * @param params 조회 파라미터
 * @returns 화면용 뉴스 스냅샷
 */
export async function fetchNewsSnapshot(params: { pressId?: string; categoryId?: string } = {}): Promise<NewsSnapshot> {
  try {
    // 메타 파일을 먼저 조회합니다.
    const metaFile = await fetchNewsMetaFile();

    // 요청값 기준으로 shard 조회용 언론사 ID를 결정합니다.
    const requestedPressId = normalizeString(params.pressId);
    const metaPressList = Array.isArray(metaFile.pressList) ? metaFile.pressList : [];
    const isRequestedPressValid = metaPressList.some((press) => String(press?.id ?? '') === requestedPressId);
    const fallbackPressId = normalizeString(metaFile.defaultSelection?.defaultPressId) || String(metaPressList[0]?.id ?? '');
    const candidatePressId = isRequestedPressValid ? requestedPressId : fallbackPressId;

    // 선택 언론사 shard를 조회하고 화면 스냅샷으로 변환합니다.
    const pressShardFile = await fetchNewsArticleShardByPressId(candidatePressId, {
      articleFileByPressId: metaFile.articleFileByPressId,
    });
    return buildNewsSnapshotFromFiles({
      metaFile,
      pressShardFile,
      requestedPressId: params.pressId,
      requestedCategoryId: params.categoryId,
    });
  } catch (error) {
    // 조회 실패 시 기본 스냅샷을 반환합니다.
    console.error('뉴스 파일 기반 스냅샷 조회 실패:', error);
    return normalizeNewsSnapshot(null);
  }
}

/**
 * 카테고리 변경 시 상위 기사 목록을 조회합니다.
 * @param pressId 언론사 ID
 * @param categoryId 카테고리 ID
 * @returns 기사 목록
 */
export async function fetchTopArticleList(
  pressId: string,
  categoryId: string
): Promise<NewsSnapshot['articleList']> {
  try {
    // 메타 캐시를 우선 사용하고 없으면 메타를 조회합니다.
    const metaFile = newsMetaFileCache || (await fetchNewsMetaFile());
    const pressShardFile = await fetchNewsArticleShardByPressId(pressId, {
      articleFileByPressId: metaFile.articleFileByPressId,
    });
    const resolvedCategoryId = normalizeString(categoryId);
    const articleList = Array.isArray(pressShardFile.articleListByCategoryId?.[resolvedCategoryId])
      ? pressShardFile.articleListByCategoryId[resolvedCategoryId]
      : [];
    return decodeArticleTitleList(articleList);
  } catch (error) {
    // 조회 실패 시 빈 목록을 반환합니다.
    console.error('기사 shard 기반 목록 조회 실패:', error);
    return [];
  }
}
