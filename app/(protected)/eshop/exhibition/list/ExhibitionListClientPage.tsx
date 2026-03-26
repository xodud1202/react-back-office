import React, { useCallback, useEffect, useState } from 'react';
import api from '@/utils/axios/axios';
import ExhibitionSearchForm from '@/components/exhibition/ExhibitionSearchForm';
import ExhibitionListGrid from '@/components/exhibition/ExhibitionListGrid';
import ExhibitionEditModal from '@/components/exhibition/ExhibitionEditModal';
import {
  DEFAULT_EXHIBITION_SEARCH_PARAMS,
} from '@/components/exhibition/types';
import type {
  ExhibitionItem,
  ExhibitionListResponse,
  ExhibitionSearchParams,
} from '@/components/exhibition/types';
import type { BrandOption, CategoryOption, CommonCode, GoodsMerch } from '@/components/goods/types';

interface ExhibitionListPageProps {
  // 상품 상태 코드 목록입니다.
  goodsStatList: CommonCode[];
  // 상품 구분 코드 목록입니다.
  goodsDivList: CommonCode[];
  // 상품 분류 목록입니다.
  goodsMerchList: GoodsMerch[];
  // 브랜드 목록입니다.
  brandList: BrandOption[];
  // 카테고리 옵션 목록입니다.
  categoryOptions: CategoryOption[];
}

// 기획전 목록 화면을 렌더링합니다.
const ExhibitionListPage = ({
  goodsStatList,
  goodsDivList,
  goodsMerchList,
  brandList,
  categoryOptions,
}: ExhibitionListPageProps) => {
  const [rows, setRows] = useState<ExhibitionItem[]>([]);
  const [searchParams, setSearchParams] = useState<ExhibitionSearchParams>(() => ({ ...DEFAULT_EXHIBITION_SEARCH_PARAMS }));
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExhibitionNo, setSelectedExhibitionNo] = useState<number | null>(null);

  // 기획전 목록을 조회합니다.
  const fetchExhibitionList = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/admin/exhibition/list', {
        params: {
          ...searchParams,
          page: 1,
          pageSize: 200,
        },
      });
      const data = (response.data || {}) as ExhibitionListResponse;
      setRows(data.list || []);
    } catch (error) {
      console.error('기획전 목록 조회에 실패했습니다.', error);
      alert('기획전 목록 조회에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  // 검색 조건을 갱신합니다.
  const handleSearch = useCallback((params: ExhibitionSearchParams) => {
    setSearchParams(params);
  }, []);

  // 등록 팝업을 엽니다.
  const handleOpenCreateModal = useCallback(() => {
    setSelectedExhibitionNo(null);
    setIsModalOpen(true);
  }, []);

  // 수정 팝업을 엽니다.
  const handleOpenEditModal = useCallback((exhibitionNo: number) => {
    setSelectedExhibitionNo(exhibitionNo);
    setIsModalOpen(true);
  }, []);

  // 저장 완료 후 목록을 갱신합니다.
  const handleSaved = useCallback(async (nextExhibitionNo?: number | null) => {
    await fetchExhibitionList();
    if (!nextExhibitionNo) {
      setIsModalOpen(false);
      setSelectedExhibitionNo(null);
      return;
    }

    setIsModalOpen(false);
    setSelectedExhibitionNo(null);
    setTimeout(() => {
      setSelectedExhibitionNo(nextExhibitionNo);
      setIsModalOpen(true);
    }, 0);
  }, [fetchExhibitionList]);

  // 팝업을 닫습니다.
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedExhibitionNo(null);
  }, []);

  // 검색 조건 변경 시 목록을 조회합니다.
  useEffect(() => {
    fetchExhibitionList();
  }, [fetchExhibitionList]);

  return (
    <>
      <div className="page-header">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><a href="#">eshop</a></li>
            <li className="breadcrumb-item active" aria-current="page">기획전</li>
          </ol>
        </nav>
      </div>

      <ExhibitionSearchForm loading={loading} onSearch={handleSearch} />

      <div className="card">
        <div className="card-body">
          <div className="d-flex justify-content-end mb-3">
            <button type="button" className="btn btn-primary btn-sm" onClick={handleOpenCreateModal}>
              기획전 등록
            </button>
          </div>
          {loading ? (
            <div className="text-center">기획전 목록을 불러오는 중입니다.</div>
          ) : (
            <ExhibitionListGrid rows={rows} onEdit={handleOpenEditModal} />
          )}
        </div>
      </div>

      <ExhibitionEditModal
        isOpen={isModalOpen}
        exhibitionNo={selectedExhibitionNo}
        goodsStatList={goodsStatList}
        goodsDivList={goodsDivList}
        goodsMerchList={goodsMerchList}
        brandList={brandList}
        categoryOptions={categoryOptions}
        onClose={handleCloseModal}
        onSaved={handleSaved}
      />
    </>
  );
};

export default ExhibitionListPage;
