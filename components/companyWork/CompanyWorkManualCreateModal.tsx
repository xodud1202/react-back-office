'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { CommonCode } from '@/components/goods/types';
import AdminFormTable from '@/components/common/AdminFormTable';
import Modal from '@/components/common/Modal';
import LazyQuillEditor from '@/components/common/editor/LazyQuillEditor';
import useQuillImageUpload from '@/hooks/useQuillImageUpload';
import type {
  CompanyWorkCompanyOption,
  CompanyWorkManualCreateFormState,
  CompanyWorkProjectOption,
  CompanyWorkSaveManualCreateHandler,
} from '@/components/companyWork/types';
import { fetchCompanyWorkProjectList } from '@/services/companyWorkApi';
import { notifyError } from '@/utils/ui/feedback';

interface CompanyWorkManualCreateModalProps {
  // 레이어 팝업 오픈 여부입니다.
  isOpen: boolean;
  // 저장 중 여부입니다.
  saving: boolean;
  // 회사 목록입니다.
  companyList: CompanyWorkCompanyOption[];
  // 현재 선택 회사 기준 프로젝트 목록입니다.
  initialProjectList: CompanyWorkProjectOption[];
  // 기본 회사 번호 문자열입니다.
  initialWorkCompanySeq: string;
  // 기본 프로젝트 번호 문자열입니다.
  initialWorkCompanyProjectSeq: string;
  // 업무 우선순위 공통코드 목록입니다.
  workPriorList: CommonCode[];
  // 저장 처리입니다.
  onSave: CompanyWorkSaveManualCreateHandler;
  // 팝업 닫기 처리입니다.
  onClose: () => void;
}

const COMPANY_WORK_MANUAL_DEFAULT_PRIORITY_CODE = 'WORK_PRIOR_02';

// 수기 등록 기본 우선순위 코드를 계산합니다.
const resolveDefaultWorkPriorCd = (workPriorList: CommonCode[]): string => {
  // 기본값은 보통 우선순위를 우선 사용하고, 없으면 첫 항목을 사용합니다.
  const defaultWorkPriorItem = workPriorList.find((workPriorItem) => workPriorItem.cd === COMPANY_WORK_MANUAL_DEFAULT_PRIORITY_CODE);
  if (defaultWorkPriorItem?.cd) {
    return defaultWorkPriorItem.cd;
  }
  return workPriorList[0]?.cd || '';
};

// 수기 등록 초기 프로젝트 목록을 현재 회사 기준으로 정리합니다.
const resolveInitialManualProjectList = (
  initialWorkCompanySeq: string,
  initialProjectList: CompanyWorkProjectOption[],
): CompanyWorkProjectOption[] => (
  // 기본 회사와 일치하는 프로젝트만 초기 목록으로 사용합니다.
  initialProjectList.filter((projectItem) => String(projectItem.workCompanySeq) === initialWorkCompanySeq)
);

// 수기 등록 초기 프로젝트 번호를 결정합니다.
const resolveInitialManualProjectSeq = (
  initialWorkCompanyProjectSeq: string,
  initialProjectList: CompanyWorkProjectOption[],
): string => {
  // 기본 프로젝트가 목록에 있으면 그대로 사용하고, 없으면 첫 프로젝트를 사용합니다.
  const hasInitialProject = initialProjectList.some(
    (projectItem) => String(projectItem.workCompanyProjectSeq) === initialWorkCompanyProjectSeq,
  );
  if (hasInitialProject) {
    return initialWorkCompanyProjectSeq;
  }
  return initialProjectList[0] ? String(initialProjectList[0].workCompanyProjectSeq) : '';
};

// 프로젝트 선택 안내 문구를 반환합니다.
const resolveProjectPlaceholderText = (workCompanySeq: string, projectLoading: boolean): string => {
  // 회사 선택 여부와 로딩 상태에 따라 안내 문구를 분기합니다.
  if (!workCompanySeq) {
    return '회사를 먼저 선택하세요';
  }
  if (projectLoading) {
    return '프로젝트를 불러오는 중입니다.';
  }
  return '프로젝트를 선택하세요';
};

// 선택값 문자열을 유효한 시퀀스 번호로 변환합니다.
const resolveManualSequenceValue = (value: string): number => {
  // 양의 정수 시퀀스만 유효한 값으로 사용합니다.
  const resolvedValue = Number(value);
  if (!Number.isSafeInteger(resolvedValue) || resolvedValue < 1) {
    return 0;
  }
  return resolvedValue;
};

// 수기 등록 입력 상태 기본값을 생성합니다.
const createInitialManualCreateFormState = (
  initialWorkCompanySeq: string,
  initialWorkCompanyProjectSeq: string,
  initialProjectList: CompanyWorkProjectOption[],
  workPriorList: CommonCode[],
): CompanyWorkManualCreateFormState => ({
  // 회사와 프로젝트는 기본 검색값으로 채우고, 제목과 본문과 담당자는 비우고, 우선순위는 기본값으로 채웁니다.
  workCompanySeq: initialWorkCompanySeq,
  workCompanyProjectSeq: resolveInitialManualProjectSeq(initialWorkCompanyProjectSeq, initialProjectList),
  title: '',
  content: '',
  coManager: '',
  workPriorCd: resolveDefaultWorkPriorCd(workPriorList),
});

