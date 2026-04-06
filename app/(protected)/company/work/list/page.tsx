import type { ComponentProps } from 'react';
import CompanyWorkListClientPage from '@/app/(protected)/company/work/list/CompanyWorkListClientPage';
import type { CompanyWorkCompanyOption, CompanyWorkProjectOption } from '@/components/companyWork/types';
import { fetchCommonCodeList } from '@/utils/server/backOffice';
import { fetchServerList } from '@/utils/server/auth';

/**
 * 회사 업무 목록 화면에 필요한 초기 데이터를 서버에서 조회합니다.
 * @returns 서버 데이터가 주입된 회사 업무 목록 화면입니다.
 */
export default async function CompanyWorkListPage() {
  const [companyList, workStatList, workPriorList] = await Promise.all([
    fetchServerList<CompanyWorkCompanyOption>('/api/admin/company/work/company/list'),
    fetchCommonCodeList('WORK_STAT'),
    fetchCommonCodeList('WORK_PRIOR'),
  ]);
  const initialWorkCompanySeq = companyList[0]?.workCompanySeq;
  const initialProjectList = initialWorkCompanySeq
    ? await fetchServerList<CompanyWorkProjectOption>(
      `/api/admin/company/work/project/list?workCompanySeq=${encodeURIComponent(String(initialWorkCompanySeq))}`,
    )
    : [];

  const props: ComponentProps<typeof CompanyWorkListClientPage> = {
    companyList,
    initialProjectList,
    workStatList,
    workPriorList,
  };

  return <CompanyWorkListClientPage {...props} />;
}
