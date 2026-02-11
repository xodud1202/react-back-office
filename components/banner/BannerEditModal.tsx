import React, { useCallback, useEffect, useMemo, useState } from 'react';
import api from '@/utils/axios/axios';
import { requireLoginUsrNo } from '@/utils/auth';
import Modal from '@/components/common/Modal';
import BannerBaseInfoSection from '@/components/banner/BannerBaseInfoSection';
import BannerImageDetailSection from '@/components/banner/BannerImageDetailSection';
import BannerGoodsDetailSection from '@/components/banner/BannerGoodsDetailSection';
import type { CommonCode, BrandOption, CategoryOption, GoodsMerch } from '@/components/goods/types';
import type { BannerDetail, BannerGoodsItem, BannerImageInfo, BannerSavePayload, BannerTabItem } from '@/components/banner/types';

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

  const [imageRows, setImageRows] = useState<BannerImageInfo[]>([]);
  const [selectedImageRowKey, setSelectedImageRowKey] = useState('');
  const [imageFileMap, setImageFileMap] = useState<Record<string, File>>({});
  const [imagePreviewMap, setImagePreviewMap] = useState<Record<string, string>>({});

  const [tabList, setTabList] = useState<BannerTabItem[]>([]);
  const [activeTabNm, setActiveTabNm] = useState('');
  const [tabGoodsRows, setTabGoodsRows] = useState<BannerGoodsItem[]>([]);
  const [goodsRows, setGoodsRows] = useState<BannerGoodsItem[]>([]);

  // 이미지 배너 여부를 계산합니다.
  const isImageBanner = useMemo(() => bannerDivCd === 'BANNER_DIV_01' || bannerDivCd === 'BANNER_DIV_03', [bannerDivCd]);
  // 상품탭배너 여부를 계산합니다.
  const isTabBanner = useMemo(() => bannerDivCd === 'BANNER_DIV_02', [bannerDivCd]);
  // 상품리스트배너 여부를 계산합니다.
  const isGoodsListBanner = useMemo(() => bannerDivCd === 'BANNER_DIV_04', [bannerDivCd]);
  // 수정 모드 여부를 계산합니다.
  const isEditMode = useMemo(() => Boolean(bannerNo), [bannerNo]);

  // 팝업 초기 상태를 설정합니다.
  const resetState = useCallback(() => {
    setBannerDivCd('BANNER_DIV_01');
    setBannerNm('');
    setDispStartDt('');
    setDispEndDt('');
    setDispOrd('1');
    setShowYn('Y');
    setImageRows([]);
    setSelectedImageRowKey('');
    setImageFileMap({});
    setImagePreviewMap({});
    setTabList([]);
    setActiveTabNm('');
    setTabGoodsRows([]);
    setGoodsRows([]);
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
  const toApiDateTime = useCallback((value?: string) => {
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

      const sourceImageList = (detail.imageInfoList && detail.imageInfoList.length > 0)
        ? detail.imageInfoList
        : (detail.imageInfo ? [detail.imageInfo] : []);
      const loadedImageRows = sourceImageList.map((item, index) => ({
        rowKey: String(item.imageBannerNo || `${targetBannerNo}_${index}`),
        imageBannerNo: item.imageBannerNo,
        bannerNo: item.bannerNo,
        bannerNm: item.bannerNm || '',
        imgPath: item.imgPath || '',
        url: item.url || '',
        bannerOpenCd: item.bannerOpenCd || 'S',
        dispOrd: item.dispOrd || index + 1,
        dispStartDt: toInputDateTime(item.dispStartDt),
        dispEndDt: toInputDateTime(item.dispEndDt),
        showYn: item.showYn || 'Y',
        delYn: item.delYn || 'N',
      }));
      setImageRows(loadedImageRows);
      setSelectedImageRowKey(loadedImageRows[0]?.rowKey || '');
      setImageFileMap({});
      setImagePreviewMap({});

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

    if (isEditMode && isImageBanner) {
      payload.imageInfoList = imageRows.map((row, index) => ({
        rowKey: row.rowKey,
        imageBannerNo: row.imageBannerNo,
        bannerNo: row.bannerNo,
        bannerNm: row.bannerNm,
        imgPath: row.imgPath,
        url: row.url,
        bannerOpenCd: row.bannerOpenCd || 'S',
        dispOrd: row.dispOrd || index + 1,
        dispStartDt: toApiDateTime(row.dispStartDt),
        dispEndDt: toApiDateTime(row.dispEndDt),
        showYn: row.showYn || 'Y',
        delYn: 'N',
      }));
    }

    if (isEditMode && isTabBanner) {
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

    if (isEditMode && isGoodsListBanner) {
      payload.goodsList = goodsRows.map((item, index) => ({
        rowKey: item.rowKey,
        goodsId: item.goodsId,
        dispOrd: item.dispOrd || index + 1,
        showYn: item.showYn || 'Y',
      }));
    }

    return payload;
  }, [bannerDivCd, bannerNm, bannerNo, dispEndDt, dispOrd, dispStartDt, goodsRows, imageRows, isEditMode, isGoodsListBanner, isImageBanner, isTabBanner, showYn, tabGoodsRows, tabList, toApiDateTime]);

  // 저장을 실행합니다.
  const handleSave = useCallback(async () => {
    const usrNo = requireLoginUsrNo();
    if (!usrNo) {
      return;
    }
    const payload = buildPayload(usrNo);
    const formData = new FormData();
    formData.append('payload', JSON.stringify(payload));

    Object.entries(imageFileMap).forEach(([rowKey, file]) => {
      formData.append('images', file);
      formData.append('imageKeys', rowKey);
    });

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
  }, [bannerNo, buildPayload, imageFileMap, onSaved]);

  // 배너를 삭제합니다.
  const handleDelete = useCallback(async () => {
    if (!bannerNo) {
      return;
    }
    const usrNo = requireLoginUsrNo();
    if (!usrNo) {
      return;
    }
    if (!window.confirm('배너를 삭제하시겠습니까?')) {
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/admin/banner/delete', {
        bannerNo,
        udtNo: usrNo,
      });
      alert('삭제되었습니다.');
      onSaved();
    } catch (error: any) {
      const message = error?.response?.data?.message || '삭제에 실패했습니다.';
      alert(message);
    } finally {
      setLoading(false);
    }
  }, [bannerNo, onSaved]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={bannerNo ? '배너 수정' : '배너 등록'}
      footerLeftActions={(
        <>
          {isEditMode && (
            <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={loading}>
              삭제
            </button>
          )}
        </>
      )}
      footerActions={(
        <button type="button" className="btn btn-primary" onClick={handleSave} disabled={loading}>
          {loading ? '저장중...' : '저장'}
        </button>
      )}
      width="92vw"
      contentHeight="86vh"
    >
      <BannerBaseInfoSection
        bannerDivList={bannerDivList}
        bannerDivCd={bannerDivCd}
        bannerNm={bannerNm}
        dispStartDt={dispStartDt}
        dispEndDt={dispEndDt}
        dispOrd={dispOrd}
        showYn={showYn}
        setBannerDivCd={setBannerDivCd}
        setBannerNm={setBannerNm}
        setDispStartDt={setDispStartDt}
        setDispEndDt={setDispEndDt}
        setDispOrd={setDispOrd}
        setShowYn={setShowYn}
      />

      {!isEditMode && (
        <>
          <hr />
          <div className="alert alert-info mb-0">
            배너 등록 단계에서는 기본 정보만 저장됩니다. 저장 후 수정에서 배너 상세 정보를 입력해주세요.
          </div>
        </>
      )}

      <BannerImageDetailSection
        isEditMode={isEditMode}
        isImageBanner={isImageBanner}
        bannerNo={bannerNo}
        bannerDivCd={bannerDivCd}
        imageRows={imageRows}
        selectedImageRowKey={selectedImageRowKey}
        imagePreviewMap={imagePreviewMap}
        setImageRows={setImageRows}
        setSelectedImageRowKey={setSelectedImageRowKey}
        setImageFileMap={setImageFileMap}
        setImagePreviewMap={setImagePreviewMap}
      />

      <BannerGoodsDetailSection
        isEditMode={isEditMode}
        isTabBanner={isTabBanner}
        isGoodsListBanner={isGoodsListBanner}
        bannerDivCd={bannerDivCd}
        tabList={tabList}
        activeTabNm={activeTabNm}
        tabGoodsRows={tabGoodsRows}
        goodsRows={goodsRows}
        setTabList={setTabList}
        setActiveTabNm={setActiveTabNm}
        setTabGoodsRows={setTabGoodsRows}
        setGoodsRows={setGoodsRows}
        categoryOptions={categoryOptions}
        goodsStatList={goodsStatList}
        goodsDivList={goodsDivList}
        goodsMerchList={goodsMerchList}
        brandList={brandList}
      />
    </Modal>
  );
};

export default BannerEditModal;
