import type { NewsCategoryRow, NewsPressRow } from '@/components/news/rss/types';

/**
 * 문자열을 trim 처리하고 빈 값이면 null을 반환합니다.
 * @param value 대상 값입니다.
 * @returns 정리된 값입니다.
 */
export const trimToNull = (value: string | null | undefined): string | null => {
  if (value == null) {
    return null;
  }
  const trimmedValue = value.trim();
  return trimmedValue ? trimmedValue : null;
};

/**
 * 언론사 행 목록의 순서를 정규화합니다.
 * @param rows 원본 행 목록입니다.
 * @returns 순서가 반영된 행 목록입니다.
 */
export const normalizePressRows = (rows: NewsPressRow[]): NewsPressRow[] => {
  return rows.map((row, index) => ({
    ...row,
    sortSeq: index + 1,
  }));
};

/**
 * 카테고리 행 목록의 순서를 정규화합니다.
 * @param rows 원본 행 목록입니다.
 * @returns 순서가 반영된 행 목록입니다.
 */
export const normalizeCategoryRows = (rows: NewsCategoryRow[]): NewsCategoryRow[] => {
  return rows.map((row, index) => ({
    ...row,
    sortSeq: index + 1,
  }));
};

/**
 * 언론사 저장 유효성을 검증합니다.
 * @param rows 언론사 목록입니다.
 * @returns 검증 메시지입니다.
 */
export const validatePressRows = (rows: NewsPressRow[]): string | null => {
  for (const row of rows) {
    const pressNm = trimToNull(row.pressNm);
    if (!pressNm) {
      return '언론사명을 입력해주세요.';
    }
    if (pressNm.length > 100) {
      return '언론사명은 100자 이내로 입력해주세요.';
    }
    if (row.useYn !== 'Y' && row.useYn !== 'N') {
      return '언론사 사용여부를 확인해주세요.';
    }
  }
  return null;
};

/**
 * 카테고리 저장 유효성을 검증합니다.
 * @param rows 카테고리 목록입니다.
 * @returns 검증 메시지입니다.
 */
export const validateCategoryRows = (rows: NewsCategoryRow[]): string | null => {
  for (const row of rows) {
    const categoryCd = trimToNull(row.categoryCd);
    const categoryNm = trimToNull(row.categoryNm);
    const sourceNm = trimToNull(row.sourceNm);
    const rssUrl = trimToNull(row.rssUrl);
    if (!categoryCd) {
      return '카테고리코드를 입력해주세요.';
    }
    if (categoryCd.length > 50) {
      return '카테고리코드는 50자 이내로 입력해주세요.';
    }
    if (!categoryNm) {
      return '카테고리명을 입력해주세요.';
    }
    if (categoryNm.length > 100) {
      return '카테고리명은 100자 이내로 입력해주세요.';
    }
    if (!sourceNm) {
      return '소스명을 입력해주세요.';
    }
    if (sourceNm.length > 150) {
      return '소스명은 150자 이내로 입력해주세요.';
    }
    if (!rssUrl) {
      return 'RSS URL을 입력해주세요.';
    }
    if (rssUrl.length > 150) {
      return 'RSS URL은 150자 이내로 입력해주세요.';
    }
    if (row.useYn !== 'Y' && row.useYn !== 'N') {
      return '카테고리 사용여부를 확인해주세요.';
    }
  }
  return null;
};

/**
 * 언론사 API 응답을 화면 행 타입으로 변환합니다.
 * @param items 원본 응답 목록입니다.
 * @returns 변환된 행 목록입니다.
 */
export const mapPressRowsFromApi = (items: any[]): NewsPressRow[] => {
  return (items || []).map((item: any, index: number) => ({
    rowId: `press-${item.pressNo}`,
    pressNo: item.pressNo ?? null,
    pressNm: item.pressNm ?? '',
    useYn: item.useYn === 'N' ? 'N' : 'Y',
    sortSeq: item.sortSeq ?? index + 1,
  }));
};

/**
 * 카테고리 API 응답을 화면 행 타입으로 변환합니다.
 * @param items 원본 응답 목록입니다.
 * @param defaultPressNo 기본 언론사 번호입니다.
 * @returns 변환된 행 목록입니다.
 */
export const mapCategoryRowsFromApi = (items: any[], defaultPressNo: number): NewsCategoryRow[] => {
  return (items || []).map((item: any, index: number) => ({
    rowId: `category-${item.pressNo}-${item.categoryCd}`,
    pressNo: item.pressNo ?? defaultPressNo,
    categoryCd: item.categoryCd ?? '',
    categoryNm: item.categoryNm ?? '',
    useYn: item.useYn === 'N' ? 'N' : 'Y',
    sortSeq: item.sortSeq ?? index + 1,
    sourceNm: item.sourceNm ?? '',
    rssUrl: item.rssUrl ?? '',
  }));
};
