import React, { useCallback, useMemo, useRef, useState } from 'react';
import api from '@/utils/axios/axios';
import BannerGoodsGrid from '@/components/banner/BannerGoodsGrid';
import CategoryGoodsSearchModal from '@/components/categoryGoods/CategoryGoodsSearchModal';
import type { BannerGoodsItem, BannerTabItem } from '@/components/banner/types';
import type { BrandOption, CategoryOption, CommonCode, GoodsMerch } from '@/components/goods/types';

interface BannerGoodsDetailSectionProps {
  // 수정 모드 여부입니다.
  isEditMode: boolean;
  // 상품탭배너 여부입니다.
  isTabBanner: boolean;
  // 상품리스트배너 여부입니다.
  isGoodsListBanner: boolean;
  // 배너 구분 코드입니다.
  bannerDivCd: string;
  // 탭 목록입니다.
  tabList: BannerTabItem[];
  // 현재 활성 탭명입니다.
  activeTabNm: string;
  // 탭 상품 목록입니다.
  tabGoodsRows: BannerGoodsItem[];
  // 일반 상품 목록입니다.
  goodsRows: BannerGoodsItem[];
  // 탭 목록 상태 변경 함수입니다.
  setTabList: React.Dispatch<React.SetStateAction<BannerTabItem[]>>;
  // 활성 탭 상태 변경 함수입니다.
  setActiveTabNm: React.Dispatch<React.SetStateAction<string>>;
  // 탭 상품 목록 상태 변경 함수입니다.
  setTabGoodsRows: React.Dispatch<React.SetStateAction<BannerGoodsItem[]>>;
  // 일반 상품 목록 상태 변경 함수입니다.
  setGoodsRows: React.Dispatch<React.SetStateAction<BannerGoodsItem[]>>;
  // 카테고리 옵션 목록입니다.
  categoryOptions: CategoryOption[];
  // 상품 상태 목록입니다.
  goodsStatList: CommonCode[];
  // 상품 구분 목록입니다.
  goodsDivList: CommonCode[];
  // 상품 분류 목록입니다.
  goodsMerchList: GoodsMerch[];
  // 브랜드 목록입니다.
  brandList: BrandOption[];
}