// 회사 업무 수기 등록 레이어 팝업을 렌더링합니다.
const CompanyWorkManualCreateModal = ({
  isOpen,
  saving,
  companyList,
  initialProjectList,
  initialWorkCompanySeq,
  initialWorkCompanyProjectSeq,
  workPriorList,
  onSave,
  onClose,
}: CompanyWorkManualCreateModalProps) => {
  const [formState, setFormState] = useState<CompanyWorkManualCreateFormState>(() => (
    createInitialManualCreateFormState(
      initialWorkCompanySeq,
      initialWorkCompanyProjectSeq,
      resolveInitialManualProjectList(initialWorkCompanySeq, initialProjectList),
      workPriorList,
    )
  ));
  const [projectList, setProjectList] = useState<CompanyWorkProjectOption[]>(() => (
    resolveInitialManualProjectList(initialWorkCompanySeq, initialProjectList)
  ));
  const [projectLoading, setProjectLoading] = useState(false);

  // 본문 에디터 툴바 옵션을 구성합니다.
  const quillToolbarOptions = useMemo(() => ([
    ['bold', 'italic', 'underline'],
    [{ header: [1, 2, false] }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['blockquote', 'code-block'],
    ['link', 'image'],
    ['clean'],
  ]), []);

  // 본문 에디터 포맷 옵션을 구성합니다.
  const quillFormats = useMemo(() => ([
    'bold',
    'italic',
    'underline',
    'header',
    'list',
    'blockquote',
    'code-block',
    'link',
    'image',
  ]), []);

  // 본문 에디터 이미지 업로드와 값 변경을 연결합니다.
  const contentQuill = useQuillImageUpload({
    toolbarOptions: quillToolbarOptions,
    formats: quillFormats,
    onChange: (value: string) => {
      // 에디터 HTML 본문을 입력 상태에 반영합니다.
      setFormState((prevState) => ({
        ...prevState,
        content: value,
      }));
    },
    editorId: 'company-work-manual-create-editor',
  });

  // 선택 회사 기준 프로젝트 목록을 조회합니다.
  const loadProjectList = useCallback(async (workCompanySeqValue: string, preferredProjectSeq = '') => {
    // 회사 번호가 없으면 프로젝트 선택 상태를 초기화합니다.
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
      // 선택 회사 번호 기준 프로젝트 목록을 조회합니다.
      const nextProjectList = await fetchCompanyWorkProjectList(resolveManualSequenceValue(workCompanySeqValue));
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
      // 프로젝트 목록 조회 실패 시 프로젝트 선택값을 비우고 오류를 안내합니다.
      console.error('회사 업무 프로젝트 목록 조회에 실패했습니다.', error);
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

  // 팝업이 열리거나 기본 선택값이 바뀌면 입력 상태를 초기화합니다.
  useEffect(() => {
    const nextInitialProjectList = resolveInitialManualProjectList(initialWorkCompanySeq, initialProjectList);

    // 다음 오픈과 현재 기본값 반영을 위해 폼 상태와 프로젝트 목록을 함께 초기화합니다.
    setProjectLoading(false);
    setProjectList(nextInitialProjectList);
    setFormState(createInitialManualCreateFormState(
      initialWorkCompanySeq,
      initialWorkCompanyProjectSeq,
      nextInitialProjectList,
      workPriorList,
    ));

    // 팝업 오픈 시 기본 프로젝트 목록이 비어 있으면 최신 목록을 다시 조회합니다.
    if (isOpen && initialWorkCompanySeq && nextInitialProjectList.length < 1) {
      void loadProjectList(initialWorkCompanySeq, initialWorkCompanyProjectSeq);
    }
  }, [
    initialProjectList,
    initialWorkCompanyProjectSeq,
    initialWorkCompanySeq,
    isOpen,
    loadProjectList,
    workPriorList,
  ]);

  // 일반 입력값 변경을 처리합니다.
  const handleChangeField = useCallback(async (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;

    // 회사 변경 시 프로젝트 목록을 새로 조회하고 프로젝트 선택값을 초기화합니다.
    if (name === 'workCompanySeq') {
      setFormState((prevState) => ({
        ...prevState,
        workCompanySeq: value,
        workCompanyProjectSeq: '',
      }));
      setProjectList([]);
      await loadProjectList(value);
      return;
    }

    // 입력한 값을 제어 상태에 반영합니다.
    setFormState((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  }, [loadProjectList]);

  // 저장 버튼 클릭을 처리합니다.
  const handleClickSave = useCallback(async () => {
    const workCompanySeq = resolveManualSequenceValue(formState.workCompanySeq);
    if (!workCompanySeq) {
      notifyError('회사를 선택해주세요.');
      return;
    }

    const workCompanyProjectSeq = resolveManualSequenceValue(formState.workCompanyProjectSeq);
    if (!workCompanyProjectSeq) {
      notifyError('프로젝트를 선택해주세요.');
      return;
    }

    // 필수 제목과 우선순위를 먼저 검증합니다.
    if (!formState.title.trim()) {
      notifyError('타이틀을 입력해주세요.');
      return;
    }
    if (!formState.workPriorCd) {
      notifyError('우선순위를 선택해주세요.');
      return;
    }

    try {
      // 상위 저장 핸들러로 현재 입력값을 전달합니다.
      await onSave({
        workCompanySeq,
        workCompanyProjectSeq,
        title: formState.title,
        content: formState.content,
        coManager: formState.coManager,
        workPriorCd: formState.workPriorCd,
      });
    } catch (error) {
      // 실패 안내는 상위에서 처리하므로 여기서는 예외만 기록합니다.
      console.error('회사 업무 수기 등록에 실패했습니다.', error);
    }
  }, [formState, onSave]);

  // 프로젝트 선택 안내 문구를 계산합니다.
  const projectPlaceholderText = useMemo(() => (
    resolveProjectPlaceholderText(formState.workCompanySeq, projectLoading)
  ), [formState.workCompanySeq, projectLoading]);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="업무 수기 등록"
        width="860px"
        contentHeight="85vh"
        footerActions={(
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => { void handleClickSave(); }}
            disabled={saving || projectLoading}
          >
            {saving ? '등록 중...' : '등록'}
          </button>
        )}
      >
        <div className="company-work-manual-create-modal">
          <AdminFormTable>
            <tbody>
              <tr>
                <th scope="row">회사 / 프로젝트</th>
                <td>
                  <div className="d-flex flex-wrap align-items-center gap-2">
                    <select
                      name="workCompanySeq"
                      className="w-200px form-select company-work-manual-create-select"
                      value={formState.workCompanySeq}
                      onChange={(event) => { void handleChangeField(event); }}
                      disabled={saving}
                    >
                      <option value="" disabled>회사를 선택하세요</option>
                      {companyList.map((companyItem) => (
                        <option key={companyItem.workCompanySeq} value={companyItem.workCompanySeq}>
                          {companyItem.workCompanyNm}
                        </option>
                      ))}
                    </select>
                    <select
                      name="workCompanyProjectSeq"
                      className="w-200px form-select company-work-manual-create-select"
                      value={formState.workCompanyProjectSeq}
                      onChange={(event) => { void handleChangeField(event); }}
                      disabled={!formState.workCompanySeq || saving || projectLoading}
                    >
                      <option value="" disabled>{projectPlaceholderText}</option>
                      {projectList.map((projectItem) => (
                        <option key={projectItem.workCompanyProjectSeq} value={projectItem.workCompanyProjectSeq}>
                          {projectItem.workCompanyProjectNm}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
              </tr>
              <tr>
                <th scope="row">타이틀</th>
                <td>
                  <input
                    type="text"
                    name="title"
                    className="form-control"
                    value={formState.title}
                    onChange={(event) => { void handleChangeField(event); }}
                    placeholder="타이틀을 입력하세요"
                    disabled={saving}
                  />
                </td>
              </tr>
              <tr>
                <th scope="row">업무담당자</th>
                <td>
                  <input
                    type="text"
                    name="coManager"
                    className="form-control"
                    value={formState.coManager}
                    onChange={(event) => { void handleChangeField(event); }}
                    placeholder="업무담당자를 입력하세요"
                    disabled={saving}
                  />
                </td>
              </tr>
              <tr>
                <th scope="row">우선순위</th>
                <td>
                  <select
                    name="workPriorCd"
                    className="form-select"
                    value={formState.workPriorCd}
                    onChange={(event) => { void handleChangeField(event); }}
                    disabled={saving}
                  >
                    <option value="" disabled>우선순위를 선택하세요</option>
                    {workPriorList.map((workPriorItem) => (
                      <option key={workPriorItem.cd} value={workPriorItem.cd}>
                        {workPriorItem.cdNm}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
              <tr>
                <th scope="row">본문</th>
                <td>
                  <LazyQuillEditor
                    id="company-work-manual-create-editor"
                    ref={contentQuill.quillRef}
                    theme="snow"
                    className="company-work-manual-create-editor"
                    value={formState.content}
                    onChange={contentQuill.handleEditorChange}
                    modules={contentQuill.quillModules}
                    formats={contentQuill.quillFormats}
                  />
                  <div className="form-text mt-2">
                    개인 프로젝트처럼 외부 업무도구를 사용하지 않는 업무를 직접 등록할 수 있습니다.
                  </div>
                </td>
              </tr>
            </tbody>
          </AdminFormTable>
        </div>
      </Modal>

      <style jsx>{`
        .company-work-manual-create-modal :global(.admin-form-table th) {
          width: 160px;
          vertical-align: middle;
        }
        .company-work-manual-create-editor {
          min-height: 260px;
        }
        .company-work-manual-create-editor :global(.ql-container) {
          min-height: 220px;
        }
        .company-work-manual-create-editor :global(.ql-editor img) {
          width: auto !important;
          max-width: 100% !important;
          height: auto !important;
        }
        .company-work-manual-create-select {
          max-width: 260px;
        }
      `}</style>
    </>
  );
};

export default CompanyWorkManualCreateModal;
