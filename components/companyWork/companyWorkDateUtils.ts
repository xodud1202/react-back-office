// 회사 업무 날짜 문자열을 date 입력값 형식으로 정규화합니다.
export const normalizeCompanyWorkDateInputValue = (value?: string | null): string => {
  // 값이 없으면 빈 문자열을 반환합니다.
  if (typeof value !== 'string') {
    return '';
  }

  const normalizedValue = value.trim();
  if (!normalizedValue) {
    return '';
  }

  // 서버 일시 문자열에서도 날짜 부분만 잘라 date 입력에 맞춥니다.
  return normalizedValue.slice(0, 10);
};

// 회사 업무 저장용 날짜 문자열을 date 기준으로 정규화합니다.
export const normalizeCompanyWorkEditableDateValue = (value?: string | null): string => {
  // 저장하지 않을 빈 값은 빈 문자열로 통일합니다.
  if (typeof value !== 'string') {
    return '';
  }

  // 상세/목록 어디서 넘어오든 날짜 부분만 저장값으로 사용합니다.
  return normalizeCompanyWorkDateInputValue(value);
};
