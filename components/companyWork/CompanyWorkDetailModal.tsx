'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CommonCode } from '@/components/goods/types';
import AdminFormTable from '@/components/common/AdminFormTable';
import Modal from '@/components/common/Modal';
import NewsImagePreviewModal from '@/components/common/NewsImagePreviewModal';
import LazyQuillEditor from '@/components/common/editor/LazyQuillEditor';
import useQuillImageUpload from '@/hooks/useQuillImageUpload';
import { downloadCompanyWorkReplyFile } from '@/services/companyWorkApi';
import type {
  CompanyWorkDetailEditableValues,
  CompanyWorkDetailResponse,
  CompanyWorkFile,
  CompanyWorkReply,
  CompanyWorkReplyFile,
  CompanyWorkDeleteReplyHandler,
  CompanyWorkSaveDetailHandler,
  CompanyWorkSaveReplyHandler,
  CompanyWorkUpdateReplyHandler,
} from '@/components/companyWork/types';
import { getLoginUsrNo } from '@/utils/auth';
import { useAppSelector } from '@/utils/hooks/redux';
import { notifyError } from '@/utils/ui/feedback';

interface CompanyWorkDetailModalProps {
  // 레이어 팝업 오픈 여부입니다.
  isOpen: boolean;
  // 상세 조회 중 여부입니다.
  loading: boolean;
  // 상세 저장 중 여부입니다.
  saving: boolean;
  // 댓글 저장 중 여부입니다.
  replySaving: boolean;
  // 상세 조회 실패 메시지입니다.
  error: string | null;
  // 상세 팝업 데이터입니다.
  detailResponse: CompanyWorkDetailResponse | null;
  // 업무 상태 공통코드 목록입니다.
  workStatList: CommonCode[];
  // 상세 저장 처리입니다.
  onSave: CompanyWorkSaveDetailHandler;
  // 댓글 등록 처리입니다.
  onSaveReply: CompanyWorkSaveReplyHandler;
  // 댓글 수정 처리입니다.
  onUpdateReply: CompanyWorkUpdateReplyHandler;
  // 댓글 삭제 처리입니다.
  onDeleteReply: CompanyWorkDeleteReplyHandler;
  // 팝업 닫기 처리입니다.
  onClose: () => void;
}

interface CompanyWorkDetailFormState {
  // 업무 상태 코드입니다.
  workStatCd: string;
  // 업무 시작일입니다.
  workStartDt: string;
  // 업무 종료일입니다.
  workEndDt: string;
  // 업무 공수시간 입력값입니다.
  workTime: string;
}

const COMPANY_WORK_IMAGE_FILE_PATTERN = /\.(png|jpe?g|gif|bmp|webp|svg)(\?|$)/i;
const COMPANY_WORK_REPLY_FILE_ACCEPT = '.pdf,.xls,.xlsx,.doc,.docx,.ppt,.pptx,.txt,.zip,.jpg,.jpeg,.png,.gif';
const COMPANY_WORK_CONTENT_QUILL_FORMATS = [
  'bold',
  'italic',
  'underline',
  'strike',
  'list',
  'link',
  'blockquote',
  'code-block',
  'header',
];

// 회사 업무 상세 입력 상태 기본값을 생성합니다.
const createInitialDetailFormState = (): CompanyWorkDetailFormState => ({
  // 상세 모달 초기 입력값은 모두 비워둡니다.
  workStatCd: '',
  workStartDt: '',
  workEndDt: '',
  workTime: '',
});

// 상세 응답을 입력 상태로 변환합니다.
const buildDetailFormState = (detailResponse: CompanyWorkDetailResponse | null): CompanyWorkDetailFormState => ({
  // 서버 상세값을 input 제어용 문자열로 맞춥니다.
  workStatCd: detailResponse?.detail?.workStatCd || '',
  workStartDt: detailResponse?.detail?.workStartDt || '',
  workEndDt: detailResponse?.detail?.workEndDt || '',
  workTime: detailResponse?.detail?.workTime == null ? '' : String(detailResponse.detail.workTime),
});

// HTML 마크업이 포함된 문자열인지 판단합니다.
const hasHtmlMarkup = (value: string): boolean => {
  // 태그 형태가 보이면 HTML 본문으로 간주합니다.
  return /<\s*[a-z][^>]*>/i.test(value);
};

