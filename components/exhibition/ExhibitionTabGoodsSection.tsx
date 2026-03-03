import React, { useCallback, useMemo, useRef, useState } from 'react';
import api from '@/utils/axios/axios';
import CategoryGoodsSearchModal from '@/components/categoryGoods/CategoryGoodsSearchModal';
import type { ExhibitionGoodsItem, ExhibitionTabItem } from '@/components/exhibition/types';
import type { BrandOption, CategoryOption, CommonCode, GoodsData, GoodsMerch } from '@/components/goods/types';
import ExhibitionGoodsGrid from '@/components/exhibition/ExhibitionGoodsGrid';
import ExhibitionTabGrid from '@/components/exhibition/ExhibitionTabGrid';

interface ExhibitionTabGoodsSectionProps {
  // 탭 정보입니다.
  tabs: ExhibitionTabItem[];
  // 상품 목록입니다.
  goodsRows: ExhibitionGoodsItem[];
  // 탭 변경 함수입니다.
  setTabs: React.Dispatch<React.SetStateAction<ExhibitionTabItem[]>>;
  // 상품 변경 함수입니다.
  setGoodsRows: React.Dispatch<React.SetStateAction<ExhibitionGoodsItem[]>>;
  // 선택 탭 행 키입니다.
  selectedTabRowKey: string;
  // 선택 탭 행 키 변경 함수입니다.
  setSelectedTabRowKey: React.Dispatch<React.SetStateAction<string>>;
  // 편집 가능 여부입니다.
  isEditable: boolean;
  // 상품 등록 모달 옵션입니다.
  categoryOptions: CategoryOption[];
  // 상품 상태 코드 목록입니다.
  goodsStatList: CommonCode[];
  // 상품 구분 코드 목록입니다.
  goodsDivList: CommonCode[];
  // 상품 분류 목록입니다.
  goodsMerchList: GoodsMerch[];
  // 브랜드 목록입니다.
  brandList: BrandOption[];
  // 저장 처리 함수입니다.
  onSave: () => void;
  // 저장 상태입니다.
  saving: boolean;
  // 기획전 번호입니다.
  exhibitionNo: number;
}

