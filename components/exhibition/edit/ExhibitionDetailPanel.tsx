import React from 'react';
import ExhibitionTabGoodsSection from '@/components/exhibition/ExhibitionTabGoodsSection';
import type { BrandOption, CategoryOption, CommonCode, GoodsMerch } from '@/components/goods/types';
import type { ExhibitionGoodsItem, ExhibitionTabItem } from '@/components/exhibition/types';

interface ExhibitionDetailPanelProps {
  // 탭 목록입니다.
  tabs: ExhibitionTabItem[];
  // 탭 목록 변경 함수입니다.
  setTabs: React.Dispatch<React.SetStateAction<ExhibitionTabItem[]>>;
  // 상품 목록입니다.
  goodsRows: ExhibitionGoodsItem[];
  // 상품 목록 변경 함수입니다.
  setGoodsRows: React.Dispatch<React.SetStateAction<ExhibitionGoodsItem[]>>;
  // 선택 탭 키입니다.
  selectedTabRowKey: string;
  // 선택 탭 키 변경 함수입니다.
  setSelectedTabRowKey: React.Dispatch<React.SetStateAction<string>>;
  // 수정 모드 여부입니다.
  isEditMode: boolean;
  // 기획전 번호입니다.
  exhibitionNo: number | null;
  // 카테고리 옵션 목록입니다.
  categoryOptions: CategoryOption[];
  // 상품 상태 코드 목록입니다.
  goodsStatList: CommonCode[];
  // 상품 구분 코드 목록입니다.
  goodsDivList: CommonCode[];
  // 상품 분류 목록입니다.
  goodsMerchList: GoodsMerch[];
  // 브랜드 목록입니다.
  brandList: BrandOption[];
  // 탭 저장 처리입니다.
  onSaveTabs: () => void;
  // 탭 저장 상태입니다.
  tabSaving: boolean;
  // 상품 저장 처리입니다.
  onSaveGoods: () => void;
  // 상품 저장 상태입니다.
  goodsSaving: boolean;
}

// 기획전 탭/상품 패널을 렌더링합니다.
const ExhibitionDetailPanel = ({
  tabs,
  setTabs,
  goodsRows,
  setGoodsRows,
  selectedTabRowKey,
  setSelectedTabRowKey,
  isEditMode,
  exhibitionNo,
  categoryOptions,
  goodsStatList,
  goodsDivList,
  goodsMerchList,
  brandList,
  onSaveTabs,
  tabSaving,
  onSaveGoods,
  goodsSaving,
}: ExhibitionDetailPanelProps) => {
  return (
    <ExhibitionTabGoodsSection
      tabs={tabs}
      goodsRows={goodsRows}
      setTabs={setTabs}
      setGoodsRows={setGoodsRows}
      selectedTabRowKey={selectedTabRowKey}
      setSelectedTabRowKey={setSelectedTabRowKey}
      isEditable={isEditMode}
      exhibitionNo={exhibitionNo || 0}
      categoryOptions={categoryOptions}
      goodsStatList={goodsStatList}
      goodsDivList={goodsDivList}
      goodsMerchList={goodsMerchList}
      brandList={brandList}
      onSaveTabs={onSaveTabs}
      tabSaving={tabSaving}
      onSaveGoods={onSaveGoods}
      goodsSaving={goodsSaving}
    />
  );
};

export default ExhibitionDetailPanel;
