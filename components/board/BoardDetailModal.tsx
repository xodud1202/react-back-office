import React from 'react';
import { dateFormatter } from '@/utils/common';
import type { BoardData } from '@/components/board/types';

interface BoardDetailModalProps {
  // 팝업 오픈 여부입니다.
  isOpen: boolean;
  // 로딩 여부입니다.
  loading: boolean;
  // 에러 메시지입니다.
  error: string | null;
  // 선택된 게시글입니다.
  selectedBoard: BoardData | null;
  // 팝업 닫기 처리입니다.
  onClose: () => void;
  // 게시글 수정 열기 처리입니다.
  onOpenEdit: () => void;
}

// 게시글 상세 팝업을 렌더링합니다.
const BoardDetailModal = ({
  isOpen,
  loading,
  error,
  selectedBoard,
  onClose,
  onOpenEdit,
}: BoardDetailModalProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    <>
      <div
        className="modal fade show"
        style={{
          display: 'flex',
          position: 'fixed',
          inset: 0,
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1050,
        }}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-dialog modal-lg" style={{ margin: 0, maxWidth: '90vw', width: '100%', maxHeight: '90vh' }}>
          <div className="modal-content" style={{ height: '90vh', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header position-relative">
              <h2 className="modal-title w-100 text-center">
                {selectedBoard?.title || '게시글 상세'}
              </h2>
              <button type="button" className="btn p-0 position-absolute end-0 me-3" aria-label="닫기" onClick={onClose}>
                <i className="fa fa-window-close" aria-hidden="true"></i>
              </button>
            </div>
            <div className="modal-body" style={{ overflowY: 'auto', flex: 1 }}>
              {loading && <div>게시글을 불러오는 중입니다.</div>}
              {!loading && error && <div className="text-danger">{error}</div>}
              {!loading && !error && !selectedBoard && <div>조회된 게시글이 없습니다.</div>}
              {!loading && !error && selectedBoard && (
                <div>
                  <div className="w-100 fw-bold">
                    <div className="row w-100">
                      <div className="col-md-10 text-end">구분</div>
                      <div className="col-md-2 text-start text-primary">{selectedBoard.boardDetailDivNm || selectedBoard.boardDetailDivCd || '-'}</div>
                    </div>
                    <div className="row w-100 text-end">
                      <div className="col-md-10 text-end">등록일</div>
                      <div className="col-md-2 text-start text-primary">{dateFormatter({ value: selectedBoard?.regDt } as any)}</div>
                    </div>
                    <div className="row w-100 text-end">
                      <div className="col-md-10 text-end">수정일</div>
                      <div className="col-md-2 text-start text-primary">{dateFormatter({ value: selectedBoard?.udtDt } as any)}</div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="text-break board-detail-content quill-content">
                      {selectedBoard.content ? (
                        <div
                          className="board-detail-body"
                          dangerouslySetInnerHTML={{ __html: selectedBoard.content }}
                        />
                      ) : (
                        '내용이 없습니다.'
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-primary"
                onClick={onOpenEdit}
                disabled={!selectedBoard}
              >
                수정
              </button>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                닫기
              </button>
            </div>
          </div>
        </div>
      </div>
      <div
        className="modal-backdrop fade show"
        style={{ position: 'fixed', inset: 0, zIndex: 1040 }}
        onClick={onClose}
      ></div>
    </>
  );
};

export default BoardDetailModal;
