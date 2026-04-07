'use client';

import React, { useCallback, useEffect, useState } from 'react';
import type { CommonCode } from '@/components/goods/types';

interface CompanyWorkStatusSelectCellProps {
  // 현재 업무 상태 코드입니다.
  value?: string;
  // 선택 가능한 업무 상태 목록입니다.
  workStatList: CommonCode[];
  // 상태 저장 처리입니다.
  onSave: (nextValue: string) => Promise<void>;
}

interface CompanyWorkDateCellProps {
  // 현재 날짜 문자열입니다.
  value?: string;
  // 날짜 저장 처리입니다.
  onSave: (nextValue: string) => Promise<void>;
}

interface CompanyWorkTextCellProps {
  // 현재 텍스트 문자열입니다.
  value?: string;
  // 입력창 placeholder 문구입니다.
  placeholder?: string;
  // 텍스트 저장 처리입니다.
  onSave: (nextValue: string) => Promise<void>;
}

interface CompanyWorkNumberCellProps {
  // 현재 숫자 값입니다.
  value?: number | null;
  // 입력창 placeholder 문구입니다.
  placeholder?: string;
  // 숫자 저장 처리입니다.
  onSave: (nextValue: number | null) => Promise<void>;
}

// 셀 입력값을 빈 문자열 기준으로 정규화합니다.
const normalizeCellValue = (value?: string | null): string => {
  // null 계열 값은 빈 문자열로 통일합니다.
  if (typeof value !== 'string') {
    return '';
  }
  return value;
};

// 회사 업무 상태 선택 셀을 렌더링합니다.
export const CompanyWorkStatusSelectCell = ({
  value,
  workStatList,
  onSave,
}: CompanyWorkStatusSelectCellProps) => {
  const [selectedValue, setSelectedValue] = useState<string>(() => normalizeCellValue(value));
  const [saving, setSaving] = useState(false);

  // 상위 값이 바뀌면 셀 표시값도 최신 상태로 동기화합니다.
  useEffect(() => {
    setSelectedValue(normalizeCellValue(value));
  }, [value]);

  // 상태 변경 시 즉시 저장을 요청합니다.
  const handleChange = useCallback(async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextValue = normalizeCellValue(event.target.value);
    const previousValue = normalizeCellValue(value);

    // 동일한 상태를 다시 선택한 경우에는 저장하지 않습니다.
    setSelectedValue(nextValue);
    if (nextValue === previousValue) {
      return;
    }

    setSaving(true);
    try {
      // 선택 즉시 저장을 요청합니다.
      await onSave(nextValue);
    } catch (error) {
      // 저장 실패 시 이전 값으로 복구합니다.
      console.error('회사 업무 상태 저장에 실패했습니다.', error);
      setSelectedValue(previousValue);
    } finally {
      setSaving(false);
    }
  }, [onSave, value]);

  return (
    <select
      className="form-select form-select-sm"
      value={selectedValue}
      onChange={(event) => { void handleChange(event); }}
      disabled={saving}
    >
      {workStatList.map((workStatItem) => (
        <option key={workStatItem.cd} value={workStatItem.cd}>
          {workStatItem.cdNm}
        </option>
      ))}
    </select>
  );
};

// 회사 업무 날짜 입력 셀을 렌더링합니다.
export const CompanyWorkDateCell = ({
  value,
  onSave,
}: CompanyWorkDateCellProps) => {
  const [inputValue, setInputValue] = useState<string>(() => normalizeCellValue(value));
  const [saving, setSaving] = useState(false);

  // 상위 값이 바뀌면 셀 표시값도 최신 상태로 동기화합니다.
  useEffect(() => {
    setInputValue(normalizeCellValue(value));
  }, [value]);

  // 날짜 선택값을 로컬 상태에 반영합니다.
  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    // input[type=date]의 yyyy-MM-dd 값을 그대로 유지합니다.
    setInputValue(normalizeCellValue(event.target.value));
  }, []);

  // 포커스 아웃 시 날짜를 즉시 저장합니다.
  const handleBlur = useCallback(async () => {
    const nextValue = normalizeCellValue(inputValue);
    const previousValue = normalizeCellValue(value);

    // 변경 사항이 없으면 저장하지 않습니다.
    if (nextValue === previousValue) {
      return;
    }

    setSaving(true);
    try {
      // focus out 시 즉시 저장을 요청합니다.
      await onSave(nextValue);
    } catch (error) {
      // 저장 실패 시 이전 값으로 복구합니다.
      console.error('회사 업무 날짜 저장에 실패했습니다.', error);
      setInputValue(previousValue);
    } finally {
      setSaving(false);
    }
  }, [inputValue, onSave, value]);

  return (
    <input
      type="date"
      className="form-control form-control-sm"
      value={inputValue}
      onChange={handleChange}
      onBlur={() => { void handleBlur(); }}
      disabled={saving}
    />
  );
};

