import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { AgGridReact as BaseAgGridReact, type AgGridReactProps } from 'ag-grid-react';
import type {
  CellClassParams,
  CellMouseDownEvent,
  CellMouseOverEvent,
  ColDef,
  ColGroupDef,
  Column,
  GridApi,
  GridReadyEvent,
  IRowNode,
  ValueFormatterParams,
} from 'ag-grid-community';

interface GridCellPosition {
  // 표시 기준 행 인덱스입니다.
  rowIndex: number;
  // 표시 기준 컬럼 아이디입니다.
  colId: string;
}

interface GridCellRange {
  // 범위 시작 셀입니다.
  start: GridCellPosition;
  // 범위 끝 셀입니다.
  end: GridCellPosition;
}

interface GridCellRangeBounds {
  // 선택 영역의 시작 행 인덱스입니다.
  rowStart: number;
  // 선택 영역의 끝 행 인덱스입니다.
  rowEnd: number;
  // 선택 영역의 시작 컬럼 인덱스입니다.
  colStart: number;
  // 선택 영역의 끝 컬럼 인덱스입니다.
  colEnd: number;
  // 드래그 시작 셀 정보입니다.
  start: GridCellPosition;
  // 드래그 종료 셀 정보입니다.
  end: GridCellPosition;
}

interface ClipboardPayload {
  // 클립보드로 복사할 문자열입니다.
  text: string;
}

type SupportedColDef<TData> = ColDef<TData> | ColGroupDef<TData>;

const INTERACTIVE_TARGET_SELECTOR = [
  'button',
  'a',
  'input',
  'select',
  'textarea',
  'label',
  '[contenteditable="true"]',
  '[role="button"]',
  '.ag-selection-checkbox',
  '.ag-row-drag',
  '.ag-group-expanded',
  '.ag-group-contracted',
].join(', ');

// 컬럼 그룹 정의 여부를 판별합니다.
const isColumnGroupDef = <TData,>(columnDef: SupportedColDef<TData>): columnDef is ColGroupDef<TData> => {
  return Array.isArray((columnDef as ColGroupDef<TData>).children);
};

// dot path 기준으로 행 데이터 값을 조회합니다.
const resolveFieldValue = (data: unknown, field: string): unknown => {
  // field 정의가 없거나 데이터가 비어 있으면 그대로 종료합니다.
  if (!field || data == null) {
    return undefined;
  }

  // 중첩 경로를 순차적으로 따라가며 값을 조회합니다.
  return field.split('.').reduce<unknown>((currentValue, pathToken) => {
    if (currentValue == null || typeof currentValue !== 'object') {
      return undefined;
    }
    return (currentValue as Record<string, unknown>)[pathToken];
  }, data);
};

// cellClass 반환값을 문자열 배열로 정규화합니다.
const normalizeCellClassValue = (cellClassValue: string | string[] | null | undefined): string[] => {
  // 값이 없으면 빈 배열을 반환합니다.
  if (!cellClassValue) {
    return [];
  }

  // 문자열 배열은 그대로 사용하고, 공백 문자열은 토큰 단위로 분리합니다.
  if (Array.isArray(cellClassValue)) {
    return cellClassValue.filter(Boolean);
  }
  return cellClassValue.split(' ').map((className) => className.trim()).filter(Boolean);
};

// 액션성 요소를 클릭한 경우 범위 선택을 건너뛰어야 하는지 판별합니다.
const isInteractiveTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  return Boolean(target.closest(INTERACTIVE_TARGET_SELECTOR));
};

// 브라우저 텍스트 선택 상태가 있는지 확인합니다.
const hasBrowserTextSelection = (): boolean => {
  // 선택된 텍스트가 있으면 브라우저 기본 복사를 우선합니다.
  const selection = window.getSelection();
  return Boolean(selection && selection.toString().trim());
};

// 입력 가능한 DOM 요소인지 확인합니다.
const isTextEntryElement = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  return Boolean(target.closest('input, textarea, select, [contenteditable="true"]'));
};

