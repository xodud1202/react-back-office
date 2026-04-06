import type { CommonCode } from '@/components/goods/types';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import { createElement } from 'react';
import {
  CompanyWorkDateCell,
  CompanyWorkStatusSelectCell,
  CompanyWorkTextCell,
} from '@/components/companyWork/CompanyWorkEditableCells';
import type { CompanyWorkListRow } from '@/components/companyWork/types';
import type { CompanyWorkSaveEditableRowHandler } from '@/components/companyWork/types';
import { dateFormatter } from '@/utils/common';

// 우선순위 코드명을 빠르게 찾기 위한 맵을 생성합니다.
const createWorkPriorNameMap = (workPriorList: CommonCode[]): Map<string, string> => {
  // 우선순위 공통코드를 코드명 맵으로 변환합니다.
  const workPriorNameMap = new Map<string, string>();
  for (const workPriorItem of workPriorList) {
    if (!workPriorItem?.cd) {
      continue;
    }
    workPriorNameMap.set(workPriorItem.cd, workPriorItem.cdNm || '');
  }
  return workPriorNameMap;
};

// 날짜 문자열을 yyyy-MM-dd 형식으로 정규화합니다.
const normalizeCompanyWorkDate = (value?: string | null): string => {
  // 날짜 값이 없으면 빈 문자열을 반환합니다.
  if (typeof value !== 'string' || value.trim() === '') {
    return '';
  }
  return value.slice(0, 10);
};

interface CreateCompanyWorkColumnDefsParams {
  // 우선순위 공통코드 목록입니다.
  workPriorList: CommonCode[];
  // 상태 공통코드 목록입니다.
  workStatList: CommonCode[];
  // 즉시 저장 처리 함수입니다.
  onSaveEditableRow: CompanyWorkSaveEditableRowHandler;
}

// 회사 업무 그리드 컬럼 정의를 생성합니다.
export const createCompanyWorkColumnDefs = ({
  workPriorList,
  workStatList,
  onSaveEditableRow,
}: CreateCompanyWorkColumnDefsParams): ColDef<CompanyWorkListRow>[] => {
  // 우선순위 코드명을 조회용 맵으로 구성합니다.
  const workPriorNameMap = createWorkPriorNameMap(workPriorList);

  return [
    { headerName: '업무번호', field: 'workKey', width: 120 },
    {
      headerName: '상태',
      field: 'workStatCd',
      width: 180,
      cellRenderer: (params: ICellRendererParams<CompanyWorkListRow>) => {
        // 행 데이터가 있으면 상태 선택 셀을 렌더링합니다.
        if (!params.data) {
          return '';
        }
        return createElement(CompanyWorkStatusSelectCell, {
          value: params.data.workStatCd,
          workStatList,
          onSave: (nextValue: string) => onSaveEditableRow(params.data!, { workStatCd: nextValue }),
        });
      },
    },
    {
      headerName: '타이틀',
      field: 'title',
      flex: 1,
      minWidth: 400,
      cellClass: 'company-work-title-cell text-start',
      cellStyle: { textAlign: 'left' },
      cellRenderer: (params: ICellRendererParams<CompanyWorkListRow>) => {
        // 내부 flex 정렬 영향 없이 타이틀을 좌측 정렬 블록으로 렌더링합니다.
        return createElement(
          'div',
          { style: { display: 'block', width: '100%', textAlign: 'left' } },
          String(params.value ?? ''),
        );
      },
    },
    {
      headerName: '업무생성일자',
      field: 'workCreateDt',
      width: 170,
      valueFormatter: (params) => dateFormatter({ value: params.value } as any),
    },
    {
      headerName: '시작일시',
      field: 'workStartDt',
      width: 170,
      cellRenderer: (params: ICellRendererParams<CompanyWorkListRow>) => {
        // 행 데이터가 있으면 시작일 달력 셀을 렌더링합니다.
        if (!params.data) {
          return '';
        }
        return createElement(CompanyWorkDateCell, {
          value: normalizeCompanyWorkDate(params.data.workStartDt),
          onSave: (nextValue: string) => onSaveEditableRow(params.data!, { workStartDt: nextValue }),
        });
      },
    },
    {
      headerName: '종료일시',
      field: 'workEndDt',
      width: 170,
      cellRenderer: (params: ICellRendererParams<CompanyWorkListRow>) => {
        // 행 데이터가 있으면 종료일 달력 셀을 렌더링합니다.
        if (!params.data) {
          return '';
        }
        return createElement(CompanyWorkDateCell, {
          value: normalizeCompanyWorkDate(params.data.workEndDt),
          onSave: (nextValue: string) => onSaveEditableRow(params.data!, { workEndDt: nextValue }),
        });
      },
    },
    {
      headerName: '우선순위',
      field: 'workPriorNm',
      width: 120,
      valueFormatter: (params) => {
        // 서버 응답 이름이 없으면 공통코드 맵으로 보정합니다.
        if (params.value) {
          return String(params.value);
        }
        const workPriorCode = params.data?.workPriorCd || '';
        return workPriorNameMap.get(workPriorCode) || '';
      },
    },
    {
      headerName: 'IT담당자',
      field: 'itManager',
      width: 150,
      cellRenderer: (params: ICellRendererParams<CompanyWorkListRow>) => {
        // 행 데이터가 있으면 IT 담당자 입력 셀을 렌더링합니다.
        if (!params.data) {
          return '';
        }
        return createElement(CompanyWorkTextCell, {
          value: params.data.itManager,
          placeholder: 'IT담당자 입력',
          onSave: (nextValue: string) => onSaveEditableRow(params.data!, { itManager: nextValue }),
        });
      },
    },
    { headerName: '업무담당자', field: 'coManager', width: 130 },
    {
      headerName: '등록일',
      field: 'regDt',
      width: 170,
      valueFormatter: (params) => dateFormatter({ value: params.value } as any),
    },
    {
      headerName: '수정일',
      field: 'udtDt',
      width: 170,
      valueFormatter: (params) => dateFormatter({ value: params.value } as any),
    },
  ];
};

// 회사 업무 그리드 기본 컬럼 속성을 생성합니다.
export const createCompanyWorkDefaultColDef = (): ColDef<CompanyWorkListRow> => ({
  // 기본 컬럼은 리사이즈 가능하고 수정 없이 중앙 정렬로 유지합니다.
  resizable: true,
  sortable: false,
  editable: false,
  cellClass: 'text-center',
});
