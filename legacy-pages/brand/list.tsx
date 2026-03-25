import React, { useCallback, useEffect, useRef, useState } from 'react';
import BrandSearchForm from '@/components/brand/BrandSearchForm';
import BrandListGrid, { type BrandListGridHandle } from '@/components/brand/BrandListGrid';
import BrandEditModal from '@/components/brand/BrandEditModal';
import api from '@/utils/axios/axios';
import { requireLoginUsrNo } from '@/utils/auth';

// 브랜드 목록 화면을 렌더링합니다.
const BrandList = () => {
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useState<Record<string, any>>({});
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedBrandNo, setSelectedBrandNo] = useState<number | null>(null);
  const gridRef = useRef<BrandListGridHandle | null>(null);

  // 검색 조건을 갱신합니다.
  const handleSearch = useCallback((params: Record<string, any>) => {
    // 검색 파라미터를 정리합니다.
    const nextParams: Record<string, any> = { ...params };
    const brandNoValue = typeof nextParams.brandNo === 'string' ? nextParams.brandNo.trim() : nextParams.brandNo;
    if (brandNoValue === '' || brandNoValue == null) {
      delete nextParams.brandNo;
    } else if (!Number.isNaN(Number(brandNoValue))) {
      nextParams.brandNo = Number(brandNoValue);
    } else {
      delete nextParams.brandNo;
    }
    if (typeof nextParams.brandNm === 'string') {
      nextParams.brandNm = nextParams.brandNm.trim();
    }
    // 검색 파라미터를 설정합니다.
    setSearchParams(nextParams);
  }, []);

  // 수정 모달을 열고 대상 브랜드를 지정합니다.
  const openEditModal = useCallback((brandNo: number) => {
    // 선택 브랜드 번호를 설정하고 모달을 엽니다.
    setSelectedBrandNo(brandNo);
    setIsEditModalOpen(true);
  }, []);

  // 등록 모달을 엽니다.
  const openCreateModal = useCallback(() => {
    // 신규 등록 모드로 전환합니다.
    setSelectedBrandNo(null);
    setIsEditModalOpen(true);
  }, []);

  // 모달을 닫고 상태를 초기화합니다.
  const closeEditModal = useCallback(() => {
    // 모달 상태와 선택값을 초기화합니다.
    setIsEditModalOpen(false);
    setSelectedBrandNo(null);
  }, []);

  // 저장 완료 후 목록을 갱신합니다.
  const handleSaved = useCallback(() => {
    // 그리드가 있으면 새로고침합니다.
    if (gridRef.current) {
      gridRef.current.refresh();
    }
  }, []);

  // 브랜드 삭제를 처리합니다.
  const handleDelete = useCallback(async (brandNo: number) => {
    const ok = confirm('해당 브랜드를 삭제하시겠습니까?');
    if (!ok) {
      return;
    }

    const usrNo = requireLoginUsrNo();
    if (!usrNo) {
      return;
    }

    try {
      const response = await api.post('/api/admin/brand/admin/delete', {
        brandNo,
        udtNo: usrNo,
      });
      if (response.data > 0) {
        alert('브랜드가 삭제되었습니다.');
        if (gridRef.current) {
          gridRef.current.refresh();
        }
        return;
      }
      alert('브랜드 삭제에 실패했습니다.');
    } catch (error) {
      console.error('브랜드 삭제에 실패했습니다.', error);
      alert('브랜드 삭제에 실패했습니다.');
    }
  }, []);

  // 모달 상태에 따라 바디 스크롤을 제어합니다.
  useEffect(() => {
    // 모달이 열리면 스크롤을 막습니다.
    if (isEditModalOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
    document.body.style.overflow = '';
  }, [isEditModalOpen]);

  return (
    <>
      <div className="page-header">
        <h3 className="page-title">브랜드 관리</h3>
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><a href="#">브랜드</a></li>
            <li className="breadcrumb-item active" aria-current="page">목록</li>
          </ol>
        </nav>
      </div>

      <BrandSearchForm
        loading={loading}
        onSearch={handleSearch}
      />

      <BrandListGrid
        ref={gridRef}
        searchParams={searchParams}
        onEdit={openEditModal}
        onLoadingChange={setLoading}
        onDelete={handleDelete}
      />

      <div className="row">
        <div className="col-lg-12 grid-margin stretch-card">
          <div className="card">
            <div className="card-body d-flex justify-content-end">
              <button type="button" className="btn btn-primary" onClick={openCreateModal}>
                등록
              </button>
            </div>
          </div>
        </div>
      </div>

      <BrandEditModal
        isOpen={isEditModalOpen}
        brandNo={selectedBrandNo}
        onClose={closeEditModal}
        onSaved={handleSaved}
      />
    </>
  );
};

export default BrandList;