// 셀 마우스 이벤트에서 범위 계산용 좌표를 추출합니다.
const resolveCellPositionFromEvent = <TData,>(
  event: CellMouseDownEvent<TData> | CellMouseOverEvent<TData>,
): GridCellPosition | null => {
  // 고정 행이나 비정상 행은 범위 선택 대상에서 제외합니다.
  if (event.node.rowPinned != null || event.node.rowIndex == null) {
    return null;
  }
  return {
    rowIndex: event.node.rowIndex,
    colId: event.column.getColId(),
  };
};

// 두 셀 좌표가 동일한지 비교합니다.
const isSameCellPosition = (first: GridCellPosition | null, second: GridCellPosition | null): boolean => {
  if (first == null || second == null) {
    return first === second;
  }
  return first.rowIndex === second.rowIndex && first.colId === second.colId;
};

// 현재 표시 중인 컬럼 순서를 빠르게 찾기 위한 맵을 만듭니다.
const buildDisplayedColumnIndexMap = <TData,>(api: GridApi<TData>): Map<string, number> => {
  // 화면에 보이는 컬럼 순서 기준 인덱스를 저장합니다.
  return new Map(api.getAllDisplayedColumns().map((column, index) => [column.getColId(), index]));
};

// 현재 선택 범위를 행/컬럼 인덱스 경계로 변환합니다.
const buildRangeBounds = (
  range: GridCellRange | null,
  columnIndexMap: Map<string, number>,
): GridCellRangeBounds | null => {
  if (range == null) {
    return null;
  }

  // 화면 기준 컬럼 인덱스가 없는 경우 선택 범위를 무효 처리합니다.
  const startColIndex = columnIndexMap.get(range.start.colId);
  const endColIndex = columnIndexMap.get(range.end.colId);
  if (startColIndex == null || endColIndex == null) {
    return null;
  }

  return {
    rowStart: Math.min(range.start.rowIndex, range.end.rowIndex),
    rowEnd: Math.max(range.start.rowIndex, range.end.rowIndex),
    colStart: Math.min(startColIndex, endColIndex),
    colEnd: Math.max(startColIndex, endColIndex),
    start: range.start,
    end: range.end,
  };
};

// 현재 셀이 선택 범위에 포함되는지 계산합니다.
const buildRangeClassNames = <TData,>(
  params: CellClassParams<TData>,
  columnIndexMap: Map<string, number>,
  rangeBounds: GridCellRangeBounds | null,
): string[] => {
  // 범위 선택 정보가 없거나 고정 행이면 클래스 없이 종료합니다.
  if (rangeBounds == null || params.node.rowPinned != null || params.node.rowIndex == null) {
    return [];
  }

  // 현재 셀의 화면 기준 컬럼 인덱스를 계산합니다.
  const currentColumnIndex = columnIndexMap.get(params.column.getColId());
  if (currentColumnIndex == null) {
    return [];
  }

  // 범위 밖 셀은 강조 클래스를 부여하지 않습니다.
  if (
    params.node.rowIndex < rangeBounds.rowStart
    || params.node.rowIndex > rangeBounds.rowEnd
    || currentColumnIndex < rangeBounds.colStart
    || currentColumnIndex > rangeBounds.colEnd
  ) {
    return [];
  }

  // 선택 영역 셀과 경계 셀에 각각 클래스를 부여합니다.
  const nextClassNameList = ['ag-grid-copy-selected-cell'];
  if (params.node.rowIndex === rangeBounds.rowStart) {
    nextClassNameList.push('ag-grid-copy-edge-top');
  }
  if (params.node.rowIndex === rangeBounds.rowEnd) {
    nextClassNameList.push('ag-grid-copy-edge-bottom');
  }
  if (currentColumnIndex === rangeBounds.colStart) {
    nextClassNameList.push('ag-grid-copy-edge-left');
  }
  if (currentColumnIndex === rangeBounds.colEnd) {
    nextClassNameList.push('ag-grid-copy-edge-right');
  }
  if (
    params.node.rowIndex === rangeBounds.start.rowIndex
    && params.column.getColId() === rangeBounds.start.colId
  ) {
    nextClassNameList.push('ag-grid-copy-range-start');
  }
  if (
    params.node.rowIndex === rangeBounds.end.rowIndex
    && params.column.getColId() === rangeBounds.end.colId
  ) {
    nextClassNameList.push('ag-grid-copy-range-end');
  }
  return nextClassNameList;
};

