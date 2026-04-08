'use client';

import React from 'react';
import CompanyWorkReadonlyHtml from '@/components/companyWork/CompanyWorkReadonlyHtml';
import type { CompanyWorkReply, CompanyWorkReplyFile } from '@/components/companyWork/types';

interface CompanyWorkReplyReadOnlyContentProps {
  // 읽기 전용으로 표시할 댓글 정보입니다.
  reply: CompanyWorkReply;
  // 이미지 미리보기 열기 처리입니다.
  onOpenPreviewImage: (imageUrl: string) => void;
  // 댓글 첨부파일 다운로드 처리입니다.
  onDownloadReplyFile: (replyFile: CompanyWorkReplyFile) => void | Promise<void>;
}

const COMPANY_WORK_IMAGE_FILE_PATTERN = /\.(png|jpe?g|gif|bmp|webp|svg)(\?|$)/i;
const COMPANY_WORK_REPLY_FILE_ITEM_STYLE: React.CSSProperties = {
  width: 'calc(100px + 1rem)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: '8px',
};
const COMPANY_WORK_REPLY_FILE_PREVIEW_STYLE: React.CSSProperties = {
  width: '100px',
  height: '100px',
  padding: 0,
  flex: '0 0 auto',
  overflow: 'hidden',
  borderRadius: '4px',
};
const COMPANY_WORK_REPLY_FILE_THUMBNAIL_STYLE: React.CSSProperties = {
  width: '100px',
  height: '100px',
  maxWidth: '100px',
  objectFit: 'cover',
  borderRadius: '4px',
};
const COMPANY_WORK_REPLY_FILE_NAME_STYLE: React.CSSProperties = {
  display: 'block',
  width: '100%',
  lineHeight: 1.3,
  whiteSpace: 'normal',
  wordBreak: 'break-all',
};

// 파일명과 URL 기준으로 이미지 첨부 여부를 판단합니다.
const isImageAttachmentByValues = (fileName: string, fileUrl?: string | null): boolean => {
  // 파일명 또는 URL 중 하나라도 이미지 확장자면 이미지 첨부로 간주합니다.
  return COMPANY_WORK_IMAGE_FILE_PATTERN.test(fileName || '') || COMPANY_WORK_IMAGE_FILE_PATTERN.test(fileUrl || '');
};

// 댓글 첨부파일이 이미지인지 파일명과 URL로 판단합니다.
const isImageReplyAttachment = (file: CompanyWorkReplyFile): boolean => {
  // 파일명 또는 URL에 이미지 확장자가 있으면 미리보기 대상으로 처리합니다.
  return isImageAttachmentByValues(file.replyFileNm, file.replyFileUrl);
};

// 댓글 읽기 전용 본문과 첨부파일을 렌더링합니다.
const CompanyWorkReplyReadOnlyContent = ({
  reply,
  onOpenPreviewImage,
  onDownloadReplyFile,
}: CompanyWorkReplyReadOnlyContentProps) => (
  <>
    <CompanyWorkReadonlyHtml
      value={reply.replyComment || ''}
      emptyText={reply.replyFileList.length > 0 ? '첨부파일만 등록된 댓글입니다.' : '댓글 내용이 없습니다.'}
      className="quill-content"
    />
    {reply.replyFileList.length > 0 ? (
      <div className="d-flex flex-wrap gap-3 mt-3">
        {reply.replyFileList.map((replyFileItem) => (
          <div key={replyFileItem.replyFileSeq} className="company-work-file-item border rounded p-2" style={COMPANY_WORK_REPLY_FILE_ITEM_STYLE}>
            {isImageReplyAttachment(replyFileItem) && replyFileItem.replyFileUrl ? (
              <button
                type="button"
                className="btn btn-link p-0 border-0"
                style={COMPANY_WORK_REPLY_FILE_PREVIEW_STYLE}
                onClick={() => onOpenPreviewImage(replyFileItem.replyFileUrl)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={replyFileItem.replyFileUrl}
                  alt={replyFileItem.replyFileNm || '댓글 첨부 이미지'}
                  style={COMPANY_WORK_REPLY_FILE_THUMBNAIL_STYLE}
                />
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-link p-0 border-0 d-flex align-items-center justify-content-center bg-light text-muted text-decoration-none"
                style={COMPANY_WORK_REPLY_FILE_PREVIEW_STYLE}
                onClick={() => { void onDownloadReplyFile(replyFileItem); }}
              >
                FILE
              </button>
            )}
            <button
              type="button"
              className="btn btn-link p-0 text-start small"
              style={COMPANY_WORK_REPLY_FILE_NAME_STYLE}
              onClick={() => { void onDownloadReplyFile(replyFileItem); }}
            >
              {replyFileItem.replyFileNm || '첨부파일'}
            </button>
          </div>
        ))}
      </div>
    ) : null}
  </>
);

export default CompanyWorkReplyReadOnlyContent;