// Quill value로 안전하게 넣기 위해 일반 텍스트를 HTML로 변환합니다.
const convertPlainTextToHtml = (value: string): string => {
  // 특수문자를 이스케이프하고 줄 단위 문단으로 감쌉니다.
  const escapedValue = value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  return escapedValue
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => (line.trim() ? `<p>${line}</p>` : '<p><br></p>'))
    .join('');
};

// 본문 문자열을 읽기 전용 Quill value 형식으로 변환합니다.
const resolveReadonlyContentValue = (value: string): string => {
  // HTML 본문은 그대로 사용하고 일반 텍스트는 HTML 문단으로 변환합니다.
  if (!value.trim()) {
    return '<p><br></p>';
  }
  if (hasHtmlMarkup(value)) {
    return value;
  }
  return convertPlainTextToHtml(value);
};

// Quill 본문이 실제 텍스트를 포함하는지 판단합니다.
const hasVisibleEditorText = (value: string): boolean => {
  // 태그와 nbsp를 제거한 뒤 표시 가능한 문자가 있는지 확인합니다.
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim() !== '';
};

// 첨부파일이 이미지인지 파일명과 URL로 판단합니다.
const isImageAttachment = (file: CompanyWorkFile): boolean => {
  // 파일명 또는 URL에 이미지 확장자가 있으면 미리보기 대상으로 처리합니다.
  return COMPANY_WORK_IMAGE_FILE_PATTERN.test(file.workJobFileNm || '') || COMPANY_WORK_IMAGE_FILE_PATTERN.test(file.workJobFileUrl || '');
};

// 읽기 전용 HTML 또는 텍스트 본문을 렌더링합니다.
const CompanyWorkReadonlyHtml = ({ value, emptyText }: { value: string; emptyText: string }) => {
  // 값이 없으면 안내 문구를 표시합니다.
  if (!value.trim()) {
    return <div className="text-muted">{emptyText}</div>;
  }

  // HTML 마크업이 있으면 그대로 렌더링하고, 아니면 줄바꿈을 유지합니다.
  if (hasHtmlMarkup(value)) {
    return <div dangerouslySetInnerHTML={{ __html: value }} />;
  }
  return <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{value}</div>;
};

// 브라우저 다운로드를 시작합니다.
const triggerBrowserFileDownload = (blob: Blob, fileName: string) => {
  // Blob URL을 생성해 임시 다운로드 링크를 클릭합니다.
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = fileName;
  link.click();
  window.URL.revokeObjectURL(blobUrl);
};