// 셀 값 조회에 필요한 공통 파라미터를 구성합니다.
const buildValueParams = <TData, TValue>(
  api: GridApi<TData>,
  column: Column<TValue>,
  rowNode: IRowNode<TData>,
  value: TValue | null | undefined,
): ValueFormatterParams<TData, TValue> => {
  const colDef = column.getColDef();
  return {
    api,
    column,
    colDef,
    context: api.getGridOption('context'),
    data: rowNode.data,
    node: rowNode,
    value,
  };
};

// 컬럼 정의 기준으로 원본 셀 값을 계산합니다.
const resolveRawCellValue = <TData, TValue>(
  api: GridApi<TData>,
  column: Column<TValue>,
  rowNode: IRowNode<TData>,
): TValue | null | undefined => {
  const colDef = column.getColDef();

  // valueGetter가 있으면 우선 사용합니다.
  if (typeof colDef.valueGetter === 'function') {
    return colDef.valueGetter({
      api,
      column,
      colDef,
      context: api.getGridOption('context'),
      data: rowNode.data,
      getValue: (field: string) => resolveFieldValue(rowNode.data, field),
      node: rowNode,
    });
  }

  // field 경로가 있으면 rowData에서 값을 꺼냅니다.
  if (typeof colDef.field === 'string' && colDef.field.trim()) {
    return resolveFieldValue(rowNode.data, colDef.field) as TValue | null | undefined;
  }

  return undefined;
};

// 복사용 셀 문자열을 화면 표시 기준으로 변환합니다.
const resolveClipboardCellText = <TData, TValue>(
  api: GridApi<TData>,
  column: Column<TValue>,
  rowNode: IRowNode<TData>,
): string => {
  const colDef = column.getColDef();

  // 값 소스가 전혀 없는 액션성 컬럼은 빈 문자열로 복사합니다.
  if (
    typeof colDef.field !== 'string'
    && typeof colDef.valueGetter !== 'function'
    && typeof colDef.valueFormatter !== 'function'
    && colDef.cellRenderer != null
  ) {
    return '';
  }

  // 원본 값과 포맷팅 값을 순차적으로 계산합니다.
  const rawValue = resolveRawCellValue(api, column, rowNode);
  const formattedValue = typeof colDef.valueFormatter === 'function'
    ? colDef.valueFormatter(buildValueParams(api, column, rowNode, rawValue))
    : rawValue;

  // 복사 문자열은 화면 표시값을 우선 사용합니다.
  if (formattedValue == null) {
    return '';
  }
  return String(formattedValue);
};

// 범위 또는 포커스 셀 기준으로 복사 문자열을 생성합니다.
const buildClipboardPayload = <TData,>(
  api: GridApi<TData>,
  rangeBounds: GridCellRangeBounds | null,
  columnIndexMap: Map<string, number>,
): ClipboardPayload | null => {
  const displayedColumns = api.getAllDisplayedColumns();

  // 활성 범위가 있으면 직사각형 TSV 문자열을 만듭니다.
  if (rangeBounds != null) {
    const lineList: string[] = [];
    for (let rowIndex = rangeBounds.rowStart; rowIndex <= rangeBounds.rowEnd; rowIndex += 1) {
      const rowNode = api.getDisplayedRowAtIndex(rowIndex);
      if (!rowNode) {
        continue;
      }

      const cellTextList: string[] = [];
      for (let colIndex = rangeBounds.colStart; colIndex <= rangeBounds.colEnd; colIndex += 1) {
        const column = displayedColumns[colIndex];
        if (!column) {
          continue;
        }
        cellTextList.push(resolveClipboardCellText(api, column, rowNode));
      }
      lineList.push(cellTextList.join('\t'));
    }
    return { text: lineList.join('\n') };
  }

  // 범위가 없으면 현재 포커스 셀 한 칸만 복사합니다.
  const focusedCell = api.getFocusedCell();
  if (focusedCell == null || focusedCell.rowPinned != null) {
    return null;
  }

  const focusedColumnIndex = columnIndexMap.get(focusedCell.column.getColId());
  if (focusedColumnIndex == null) {
    return null;
  }

  const focusedRowNode = api.getDisplayedRowAtIndex(focusedCell.rowIndex);
  if (!focusedRowNode) {
    return null;
  }

  return {
    text: resolveClipboardCellText(api, displayedColumns[focusedColumnIndex], focusedRowNode),
  };
};

