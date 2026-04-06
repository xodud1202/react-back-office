import type { CommonCode } from '@/components/goods/types';
import type { ColDef } from 'ag-grid-community';
import type { CompanyWorkListRow } from '@/components/companyWork/types';
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

// 회사 업무 그리드 컬럼 정의를 생성합니다.
export const createCompanyWorkColumnDefs = (workPriorList: CommonCode[]): ColDef<CompanyWorkListRow>[] => {
  // 우선순위 코드명을 조회용 맵으로 구성합니다.
  const workPriorNameMap = createWorkPriorNameMap(workPriorList);

  return [
    { headerName: '업무번호', field: 'workKey', width: 120 },
    {
      headerName: '타이틀',
      field: 'title',
      flex: 1,
      minWidth: 400,
      cellClass: 'company-work-title-cell text-start',
      cellStyle: { textAlign: 'left' },
    },
    {
      headerName: '시작일시',
      field: 'workStartDt',
      width: 170,
      valueFormatter: (params) => dateFormatter({ value: params.value } as any),
    },
    {
      headerName: '종료일시',
      field: 'workEndDt',
      width: 170,
      valueFormatter: (params) => dateFormatter({ value: params.value } as any),
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
    { headerName: 'IT담당자', field: 'itManager', width: 130 },
    { headerName: '업무담당자', field: 'coManager', width: 130 },
    {
      headerName: '업무생성일자',
      field: 'workCreateDt',
      width: 170,
      valueFormatter: (params) => dateFormatter({ value: params.value } as any),
    },
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
