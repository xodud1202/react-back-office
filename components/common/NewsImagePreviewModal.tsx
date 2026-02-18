import React, { useCallback, useEffect } from 'react';

// 이미지 미리보기 모달 속성 타입입니다.
interface NewsImagePreviewModalProps {
  isOpen: boolean;
  imageUrl: string | null;
  onClose: () => void;
}

// 뉴스 이미지 미리보기 모달을 렌더링합니다.
const NewsImagePreviewModal: React.FC<NewsImagePreviewModalProps> = ({ isOpen, imageUrl, onClose }) => {
  // 모달이 열릴 때 배경 스크롤을 잠급니다.
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  // 배경 클릭 시 모달을 닫습니다.
  const handleBackdropClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }, [onClose]);

  // 닫기 버튼 클릭을 처리합니다.
  const handleCloseClick = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!isOpen || !imageUrl) {
    return null;
  }

  return (
    <>
      <div
        className="modal fade show d-flex align-items-center justify-content-center"
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        onClick={handleBackdropClick}
        style={{
          position: 'fixed',
          inset: 0,
          margin: 0,
          padding: 0,
          zIndex: 1060,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }}
      >
        <div
          role="document"
          style={{
            width: '500px',
            height: '500px',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <button
            type="button"
            className="btn btn-light"
            aria-label="닫기"
            onClick={handleCloseClick}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              zIndex: 1,
            }}
          >
            닫기
          </button>
          <img
            src={imageUrl}
            alt="뉴스 타이틀 이미지"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block',
              backgroundColor: '#f8f9fa',
            }}
          />
        </div>
      </div>
    </>
  );
};

export default NewsImagePreviewModal;
