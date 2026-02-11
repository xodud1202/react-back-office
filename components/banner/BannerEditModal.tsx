import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import api from '@/utils/axios/axios';
import { requireLoginUsrNo } from '@/utils/auth';
import Modal from '@/components/common/Modal';
import BannerGoodsGrid from '@/components/banner/BannerGoodsGrid';
import CategoryGoodsSearchModal from '@/components/categoryGoods/CategoryGoodsSearchModal';
import type { CommonCode, BrandOption, CategoryOption, GoodsMerch } from '@/components/goods/types';
import type { BannerDetail, BannerGoodsItem, BannerSavePayload, BannerTabItem } from '@/components/banner/types';

interface BannerEditModalProps {
  // 팝업 오픈 여부입니다.
  isOpen: boolean;
  // 수정 대상 배너 번호입니다.
  bannerNo: number | null;
  // 배너 구분 목록입니다.
  bannerDivList: CommonCode[];
  // 상품 상태 목록입니다.
  goodsStatList: CommonCode[];
  // 상품 구분 목록입니다.
  goodsDivList: CommonCode[];
  // 상품 분류 목록입니다.
  goodsMerchList: GoodsMerch[];
  // 브랜드 목록입니다.
  brandList: BrandOption[];
  // 카테고리 옵션 목록입니다.
  categoryOptions: CategoryOption[];
  // 닫기 처리 함수입니다.
  onClose: () => void;
  // 저장 완료 처리 함수입니다.
  onSaved: () => void;
}

