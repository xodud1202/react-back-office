'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Modal from '@/components/common/Modal';
import type {
  CompanyWorkCompanyOption,
  CompanyWorkImportFormState,
  CompanyWorkProjectOption,
} from '@/components/companyWork/types';
import { fetchCompanyWorkProjectList, importCompanyWork } from '@/services/companyWorkApi';
import { requireLoginUsrNo } from '@/utils/auth';
import { extractApiErrorMessage } from '@/utils/api/error';
import { notifyError, notifySuccess } from '@/utils/ui/feedback';

interface CompanyWorkImportModalProps {
  // 모달 오픈 여부입니다.
  isOpen: boolean;
  // 회사 목록입니다.
  companyList: CompanyWorkCompanyOption[];
  // 메인 검색에서 선택된 회사 번호 문자열입니다.
  initialWorkCompanySeq?: string;
  // 메인 검색에서 선택된 프로젝트 번호 문자열입니다.
  initialWorkCompanyProjectSeq?: string;
  // 모달 닫기 처리입니다.
  onClose: () => void;
  // 가져오기 성공 후 후속 처리입니다.
  onImported?: () => Promise<void> | void;
}

// SR 가져오기 기본 회사 번호를 계산합니다.
const resolveDefaultWorkCompanySeq = (
  companyList: CompanyWorkCompanyOption[],
  initialWorkCompanySeq?: string,
): string => {
  // 기존 선택 회사가 있으면 우선 사용하고, 없으면 첫 회사를 기본값으로 사용합니다.
  if (initialWorkCompanySeq) {
    return initialWorkCompanySeq;
  }
  return companyList[0] ? String(companyList[0].workCompanySeq) : '';
};

// SR 가져오기 모달 기본 상태를 생성합니다.
const createInitialImportFormState = (): CompanyWorkImportFormState => ({
  // 초기에는 선택값과 업무키를 모두 비웁니다.
  workCompanySeq: '',
  workCompanyProjectSeq: '',
  workKey: '',
});

// 프로젝트 선택 플레이스홀더 문구를 반환합니다.
const resolveProjectPlaceholderText = (formState: CompanyWorkImportFormState, projectLoading: boolean): string => {
  // 회사 선택 여부와 로딩 상태에 따라 안내 문구를 분기합니다.
  if (!formState.workCompanySeq) {
    return '회사를 먼저 선택하세요';
  }
  if (projectLoading) {
    return '프로젝트를 불러오는 중입니다.';
  }
  return '프로젝트를 선택하세요';
};