// 클립보드 API와 execCommand fallback으로 텍스트를 복사합니다.
const copyTextToClipboard = async (text: string): Promise<void> => {
  // 최신 클립보드 API가 가능하면 우선 사용합니다.
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  // fallback textarea를 사용해 복사를 시도합니다.
  const textareaElement = document.createElement('textarea');
  textareaElement.value = text;
  textareaElement.setAttribute('readonly', 'true');
  textareaElement.style.position = 'fixed';
  textareaElement.style.top = '-9999px';
  textareaElement.style.left = '-9999px';
  document.body.appendChild(textareaElement);
  textareaElement.select();
  document.execCommand('copy');
  document.body.removeChild(textareaElement);
};

// 컬럼 정의를 재귀 순회하며 범위 선택 클래스 로직을 주입합니다.
const decorateColumnDefs = <TData,>(
  columnDefList: SupportedColDef<TData>[] | null | undefined,
  defaultCellClass: ColDef<TData>['cellClass'] | undefined,
  columnIndexMapRef: React.MutableRefObject<Map<string, number>>,
  rangeBoundsRef: React.MutableRefObject<GridCellRangeBounds | null>,
): SupportedColDef<TData>[] | undefined => {
  if (!columnDefList) {
    return undefined;
  }

  // 그룹 컬럼은 children만 재귀적으로 보정하고, leaf 컬럼은 클래스 함수를 합성합니다.
  return columnDefList.map((columnDef) => {
    if (isColumnGroupDef(columnDef)) {
      return {
        ...columnDef,
        children: decorateColumnDefs(
          columnDef.children,
          defaultCellClass,
          columnIndexMapRef,
          rangeBoundsRef,
        ),
      };
    }

    const originalCellClass = columnDef.cellClass;
    return {
      ...columnDef,
      cellClass: (params: CellClassParams<TData>) => {
        const defaultClassNameList = typeof defaultCellClass === 'function'
          ? normalizeCellClassValue(defaultCellClass(params))
          : normalizeCellClassValue(defaultCellClass);
        const originalClassNameList = typeof originalCellClass === 'function'
          ? normalizeCellClassValue(originalCellClass(params))
          : normalizeCellClassValue(originalCellClass);
        const rangeClassNameList = buildRangeClassNames(
          params,
          columnIndexMapRef.current,
          rangeBoundsRef.current,
        );

        // 기본/개별/범위 클래스를 한 번에 반환합니다.
        return [...defaultClassNameList, ...originalClassNameList, ...rangeClassNameList];
      },
    };
  });
};

