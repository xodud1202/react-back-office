'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CommonCode } from '@/components/goods/types';
import AdminFormTable from '@/components/common/AdminFormTable';
import Modal from '@/components/common/Modal';
import NewsImagePreviewModal from '@/components/common/NewsImagePreviewModal';
import LazyQuillEditor from '@/components/common/editor/LazyQuillEditor';
import useQuillImageUpload from '@/hooks/useQuillImageUpload';
import type {
  CompanyWorkDetailEditableValues,
  CompanyWorkDetailResponse,
  CompanyWorkFile,
  CompanyWorkSaveDetailHandler,
  CompanyWorkSaveReplyHandler,
} from '@/components/companyWork/types';

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
  onClose,
}: CompanyWorkDetailModalProps) => {
  const contentQuillRef = useRef<any>(null);
  const [formState, setFormState] = useState<CompanyWorkDetailFormState>(() => createInitialDetailFormState());
  const [replyComment, setReplyComment] = useState('');
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // 댓글 에디터 툴바 옵션을 구성합니다.
  const quillToolbarOptions = useMemo(() => ([
    ['bold', 'italic', 'underline'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link', 'image'],
    ['clean'],
  ]), []);

  // 댓글 에디터 포맷 옵션을 구성합니다.
  const quillFormats = useMemo(() => ([
    'bold',
    'italic',
    'underline',
    'list',
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

  // 읽기 전용 본문 표시값을 Quill HTML 형식으로 변환합니다.
  const readonlyContentValue = useMemo(
    () => resolveReadonlyContentValue(detailResponse?.detail?.content || ''),
    [detailResponse?.detail?.content],
  );

  // 상세 응답이 바뀌면 입력 상태를 최신값으로 동기화합니다.
  useEffect(() => {
    setFormState(buildDetailFormState(detailResponse));
  }, [detailResponse]);

  // 팝업이 닫히면 댓글 입력과 이미지 미리보기를 초기화합니다.
  useEffect(() => {
    if (isOpen) {
      return;
    }
    setReplyComment('');
    setPreviewImageUrl(null);
  }, [isOpen]);

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
    // Quill 빈 본문은 저장하지 않습니다.
    if (!hasVisibleEditorText(replyComment)) {
      alert('댓글 내용을 입력해주세요.');
      return;
    }

    try {
      // 댓글 저장 성공 시 입력창을 비웁니다.
      await onSaveReply(replyComment);
      setReplyComment('');
    } catch (errorObject) {
      // 실패 안내는 상위에서 처리하므로 여기서는 예외만 기록합니다.
      console.error('회사 업무 댓글 저장에 실패했습니다.', errorObject);
    }
  }, [onSaveReply, replyComment]);

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
                        {detailResponse.replyList.map((replyItem) => (
                          <div key={replyItem.replySeq} className="border rounded p-3">
                            <div className="small text-muted mb-2 text-end">{replyItem.regDt || '-'}</div>
                            <CompanyWorkReadonlyHtml value={replyItem.replyComment || ''} emptyText="댓글 내용이 없습니다." />
                          </div>
                        ))}
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
      `}</style>
    </>
  );
};

export default CompanyWorkDetailModal;