// 회사 업무 IT 담당자 입력 셀을 렌더링합니다.
export const CompanyWorkTextCell = ({
  value,
  placeholder,
  onSave,
}: CompanyWorkTextCellProps) => {
  const [inputValue, setInputValue] = useState<string>(() => normalizeCellValue(value));
  const [saving, setSaving] = useState(false);

  // 상위 값이 바뀌면 셀 표시값도 최신 상태로 동기화합니다.
  useEffect(() => {
    setInputValue(normalizeCellValue(value));
  }, [value]);

  // 입력값을 로컬 상태에 반영합니다.
  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    // 현재 입력 중인 값을 그대로 유지합니다.
    setInputValue(event.target.value);
  }, []);

  // 엔터 입력 시 blur를 유도해 즉시 저장 흐름을 맞춥니다.
  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    // 엔터 입력 시 현재 입력창 포커스를 해제합니다.
    if (event.key === 'Enter') {
      event.currentTarget.blur();
    }
  }, []);

  // 포커스 아웃 시 입력값을 즉시 저장합니다.
  const handleBlur = useCallback(async () => {
    const nextValue = normalizeCellValue(inputValue).trim();
    const previousValue = normalizeCellValue(value).trim();

    // 변경 사항이 없으면 저장하지 않습니다.
    if (nextValue === previousValue) {
      return;
    }

    setSaving(true);
    try {
      // focus out 시 즉시 저장을 요청합니다.
      await onSave(nextValue);
    } catch (error) {
      // 저장 실패 시 이전 값으로 복구합니다.
      console.error('회사 업무 IT 담당자 저장에 실패했습니다.', error);
      setInputValue(previousValue);
    } finally {
      setSaving(false);
    }
  }, [inputValue, onSave, value]);

  return (
    <input
      type="text"
      className="form-control form-control-sm"
      value={inputValue}
      placeholder={placeholder}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={() => { void handleBlur(); }}
      disabled={saving}
    />
  );
};

// 회사 업무 공수시간 숫자 입력 셀을 렌더링합니다.
export const CompanyWorkNumberCell = ({
  value,
  placeholder,
  onSave,
}: CompanyWorkNumberCellProps) => {
  const [inputValue, setInputValue] = useState<string>(() => (
    typeof value === 'number' ? String(value) : ''
  ));
  const [saving, setSaving] = useState(false);

  // 상위 값이 바뀌면 셀 표시값도 최신 상태로 동기화합니다.
  useEffect(() => {
    setInputValue(typeof value === 'number' ? String(value) : '');
  }, [value]);

  // 숫자만 남기도록 입력값을 정규화합니다.
  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    // 숫자가 아닌 문자는 제거해 공수시간 입력을 숫자로만 제한합니다.
    setInputValue(event.target.value.replace(/[^0-9]/g, ''));
  }, []);

  // 엔터 입력 시 blur를 유도해 즉시 저장 흐름을 맞춥니다.
  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    // 엔터 입력 시 현재 입력창 포커스를 해제합니다.
    if (event.key === 'Enter') {
      event.currentTarget.blur();
    }
  }, []);

  // 포커스 아웃 시 숫자 입력값을 즉시 저장합니다.
  const handleBlur = useCallback(async () => {
    const nextValue = inputValue.trim() === '' ? null : Number(inputValue);
    const previousValue = typeof value === 'number' ? value : null;

    // 변경 사항이 없으면 저장하지 않습니다.
    if (nextValue === previousValue) {
      return;
    }

    setSaving(true);
    try {
      // focus out 시 즉시 저장을 요청합니다.
      await onSave(nextValue);
    } catch (error) {
      // 저장 실패 시 이전 값으로 복구합니다.
      console.error('회사 업무 공수시간 저장에 실패했습니다.', error);
      setInputValue(previousValue == null ? '' : String(previousValue));
    } finally {
      setSaving(false);
    }
  }, [inputValue, onSave, value]);

  return (
    <input
      type="text"
      inputMode="numeric"
      className="form-control form-control-sm"
      value={inputValue}
      placeholder={placeholder}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={() => { void handleBlur(); }}
      disabled={saving}
    />
  );
};