// ag-grid 공통 셀 범위 복사 wrapper를 렌더링합니다.
export const AgGridReact = <TData,>(props: AgGridReactProps<TData>) => {
  const {
    columnDefs,
    defaultColDef,
    domLayout,
    onCellMouseDown,
    onCellMouseOver,
    onGridReady,
    ...restProps
  } = props;

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const gridApiRef = useRef<GridApi<TData> | null>(null);
  const draggingRef = useRef(false);
  const selectedRangeRef = useRef<GridCellRange | null>(null);
  const rangeBoundsRef = useRef<GridCellRangeBounds | null>(null);
  const columnIndexMapRef = useRef<Map<string, number>>(new Map());
  const gridCleanupRef = useRef<(() => void) | null>(null);

  // 현재 range와 표시 컬럼 상태를 다시 계산합니다.
  const syncRangeMetadata = useCallback(() => {
    const api = gridApiRef.current;
    if (!api) {
      columnIndexMapRef.current = new Map();
      rangeBoundsRef.current = null;
      return;
    }

    // 표시 중인 컬럼 인덱스와 range 경계를 최신 상태로 맞춥니다.
    columnIndexMapRef.current = buildDisplayedColumnIndexMap(api);
    rangeBoundsRef.current = buildRangeBounds(selectedRangeRef.current, columnIndexMapRef.current);
  }, []);

  // 셀 클래스 재계산을 위해 현재 보이는 셀을 다시 그립니다.
  const refreshSelectionStyles = useCallback(() => {
    const api = gridApiRef.current;
    if (!api || api.isDestroyed()) {
      return;
    }
    api.refreshCells({ force: true });
  }, []);

  // 현재 선택 범위를 적용하고 표시를 갱신합니다.
  const applyRangeSelection = useCallback((nextRange: GridCellRange | null) => {
    const previousRange = selectedRangeRef.current;
    if (
      nextRange == null
      && previousRange == null
    ) {
      draggingRef.current = false;
      return;
    }

    if (
      nextRange != null
      && previousRange != null
      && isSameCellPosition(previousRange.start, nextRange.start)
      && isSameCellPosition(previousRange.end, nextRange.end)
    ) {
      return;
    }

    // range ref와 경계 메타데이터를 함께 갱신합니다.
    selectedRangeRef.current = nextRange;
    syncRangeMetadata();
    refreshSelectionStyles();
  }, [refreshSelectionStyles, syncRangeMetadata]);

  // 현재 선택 범위를 제거합니다.
  const clearRangeSelection = useCallback(() => {
    draggingRef.current = false;
    applyRangeSelection(null);
  }, [applyRangeSelection]);

  // grid API 이벤트 등록과 해제를 공통 관리합니다.
  const bindGridLifecycleEvents = useCallback((api: GridApi<TData>) => {
    // 데이터/페이지/컬럼 상태가 바뀌면 이전 범위를 제거합니다.
    const clearSelectionHandler = () => {
      clearRangeSelection();
    };
    api.addEventListener('modelUpdated', clearSelectionHandler);
    api.addEventListener('paginationChanged', clearSelectionHandler);
    api.addEventListener('columnMoved', clearSelectionHandler);
    api.addEventListener('displayedColumnsChanged', clearSelectionHandler);
    api.addEventListener('sortChanged', clearSelectionHandler);
    api.addEventListener('filterChanged', clearSelectionHandler);

    return () => {
      // 이미 파기된 grid API에는 정리 호출을 보내지 않습니다.
      if (api.isDestroyed()) {
        return;
      }
      api.removeEventListener('modelUpdated', clearSelectionHandler);
      api.removeEventListener('paginationChanged', clearSelectionHandler);
      api.removeEventListener('columnMoved', clearSelectionHandler);
      api.removeEventListener('displayedColumnsChanged', clearSelectionHandler);
      api.removeEventListener('sortChanged', clearSelectionHandler);
      api.removeEventListener('filterChanged', clearSelectionHandler);
    };
  }, [clearRangeSelection]);

  // grid 준비 완료 시 공통 복사 이벤트를 연결합니다.
  const handleGridReady = useCallback((event: GridReadyEvent<TData>) => {
    gridCleanupRef.current?.();
    gridCleanupRef.current = null;
    gridApiRef.current = event.api;
    syncRangeMetadata();
    gridCleanupRef.current = bindGridLifecycleEvents(event.api);
    onGridReady?.(event);
  }, [bindGridLifecycleEvents, onGridReady, syncRangeMetadata]);

  // 셀 드래그 시작 시 범위 선택을 초기화합니다.
  const handleCellMouseDown = useCallback((event: CellMouseDownEvent<TData>) => {
    onCellMouseDown?.(event);

    const nativeMouseEvent = event.event;
    if (!(nativeMouseEvent instanceof MouseEvent)) {
      return;
    }

    // 편집 중이거나 액션성 요소 클릭은 범위 선택을 시작하지 않습니다.
    if (event.api.getEditingCells().length > 0 || isInteractiveTarget(nativeMouseEvent.target)) {
      return;
    }
    if (nativeMouseEvent.button !== 0) {
      return;
    }

    const startCellPosition = resolveCellPositionFromEvent(event);
    if (startCellPosition == null) {
      return;
    }

    // 좌클릭 셀을 단일 range 시작점으로 저장합니다.
    draggingRef.current = true;
    applyRangeSelection({
      start: startCellPosition,
      end: startCellPosition,
    });
  }, [applyRangeSelection, onCellMouseDown]);

  // 드래그 중 마우스가 지나간 셀까지 범위를 확장합니다.
  const handleCellMouseOver = useCallback((event: CellMouseOverEvent<TData>) => {
    onCellMouseOver?.(event);

    if (!draggingRef.current || event.api.getEditingCells().length > 0) {
      return;
    }

    const currentRange = selectedRangeRef.current;
    const endCellPosition = resolveCellPositionFromEvent(event);
    if (currentRange == null || endCellPosition == null) {
      return;
    }

    applyRangeSelection({
      start: currentRange.start,
      end: endCellPosition,
    });
  }, [applyRangeSelection, onCellMouseOver]);

  // wrapper 루트에서 Escape와 Ctrl/Cmd+C를 공통 처리합니다.
  const handleKeyDownCapture = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      clearRangeSelection();
      return;
    }

    // 복사 단축키가 아니면 기본 동작을 유지합니다.
    const isCopyShortcut = (event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey
      && event.key.toLowerCase() === 'c';
    if (!isCopyShortcut) {
      return;
    }

    const api = gridApiRef.current;
    if (!api || api.isDestroyed()) {
      return;
    }

    // 편집 중 입력과 브라우저 기본 텍스트 선택 복사는 그대로 둡니다.
    if (api.getEditingCells().length > 0 || hasBrowserTextSelection()) {
      return;
    }
    if (isTextEntryElement(event.target) || isTextEntryElement(document.activeElement)) {
      return;
    }

    const clipboardPayload = buildClipboardPayload(api, rangeBoundsRef.current, columnIndexMapRef.current);
    if (clipboardPayload == null) {
      return;
    }

    // 공통 wrapper에서 복사를 직접 수행합니다.
    event.preventDefault();
    event.stopPropagation();
    void copyTextToClipboard(clipboardPayload.text).catch((copyError) => {
      console.error('ag-grid 셀 복사에 실패했습니다.', copyError);
    });
  }, [clearRangeSelection]);

  // 드래그 종료와 외부 클릭 해제를 문서 전역에서 감지합니다.
  useEffect(() => {
    const handleWindowMouseUp = () => {
      draggingRef.current = false;
    };
    const handleDocumentMouseDown = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node | null)) {
        clearRangeSelection();
      }
    };

    window.addEventListener('mouseup', handleWindowMouseUp);
    document.addEventListener('mousedown', handleDocumentMouseDown, true);
    return () => {
      window.removeEventListener('mouseup', handleWindowMouseUp);
      document.removeEventListener('mousedown', handleDocumentMouseDown, true);
    };
  }, [clearRangeSelection]);

  // grid API 리스너를 unmount 시 정리합니다.
  useEffect(() => {
    return () => {
      gridCleanupRef.current?.();
      gridCleanupRef.current = null;
      gridApiRef.current = null;
    };
  }, []);

  // leaf column마다 공통 선택 클래스 로직을 주입합니다.
  const decoratedColumnDefs = useMemo(() => (
    decorateColumnDefs(
      columnDefs,
      defaultColDef?.cellClass,
      columnIndexMapRef,
      rangeBoundsRef,
    )
  ), [columnDefs, defaultColDef?.cellClass]);

  // defaultColDef의 cellClass는 leaf 컬럼에 합성했으므로 중복 적용을 막습니다.
  const decoratedDefaultColDef = useMemo(() => ({
    ...defaultColDef,
    cellClass: undefined,
  }), [defaultColDef]);

  return (
    <div
      ref={wrapperRef}
      className={`ag-grid-copy-wrapper${domLayout === 'autoHeight' ? '' : ' ag-grid-copy-wrapper-fill'}`}
      onKeyDownCapture={handleKeyDownCapture}
    >
      <BaseAgGridReact<TData>
        {...restProps}
        columnDefs={decoratedColumnDefs}
        defaultColDef={decoratedDefaultColDef}
        domLayout={domLayout}
        onGridReady={handleGridReady}
        onCellMouseDown={handleCellMouseDown}
        onCellMouseOver={handleCellMouseOver}
      />
    </div>
  );
};

export type { AgGridReactProps };

export default AgGridReact;
