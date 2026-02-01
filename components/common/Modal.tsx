import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  footerActions?: React.ReactNode;
  width?: string;
  contentHeight?: string;
  children: React.ReactNode;
}

// 공통 레이어 팝업을 렌더링합니다.
const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, footerActions, width, contentHeight, children }) => {
  if (!isOpen) return null;

  return (
    <>
      <div
        className="modal fade show d-flex align-items-center justify-content-center"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        style={{
          position: 'fixed',
          inset: 0,
          margin: 0,
          padding: 0,
          zIndex: 1055,
        }}
      >
        <div className="modal-dialog modal-lg" role="document" style={{ width: width || '70vw', margin: 0 }}>
          <div
            className="modal-content d-flex flex-column"
            style={{ height: contentHeight || undefined, maxHeight: contentHeight ? undefined : '80vh' }}
          >
            <div className="modal-header d-flex align-items-center">
              <h5 className="modal-title">{title || '상세 정보'}</h5>
              <button type="button" className="btn btn-link p-0 text-white ms-auto" aria-label="닫기" onClick={onClose}>
                <i className="fa fa-window-close"></i>
              </button>
            </div>
            <div className="modal-body p-3" style={{ overflowY: 'auto' }}>
              {children}
            </div>
            <div className="modal-footer">
              <div className="modal-footer-actions">{footerActions}</div>
              <button type="button" className="btn btn-dark" onClick={onClose}>
                닫기
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" style={{ position: 'fixed', inset: 0, zIndex: 1050 }}></div>
    </>
  );
};

export default Modal;