// 회사 업무 상세 레이어 팝업을 렌더링합니다.
const CompanyWorkDetailModal = ({
  isOpen,
  loading,
  saving,
  replySaving,
  error,
  detailResponse,
  workStatList,
  onSave,
  onSaveReply,
  onUpdateReply,
  onDeleteReply,
  onClose,
}: CompanyWorkDetailModalProps) => {
  const contentQuillRef = useRef<any>(null);
  const replyFileInputRef = useRef<HTMLInputElement | null>(null);
  const editingReplyFileInputRef = useRef<HTMLInputElement | null>(null);
  const [formState, setFormState] = useState<CompanyWorkDetailFormState>(() => createInitialDetailFormState());
  const [replyComment, setReplyComment] = useState('');
  const [replyFiles, setReplyFiles] = useState<File[]>([]);
  const [editingReplySeq, setEditingReplySeq] = useState<number | null>(null);
  const [editingReplyComment, setEditingReplyComment] = useState('');
  const [editingReplyFiles, setEditingReplyFiles] = useState<File[]>([]);
  const [editingDeleteReplyFileSeqList, setEditingDeleteReplyFileSeqList] = useState<number[]>([]);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const loginUsrNoFromStore = useAppSelector((state) => state.auth.user?.usrNo ?? 0);
  const currentLoginUsrNo = useMemo(
    () => loginUsrNoFromStore || getLoginUsrNo() || 0,
    [loginUsrNoFromStore],
  );
  const editingReplyEditorId = useMemo(
    () => `company-work-reply-edit-editor-${editingReplySeq || 'none'}`,
    [editingReplySeq],
  );

  // 댓글 에디터 툴바 옵션을 구성합니다.
  const quillToolbarOptions = useMemo(() => ([
    ['bold', 'italic', 'underline'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['code-block'],
    ['link', 'image'],
    ['clean'],
  ]), []);

  // 댓글 에디터 포맷 옵션을 구성합니다.
  const quillFormats = useMemo(() => ([
    'bold',
    'italic',
    'underline',
    'list',
    'code-block',
    'link',
    'image',
  ]), []);

  // 댓글 에디터에 이미지 업로드와 붙여넣기 업로드를 연결합니다.
  const replyQuill = useQuillImageUpload({
    toolbarOptions: quillToolbarOptions,
    formats: quillFormats,
    onChange: setReplyComment,
    editorId: 'company-work-reply-editor',
  });

  // 댓글 수정 에디터에 이미지 업로드와 붙여넣기 업로드를 연결합니다.
  const editingReplyQuill = useQuillImageUpload({
    toolbarOptions: quillToolbarOptions,
    formats: quillFormats,
    onChange: setEditingReplyComment,
    editorId: editingReplyEditorId,
  });

  // 읽기 전용 본문 표시값을 Quill HTML 형식으로 변환합니다.
  const readonlyContentValue = useMemo(
    () => resolveReadonlyContentValue(detailResponse?.detail?.content || ''),
    [detailResponse?.detail?.content],
  );

  // 댓글 수정 상태를 초기화합니다.
  const resetEditingReplyState = useCallback(() => {
    // 수정 대상과 첨부 선택 상태를 모두 비웁니다.
    setEditingReplySeq(null);
    setEditingReplyComment('');
    setEditingReplyFiles([]);
    setEditingDeleteReplyFileSeqList([]);
    if (editingReplyFileInputRef.current) {
      // 파일 입력창 값도 함께 비워 동일 파일을 다시 선택할 수 있게 합니다.
      editingReplyFileInputRef.current.value = '';
    }
  }, []);

  // 상세 응답이 바뀌면 입력 상태를 최신값으로 동기화합니다.
  useEffect(() => {
    setFormState(buildDetailFormState(detailResponse));
  }, [detailResponse]);

  // 다른 업무 상세를 열면 댓글 작성/수정 상태를 초기화합니다.
  useEffect(() => {
    setReplyComment('');
    setReplyFiles([]);
    resetEditingReplyState();
    if (replyFileInputRef.current) {
      // 파일 입력창 값도 함께 비워 이전 업무 선택 상태가 남지 않게 합니다.
      replyFileInputRef.current.value = '';
    }
  }, [detailResponse?.detail?.workSeq, resetEditingReplyState]);

  // 팝업이 닫히면 댓글 입력과 이미지 미리보기를 초기화합니다.
  useEffect(() => {
    if (isOpen) {
      return;
    }
    setReplyComment('');
    setReplyFiles([]);
    resetEditingReplyState();
    setPreviewImageUrl(null);
    if (replyFileInputRef.current) {
      // 파일 입력창 값도 함께 비워 동일 파일을 다시 선택할 수 있게 합니다.
      replyFileInputRef.current.value = '';
    }
  }, [isOpen, resetEditingReplyState]);

  // 일반 입력값 변경을 처리합니다.
  const handleChangeField = useCallback((event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;

    // 입력한 값을 제어 상태에 반영합니다.
    setFormState((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  }, []);

  // 저장 버튼 클릭을 처리합니다.
  const handleClickSave = useCallback(async () => {
    let resolvedWorkTime: number | null = null;
    const normalizedWorkTime = formState.workTime.trim();

    // 공수시간 입력값이 있으면 정수 여부를 먼저 검증합니다.
    if (normalizedWorkTime !== '') {
      if (!/^\d+$/.test(normalizedWorkTime)) {
        alert('업무 공수시간을 확인해주세요.');
        return;
      }
      resolvedWorkTime = Number(normalizedWorkTime);
    }

    const savePayload: CompanyWorkDetailEditableValues = {
      workStatCd: formState.workStatCd,
      workStartDt: formState.workStartDt,
      workEndDt: formState.workEndDt,
      workTime: resolvedWorkTime,
    };

    try {
      // 상세 저장 요청을 상위로 전달합니다.
      await onSave(savePayload);
    } catch (errorObject) {
      // 실패 안내는 상위에서 처리하므로 여기서는 예외만 기록합니다.
      console.error('회사 업무 상세 저장에 실패했습니다.', errorObject);
    }
  }, [formState, onSave]);

  // 댓글등록 버튼 클릭을 처리합니다.
  const handleClickSaveReply = useCallback(async () => {
    // 댓글 본문과 첨부파일이 모두 비어 있으면 저장하지 않습니다.
    if (!hasVisibleEditorText(replyComment) && replyFiles.length < 1) {
      alert('댓글 내용 또는 첨부파일을 등록해주세요.');
      return;
    }

    try {
      // 댓글 저장 성공 시 입력창을 비웁니다.
      await onSaveReply(replyComment, replyFiles);
      setReplyComment('');
      setReplyFiles([]);
      if (replyFileInputRef.current) {
        // 저장 완료 후 파일 입력창 값도 초기화합니다.
        replyFileInputRef.current.value = '';
      }
    } catch (errorObject) {
      // 실패 안내는 상위에서 처리하므로 여기서는 예외만 기록합니다.
      console.error('회사 업무 댓글 저장에 실패했습니다.', errorObject);
    }
  }, [onSaveReply, replyComment, replyFiles]);

  // 댓글 첨부파일 선택을 처리합니다.
  const handleChangeReplyFiles = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFileList = Array.from(event.target.files || []);
    if (nextFileList.length < 1) {
      return;
    }

    // 기존 선택 목록 뒤에 새 파일을 이어 붙입니다.
    setReplyFiles((prevState) => [...prevState, ...nextFileList]);
    event.target.value = '';
  }, []);

  // 선택한 댓글 첨부파일을 목록에서 제거합니다.
  const handleRemoveReplyFile = useCallback((targetIndex: number) => {
    // 선택 목록에서 해당 인덱스의 파일만 제외합니다.
    setReplyFiles((prevState) => prevState.filter((_, fileIndex) => fileIndex !== targetIndex));
  }, []);

  // 댓글 수정 모드를 시작합니다.
  const handleStartEditReply = useCallback((reply: CompanyWorkReply) => {
    // 대상 댓글 기준으로 수정 입력 상태를 초기화합니다.
    setEditingReplySeq(reply.replySeq);
    setEditingReplyComment(reply.replyComment || '');
    setEditingReplyFiles([]);
    setEditingDeleteReplyFileSeqList([]);
    if (editingReplyFileInputRef.current) {
      // 파일 입력창 값도 함께 비워 이전 선택 상태가 남지 않게 합니다.
      editingReplyFileInputRef.current.value = '';
    }
  }, []);

  // 댓글 수정 모드를 취소합니다.
  const handleCancelEditReply = useCallback(() => {
    // 수정 중 입력 상태를 모두 초기화합니다.
    resetEditingReplyState();
  }, [resetEditingReplyState]);

  // 댓글 수정 첨부파일 선택을 처리합니다.
  const handleChangeEditingReplyFiles = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFileList = Array.from(event.target.files || []);
    if (nextFileList.length < 1) {
      return;
    }

    // 기존 선택 목록 뒤에 새 파일을 이어 붙입니다.
    setEditingReplyFiles((prevState) => [...prevState, ...nextFileList]);
    event.target.value = '';
  }, []);

  // 선택한 댓글 수정 신규 첨부파일을 목록에서 제거합니다.
  const handleRemoveEditingReplyFile = useCallback((targetIndex: number) => {
    // 선택 목록에서 해당 인덱스의 파일만 제외합니다.
    setEditingReplyFiles((prevState) => prevState.filter((_, fileIndex) => fileIndex !== targetIndex));
  }, []);

  // 기존 댓글 첨부파일 삭제 대상을 토글합니다.
  const handleToggleDeleteEditingReplyFile = useCallback((replyFileSeq: number) => {
    // 이미 삭제 대상으로 표시된 파일이면 취소하고, 아니면 삭제 대상으로 추가합니다.
    setEditingDeleteReplyFileSeqList((prevState) => (
      prevState.includes(replyFileSeq)
        ? prevState.filter((fileSeq) => fileSeq !== replyFileSeq)
        : [...prevState, replyFileSeq]
    ));
  }, []);

  // 현재 댓글 첨부파일이 삭제 대상으로 표시되었는지 확인합니다.
  const isEditingReplyFileDeleted = useCallback((replyFileSeq: number) => {
    // 삭제 대상 시퀀스 목록에 포함되어 있으면 true를 반환합니다.
    return editingDeleteReplyFileSeqList.includes(replyFileSeq);
  }, [editingDeleteReplyFileSeqList]);

  // 댓글 수정 저장 버튼 클릭을 처리합니다.
  const handleClickUpdateReply = useCallback(async (reply: CompanyWorkReply) => {
    const activeExistingReplyFileCount = reply.replyFileList.filter(
      (replyFileItem) => !editingDeleteReplyFileSeqList.includes(replyFileItem.replyFileSeq),
    ).length;

    // 수정 후 본문과 활성 첨부가 모두 없으면 저장하지 않습니다.
    if (!hasVisibleEditorText(editingReplyComment) && activeExistingReplyFileCount < 1 && editingReplyFiles.length < 1) {
      alert('댓글 내용 또는 첨부파일을 등록해주세요.');
      return;
    }

    try {
      // 댓글 수정 성공 시 수정 상태를 초기화합니다.
      await onUpdateReply(reply.replySeq, editingReplyComment, editingDeleteReplyFileSeqList, editingReplyFiles);
      resetEditingReplyState();
    } catch (errorObject) {
      // 실패 안내는 상위에서 처리하므로 여기서는 예외만 기록합니다.
      console.error('회사 업무 댓글 수정에 실패했습니다.', errorObject);
    }
  }, [editingDeleteReplyFileSeqList, editingReplyComment, editingReplyFiles, onUpdateReply, resetEditingReplyState]);

  // 댓글 삭제 버튼 클릭을 처리합니다.
  const handleClickDeleteReply = useCallback(async (reply: CompanyWorkReply) => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) {
      return;
    }

    try {
      // 댓글 삭제 성공 시 수정 중인 대상이면 함께 초기화합니다.
      await onDeleteReply(reply.replySeq);
      if (editingReplySeq === reply.replySeq) {
        resetEditingReplyState();
      }
    } catch (errorObject) {
      // 실패 안내는 상위에서 처리하므로 여기서는 예외만 기록합니다.
      console.error('회사 업무 댓글 삭제에 실패했습니다.', errorObject);
    }
  }, [editingReplySeq, onDeleteReply, resetEditingReplyState]);

  // 첨부 이미지 미리보기를 엽니다.
  const handleOpenPreviewImage = useCallback((imageUrl: string) => {
    // 선택한 이미지를 미리보기 상태에 반영합니다.
    setPreviewImageUrl(imageUrl);
  }, []);

  // 첨부 이미지 미리보기를 닫습니다.
  const handleClosePreviewImage = useCallback(() => {
    // 미리보기 URL을 제거합니다.
    setPreviewImageUrl(null);
  }, []);

  // 저장된 댓글 첨부파일 다운로드를 처리합니다.
  const handleDownloadReplyFile = useCallback(async (replyFile: CompanyWorkReplyFile) => {
    try {
      // 댓글 첨부파일 다운로드 API를 호출한 뒤 브라우저 저장을 시작합니다.
      const downloadData = await downloadCompanyWorkReplyFile(replyFile.replyFileSeq);
      triggerBrowserFileDownload(
        downloadData.blob,
        downloadData.fileName || replyFile.replyFileNm || 'company-work-reply-file'
      );
    } catch (errorObject) {
      // 다운로드 실패 시 사용자에게 오류를 안내합니다.
      console.error('회사 업무 댓글 첨부파일 다운로드에 실패했습니다.', errorObject);
      notifyError('댓글 첨부파일 다운로드에 실패했습니다.');
    }
  }, []);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="회사 업무 상세"
        width="90vw"
        contentHeight="90vh"
        footerActions={(
          <button type="button" className="btn btn-primary" onClick={() => { void handleClickSave(); }} disabled={loading || saving || !detailResponse?.detail}>
            {saving ? '저장 중...' : '저장'}
          </button>
        )}
      >
        {loading ? (
          <div className="text-center text-muted py-5">업무 상세 정보를 불러오는 중입니다.</div>
        ) : null}
        {!loading && error ? (
          <div className="text-danger">{error}</div>
        ) : null}
        {!loading && !error && !detailResponse?.detail ? (
          <div className="text-muted">조회된 업무 상세가 없습니다.</div>
        ) : null}
        {!loading && !error && detailResponse?.detail ? (
          <div className="company-work-detail-modal">
            <AdminFormTable>
              <tbody>
                <tr>
                  <th scope="row">회사 / 프로젝트</th>
                  <td>
                    <div className="form-control-plaintext">
                      {detailResponse.detail.workCompanyNm} / {detailResponse.detail.workCompanyProjectNm}
                    </div>
                  </td>
                  <th scope="row">업무 생성 일시</th>
                  <td>
                    <div className="form-control-plaintext">{detailResponse.detail.workCreateDt || '-'}</div>
                  </td>
                </tr>
                <tr>
                  <th scope="row">타이틀</th>
                  <td colSpan={3}>
                    <div className="form-control-plaintext">{detailResponse.detail.title || '-'}</div>
                  </td>
                </tr>
                <tr>
                  <th scope="row">상태</th>
                  <td>
                    <select
                      name="workStatCd"
                      className="form-select"
                      value={formState.workStatCd}
                      onChange={handleChangeField}
                    >
                      {workStatList.map((workStatItem) => (
                        <option key={workStatItem.cd} value={workStatItem.cd}>{workStatItem.cdNm}</option>
                      ))}
                    </select>
                  </td>
                  <th scope="row">업무 공수시간</th>
                  <td>
                    <input
                      type="number"
                      name="workTime"
                      className="form-control"
                      min="0"
                      step="1"
                      value={formState.workTime}
                      onChange={handleChangeField}
                    />
                  </td>
                </tr>
                <tr>
                  <th scope="row">업무 시작일시</th>
                  <td>
                    <input
                      type="date"
                      name="workStartDt"
                      className="form-control"
                      value={formState.workStartDt}
                      onChange={handleChangeField}
                    />
                  </td>
                  <th scope="row">업무 종료일시</th>
                  <td>
                    <input
                      type="date"
                      name="workEndDt"
                      className="form-control"
                      value={formState.workEndDt}
                      onChange={handleChangeField}
                    />
                  </td>
                </tr>
                <tr>
                  <th scope="row">본문</th>
                  <td colSpan={3}>
                    <div className="company-work-detail-body">
                      <LazyQuillEditor
                        ref={contentQuillRef}
                        theme="snow"
                        className="company-work-content-editor"
                        value={readonlyContentValue}
                        readOnly
                        modules={{ toolbar: false }}
                        formats={COMPANY_WORK_CONTENT_QUILL_FORMATS}
                      />
                    </div>
                  </td>
                </tr>
                <tr>
                  <th scope="row">첨부파일</th>
                  <td colSpan={3}>
                    {detailResponse.fileList.length > 0 ? (
                      <div className="d-flex flex-wrap gap-3">
                        {detailResponse.fileList.map((fileItem) => (
                          <div key={fileItem.workJobFileSeq} className="company-work-file-item border rounded p-2">
                            {isImageAttachment(fileItem) && fileItem.workJobFileUrl ? (
                              <button
                                type="button"
                                className="btn btn-link p-0 border-0 company-work-file-preview-button"
                                onClick={() => handleOpenPreviewImage(fileItem.workJobFileUrl)}
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={fileItem.workJobFileUrl}
                                  alt={fileItem.workJobFileNm || '업무 첨부 이미지'}
                                  className="company-work-file-thumbnail"
                                />
                              </button>
                            ) : (
                              fileItem.workJobFileUrl ? (
                                <a
                                  href={fileItem.workJobFileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  download
                                  className="company-work-file-preview-link d-flex align-items-center justify-content-center bg-light text-muted text-decoration-none"
                                >
                                  FILE
                                </a>
                              ) : (
                                <div className="company-work-file-preview-link d-flex align-items-center justify-content-center bg-light text-muted">
                                  FILE
                                </div>
                              )
                            )}
                            {fileItem.workJobFileUrl ? (
                              <a
                                href={fileItem.workJobFileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                download
                                className="company-work-file-name-link small"
                              >
                                {fileItem.workJobFileNm || '첨부파일'}
                              </a>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-muted">첨부파일이 없습니다.</div>
                    )}
                  </td>
                </tr>
                <tr>
                  <th scope="row">댓글쓰기</th>
                  <td colSpan={3}>
                    <LazyQuillEditor
                      id="company-work-reply-editor"
                      ref={replyQuill.quillRef}
                      theme="snow"
                      className="company-work-reply-editor"
                      value={replyComment}
                      onChange={replyQuill.handleEditorChange}
                      modules={replyQuill.quillModules}
                      formats={replyQuill.quillFormats}
                    />
                    <div className="mt-3">
                      <input
                        type="file"
                        ref={replyFileInputRef}
                        className="form-control"
                        multiple
                        accept={COMPANY_WORK_REPLY_FILE_ACCEPT}
                        onChange={handleChangeReplyFiles}
                      />
                      <div className="form-text">문서와 이미지 파일을 여러 개 첨부할 수 있습니다. 파일당 최대 10MB까지 업로드 가능합니다.</div>
                    </div>
                    {replyFiles.length > 0 ? (
                      <div className="company-work-reply-selected-file-list mt-3">
                        {replyFiles.map((fileItem, fileIndex) => (
                          <div key={`${fileItem.name}-${fileItem.size}-${fileItem.lastModified}-${fileIndex}`} className="company-work-reply-selected-file-item">
                            <span className="company-work-reply-selected-file-name">{fileItem.name}</span>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => handleRemoveReplyFile(fileIndex)}
                            >
                              제거
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    <div className="d-flex justify-content-end mt-3">
                      <button
                        type="button"
                        className="btn btn-outline-primary"
                        onClick={() => { void handleClickSaveReply(); }}
                        disabled={replySaving || !detailResponse?.detail}
                      >
                        {replySaving ? '등록 중...' : '댓글등록'}
                      </button>
                    </div>
                  </td>
                </tr>
                <tr>
                  <th scope="row">댓글목록</th>
                  <td colSpan={3}>
                    {detailResponse.replyList.length > 0 ? (
                      <div className="d-flex flex-column gap-3">
                        {detailResponse.replyList.map((replyItem) => {
                          const isEditableReply = currentLoginUsrNo > 0 && replyItem.regNo === currentLoginUsrNo;
                          const isEditingReply = editingReplySeq === replyItem.replySeq;

                          return (
                            <div key={replyItem.replySeq} className="border rounded p-3">
                              <div className="company-work-reply-card-header d-flex justify-content-between align-items-start gap-3 mb-2">
                                <div className="small text-muted">{replyItem.regDt || '-'}</div>
                                {isEditableReply ? (
                                  isEditingReply ? (
                                    <div className="d-flex gap-2 flex-shrink-0">
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-outline-secondary"
                                        onClick={handleCancelEditReply}
                                        disabled={replySaving}
                                      >
                                        취소
                                      </button>
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-outline-primary"
                                        onClick={() => { void handleClickUpdateReply(replyItem); }}
                                        disabled={replySaving}
                                      >
                                        {replySaving ? '저장 중...' : '저장'}
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="d-flex gap-2 flex-shrink-0">
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-outline-primary"
                                        onClick={() => handleStartEditReply(replyItem)}
                                        disabled={replySaving}
                                      >
                                        수정
                                      </button>
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-outline-danger"
                                        onClick={() => { void handleClickDeleteReply(replyItem); }}
                                        disabled={replySaving}
                                      >
                                        삭제
                                      </button>
                                    </div>
                                  )
                                ) : null}
                              </div>

                              {isEditingReply ? (
                                <>
                                  <LazyQuillEditor
                                    id={editingReplyEditorId}
                                    ref={editingReplyQuill.quillRef}
                                    theme="snow"
                                    className="company-work-reply-editor"
                                    value={editingReplyComment}
                                    onChange={editingReplyQuill.handleEditorChange}
                                    modules={editingReplyQuill.quillModules}
                                    formats={editingReplyQuill.quillFormats}
                                  />
                                  {replyItem.replyFileList.length > 0 ? (
                                    <div className="company-work-reply-edit-file-list mt-3">
                                      {replyItem.replyFileList.map((replyFileItem) => {
                                        const isDeletedReplyFile = isEditingReplyFileDeleted(replyFileItem.replyFileSeq);
                                        return (
                                          <div
                                            key={replyFileItem.replyFileSeq}
                                            className={`company-work-reply-edit-file-item ${isDeletedReplyFile ? 'is-deleted' : ''}`}
                                          >
                                            <button
                                              type="button"
                                              className="btn btn-sm btn-outline-primary company-work-reply-file-button"
                                              onClick={() => { void handleDownloadReplyFile(replyFileItem); }}
                                            >
                                              {replyFileItem.replyFileNm || '첨부파일'}
                                            </button>
                                            <button
                                              type="button"
                                              className={`btn btn-sm ${isDeletedReplyFile ? 'btn-outline-secondary' : 'btn-outline-danger'}`}
                                              onClick={() => handleToggleDeleteEditingReplyFile(replyFileItem.replyFileSeq)}
                                              disabled={replySaving}
                                            >
                                              {isDeletedReplyFile ? '삭제취소' : '삭제'}
                                            </button>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : null}
                                  <div className="mt-3">
                                    <input
                                      type="file"
                                      ref={editingReplyFileInputRef}
                                      className="form-control"
                                      multiple
                                      accept={COMPANY_WORK_REPLY_FILE_ACCEPT}
                                      onChange={handleChangeEditingReplyFiles}
                                    />
                                    <div className="form-text">기존 첨부는 삭제만 가능하고, 새 첨부는 여러 개 추가할 수 있습니다.</div>
                                  </div>
                                  {editingReplyFiles.length > 0 ? (
                                    <div className="company-work-reply-selected-file-list mt-3">
                                      {editingReplyFiles.map((fileItem, fileIndex) => (
                                        <div key={`${fileItem.name}-${fileItem.size}-${fileItem.lastModified}-${fileIndex}`} className="company-work-reply-selected-file-item">
                                          <span className="company-work-reply-selected-file-name">{fileItem.name}</span>
                                          <button
                                            type="button"
                                            className="btn btn-sm btn-outline-secondary"
                                            onClick={() => handleRemoveEditingReplyFile(fileIndex)}
                                            disabled={replySaving}
                                          >
                                            제거
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  ) : null}
                                </>
                              ) : (
                                <>
                                  <CompanyWorkReadonlyHtml
                                    value={replyItem.replyComment || ''}
                                    emptyText={replyItem.replyFileList.length > 0 ? '첨부파일만 등록된 댓글입니다.' : '댓글 내용이 없습니다.'}
                                  />
                                  {replyItem.replyFileList.length > 0 ? (
                                    <div className="company-work-reply-file-list mt-3">
                                      {replyItem.replyFileList.map((replyFileItem) => (
                                        <button
                                          key={replyFileItem.replyFileSeq}
                                          type="button"
                                          className="btn btn-sm btn-outline-primary company-work-reply-file-button"
                                          onClick={() => { void handleDownloadReplyFile(replyFileItem); }}
                                        >
                                          {replyFileItem.replyFileNm || '첨부파일'}
                                        </button>
                                      ))}
                                    </div>
                                  ) : null}
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-muted">등록된 댓글이 없습니다.</div>
                    )}
                  </td>
                </tr>
              </tbody>
            </AdminFormTable>
          </div>
        ) : null}
      </Modal>

      <NewsImagePreviewModal
        isOpen={!!previewImageUrl}
        imageUrl={previewImageUrl}
        onClose={handleClosePreviewImage}
        width="80vw"
        height="80vh"
        maxWidth="80vw"
        maxHeight="80vh"
      />

      <style jsx>{`
        .company-work-detail-modal :global(.admin-form-table th) {
          width: 160px;
          vertical-align: middle;
        }
        .company-work-detail-body {
          min-height: 220px;
        }
        .company-work-content-editor :global(.ql-toolbar) {
          display: none;
        }
        .company-work-content-editor :global(.ql-container) {
          min-height: 220px;
          max-height: 320px;
          overflow-y: auto;
          border-top: 1px solid #dee2e6 !important;
          border-radius: 0.375rem;
          background-color: #ffffff;
        }
        .company-work-content-editor :global(.ql-editor) {
          color: #212529;
          white-space: normal;
        }
        .company-work-content-editor :global(.ql-editor img),
        .company-work-reply-editor :global(.ql-editor img) {
          width: auto !important;
          max-width: 100% !important;
          height: auto !important;
          border-radius: 0 !important;
        }
        .company-work-file-item {
          width: calc(100px + 1rem);
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
        }
        .company-work-file-thumbnail,
        .company-work-file-preview-link,
        .company-work-file-preview-button {
          width: 100px !important;
          height: 100px !important;
          padding: 0;
          flex: 0 0 auto;
          overflow: hidden;
        }
        .company-work-file-thumbnail,
        .company-work-file-preview-link {
          width: 100px !important;
          height: 100px !important;
          object-fit: cover;
          border-radius: 4px !important;
        }
        .company-work-file-preview-button {
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 0;
          border-radius: 4px;
        }
        .company-work-file-preview-link {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .company-work-file-item :global(img.company-work-file-thumbnail) {
          width: 100px !important;
          height: 100px !important;
          max-width: 100px !important;
          object-fit: cover !important;
          border-radius: 4px !important;
        }
        .company-work-file-name-link {
          display: block;
          width: 100%;
          line-height: 1.3;
          white-space: normal;
          word-break: break-all;
        }
        .company-work-reply-editor {
          min-height: 180px;
        }
        .company-work-reply-editor :global(.ql-container) {
          min-height: 130px;
        }
        .company-work-reply-selected-file-list,
        .company-work-reply-file-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .company-work-reply-edit-file-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .company-work-reply-edit-file-item {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .company-work-reply-edit-file-item.is-deleted {
          opacity: 0.6;
        }
        .company-work-reply-edit-file-item.is-deleted :global(.company-work-reply-file-button) {
          text-decoration: line-through;
        }
        .company-work-reply-selected-file-item {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 10px;
          border: 1px solid #dee2e6;
          border-radius: 999px;
          background-color: #f8f9fa;
          max-width: 100%;
        }
        .company-work-reply-selected-file-name {
          max-width: 360px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .company-work-reply-file-button {
          max-width: 100%;
          word-break: break-all;
        }
      `}</style>
    </>
  );
};

export default CompanyWorkDetailModal;
