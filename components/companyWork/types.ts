import type { CommonCode } from '@/components/goods/types';

// 회사 선택 항목 정보를 정의합니다.
export interface CompanyWorkCompanyOption {
  // 회사 번호입니다.
  workCompanySeq: number;
  // 회사명입니다.
  workCompanyNm: string;
  // 사용 플랫폼명입니다.
  workPlatformNm: string;
  // 표시 순서입니다.
  dispOrd: number;
}

// 프로젝트 선택 항목 정보를 정의합니다.
export interface CompanyWorkProjectOption {
  // 프로젝트 번호입니다.
  workCompanyProjectSeq: number;
  // 회사 번호입니다.
  workCompanySeq: number;
  // 프로젝트명입니다.
  workCompanyProjectNm: string;
  // 표시 순서입니다.
  dispOrd: number;
}

// 회사 업무 검색 폼 상태를 정의합니다.
export interface CompanyWorkSearchFormState {
  // 선택된 회사 번호 문자열입니다.
  workCompanySeq: string;
  // 선택된 프로젝트 번호 문자열입니다.
  workCompanyProjectSeq: string;
  // 타이틀 검색어입니다.
  title: string;
}

// 회사 업무 조회 파라미터를 정의합니다.
export interface CompanyWorkSearchParams {
  // 회사 번호입니다.
  workCompanySeq: number;
  // 프로젝트 번호입니다.
  workCompanyProjectSeq: number;
  // 타이틀 검색어입니다.
  title: string;
}

// 회사 업무 목록 행 정보를 정의합니다.
export interface CompanyWorkListRow {
  // 업무 시퀀스입니다.
  workSeq: number;
  // 회사 번호입니다.
  workCompanySeq: number;
  // 프로젝트 번호입니다.
  workCompanyProjectSeq: number;
  // 업무 상태 코드입니다.
  workStatCd: string;
  // 업무 키입니다.
  workKey: string;
  // 업무 타이틀입니다.
  title: string;
  // 업무 생성 일시입니다.
  workCreateDt: string;
  // 업무 시작 일시입니다.
  workStartDt: string;
  // 업무 종료 일시입니다.
  workEndDt: string;
  // 업무 우선순위 코드입니다.
  workPriorCd: string;
  // 업무 우선순위명입니다.
  workPriorNm: string;
  // IT 담당자명입니다.
  itManager: string;
  // 업무 담당자명입니다.
  coManager: string;
  // 등록 일시입니다.
  regDt: string;
  // 수정 일시입니다.
  udtDt: string;
}

// 상태별 회사 업무 섹션 정보를 정의합니다.
export interface CompanyWorkStatusSection {
  // 업무 상태 코드입니다.
  workStatCd: string;
  // 해당 상태의 업무 목록입니다.
  list: CompanyWorkListRow[];
}

// 비완료 상태별 목록 응답을 정의합니다.
export interface CompanyWorkStatusListResponse {
  // 상태별 섹션 목록입니다.
  statusSectionList: CompanyWorkStatusSection[];
}

// 완료 목록 응답을 정의합니다.
export interface CompanyWorkCompletedListResponse {
  // 완료 업무 목록입니다.
  list: CompanyWorkListRow[];
  // 전체 건수입니다.
  totalCount: number;
  // 현재 페이지입니다.
  page: number;
  // 페이지 크기입니다.
  pageSize: number;
}

// SR 가져오기 모달 상태를 정의합니다.
export interface CompanyWorkImportFormState {
  // 선택된 회사 번호 문자열입니다.
  workCompanySeq: string;
  // 선택된 프로젝트 번호 문자열입니다.
  workCompanyProjectSeq: string;
  // 입력한 업무 키입니다.
  workKey: string;
}

// 회사 업무 가져오기 요청 데이터를 정의합니다.
export interface CompanyWorkImportRequest {
  // 회사 번호입니다.
  workCompanySeq: number;
  // 프로젝트 번호입니다.
  workCompanyProjectSeq: number;
  // 업무 키입니다.
  workKey: string;
  // 등록자 번호입니다.
  regNo: number;
  // 수정자 번호입니다.
  udtNo: number;
}

// 회사 업무 가져오기 응답 데이터를 정의합니다.
export interface CompanyWorkImportResponse {
  // 처리 결과 메시지입니다.
  message: string;
  // 저장된 업무 시퀀스입니다.
  workSeq: number;
  // 저장된 업무 키입니다.
  workKey: string;
}

// 회사 업무 즉시 수정 가능 항목을 정의합니다.
export interface CompanyWorkEditableValues {
  // 업무 상태 코드입니다.
  workStatCd: string;
  // 업무 시작일입니다.
  workStartDt: string;
  // 업무 종료일입니다.
  workEndDt: string;
  // IT 담당자명입니다.
  itManager: string;
}

// 회사 업무 즉시 수정 요청 데이터를 정의합니다.
export interface CompanyWorkUpdateRequest extends CompanyWorkEditableValues {
  // 업무 시퀀스입니다.
  workSeq: number;
  // 수정자 번호입니다.
  udtNo: number;
}

// 회사 업무 즉시 저장 처리 함수 타입을 정의합니다.
export type CompanyWorkSaveEditableRowHandler = (
  row: CompanyWorkListRow,
  changes: Partial<CompanyWorkEditableValues>,
) => Promise<void>;

// 회사 업무 페이지 서버 주입 데이터 타입을 정의합니다.
export interface CompanyWorkPageInitialData {
  // 회사 목록입니다.
  companyList: CompanyWorkCompanyOption[];
  // 업무 상태 공통코드 목록입니다.
  workStatList: CommonCode[];
  // 업무 우선순위 공통코드 목록입니다.
  workPriorList: CommonCode[];
}