// 배너 등록/수정 팝업을 렌더링합니다.
const BannerEditModal = ({
  isOpen,
  bannerNo,
  bannerDivList,
  goodsStatList,
  goodsDivList,
  goodsMerchList,
  brandList,
  categoryOptions,
  onClose,
  onSaved,
}: BannerEditModalProps) => {
  const [loading, setLoading] = useState(false);
  const [bannerDivCd, setBannerDivCd] = useState('BANNER_DIV_01');
  const [bannerNm, setBannerNm] = useState('');
  const [dispStartDt, setDispStartDt] = useState('');
  const [dispEndDt, setDispEndDt] = useState('');
  const [dispOrd, setDispOrd] = useState('1');
  const [showYn, setShowYn] = useState('Y');

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [imagePath, setImagePath] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [bannerOpenCd, setBannerOpenCd] = useState('S');

  const [tabList, setTabList] = useState<BannerTabItem[]>([]);
  const [activeTabNm, setActiveTabNm] = useState('');
  const [tabGoodsRows, setTabGoodsRows] = useState<BannerGoodsItem[]>([]);
  const [goodsRows, setGoodsRows] = useState<BannerGoodsItem[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  const excelInputRef = useRef<HTMLInputElement | null>(null);

  // 이미지 배너 여부를 계산합니다.
  const isImageBanner = useMemo(() => bannerDivCd === 'BANNER_DIV_01' || bannerDivCd === 'BANNER_DIV_03', [bannerDivCd]);
  // 상품탭배너 여부를 계산합니다.
  const isTabBanner = useMemo(() => bannerDivCd === 'BANNER_DIV_02', [bannerDivCd]);
  // 상품리스트배너 여부를 계산합니다.
  const isGoodsListBanner = useMemo(() => bannerDivCd === 'BANNER_DIV_04', [bannerDivCd]);

  // 팝업 초기 상태를 설정합니다.
  const resetState = useCallback(() => {
    setBannerDivCd('BANNER_DIV_01');
    setBannerNm('');
    setDispStartDt('');
    setDispEndDt('');
    setDispOrd('1');
    setShowYn('Y');
    setImageFile(null);
    setImagePreviewUrl('');
    setImagePath('');
    setLinkUrl('');
    setBannerOpenCd('S');
    setTabList([]);
    setActiveTabNm('');
    setTabGoodsRows([]);
    setGoodsRows([]);
    setSelectedRowKeys([]);
    setIsSearchModalOpen(false);
  }, []);

  // 서버 날짜 문자열을 datetime-local 입력값으로 변환합니다.
  const toInputDateTime = useCallback((value?: string) => {
    if (!value) {
      return '';
    }
    if (value.includes('T')) {
      return value.slice(0, 16);
    }
    return value.replace(' ', 'T').slice(0, 16);
  }, []);

  // datetime-local 입력값을 서버 저장 형식으로 변환합니다.
  const toApiDateTime = useCallback((value: string) => {
    if (!value) {
      return undefined;
    }
    return `${value.replace('T', ' ')}:00`;
  }, []);

  // 상세 데이터를 조회해 화면에 반영합니다.
  const fetchDetail = useCallback(async (targetBannerNo: number) => {
    setLoading(true);
    try {
      const response = await api.get('/api/admin/banner/detail', { params: { bannerNo: targetBannerNo } });
      const detail = (response.data || {}) as BannerDetail;
      setBannerDivCd(detail.bannerDivCd || 'BANNER_DIV_01');
      setBannerNm(detail.bannerNm || '');
      setDispStartDt(toInputDateTime(detail.dispStartDt));
      setDispEndDt(toInputDateTime(detail.dispEndDt));
      setDispOrd(String(detail.dispOrd || 1));
      setShowYn(detail.showYn || 'Y');

      const imageInfo = detail.imageInfo;
      setImagePath(imageInfo?.imgPath || '');
      setImagePreviewUrl(imageInfo?.imgPath || '');
      setLinkUrl(imageInfo?.url || '');
      setBannerOpenCd(imageInfo?.bannerOpenCd || 'S');

      const loadedTabs = (detail.tabList || []).map((tab, index) => ({
        bannerTabNo: tab.bannerTabNo,
        tabNm: tab.tabNm,
        dispOrd: tab.dispOrd || index + 1,
        showYn: tab.showYn || 'Y',
      }));
      setTabList(loadedTabs);
      setActiveTabNm(loadedTabs[0]?.tabNm || '');

      const loadedGoods = (detail.goodsList || []).map((item, index) => ({
        rowKey: `${item.bannerTabNo || 0}_${item.goodsId}_${index}`,
        bannerNo: item.bannerNo,
        bannerTabNo: item.bannerTabNo,
        tabNm: item.tabNm || '',
        goodsId: item.goodsId,
        erpStyleCd: item.erpStyleCd,
        goodsNm: item.goodsNm,
        goodsStatNm: item.goodsStatNm,
        goodsDivNm: item.goodsDivNm,
        imgUrl: item.imgUrl,
        imgPath: item.imgPath,
        dispOrd: item.dispOrd || index + 1,
        showYn: item.showYn || 'Y',
      }));
      if (detail.bannerDivCd === 'BANNER_DIV_02') {
        setTabGoodsRows(loadedGoods);
        setGoodsRows([]);
      } else if (detail.bannerDivCd === 'BANNER_DIV_04') {
        setGoodsRows(loadedGoods);
        setTabGoodsRows([]);
      } else {
        setTabGoodsRows([]);
        setGoodsRows([]);
      }
    } catch (error) {
      console.error('배너 상세 조회에 실패했습니다.', error);
      alert('배너 상세 조회에 실패했습니다.');
      onClose();
    } finally {
      setLoading(false);
    }
  }, [onClose, toInputDateTime]);

  // 탭별 현재 상품 목록을 반환합니다.
  const currentTabGoods = useMemo(() => {
    if (!isTabBanner || !activeTabNm) {
      return [];
    }
    return tabGoodsRows
      .filter((item) => item.tabNm === activeTabNm)
      .sort((a, b) => a.dispOrd - b.dispOrd);
  }, [activeTabNm, isTabBanner, tabGoodsRows]);

  // 팝업 오픈 시 신규/수정 초기화를 수행합니다.
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    if (bannerNo) {
      fetchDetail(bannerNo);
      return;
    }
    resetState();
  }, [bannerNo, fetchDetail, isOpen, resetState]);

  // 팝업 닫힘 시 상태를 정리합니다.
  useEffect(() => {
    if (isOpen) {
      return;
    }
    resetState();
  }, [isOpen, resetState]);

  // 이미지 파일 선택 시 미리보기를 갱신합니다.
  const handleImageChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setImageFile(file);
    if (!file) {
      return;
    }
    const nextPreview = URL.createObjectURL(file);
    setImagePreviewUrl(nextPreview);
  }, []);

  // 탭을 추가합니다.
  const handleAddTab = useCallback(() => {
    const nextIndex = tabList.length + 1;
    const nextTabNm = `TAB${nextIndex}`;
    const nextTab: BannerTabItem = {
      tabNm: nextTabNm,
      dispOrd: nextIndex,
      showYn: 'Y',
    };
    setTabList((prev) => [...prev, nextTab]);
    setActiveTabNm(nextTabNm);
  }, [tabList.length]);

  // 탭을 삭제합니다.
  const handleDeleteTab = useCallback((tabNm: string) => {
    setTabList((prev) => prev.filter((item) => item.tabNm !== tabNm));
    setTabGoodsRows((prev) => prev.filter((item) => item.tabNm !== tabNm));
    setSelectedRowKeys([]);
    setActiveTabNm((prev) => (prev === tabNm ? '' : prev));
  }, []);

  // 탭명을 변경합니다.
  const handleChangeTabName = useCallback((targetTabNm: string, nextTabNm: string) => {
    setTabList((prev) => prev.map((item) => (
      item.tabNm === targetTabNm ? { ...item, tabNm: nextTabNm } : item
    )));
    setTabGoodsRows((prev) => prev.map((item) => (
      item.tabNm === targetTabNm ? { ...item, tabNm: nextTabNm } : item
    )));
    setActiveTabNm((prev) => (prev === targetTabNm ? nextTabNm : prev));
  }, []);

  // 현재 탭의 상품 정렬 변경을 반영합니다.
  const handleTabGoodsOrderChange = useCallback((rows: BannerGoodsItem[]) => {
    setTabGoodsRows((prev) => {
      const withoutCurrent = prev.filter((item) => item.tabNm !== activeTabNm);
      return [...withoutCurrent, ...rows.map((item, index) => ({ ...item, dispOrd: index + 1 }))];
    });
  }, [activeTabNm]);

  // 상품리스트배너 정렬 변경을 반영합니다.
  const handleGoodsOrderChange = useCallback((rows: BannerGoodsItem[]) => {
    setGoodsRows(rows.map((item, index) => ({ ...item, dispOrd: index + 1 })));
  }, []);

  // 선택된 상품을 삭제합니다.
  const handleDeleteSelectedGoods = useCallback(() => {
    if (selectedRowKeys.length === 0) {
      alert('삭제할 상품을 선택해주세요.');
      return;
    }
    if (isTabBanner) {
      setTabGoodsRows((prev) => prev.filter((item) => !selectedRowKeys.includes(item.rowKey)));
      setSelectedRowKeys([]);
      return;
    }
    if (isGoodsListBanner) {
      setGoodsRows((prev) => prev.filter((item) => !selectedRowKeys.includes(item.rowKey)));
      setSelectedRowKeys([]);
    }
  }, [isGoodsListBanner, isTabBanner, selectedRowKeys]);

  // 상품 선택 모달을 엽니다.
  const handleOpenSearchModal = useCallback(() => {
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
  }, [activeTabNm, isGoodsListBanner, isTabBanner]);

  // 엑셀 업로드 버튼 클릭 시 파일 선택창을 엽니다.
  const handleExcelUploadClick = useCallback(() => {
    if (!excelInputRef.current) {
      return;
    }
    excelInputRef.current.value = '';
    excelInputRef.current.click();
  }, []);

  // 엑셀 파일을 업로드해 파싱 결과를 반영합니다.
  const handleExcelUploadChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    try {
      const formData = new FormData();
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
  }, [bannerDivCd, isGoodsListBanner, isTabBanner]);

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
      const filenameMatch = disposition?.match(/filename="?([^";]+)"?/);
      link.download = filenameMatch?.[1] || 'banner_goods_template.xlsx';
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('엑셀 다운로드에 실패했습니다.', error);
      alert('엑셀 다운로드에 실패했습니다.');
    }
  }, [bannerDivCd]);

  // 저장 요청 데이터를 구성합니다.
  const buildPayload = useCallback((usrNo: number): BannerSavePayload => {
    const payload: BannerSavePayload = {
      bannerNo: bannerNo || undefined,
      bannerDivCd,
      bannerNm,
      dispStartDt: toApiDateTime(dispStartDt),
      dispEndDt: toApiDateTime(dispEndDt),
      dispOrd: Number(dispOrd || 1),
      showYn,
      regNo: usrNo,
      udtNo: usrNo,
    };

    if (isImageBanner) {
      payload.imageInfo = {
        imgPath: imagePath || undefined,
        url: linkUrl,
        bannerOpenCd,
        dispOrd: 1,
      };
    }

    if (isTabBanner) {
      payload.tabList = tabList.map((item, index) => ({
        bannerTabNo: item.bannerTabNo,
        tabNm: item.tabNm,
        dispOrd: item.dispOrd || index + 1,
        showYn: item.showYn || 'Y',
      }));
      payload.goodsList = tabGoodsRows.map((item, index) => ({
        rowKey: item.rowKey,
        tabNm: item.tabNm,
        goodsId: item.goodsId,
        dispOrd: item.dispOrd || index + 1,
        showYn: item.showYn || 'Y',
      }));
    }

    if (isGoodsListBanner) {
      payload.goodsList = goodsRows.map((item, index) => ({
        rowKey: item.rowKey,
        goodsId: item.goodsId,
        dispOrd: item.dispOrd || index + 1,
        showYn: item.showYn || 'Y',
      }));
    }

    return payload;
  }, [bannerDivCd, bannerNm, bannerNo, bannerOpenCd, dispEndDt, dispOrd, dispStartDt, goodsRows, imagePath, isGoodsListBanner, isImageBanner, isTabBanner, linkUrl, showYn, tabGoodsRows, tabList, toApiDateTime]);

  // 저장을 실행합니다.
  const handleSave = useCallback(async () => {
    const usrNo = requireLoginUsrNo();
    if (!usrNo) {
      return;
    }
    const payload = buildPayload(usrNo);
    const formData = new FormData();
    formData.append('payload', JSON.stringify(payload));
    if (imageFile) {
      formData.append('image', imageFile);
    }

    setLoading(true);
    try {
      if (bannerNo) {
        await api.post('/api/admin/banner/update', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post('/api/admin/banner/create', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      alert('저장되었습니다.');
      onSaved();
    } catch (error: any) {
      const message = error?.response?.data?.message || '저장에 실패했습니다.';
      alert(message);
    } finally {
      setLoading(false);
    }
  }, [bannerNo, buildPayload, imageFile, onSaved]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={bannerNo ? '배너 수정' : '배너 등록'}
      footerActions={(
        <button type="button" className="btn btn-primary" onClick={handleSave} disabled={loading}>
          {loading ? '저장중...' : '저장'}
        </button>
      )}
      width="92vw"
      contentHeight="86vh"
    >
      <div className="row">
        <div className="col-md-3">
          <div className="form-group">
            <label>배너구분</label>
            <select className="form-select" value={bannerDivCd} onChange={(e) => setBannerDivCd(e.target.value)}>
              {bannerDivList.map((item) => (
                <option key={item.cd} value={item.cd}>{item.cdNm}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="col-md-4">
          <div className="form-group">
            <label>배너명</label>
            <input className="form-control" value={bannerNm} onChange={(e) => setBannerNm(e.target.value)} maxLength={20} />
          </div>
        </div>
        <div className="col-md-2">
          <div className="form-group">
            <label>노출시작일시</label>
            <input className="form-control" type="datetime-local" value={dispStartDt} onChange={(e) => setDispStartDt(e.target.value)} />
          </div>
        </div>
        <div className="col-md-2">
          <div className="form-group">
            <label>노출종료일시</label>
            <input className="form-control" type="datetime-local" value={dispEndDt} onChange={(e) => setDispEndDt(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-md-2">
          <div className="form-group">
            <label>노출순서</label>
            <input className="form-control" type="number" value={dispOrd} onChange={(e) => setDispOrd(e.target.value)} min={1} />
          </div>
        </div>
        <div className="col-md-3">
          <div className="form-group">
            <label>노출여부</label>
            <select className="form-select" value={showYn} onChange={(e) => setShowYn(e.target.value)}>
              <option value="Y">Y</option>
              <option value="N">N</option>
            </select>
          </div>
        </div>
      </div>

      {isImageBanner && (
        <>
          <hr />
          <div className="row">
            <div className="col-md-4">
              <div className="form-group">
                <label>배너 이미지</label>
                <input type="file" className="form-control" accept="image/*" onChange={handleImageChange} />
                <small className="text-muted d-block mt-1">
                  {bannerDivCd === 'BANNER_DIV_01' ? '권장 규격: 1280x1280' : '권장 규격: 1280x200'}
                </small>
              </div>
            </div>
            <div className="col-md-4">
              <div className="form-group">
                <label>링크 URL</label>
                <input className="form-control" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
              </div>
            </div>
            <div className="col-md-2">
              <div className="form-group">
                <label>오픈방식</label>
                <select className="form-select" value={bannerOpenCd} onChange={(e) => setBannerOpenCd(e.target.value)}>
                  <option value="S">동일창</option>
                  <option value="N">새창</option>
                </select>
              </div>
            </div>
            <div className="col-md-2 d-flex align-items-end">
              {imagePreviewUrl && (
                <img src={imagePreviewUrl} alt="미리보기" style={{ width: '100%', maxHeight: '110px', objectFit: 'contain' }} />
              )}
            </div>
          </div>
        </>
      )}

      {(isTabBanner || isGoodsListBanner) && (
        <>
          <hr />
          <div className="d-flex flex-wrap justify-content-end gap-2 mb-2">
            {isTabBanner && (
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleAddTab}>탭 추가</button>
            )}
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleExcelDownload}>엑셀 다운로드</button>
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleExcelUploadClick}>엑셀 업로드</button>
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleOpenSearchModal}>상품 등록</button>
            <button type="button" className="btn btn-danger btn-sm" onClick={handleDeleteSelectedGoods}>선택 삭제</button>
          </div>
          <input
            ref={excelInputRef}
            type="file"
            accept=".xlsx"
            style={{ display: 'none' }}
            onChange={handleExcelUploadChange}
          />

          {isTabBanner && (
            <div className="mb-3">
              <div className="table-responsive">
                <table className="table table-sm table-bordered">
                  <thead>
                    <tr>
                      <th style={{ width: '80px' }}>순서</th>
                      <th>탭명</th>
                      <th style={{ width: '120px' }}>노출여부</th>
                      <th style={{ width: '220px' }}>관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tabList.map((tab, index) => (
                      <tr key={`${tab.tabNm}_${index}`} className={activeTabNm === tab.tabNm ? 'table-primary' : ''}>
                        <td>{tab.dispOrd}</td>
                        <td>
                          <input
                            className="form-control form-control-sm"
                            value={tab.tabNm}
                            onChange={(e) => handleChangeTabName(tab.tabNm, e.target.value)}
                          />
                        </td>
                        <td>
                          <select
                            className="form-select form-select-sm"
                            value={tab.showYn}
                            onChange={(e) => {
                              const nextShowYn = e.target.value;
                              setTabList((prev) => prev.map((item) => (
                                item.tabNm === tab.tabNm ? { ...item, showYn: nextShowYn } : item
                              )));
                            }}
                          >
                            <option value="Y">Y</option>
                            <option value="N">N</option>
                          </select>
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => setActiveTabNm(tab.tabNm)}>선택</button>
                            <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => handleDeleteTab(tab.tabNm)}>삭제</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <BannerGoodsGrid
            rows={isTabBanner ? currentTabGoods : goodsRows}
            onOrderChange={isTabBanner ? handleTabGoodsOrderChange : handleGoodsOrderChange}
            onSelectionChange={setSelectedRowKeys}
          />
        </>
      )}

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
    </Modal>
  );
};

export default BannerEditModal;
