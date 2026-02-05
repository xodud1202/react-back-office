import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { GetServerSideProps, GetServerSidePropsContext } from 'next';
import api from '@/utils/axios/axios';
import { fetchSSRList } from '@/utils/ssrFetch';
import { requireLoginUsrNo } from '@/utils/auth';
import CategoryTree from '@/components/category/CategoryTree';
import type { CategoryItem, CategoryTreeNode } from '@/components/category/types';
import CategoryGoodsGrid from '@/components/categoryGoods/CategoryGoodsGrid';
import CategoryGoodsSearchModal from '@/components/categoryGoods/CategoryGoodsSearchModal';
import type { CategoryGoodsItem } from '@/components/categoryGoods/types';
import type { BrandOption, CategoryOption, CommonCode, GoodsMerch } from '@/components/goods/types';

interface CategoryGoodsPageProps {
  goodsStatList: CommonCode[];
  goodsDivList: CommonCode[];
  goodsMerchList: GoodsMerch[];
  brandList: BrandOption[];
}

// SSR에서 공통 데이터를 조회합니다.
export const getServerSideProps: GetServerSideProps<CategoryGoodsPageProps> = async (ctx: GetServerSidePropsContext) => {
  const [goodsStatList, goodsDivList, goodsMerchList, brandList] = await Promise.all([
    fetchSSRList<CommonCode>(ctx, `/api/admin/common/code?grpCd=${encodeURIComponent('GOODS_STAT')}`),
    fetchSSRList<CommonCode>(ctx, `/api/admin/common/code?grpCd=${encodeURIComponent('GOODS_DIV')}`),
    fetchSSRList<GoodsMerch>(ctx, '/api/admin/goods/merch/list'),
    fetchSSRList<BrandOption>(ctx, '/api/admin/brand/list'),
  ]);

  return {
    props: {
      goodsStatList,
      goodsDivList,
      goodsMerchList,
      brandList,
    },
  };
};