// 기획전 탭/상품 영역을 렌더링합니다.
const ExhibitionTabGoodsSection = ({
  tabs,
  goodsRows,
  setTabs,
  setGoodsRows,
  selectedTabRowKey,
  setSelectedTabRowKey,
  isEditable,
  categoryOptions,
  goodsStatList,
  goodsDivList,
  goodsMerchList,
  brandList,
  onSave,
  saving,
  exhibitionNo,
}: ExhibitionTabGoodsSectionProps) => {
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [selectedGoodsRowKeys, setSelectedGoodsRowKeys] = useState<string[]>([]);
  const excelInputRef = useRef<HTMLInputElement | null>(null);
  const tabSequenceRef = useRef(1);

  // 선택된 탭 정보를 조회합니다.
  const selectedTab = useMemo(() => tabs.find((item) => item.rowKey === selectedTabRowKey), [selectedTabRowKey, tabs]);

  // 등록 탭의 상품인지 판단합니다.
  const isGoodsInSelectedTab = useCallback((item: ExhibitionGoodsItem) => {
    if (!selectedTab) {
      return false;
    }
    if (selectedTab.exhibitionTabNo != null && item.exhibitionTabNo != null) {
      return item.exhibitionTabNo === selectedTab.exhibitionTabNo;
    }
    if (selectedTab.rowKey && item.exhibitionTabRowKey) {
      return item.exhibitionTabRowKey === selectedTab.rowKey;
    }
    return false;
  }, [selectedTab]);

  // 선택 탭의 상품 목록을 정렬해 조회합니다.
  const currentGoodsRows = useMemo(() => {
    const filtered = goodsRows.filter((item) => isGoodsInSelectedTab(item));
    return [...filtered].sort((a, b) => a.dispOrd - b.dispOrd);
  }, [goodsRows, isGoodsInSelectedTab]);

  // 탭 행 키를 기본값으로 정리합니다.
  const getSafeTabRowKey = useCallback((tab: ExhibitionTabItem) => {
    return tab.rowKey || String(tab.exhibitionTabNo);
  }, []);

  // 탭 행 키용 임시 키를 생성합니다.
  const buildNewTabRowKey = useCallback(() => {
    const nextSequence = tabSequenceRef.current;
    tabSequenceRef.current += 1;
    return `tab-new-${Date.now()}-${nextSequence}`;
  }, []);

  // 임시 상품 행 키를 생성합니다.
  const buildNewGoodsRowKey = useCallback((goodsId: string, index: number) => {
    return `goods-${Date.now()}-${goodsId}-${index}`;
  }, []);

  // 탭 번호/행키 순서를 반영해 탭 목록을 갱신합니다.
  const normalizeTabRows = useCallback((sourceRows: ExhibitionTabItem[]) => {
    return sourceRows
      .map((item, index) => ({
        ...item,
        dispOrd: index + 1,
        tabNm: item.tabNm?.trim() || `탭${index + 1}`,
        showYn: item.showYn === 'N' ? 'N' : 'Y',
      }));
  }, []);

  // 탭을 추가합니다.
  const handleAddTab = useCallback(() => {
    const next = normalizeTabRows([
      ...tabs,
      {
        rowKey: buildNewTabRowKey(),
        tabNm: `탭${tabs.length + 1}`,
        dispOrd: tabs.length + 1,
        showYn: 'Y',
      },
    ]);
    setTabs(next);
    setSelectedTabRowKey(getSafeTabRowKey(next[next.length - 1]!));
  }, [buildNewTabRowKey, getSafeTabRowKey, normalizeTabRows, setSelectedTabRowKey, setTabs, tabs]);

  // 탭을 삭제합니다.
  const handleDeleteTab = useCallback((targetRowKey: string) => {
    const targetTab = tabs.find((item) => item.rowKey === targetRowKey);
    if (!targetTab) {
      return;
    }
    const hasGoods = goodsRows.some((item) => {
      if (targetTab.exhibitionTabNo != null && item.exhibitionTabNo != null) {
        return item.exhibitionTabNo === targetTab.exhibitionTabNo;
      }
      return !!(item.exhibitionTabRowKey && targetTab.rowKey && item.exhibitionTabRowKey === targetTab.rowKey);
    });
    if (hasGoods && !window.confirm('선택한 탭의 등록 상품이 있습니다. 삭제하시겠습니까?')) {
      return;
    }
    const nextTabs = tabs.filter((item) => item.rowKey !== targetRowKey);
    const nextGoods = goodsRows.filter((item) => {
      if (targetTab.exhibitionTabNo != null) {
        return item.exhibitionTabNo !== targetTab.exhibitionTabNo;
      }
      return item.exhibitionTabRowKey !== targetTab.rowKey;
    });
    setTabs(normalizeTabRows(nextTabs));
    setGoodsRows(nextGoods);
    if (selectedTabRowKey === targetRowKey) {
      setSelectedTabRowKey(nextTabs[0]?.rowKey || '');
    }
    setSelectedGoodsRowKeys([]);
  }, [goodsRows, normalizeTabRows, selectedTabRowKey, setGoodsRows, setSelectedTabRowKey, setTabs, tabs]);

  // 탭 목록의 행을 정렬 또는 변경합니다.
  const handleTabRowsChange = useCallback((nextRows: ExhibitionTabItem[]) => {
    setTabs(normalizeTabRows(nextRows));
  }, [normalizeTabRows, setTabs]);

  // 상품 노출순서를 갱신합니다.
  const handleGoodsRowsChange = useCallback((nextRows: ExhibitionGoodsItem[]) => {
    setGoodsRows((prev) => {
      const remain = prev.filter((item) => !isGoodsInSelectedTab(item));
      return [...remain, ...nextRows.map((item, index) => ({ ...item, dispOrd: index + 1 }))];
    });
  }, [isGoodsInSelectedTab, setGoodsRows]);

  // 탭 행을 선택합니다.
  const handleSelectTab = useCallback((rowKey: string) => {
    setSelectedTabRowKey(rowKey);
    setSelectedGoodsRowKeys([]);
  }, [setSelectedTabRowKey]);

  // 상품 등록 모달에서 선택된 상품을 반영합니다.
  const handleApplyGoods = useCallback((selectedGoods: GoodsData[]) => {
    if (!selectedTab) {
      alert('탭을 먼저 선택해주세요.');
      return;
    }
    if (selectedGoods.length === 0) {
      return;
    }

    const tabNo = selectedTab.exhibitionTabNo;
    const tabRowKey = selectedTab.rowKey;
    const existing = new Set(
      goodsRows.filter((item) => isGoodsInSelectedTab(item)).map((item) => item.goodsId),
    );
    const nextGoodsRows: ExhibitionGoodsItem[] = [];
    selectedGoods.forEach((item, index) => {
      if (!item.goodsId || existing.has(item.goodsId)) {
        return;
      }
      nextGoodsRows.push({
        rowKey: buildNewGoodsRowKey(item.goodsId, index),
        exhibitionNo: selectedTab.exhibitionNo || exhibitionNo,
        exhibitionTabNo: tabNo,
        exhibitionTabRowKey: tabNo == null ? tabRowKey : undefined,
        goodsId: item.goodsId,
        erpStyleCd: item.erpStyleCd,
        goodsNm: item.goodsNm,
        dispOrd: currentGoodsRows.length + nextGoodsRows.length + 1,
        showYn: 'Y',
      });
    });

    setGoodsRows((prev) => [...prev, ...nextGoodsRows]);
    setIsSearchModalOpen(false);
  }, [currentGoodsRows.length, isGoodsInSelectedTab, selectedTab, setGoodsRows, buildNewGoodsRowKey, goodsRows]);

  // 엑셀 파일 업로드 창을 엽니다.
  const handleExcelUploadClick = useCallback(() => {
    if (!excelInputRef.current) {
      return;
    }
    excelInputRef.current.value = '';
    excelInputRef.current.click();
  }, []);

  // 엑셀 업로드 결과를 반영합니다.
  const handleExcelUploadChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    if (!selectedTab) {
      alert('탭을 선택해주세요.');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/api/admin/exhibition/goods/excel/parse', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const items = Array.isArray(response.data) ? response.data : [];
      const existing = new Set(
        goodsRows.filter((item) => isGoodsInSelectedTab(item)).map((item) => item.goodsId),
      );
      const nextGoodsRows: ExhibitionGoodsItem[] = [];
      items.forEach((raw: any, index: number) => {
        const goodsId = String(raw.goodsId || '').trim();
        if (!goodsId || existing.has(goodsId)) {
          return;
        }
        const parsedDispOrd = Number(raw.dispOrd);
        nextGoodsRows.push({
          rowKey: buildNewGoodsRowKey(goodsId, index),
          exhibitionNo: selectedTab.exhibitionNo || exhibitionNo,
          exhibitionTabNo: selectedTab.exhibitionTabNo,
          exhibitionTabRowKey: selectedTab.exhibitionTabNo == null ? selectedTab.rowKey : undefined,
          goodsId,
          dispOrd: Number.isInteger(parsedDispOrd) && parsedDispOrd > 0 ? parsedDispOrd : currentGoodsRows.length + nextGoodsRows.length + 1,
          showYn: String(raw.showYn || 'Y'),
        });
      });
      setGoodsRows((prev) => [...prev, ...nextGoodsRows]);
      alert('엑셀 업로드가 반영되었습니다.');
    } catch (error: any) {
      const message = error?.response?.data?.message || '엑셀 업로드에 실패했습니다.';
      alert(message);
    } finally {
      if (excelInputRef.current) {
        excelInputRef.current.value = '';
      }
    }
  }, [currentGoodsRows.length, isGoodsInSelectedTab, selectedTab, setGoodsRows, buildNewGoodsRowKey, goodsRows]);

  // 엑셀을 다운로드합니다.
  const handleExcelDownload = useCallback(async () => {
    if (!exhibitionNo) {
      alert('저장된 기획전에서만 템플릿을 받을 수 있습니다.');
      return;
    }
    try {
      const response = await api.get('/api/admin/exhibition/goods/excel/download', {
        params: {
          exhibitionNo,
          exhibitionTabNo: selectedTab?.exhibitionTabNo,
        },
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const contentDisposition = response.headers['content-disposition'];
      const fileNameMatch = contentDisposition?.match(/filename=\"?([^\";]+)\"?/);
      link.download = fileNameMatch?.[1] || 'exhibition_goods_template.xlsx';
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('엑셀 다운로드에 실패했습니다.', error);
      const message = error?.response?.data?.message || '엑셀 다운로드에 실패했습니다.';
      alert(message);
    }
  }, [exhibitionNo, selectedTab]);

  // 선택 상품을 삭제합니다.
  const handleDeleteSelectedGoods = useCallback(() => {
    if (selectedGoodsRowKeys.length === 0) {
      alert('삭제할 상품을 선택해주세요.');
      return;
    }
    setGoodsRows((prev) => prev.filter((item) => !selectedGoodsRowKeys.includes(String(item.rowKey))));
    setSelectedGoodsRowKeys([]);
  }, [selectedGoodsRowKeys, setGoodsRows]);

  // 상품 등록 모달을 엽니다.
  const handleOpenGoodsModal = useCallback(() => {
    if (!selectedTab) {
      alert('탭을 먼저 선택해주세요.');
      return;
    }
    setIsSearchModalOpen(true);
  }, [selectedTab]);

  // 등록 모드에서는 탭&상품 섹션을 비활성화합니다.
  if (!isEditable) {
    return (
      <div className="alert alert-info">
        기획전 등록 후 탭 및 상품을 등록할 수 있습니다.
      </div>
    );
  }

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
        <button type="button" className="btn btn-sm btn-outline-success" onClick={handleAddTab}>
          탭 추가
        </button>
        <div className="d-flex gap-2">
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleExcelDownload}>
            엑셀 다운로드
          </button>
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleExcelUploadClick}>
            엑셀 업로드
          </button>
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleOpenGoodsModal}>
            상품등록
          </button>
          <button type="button" className="btn btn-outline-danger btn-sm" onClick={handleDeleteSelectedGoods}>
            삭제
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={onSave} disabled={saving}>
            {saving ? '저장중...' : '상품 저장'}
          </button>
        </div>
      </div>

      <ExhibitionTabGrid
        rows={tabs}
        selectedRowKey={selectedTabRowKey}
        isEditable={isEditable}
        onRowsChange={handleTabRowsChange}
        onSelect={handleSelectTab}
        onDelete={handleDeleteTab}
      />

      <div className="mt-3 mb-2 fw-semibold">
        상품 정보
      </div>
      <ExhibitionGoodsGrid
        rows={currentGoodsRows}
        isEditable={isEditable}
        onRowsChange={handleGoodsRowsChange}
        onSelectionChange={setSelectedGoodsRowKeys}
      />

      <input
        ref={excelInputRef}
        type="file"
        accept=".xlsx"
        style={{ display: 'none' }}
        onChange={handleExcelUploadChange}
      />

      <CategoryGoodsSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        categoryOptions={categoryOptions}
        goodsStatList={goodsStatList}
        goodsDivList={goodsDivList}
        goodsMerchList={goodsMerchList}
        brandList={brandList}
        onApply={handleApplyGoods}
      />
    </>
  );
};

export default ExhibitionTabGoodsSection;
