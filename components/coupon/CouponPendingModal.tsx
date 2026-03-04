import React from 'react';
import Modal from '@/components/common/Modal';

interface CouponPendingModalProps {
  // 모달 오픈 여부입니다.
  isOpen: boolean;
  // 모달 닫기 함수입니다.
  onClose: () => void;
  // 모달 모드입니다.
  mode: 'CREATE' | 'EDIT';
  // 수정 대상 쿠폰 번호입니다.
  cpnNo?: number | null;
}

// 쿠폰 등록/수정 추후 개발 안내 모달을 렌더링합니다.
const CouponPendingModal = ({ isOpen, onClose, mode, cpnNo }: CouponPendingModalProps) => {
  // 모드에 따른 모달 타이틀을 계산합니다.
  const title = mode === 'CREATE' ? '쿠폰 등록' : '쿠폰 수정';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} width="480px">
      <div className="text-center py-4">
        <p className="mb-2">쿠폰 {mode === 'CREATE' ? '등록' : '수정'} 기능은 추후 개발 예정입니다.</p>
        {mode === 'EDIT' && cpnNo ? (
          <p className="mb-0 text-muted">선택된 쿠폰번호: {cpnNo}</p>
        ) : null}
      </div>
    </Modal>
  );
};

export default CouponPendingModal;