// 카테고리별 상품 관리 화면을 렌더링합니다.
const CategoryGoodsPage = ({
  goodsStatList,
  goodsDivList,
  goodsMerchList,
  brandList,
}: CategoryGoodsPageProps) => {
  const [categoryList, setCategoryList] = useState<CategoryItem[]>([]);
  const [treeNodes, setTreeNodes] = useState<CategoryTreeNode[]>([]);
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [categoryGoodsRows, setCategoryGoodsRows] = useState<CategoryGoodsItem[]>([]);
  const [categoryGoodsLoading, setCategoryGoodsLoading] = useState(false);
  const [selectedGoodsIds, setSelectedGoodsIds] = useState<string[]>([]);
  const [isOrderDirty, setIsOrderDirty] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const excelInputRef = useRef<HTMLInputElement | null>(null);

  // 선택된 카테고리가 최하단인지 여부를 확인합니다.
  const isLeafSelectedCategory = useMemo(() => {
    if (!selectedCategoryId) {
      return false;
    }
    return !categoryList.some((item) => item.parentCategoryId === selectedCategoryId);
  }, [categoryList, selectedCategoryId]);

  // 카테고리 트리 노드를 구성합니다.
  const buildTreeNodes = useCallback((list: CategoryItem[]) => {
    const nodeMap = new Map<string, CategoryTreeNode>();
    const roots: CategoryTreeNode[] = [];
    // 카테고리 노드 맵을 구성합니다.
    list.forEach((item) => {
      nodeMap.set(item.categoryId, { ...item, children: [] });
    });
    // 부모-자식 관계를 구성합니다.
    nodeMap.forEach((node) => {
      if (node.parentCategoryId && nodeMap.has(node.parentCategoryId)) {
        nodeMap.get(node.parentCategoryId)!.children.push(node);
      } else {
        roots.push(node);
      }
    });
    // 정렬 순서 기준으로 정렬합니다.
    const sortNodes = (nodes: CategoryTreeNode[]) => {
      nodes.sort((a, b) => {
        const dispA = a.dispOrd ?? 0;
        const dispB = b.dispOrd ?? 0;
        if (dispA !== dispB) {
          return dispA - dispB;
        }
        return a.categoryId.localeCompare(b.categoryId);
      });
      nodes.forEach((child) => {
        if (child.children.length > 0) {
          sortNodes(child.children);
        }
      });
    };
    sortNodes(roots);
    return roots;
  }, []);

  // 카테고리 목록을 조회합니다.
  const fetchCategoryList = useCallback(async () => {
    try {
      const response = await api.get('/api/admin/category/manage/list');
      const list = (response.data || []) as CategoryItem[];
      setCategoryList(list);
      setTreeNodes(buildTreeNodes(list));
    } catch (e) {
      console.error('카테고리 목록을 불러오는 데 실패했습니다.', e);
      alert('카테고리 목록을 불러오는 데 실패했습니다.');
    }
  }, [buildTreeNodes]);

  // 카테고리별 상품 목록을 조회합니다.
  const fetchCategoryGoodsList = useCallback(async (categoryId: string) => {
    setCategoryGoodsLoading(true);
    try {
      const response = await api.get('/api/admin/category/goods/list', {
        params: { categoryId },
      });
      const list = (response.data || []) as CategoryGoodsItem[];
      // 현재 정렬 순서 기준으로 1부터 순번을 재정렬해 표시합니다.
      const normalized = list.map((item, index) => ({
        ...item,
        dispOrd: index + 1,
      }));
      setCategoryGoodsRows(normalized);
      setIsOrderDirty(false);
    } catch (e) {
      console.error('카테고리별 상품을 불러오는 데 실패했습니다.', e);
      alert('카테고리별 상품을 불러오는 데 실패했습니다.');
    } finally {
      setCategoryGoodsLoading(false);
    }
  }, []);

  // 트리 확장/축소 상태를 변경합니다.
  const handleToggleExpand = useCallback((categoryId: string) => {
    setExpandedMap((prev) => ({ ...prev, [categoryId]: !prev[categoryId] }));
  }, []);

  // 카테고리를 선택하고 상품 목록을 조회합니다.
  const handleSelectCategory = useCallback(async (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setSelectedGoodsIds([]);
    await fetchCategoryGoodsList(categoryId);
  }, [fetchCategoryGoodsList]);

  // 정렬 변경 결과를 반영합니다.
  const handleOrderChange = useCallback((rows: CategoryGoodsItem[]) => {
    setCategoryGoodsRows(rows);
    setIsOrderDirty(true);
  }, []);

  // 선택된 상품코드를 갱신합니다.
  const handleSelectionChange = useCallback((goodsIds: string[]) => {
    setSelectedGoodsIds(goodsIds);
  }, []);

  // 정렬 순서를 저장합니다.
  const handleSaveOrder = useCallback(async () => {
    if (!selectedCategoryId) {
      alert('카테고리를 선택해주세요.');
      return;
    }
    if (!isOrderDirty) {
      alert('변경된 순서가 없습니다.');
      return;
    }
    const usrNo = requireLoginUsrNo();
    if (!usrNo) {
      return;
    }
    // 저장 순서를 재계산합니다.
    const orders = categoryGoodsRows.map((item, index) => ({
      goodsId: item.goodsId,
      dispOrd: index + 1,
    }));
    try {
      const response = await api.post('/api/admin/category/goods/order/save', {
        categoryId: selectedCategoryId,
        orders,
        udtNo: usrNo,
      });
      if (response.data >= 0) {
        alert('노출 순서가 저장되었습니다.');
        await fetchCategoryGoodsList(selectedCategoryId);
      }
    } catch (e) {
      console.error('노출 순서 저장에 실패했습니다.', e);
      alert('노출 순서 저장에 실패했습니다.');
    }
  }, [categoryGoodsRows, fetchCategoryGoodsList, isOrderDirty, selectedCategoryId]);

  // 선택된 상품을 삭제합니다.
  const handleDeleteGoods = useCallback(async () => {
    if (!selectedCategoryId) {
      alert('카테고리를 선택해주세요.');
      return;
    }
    if (selectedGoodsIds.length === 0) {
      alert('삭제할 상품을 선택해주세요.');
      return;
    }
    const usrNo = requireLoginUsrNo();
    if (!usrNo) {
      return;
    }
    try {
      // 삭제 요청을 전송합니다.
      const response = await api.post('/api/admin/category/goods/delete', {
        categoryId: selectedCategoryId,
        goodsIds: selectedGoodsIds,
        udtNo: usrNo,
      });
      if (response.data >= 0) {
        alert('선택된 상품이 삭제되었습니다.');
        await fetchCategoryGoodsList(selectedCategoryId);
        setSelectedGoodsIds([]);
      }
    } catch (e) {
      console.error('상품 삭제에 실패했습니다.', e);
      alert('상품 삭제에 실패했습니다.');
    }
  }, [fetchCategoryGoodsList, selectedCategoryId, selectedGoodsIds]);

  // 엑셀 다운로드를 실행합니다.
  const handleExcelDownload = useCallback(async () => {
    if (!selectedCategoryId) {
      alert('카테고리를 선택해주세요.');
      return;
    }
    try {
      // 엑셀 데이터를 다운로드합니다.
      const response = await api.get('/api/admin/category/goods/excel/download', {
        params: { categoryId: selectedCategoryId },
        responseType: 'blob',
      });
      // 다운로드 파일명을 추출합니다.
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const disposition = response.headers['content-disposition'] as string | undefined;
      const filenameMatch = disposition?.match(/filename="?([^"]+)"?/);
      link.download = filenameMatch?.[1] || 'category_goods.xlsx';
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('엑셀 다운로드에 실패했습니다.', e);
      alert('엑셀 다운로드에 실패했습니다.');
    }
  }, [selectedCategoryId]);

  // 엑셀 업로드를 시작합니다.
  const handleExcelUploadClick = useCallback(() => {
    if (excelInputRef.current) {
      // 이전 선택 파일을 초기화하고 업로드 창을 엽니다.
      excelInputRef.current.value = '';
      excelInputRef.current.click();
    }
  }, []);

  // 엑셀 업로드 파일을 처리합니다.
  const handleExcelUploadChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const usrNo = requireLoginUsrNo();
    if (!usrNo) {
      return;
    }
    try {
      // 업로드 폼 데이터를 구성합니다.
      const formData = new FormData();
      formData.append('file', file);
      formData.append('regNo', String(usrNo));
      formData.append('udtNo', String(usrNo));
      // 업로드 요청을 전송합니다.
      const response = await api.post('/api/admin/category/goods/excel/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert(`엑셀 업로드가 완료되었습니다. (총 ${response.data?.total || 0}건)`);
      if (selectedCategoryId) {
        await fetchCategoryGoodsList(selectedCategoryId);
      }
    } catch (e: any) {
      const message = e?.response?.data?.message || '엑셀 업로드에 실패했습니다.';
      console.error('엑셀 업로드에 실패했습니다.', e);
      alert(message);
    }
  }, [fetchCategoryGoodsList, selectedCategoryId]);

  // 상품 등록 팝업을 엽니다.
  const handleOpenSearchModal = useCallback(() => {
    if (!selectedCategoryId) {
      alert('카테고리를 선택해주세요.');
      return;
    }
    // 최하단 카테고리에서만 상품 등록을 허용합니다.
    if (!isLeafSelectedCategory) {
      alert('최하단 카테고리에서만 상품 등록이 가능합니다.');
      return;
    }
    // 검색 팝업을 엽니다.
    setIsSearchModalOpen(true);
  }, [isLeafSelectedCategory, selectedCategoryId]);

  // 상품 등록 팝업을 닫습니다.
  const handleCloseSearchModal = useCallback(() => {
    // 검색 팝업을 닫습니다.
    setIsSearchModalOpen(false);
  }, []);

  // 선택 상품을 등록합니다.
  const handleRegisterGoods = useCallback(async (goodsIds: string[]) => {
    if (!selectedCategoryId) {
      alert('카테고리를 선택해주세요.');
      return;
    }
    const usrNo = requireLoginUsrNo();
    if (!usrNo) {
      return;
    }
    try {
      // 상품 등록 요청을 전송합니다.
      const response = await api.post('/api/admin/category/goods/register', {
        categoryId: selectedCategoryId,
        goodsIds,
        regNo: usrNo,
        udtNo: usrNo,
      });
      if (response.data >= 0) {
        alert('상품이 등록되었습니다.');
        setIsSearchModalOpen(false);
        await fetchCategoryGoodsList(selectedCategoryId);
      }
    } catch (e) {
      console.error('상품 등록에 실패했습니다.', e);
      alert('상품 등록에 실패했습니다.');
    }
  }, [fetchCategoryGoodsList, selectedCategoryId]);

  // 하위 카테고리가 없는 목록을 계산합니다.
  const leafCategoryOptions = useMemo<CategoryOption[]>(() => {
    const childSet = new Set<string>();
    categoryList.forEach((item) => {
      if (item.parentCategoryId) {
        childSet.add(item.parentCategoryId);
      }
    });
    return categoryList
      .filter((item) => !childSet.has(item.categoryId))
      .map((item) => ({
        categoryId: item.categoryId,
        parentCategoryId: item.parentCategoryId || '',
        categoryLevel: item.categoryLevel || 0,
        categoryNm: item.categoryNm,
        dispOrd: item.dispOrd ?? 0,
      }));
  }, [categoryList]);

  // 초기 로딩 시 카테고리 목록을 조회합니다.
  useEffect(() => {
    fetchCategoryList();
  }, [fetchCategoryList]);

  return (
    <>
      <div className="page-header">
        <h3 className="page-title"> 카테고리별 상품 관리 </h3>
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><a href="#">카테고리</a></li>
            <li className="breadcrumb-item active" aria-current="page">카테고리별 상품</li>
          </ol>
        </nav>
      </div>

      <div className="row">
        <div className="col-lg-4 grid-margin stretch-card">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h5 className="mb-0">카테고리 목록</h5>
                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={fetchCategoryList}>
                  새로고침
                </button>
              </div>
              <CategoryTree
                nodes={treeNodes}
                expandedMap={expandedMap}
                selectedId={selectedCategoryId}
                onToggle={handleToggleExpand}
                onSelect={handleSelectCategory}
                onContextMenu={() => {}}
              />
            </div>
          </div>
        </div>
        <div className="col-lg-8 grid-margin stretch-card">
          <div className="card">
            <div className="card-body">
              <div className="d-flex flex-wrap justify-content-end gap-2 mb-3">
                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleExcelDownload}>
                  엑셀 다운로드
                </button>
                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleExcelUploadClick}>
                  엑셀 업로드
                </button>
                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleOpenSearchModal}>
                  상품 등록
                </button>
                <button type="button" className="btn btn-primary btn-sm" onClick={handleSaveOrder}>
                  저장
                </button>
                <button type="button" className="btn btn-danger btn-sm" onClick={handleDeleteGoods}>
                  삭제
                </button>
              </div>
              <input
                ref={excelInputRef}
                type="file"
                accept=".xlsx"
                style={{ display: 'none' }}
                onChange={handleExcelUploadChange}
              />
              <CategoryGoodsGrid
                rows={categoryGoodsRows}
                loading={categoryGoodsLoading}
                onOrderChange={handleOrderChange}
                onSelectionChange={handleSelectionChange}
              />
            </div>
          </div>
        </div>
      </div>

      <CategoryGoodsSearchModal
        isOpen={isSearchModalOpen}
        onClose={handleCloseSearchModal}
        categoryOptions={leafCategoryOptions}
        goodsStatList={goodsStatList}
        goodsDivList={goodsDivList}
        goodsMerchList={goodsMerchList}
        brandList={brandList}
        onApply={handleRegisterGoods}
      />
    </>
  );
};

export default CategoryGoodsPage;