// 상품 상세 섹션을 렌더링합니다.
const BannerGoodsDetailSection = ({
  isEditMode,
  isTabBanner,
  isGoodsListBanner,
  bannerDivCd,
  tabList,
  activeTabNm,
  tabGoodsRows,
  goodsRows,
  setTabList,
  setActiveTabNm,
  setTabGoodsRows,
  setGoodsRows,
  categoryOptions,
  goodsStatList,
  goodsDivList,
  goodsMerchList,
  brandList,
}: BannerGoodsDetailSectionProps) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const excelInputRef = useRef<HTMLInputElement | null>(null);

  // 현재 노출할 상품 목록을 계산합니다.
  const currentRows = useMemo(() => {
    if (isTabBanner) {
      if (!activeTabNm) {
        return [];
      }
      return tabGoodsRows
        .filter((item) => item.tabNm === activeTabNm)
        .sort((a, b) => a.dispOrd - b.dispOrd);
    }
    return goodsRows;
  }, [activeTabNm, goodsRows, isTabBanner, tabGoodsRows]);

  // 탭을 추가합니다.
  const handleAddTab = useCallback(() => {
    const nextIndex = tabList.length + 1;
    const nextTabNm = `TAB${nextIndex}`;
    // 신규 탭 기본값을 생성합니다.
    const nextTab: BannerTabItem = {
      tabNm: nextTabNm,
      dispOrd: nextIndex,
      showYn: 'Y',
    };
    setTabList((prev) => [...prev, nextTab]);
    setActiveTabNm(nextTabNm);
  }, [setActiveTabNm, setTabList, tabList.length]);

  // 탭을 삭제합니다.
  const handleDeleteTab = useCallback((tabNm: string) => {
    // 탭 정보와 연결된 상품 목록을 함께 정리합니다.
    setTabList((prev) => prev.filter((item) => item.tabNm !== tabNm));
    setTabGoodsRows((prev) => prev.filter((item) => item.tabNm !== tabNm));
    setSelectedRowKeys([]);
    setActiveTabNm((prev) => (prev === tabNm ? '' : prev));
  }, [setActiveTabNm, setTabGoodsRows, setTabList]);

  // 탭명을 변경합니다.
  const handleChangeTabName = useCallback((targetTabNm: string, nextTabNm: string) => {
    // 탭 목록의 이름을 변경합니다.
    setTabList((prev) => prev.map((item) => (
      item.tabNm === targetTabNm ? { ...item, tabNm: nextTabNm } : item
    )));
    // 탭 상품 목록의 매핑명도 함께 변경합니다.
    setTabGoodsRows((prev) => prev.map((item) => (
      item.tabNm === targetTabNm ? { ...item, tabNm: nextTabNm } : item
    )));
    setActiveTabNm((prev) => (prev === targetTabNm ? nextTabNm : prev));
  }, [setActiveTabNm, setTabGoodsRows, setTabList]);

  // 탭 노출여부를 변경합니다.
  const handleChangeTabShowYn = useCallback((targetTabNm: string, nextShowYn: string) => {
    setTabList((prev) => prev.map((item) => (
      item.tabNm === targetTabNm ? { ...item, showYn: nextShowYn } : item
    )));
  }, [setTabList]);

  // 상품탭배너 정렬 변경을 반영합니다.
  const handleTabGoodsOrderChange = useCallback((rows: BannerGoodsItem[]) => {
    setTabGoodsRows((prev) => {
      const withoutCurrent = prev.filter((item) => item.tabNm !== activeTabNm);
      return [...withoutCurrent, ...rows.map((item, index) => ({ ...item, dispOrd: index + 1 }))];
    });
  }, [activeTabNm, setTabGoodsRows]);

  // 상품리스트배너 정렬 변경을 반영합니다.
  const handleGoodsOrderChange = useCallback((rows: BannerGoodsItem[]) => {
    setGoodsRows(rows.map((item, index) => ({ ...item, dispOrd: index + 1 })));
  }, [setGoodsRows]);

  // 선택된 상품을 삭제합니다.
  const handleDeleteSelectedGoods = useCallback(() => {
    if (selectedRowKeys.length === 0) {
      alert('삭제할 상품을 선택해주세요.');
      return;
    }
    // 배너 타입별 목록에서 선택 행을 제거합니다.
    if (isTabBanner) {
      setTabGoodsRows((prev) => prev.filter((item) => !selectedRowKeys.includes(item.rowKey)));
      setSelectedRowKeys([]);
      return;
    }
    if (isGoodsListBanner) {
      setGoodsRows((prev) => prev.filter((item) => !selectedRowKeys.includes(item.rowKey)));
      setSelectedRowKeys([]);
    }
  }, [isGoodsListBanner, isTabBanner, selectedRowKeys, setGoodsRows, setTabGoodsRows]);

  // 상품 검색 모달을 엽니다.
  const handleOpenGoodsModal = useCallback(() => {
    if (isTabBanner && !activeTabNm) {
      alert('탭을 선택해주세요.');
      return;
    }
    setIsSearchModalOpen(true);
  }, [activeTabNm, isTabBanner]);

  // 선택 상품을 현재 배너 타입에 맞게 추가합니다.
  const handleApplyGoods = useCallback((goodsIds: string[]) => {
    if (goodsIds.length === 0) {
      return;
    }
    if (isTabBanner) {
      // 탭형 배너의 선택 탭에만 상품을 추가합니다.
      setTabGoodsRows((prev) => {
        const current = prev.filter((item) => item.tabNm === activeTabNm);
        const existingSet = new Set(current.map((item) => item.goodsId));
        const nextRows = [...prev];
        let nextOrd = current.length + 1;
        goodsIds.forEach((goodsId) => {
          if (existingSet.has(goodsId)) {
            return;
          }
          nextRows.push({
            rowKey: `${activeTabNm}_${goodsId}_${Date.now()}_${nextOrd}`,
            tabNm: activeTabNm,
            goodsId,
            dispOrd: nextOrd,
            showYn: 'Y',
          });
          nextOrd += 1;
        });
        return nextRows;
      });
      setIsSearchModalOpen(false);
      return;
    }
    if (isGoodsListBanner) {
      // 리스트형 배너에 중복 없이 상품을 추가합니다.
      setGoodsRows((prev) => {
        const existingSet = new Set(prev.map((item) => item.goodsId));
        const nextRows = [...prev];
        let nextOrd = prev.length + 1;
        goodsIds.forEach((goodsId) => {
          if (existingSet.has(goodsId)) {
            return;
          }
          nextRows.push({
            rowKey: `list_${goodsId}_${Date.now()}_${nextOrd}`,
            goodsId,
            dispOrd: nextOrd,
            showYn: 'Y',
          });
          nextOrd += 1;
        });
        return nextRows;
      });
      setIsSearchModalOpen(false);
    }
  }, [activeTabNm, isGoodsListBanner, isTabBanner, setGoodsRows, setTabGoodsRows]);

  // 엑셀 업로드 선택창을 엽니다.
  const handleExcelUploadClick = useCallback(() => {
    if (!excelInputRef.current) {
      return;
    }
    excelInputRef.current.value = '';
    excelInputRef.current.click();
  }, []);

  // 엑셀 파싱 결과를 현재 목록에 반영합니다.
  const handleExcelUploadChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    try {
      const formData = new FormData();
      // 엑셀 파싱 API 요청값을 구성합니다.
      formData.append('bannerDivCd', bannerDivCd);
      formData.append('file', file);
      const response = await api.post('/api/admin/banner/goods/excel/parse', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const rows = Array.isArray(response.data) ? response.data : [];
      if (isTabBanner) {
        setTabGoodsRows((prev) => {
          const nextRows = [...prev];
          rows.forEach((item: any, index: number) => {
            if (!item.goodsId || !item.tabNm) {
              return;
            }
            nextRows.push({
              rowKey: `${item.tabNm}_${item.goodsId}_${Date.now()}_${index}`,
              tabNm: item.tabNm,
              goodsId: item.goodsId,
              dispOrd: Number(item.dispOrd || 1),
              showYn: String(item.showYn || 'Y'),
            });
          });
          return nextRows;
        });
      } else if (isGoodsListBanner) {
        setGoodsRows((prev) => {
          const nextRows = [...prev];
          rows.forEach((item: any, index: number) => {
            if (!item.goodsId) {
              return;
            }
            nextRows.push({
              rowKey: `list_${item.goodsId}_${Date.now()}_${index}`,
              goodsId: item.goodsId,
              dispOrd: Number(item.dispOrd || 1),
              showYn: String(item.showYn || 'Y'),
            });
          });
          return nextRows;
        });
      }
      alert('엑셀 업로드가 반영되었습니다. 저장 버튼 클릭 시 DB에 저장됩니다.');
    } catch (error: any) {
      const message = error?.response?.data?.message || '엑셀 업로드에 실패했습니다.';
      alert(message);
    }
  }, [bannerDivCd, isGoodsListBanner, isTabBanner, setGoodsRows, setTabGoodsRows]);

  // 엑셀 템플릿을 다운로드합니다.
  const handleExcelDownload = useCallback(async () => {
    try {
      const response = await api.get('/api/admin/banner/goods/excel/download', {
        params: { bannerDivCd },
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const disposition = response.headers['content-disposition'] as string | undefined;
      const filenameMatch = disposition?.match(/filename=\"?([^\";]+)\"?/);
      link.download = filenameMatch?.[1] || 'banner_goods_template.xlsx';
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('엑셀 다운로드에 실패했습니다.', error);
      alert('엑셀 다운로드에 실패했습니다.');
    }
  }, [bannerDivCd]);

  if (!isEditMode || (!isTabBanner && !isGoodsListBanner)) {
    return null;
  }

  return (
    <>
      <hr />
      <div className="d-flex flex-wrap justify-content-end gap-2 mb-2">
        {isTabBanner && (<button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleAddTab}>탭 추가</button>)}
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleExcelDownload}>엑셀 다운로드</button>
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleExcelUploadClick}>엑셀 업로드</button>
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleOpenGoodsModal}>상품 등록</button>
        <button type="button" className="btn btn-danger btn-sm" onClick={handleDeleteSelectedGoods}>선택 삭제</button>
      </div>
      <input ref={excelInputRef} type="file" accept=".xlsx" style={{ display: 'none' }} onChange={handleExcelUploadChange} />

      {isTabBanner && (
        <div className="mb-3"><div className="table-responsive"><table className="table table-sm table-bordered"><thead><tr><th style={{ width: '80px' }}>순서</th><th>탭명</th><th style={{ width: '120px' }}>노출여부</th><th style={{ width: '220px' }}>관리</th></tr></thead><tbody>{tabList.map((tab, index) => (
          <tr key={`${tab.tabNm}_${index}`} className={activeTabNm === tab.tabNm ? 'table-primary' : ''}>
            <td>{tab.dispOrd}</td>
            <td><input className="form-control form-control-sm" value={tab.tabNm} onChange={(e) => handleChangeTabName(tab.tabNm, e.target.value)} /></td>
            <td><select className="form-select form-select-sm" value={tab.showYn} onChange={(e) => handleChangeTabShowYn(tab.tabNm, e.target.value)}><option value="Y">Y</option><option value="N">N</option></select></td>
            <td><div className="d-flex gap-2"><button type="button" className="btn btn-outline-primary btn-sm" onClick={() => setActiveTabNm(tab.tabNm)}>선택</button><button type="button" className="btn btn-outline-danger btn-sm" onClick={() => handleDeleteTab(tab.tabNm)}>삭제</button></div></td>
          </tr>
        ))}</tbody></table></div></div>
      )}

      <BannerGoodsGrid
        rows={currentRows}
        onOrderChange={isTabBanner ? handleTabGoodsOrderChange : handleGoodsOrderChange}
        onSelectionChange={setSelectedRowKeys}
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

export default BannerGoodsDetailSection;
