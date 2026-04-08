'use client';

import React, { useCallback, useState } from 'react';
import Modal from '@/components/common/Modal';
import NewsImagePreviewModal from '@/components/common/NewsImagePreviewModal';
import CompanyWorkReplyReadOnlyContent from '@/components/companyWork/CompanyWorkReplyReadOnlyContent';
import type { CompanyWorkReply, CompanyWorkReplyFile, CompanyWorkReplyViewTarget } from '@/components/companyWork/types';
import { downloadCompanyWorkReplyFile } from '@/services/companyWorkApi';
import { notifyError } from '@/utils/ui/feedback';

interface CompanyWorkReplyViewModalProps {
  // 레이어 팝업 오픈 여부입니다.
  isOpen: boolean;
  // 댓글 목록 조회 중 여부입니다.
  loading: boolean;
  // 댓글 목록 조회 실패 메시지입니다.
  error: string | null;
  // 조회 대상 업무 정보입니다.
  target: CompanyWorkReplyViewTarget | null;
  // 댓글 목록입니다.
  replyList: CompanyWorkReply[];
  // 팝업 닫기 처리입니다.
  onClose: () => void;
}

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

// 회사 업무 댓글 조회 전용 레이어 팝업을 렌더링합니다.
const CompanyWorkReplyViewModal = ({
  isOpen,
  loading,
  error,
  target,
  replyList,
  onClose,
}: CompanyWorkReplyViewModalProps) => {
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // 이미지 미리보기 팝업을 엽니다.
  const handleOpenPreviewImage = useCallback((imageUrl: string) => {
    // 선택 이미지 URL을 저장해 미리보기 팝업을 표시합니다.
    setPreviewImageUrl(imageUrl);
  }, []);

  // 이미지 미리보기 팝업을 닫습니다.
  const handleClosePreviewImage = useCallback(() => {
    // 선택 이미지 URL을 비워 미리보기 팝업을 닫습니다.
    setPreviewImageUrl(null);
  }, []);

  // 댓글 첨부파일을 다운로드합니다.
  const handleDownloadReplyFile = useCallback(async (replyFile: CompanyWorkReplyFile) => {
    try {
      // 댓글 첨부파일 다운로드 API를 호출해 브라우저 저장을 시작합니다.
      const downloadData = await downloadCompanyWorkReplyFile(replyFile.replyFileSeq);
      triggerBrowserFileDownload(
        downloadData.blob,
        downloadData.fileName || replyFile.replyFileNm || 'company-work-reply-file',
      );
    } catch (error) {
      // 다운로드 실패 시 오류 메시지를 노출합니다.
      console.error('회사 업무 댓글 첨부파일 다운로드에 실패했습니다.', error);
      notifyError('댓글 첨부파일 다운로드에 실패했습니다.');
    }
  }, []);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="업무 댓글"
        width="1100px"
      >
        <div className="border rounded p-3 mb-3">
          <div className="small text-muted mb-1">{target?.workKey || '-'}</div>
          <div className="fw-semibold">{target?.title || '업무 제목이 없습니다.'}</div>
          <div className="small text-muted mt-2">댓글 {target?.replyCount ?? replyList.length}개</div>
        </div>

        {loading ? (
          <div className="text-muted">댓글을 불러오는 중입니다.</div>
        ) : error ? (
          <div className="text-danger">{error}</div>
        ) : replyList.length > 0 ? (
          <div className="d-flex flex-column gap-3">
            {replyList.map((replyItem) => (
              <div key={replyItem.replySeq} className="border rounded p-3">
                <div className="small text-muted mb-2">{replyItem.regDt || '-'}</div>
                <CompanyWorkReplyReadOnlyContent
                  reply={replyItem}
                  onOpenPreviewImage={handleOpenPreviewImage}
                  onDownloadReplyFile={handleDownloadReplyFile}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-muted">등록된 댓글이 없습니다.</div>
        )}
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
    </>
  );
};

export default CompanyWorkReplyViewModal;
