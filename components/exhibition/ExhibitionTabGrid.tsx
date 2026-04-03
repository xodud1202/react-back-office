import React, { useCallback, useMemo } from 'react';
import type { ColDef, CellValueChangedEvent, ICellRendererParams, RowClickedEvent, RowDragEndEvent } from 'ag-grid-community';
import { AgGridReact } from '@/components/common/agGrid/AgGridReact';
import type { ExhibitionTabItem } from '@/components/exhibition/types';

interface ExhibitionTabGridProps {
  // 탭 데이터입니다.
  rows: ExhibitionTabItem[];
  // 선택된 탭 행 키입니다.
  selectedRowKey: string;
  // 탭 편집 가능 여부입니다.
  isEditable: boolean;
  // 탭 목록 변경 처리 함수입니다.
  onRowsChange: (nextRows: ExhibitionTabItem[]) => void;
  // 탭 선택 처리 함수입니다.
  onSelect: (rowKey: string) => void;
}

// 기획전 탭 정보를 렌더링합니다.
const ExhibitionTabGrid = ({
  rows,
  selectedRowKey,
  isEditable,
  onRowsChange,
  onSelect,
}: ExhibitionTabGridProps) => {
  // 시간 선택 옵션(00시~24시)을 생성합니다.
  const hourOptions = useMemo(() => Array.from({ length: 25 }, (_, index) => String(index).padStart(2, '0')), []);

  // datetime 문자열에서 날짜만 추출합니다.
  const getDatePart = useCallback((value?: string) => {
    // 값이 없으면 빈 문자열을 반환합니다.
    if (!value) {
      return '';
    }
    // ISO/공백 구분 형태를 모두 날짜로 정규화합니다.
    const normalized = value.includes('T') ? value.replace('T', ' ') : value;
    if (normalized.length < 10) {
      return '';
    }
    return normalized.slice(0, 10);
  }, []);

  // datetime 문자열에서 시간(00~24)을 추출합니다.
  const getHourPart = useCallback((value?: string, isEnd = false) => {
    // 값이 없으면 시작 00시, 종료 24시를 기본값으로 사용합니다.
    if (!value) {
      return isEnd ? '24' : '00';
    }
    const normalized = value.includes('T') ? value.replace('T', ' ') : value;
    if (normalized.length < 13) {
      return isEnd ? '24' : '00';
    }
    const hour = normalized.slice(11, 13);
    const minute = normalized.slice(14, 16);
    const second = normalized.slice(17, 19);
    if (hour === '23' && minute === '59' && (second === '59' || second === '')) {
      return '24';
    }
    return /^\d{2}$/.test(hour) ? hour : (isEnd ? '24' : '00');
  }, []);

  // 날짜/시간을 API 저장 형식 문자열로 변환합니다.
  const toApiDateTimeString = useCallback((date?: string, hour?: string, isEnd = false) => {
    // 날짜가 없으면 값을 제거합니다.
    if (!date) {
      return undefined;
    }
    const resolvedHour = hour || (isEnd ? '24' : '00');
    const hourNumber = Number(resolvedHour);
    // 종료 24시는 23:59:59로 저장합니다.
    if (hourNumber === 24) {
      return `${date} 23:59:59`;
    }
    if (Number.isNaN(hourNumber) || hourNumber < 0 || hourNumber > 23) {
      return undefined;
    }
    return `${date} ${resolvedHour}:00:00`;
  }, []);

  // 탭 행의 노출일시 필드를 갱신합니다.
  const handleChangeDateTimeField = useCallback((
    rowKey: string,
    field: 'dispStartDt' | 'dispEndDt',
    date: string,
    hour: string,
    isEnd = false
  ) => {
    // 행 키 기준으로 날짜/시간을 합쳐 대상 필드만 변경합니다.
    onRowsChange(rows.map((row) => (
      row.rowKey === rowKey ? { ...row, [field]: toApiDateTimeString(date, hour, isEnd) } : row
    )));
  }, [onRowsChange, rows, toApiDateTimeString]);

  // 컬럼을 정의합니다.
  const columnDefs = useMemo<ColDef<ExhibitionTabItem>[]>(() => ([
    {
      headerName: '순서',
      field: 'dispOrd',
      width: 90,
    },
    {
      headerName: '드래그',
      rowDrag: true,
      width: 80,
      suppressSizeToFit: true,
    },
    {
      headerName: '탭명',
      field: 'tabNm',
      width: 240,
      editable: isEditable,
      cellClass: 'text-start',
    },
    {
      headerName: '노출시작일시',
      field: 'dispStartDt',
      width: 300,
      editable: false,
      cellClass: 'text-start',
      cellRenderer: (params: ICellRendererParams<ExhibitionTabItem>) => {
        // 편집 모드가 아니면 텍스트만 표시합니다.
        if (!isEditable) {
          return <span>{params.data?.dispStartDt || ''}</span>;
        }
        const rowKey = params.data?.rowKey;
        if (!rowKey) {
          return null;
        }
        const currentDate = getDatePart(params.data?.dispStartDt);
        const currentHour = getHourPart(params.data?.dispStartDt, false);
        // 캘린더(datetime-local) 입력으로 노출일시를 수정합니다.
        return (
          <div className="d-flex align-items-center gap-1">
            <input
              type="date"
              className="form-control form-control-sm"
              value={currentDate}
              onChange={(event) => handleChangeDateTimeField(rowKey, 'dispStartDt', event.target.value, currentHour, false)}
            />
            <select
              className="form-select form-select-sm"
              value={currentHour}
              onChange={(event) => handleChangeDateTimeField(rowKey, 'dispStartDt', currentDate, event.target.value, false)}
            >
              {hourOptions.map((hour) => (
                <option key={`start-hour-${rowKey}-${hour}`} value={hour}>
                  {hour}시
                </option>
              ))}
            </select>
          </div>
        );
      },
    },
    {
      headerName: '노출종료일시',
      field: 'dispEndDt',
      width: 300,
      editable: false,
      cellClass: 'text-start',
      cellRenderer: (params: ICellRendererParams<ExhibitionTabItem>) => {
        // 편집 모드가 아니면 텍스트만 표시합니다.
        if (!isEditable) {
          return <span>{params.data?.dispEndDt || ''}</span>;
        }
        const rowKey = params.data?.rowKey;
        if (!rowKey) {
          return null;
        }
        const currentDate = getDatePart(params.data?.dispEndDt);
        const currentHour = getHourPart(params.data?.dispEndDt, true);
        // 캘린더(datetime-local) 입력으로 노출일시를 수정합니다.
        return (
          <div className="d-flex align-items-center gap-1">
            <input
              type="date"
              className="form-control form-control-sm"
              value={currentDate}
              onChange={(event) => handleChangeDateTimeField(rowKey, 'dispEndDt', event.target.value, currentHour, true)}
            />
            <select
              className="form-select form-select-sm"
              value={currentHour}
              onChange={(event) => handleChangeDateTimeField(rowKey, 'dispEndDt', currentDate, event.target.value, true)}
            >
              {hourOptions.map((hour) => (
                <option key={`end-hour-${rowKey}-${hour}`} value={hour}>
                  {hour}시
                </option>
              ))}
            </select>
          </div>
        );
      },
    },
    {
      headerName: '노출여부',
      field: 'showYn',
      width: 120,
      editable: isEditable,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: isEditable ? {
        values: ['Y', 'N'],
      } : undefined,
    },
  ]), [getDatePart, getHourPart, handleChangeDateTimeField, hourOptions, isEditable]);

  // 공통 그리드 옵션입니다.
  const defaultColDef = useMemo<ColDef>(() => ({
    resizable: true,
    sortable: false,
    editable: false,
    cellClass: 'text-center',
  }), []);

  // AG Grid v32.2+ 단일 선택 옵션을 정의합니다.
  const rowSelection = useMemo(() => ({
    mode: 'singleRow' as const,
    enableClickSelection: true,
  }), []);

  // 행 순서가 변경되면 노출순서를 재계산합니다.
  const handleRowDragEnd = useCallback((event: RowDragEndEvent<ExhibitionTabItem>) => {
    if (!isEditable) {
      return;
    }
    const nextRows: ExhibitionTabItem[] = [];
    const rowCount = event.api.getDisplayedRowCount();
    for (let index = 0; index < rowCount; index += 1) {
      const node = event.api.getDisplayedRowAtIndex(index);
      if (!node?.data?.rowKey) {
        continue;
      }
      nextRows.push({
        ...node.data,
        dispOrd: index + 1,
      });
    }
    onRowsChange(nextRows);
  }, [isEditable, onRowsChange]);

  // 셀 편집값이 변경되면 행을 갱신합니다.
  const handleCellValueChanged = useCallback((event: CellValueChangedEvent<ExhibitionTabItem>) => {
    const nextData = event.data;
    if (!nextData?.rowKey) {
      return;
    }
    onRowsChange(rows.map((row) => (
      row.rowKey === nextData.rowKey ? { ...row, ...nextData } : row
    )));
  }, [onRowsChange, rows]);

  // 선택된 탭을 상단 영역에 반영합니다.
  const handleRowClicked = useCallback((event: RowClickedEvent<ExhibitionTabItem>) => {
    if (!event.data?.rowKey) {
      return;
    }
    onSelect(event.data.rowKey);
  }, [onSelect]);

  // 초기 행 선택을 기본 처리합니다.
  const getRowClass = useCallback((params: { data?: ExhibitionTabItem }) => {
    if (!params.data?.rowKey || !selectedRowKey) {
      return '';
    }
    return params.data.rowKey === selectedRowKey ? 'ag-row-selected' : '';
  }, [selectedRowKey]);

  return (
    <div className="ag-theme-alpine-dark header-center" style={{ width: '100%', height: '220px' }}>
      <AgGridReact<ExhibitionTabItem>
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        rowData={rows}
        rowSelection={rowSelection}
        rowDragManaged
        animateRows
        overlayNoRowsTemplate="탭이 없습니다."
        getRowId={(params) => String(params.data.rowKey || '')}
        onRowDragEnd={handleRowDragEnd}
        onCellValueChanged={isEditable ? handleCellValueChanged : undefined}
        onRowClicked={handleRowClicked}
        getRowClass={getRowClass}
      />
    </div>
  );
};

export default ExhibitionTabGrid;