// 회사 업무 SR 가져오기 모달을 렌더링합니다.
const CompanyWorkImportModal = ({
  isOpen,
  companyList,
  initialWorkCompanySeq,
  initialWorkCompanyProjectSeq,
  onClose,
  onImported,
}: CompanyWorkImportModalProps) => {
  const [formState, setFormState] = useState<CompanyWorkImportFormState>(() => createInitialImportFormState());
  const [projectList, setProjectList] = useState<CompanyWorkProjectOption[]>([]);
  const [projectLoading, setProjectLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);

  // 선택 회사 기준 프로젝트 목록을 조회합니다.
  const loadProjectList = useCallback(async (workCompanySeqValue: string, preferredProjectSeq = '') => {
    // 회사가 비어 있으면 프로젝트 상태를 초기화합니다.
    if (!workCompanySeqValue) {
      setProjectList([]);
      setFormState((prevState) => ({
        ...prevState,
        workCompanyProjectSeq: '',
      }));
      return;
    }

    setProjectLoading(true);
    try {
      // 선택 회사의 프로젝트 목록을 조회합니다.
      const nextProjectList = await fetchCompanyWorkProjectList(Number(workCompanySeqValue));
      setProjectList(nextProjectList);
      setFormState((prevState) => {
        const hasPreferredProject = nextProjectList.some(
          (projectItem) => String(projectItem.workCompanyProjectSeq) === preferredProjectSeq,
        );
        return {
          ...prevState,
          workCompanyProjectSeq: hasPreferredProject
            ? preferredProjectSeq
            : (nextProjectList[0] ? String(nextProjectList[0].workCompanyProjectSeq) : ''),
        };
      });
    } catch (error) {
      // 프로젝트 조회 실패 시 목록과 선택값을 비웁니다.
      console.error('SR 가져오기 프로젝트 목록 조회에 실패했습니다.', error);
      setProjectList([]);
      setFormState((prevState) => ({
        ...prevState,
        workCompanyProjectSeq: '',
      }));
      notifyError('프로젝트 목록 조회에 실패했습니다.');
    } finally {
      setProjectLoading(false);
    }
  }, []);

  // 모달 오픈 시 기본 회사/프로젝트 선택값을 반영합니다.
  useEffect(() => {
    // 모달이 닫히면 내부 상태를 초기화합니다.
    if (!isOpen) {
      setFormState(createInitialImportFormState());
      setProjectList([]);
      setProjectLoading(false);
      setImportLoading(false);
      return;
    }

    // 메인 검색 선택값을 기본값으로 채웁니다.
    const nextWorkCompanySeq = resolveDefaultWorkCompanySeq(companyList, initialWorkCompanySeq);
    const nextWorkCompanyProjectSeq = initialWorkCompanyProjectSeq || '';
    setFormState({
      workCompanySeq: nextWorkCompanySeq,
      workCompanyProjectSeq: nextWorkCompanyProjectSeq,
      workKey: '',
    });
    void loadProjectList(nextWorkCompanySeq, nextWorkCompanyProjectSeq);
  }, [companyList, initialWorkCompanyProjectSeq, initialWorkCompanySeq, isOpen, loadProjectList]);

  // 회사 선택 변경 시 프로젝트 목록을 다시 조회합니다.
  const handleChangeWorkCompanySeq = useCallback(async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextWorkCompanySeq = event.target.value;

    // 회사 변경 즉시 프로젝트 선택과 업무키를 유지한 상태로 회사만 반영합니다.
    setFormState((prevState) => ({
      ...prevState,
      workCompanySeq: nextWorkCompanySeq,
      workCompanyProjectSeq: '',
    }));
    setProjectList([]);
    await loadProjectList(nextWorkCompanySeq);
  }, [loadProjectList]);

  // 프로젝트 선택 변경을 반영합니다.
  const handleChangeWorkCompanyProjectSeq = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextWorkCompanyProjectSeq = event.target.value;

    // 선택한 프로젝트 번호를 상태에 반영합니다.
    setFormState((prevState) => ({
      ...prevState,
      workCompanyProjectSeq: nextWorkCompanyProjectSeq,
    }));
  }, []);

  // 업무키 입력값을 반영합니다.
  const handleChangeWorkKey = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const nextWorkKey = event.target.value;

    // 입력한 업무키를 상태에 반영합니다.
    setFormState((prevState) => ({
      ...prevState,
      workKey: nextWorkKey,
    }));
  }, []);

  // 가져오기 버튼 클릭 시 필수값을 검증하고 Jira 업무 저장을 요청합니다.
  const handleImport = useCallback(async () => {
    // 필수 회사와 프로젝트와 업무키를 순서대로 검증합니다.
    if (!formState.workCompanySeq) {
      notifyError('회사를 선택해주세요.');
      return;
    }
    if (!formState.workCompanyProjectSeq) {
      notifyError('프로젝트를 선택해주세요.');
      return;
    }
    if (!formState.workKey.trim()) {
      notifyError('업무키를 입력해주세요.');
      return;
    }

    // 로그인 사용자 번호가 없으면 저장을 진행하지 않습니다.
    const loginUsrNo = requireLoginUsrNo();
    if (!loginUsrNo) {
      return;
    }

    setImportLoading(true);
    try {
      // Jira 업무 가져오기 저장 API를 호출합니다.
      const response = await importCompanyWork({
        workCompanySeq: Number(formState.workCompanySeq),
        workCompanyProjectSeq: Number(formState.workCompanyProjectSeq),
        workKey: formState.workKey.trim(),
        regNo: loginUsrNo,
        udtNo: loginUsrNo,
      });
      notifySuccess(response.message || '업무를 가져왔습니다.');
      onClose();
      await onImported?.();
    } catch (error) {
      // 서버 메시지를 우선 노출하고 모달은 유지합니다.
      const message = extractApiErrorMessage(error, '업무 가져오기에 실패했습니다.');
      notifyError(message);
    } finally {
      setImportLoading(false);
    }
  }, [formState, onClose, onImported]);

  // 프로젝트 선택 안내 문구를 계산합니다.
  const projectPlaceholderText = resolveProjectPlaceholderText(formState, projectLoading);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="SR 가져오기"
      width="520px"
      footerActions={(
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => { void handleImport(); }}
          disabled={projectLoading || importLoading}
        >
          {importLoading ? '가져오는 중...' : '가져오기'}
        </button>
      )}
    >
      <div className="table-responsive">
        <table className="table table-bordered mb-0">
          <tbody>
            <tr>
              <th scope="row" style={{ width: '140px' }}>회사</th>
              <td>
                <select
                  className="form-select"
                  value={formState.workCompanySeq}
                  onChange={handleChangeWorkCompanySeq}
                  disabled={importLoading}
                >
                  <option value="" disabled>회사를 선택하세요</option>
                  {companyList.map((companyItem) => (
                    <option key={companyItem.workCompanySeq} value={companyItem.workCompanySeq}>
                      {companyItem.workCompanyNm}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
            <tr>
              <th scope="row">프로젝트</th>
              <td>
                <select
                  className="form-select"
                  value={formState.workCompanyProjectSeq}
                  onChange={handleChangeWorkCompanyProjectSeq}
                  disabled={!formState.workCompanySeq || projectLoading || importLoading}
                >
                  <option value="" disabled>{projectPlaceholderText}</option>
                  {projectList.map((projectItem) => (
                    <option key={projectItem.workCompanyProjectSeq} value={projectItem.workCompanyProjectSeq}>
                      {projectItem.workCompanyProjectNm}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
            <tr>
              <th scope="row">업무키</th>
              <td>
                <input
                  type="text"
                  className="form-control"
                  value={formState.workKey}
                  onChange={handleChangeWorkKey}
                  placeholder="업무키를 입력하세요"
                  disabled={importLoading}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Modal>
  );
};

export default CompanyWorkImportModal;
