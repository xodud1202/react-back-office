// 숫자 입력값에서 숫자만 남깁니다.
export const normalizeNumberInput = (value: unknown) => {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value).replace(/[^0-9]/g, '');
};

// 숫자 값을 천 단위 콤마로 표시합니다.
export const formatNumber = (value: number | string | null | undefined) => {
  if (value === null || value === undefined) {
    return '';
  }
  const digits = String(value).replace(/[^0-9]/g, '');
  if (digits === '') {
    return '';
  }
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// 숫자 문자열을 숫자로 변환합니다.
export const parseNumber = (value: number | string | null | undefined) => {
  if (value === null || value === undefined) {
    return null;
  }
  const digits = String(value).replace(/[^0-9]/g, '');
  return digits === '' ? null : Number(digits);
};
