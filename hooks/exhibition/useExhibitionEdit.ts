import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { requireLoginUsrNo } from '@/utils/auth';
import useQuillImageUpload from '@/hooks/useQuillImageUpload';
import { extractApiErrorMessage } from '@/utils/api/error';
import { confirmAction, notifyError, notifySuccess } from '@/utils/ui/feedback';
import type { ExhibitionGoodsItem, ExhibitionSavePayload, ExhibitionTabItem } from '@/components/exhibition/types';
import {
  deleteExhibitionApi,
  fetchExhibitionDetailApi,
  saveExhibitionGoodsApi,
  saveExhibitionMasterApi,
  saveExhibitionTabApi,
  uploadExhibitionThumbnailApi,
} from '@/services/exhibitionApi';

interface UseExhibitionEditParams {
  // 팝업 오픈 여부입니다.
  isOpen: boolean;
  // 수정 대상 기획전 번호입니다.
  exhibitionNo: number | null;
  // 닫기 처리입니다.
  onClose: () => void;
  // 저장 완료 처리입니다.
  onSaved: (exhibitionNo?: number | null) => void;
}

/**
 * 기획전 수정 팝업 로직을 처리합니다.
 * @param params 훅 파라미터입니다.
 * @returns 기획전 수정 상태와 이벤트입니다.
 */
const useExhibitionEdit = ({ isOpen, exhibitionNo, onClose, onSaved }: UseExhibitionEditParams) => {
  const [loading, setLoading] = useState(false);
  const [masterSaving, setMasterSaving] = useState(false);
  const [tabSaving, setTabSaving] = useState(false);
  const [goodsSaving, setGoodsSaving] = useState(false);
  const [activePanel, setActivePanel] = useState<'master' | 'detail'>('master');
  const [exhibitionNm, setExhibitionNm] = useState('');
  const [dispStartDate, setDispStartDate] = useState('');
  const [dispEndDate, setDispEndDate] = useState('');
  const [dispStartHour, setDispStartHour] = useState('00');
  const [dispEndHour, setDispEndHour] = useState('24');
  const [listShowYn, setListShowYn] = useState('Y');
  const [showYn, setShowYn] = useState('Y');
  const [exhibitionPcDesc, setExhibitionPcDesc] = useState('');
  const [exhibitionMoDesc, setExhibitionMoDesc] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [isThumbnailPreviewOpen, setIsThumbnailPreviewOpen] = useState(false);
  const [tabs, setTabs] = useState<ExhibitionTabItem[]>([]);
  const [goodsRows, setGoodsRows] = useState<ExhibitionGoodsItem[]>([]);
  const [selectedTabRowKey, setSelectedTabRowKey] = useState('');
  const tabSequenceRef = useRef(1);
  const hourOptions = useMemo(() => Array.from({ length: 25 }, (_, index) => String(index).padStart(2, '0')), []);

  const isEditMode = useMemo(() => Boolean(exhibitionNo), [exhibitionNo]);

  // Quill 툴바 옵션을 구성합니다.
  const quillToolbarOptions = useMemo(
    () => ([
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link', 'image'],
      ['clean'],
    ]),
    []
  );

  // Quill 포맷 옵션을 구성합니다.
  const quillFormatsOptions = useMemo(
    () => ([
      'header',
      'bold',
      'italic',
      'underline',
      'strike',
      'list',
      'link',
      'image',
    ]),
    []
  );

  // PC 상세 에디터 바인딩을 구성합니다.
  const pcDescEditor = useQuillImageUpload({
    toolbarOptions: quillToolbarOptions,
    formats: quillFormatsOptions,
    onChange: setExhibitionPcDesc,
    editorId: 'exhibition-pc-desc',
  });

  // MO 상세 에디터 바인딩을 구성합니다.
  const moDescEditor = useQuillImageUpload({
    toolbarOptions: quillToolbarOptions,
    formats: quillFormatsOptions,
    onChange: setExhibitionMoDesc,
    editorId: 'exhibition-mo-desc',
  });

  // 날짜와 시간 값을 저장용 문자열로 변환합니다.
  const toApiDateTime = useCallback((date?: string, hour?: string, isEnd = false): string | undefined => {
    if (!date) {
      return undefined;
    }
    const normalizedHour = hour || (isEnd ? '24' : '00');
    if (!/^\d{2}$/.test(normalizedHour)) {
      return undefined;
    }
    const hourNumber = Number(normalizedHour);
    if (hourNumber === 24) {
      return `${date} 23:59:59`;
    }
    if (hourNumber < 0 || hourNumber > 23) {
      return undefined;
    }
    return `${date} ${normalizedHour}:00:00`;
  }, []);

  // API 응답 datetime에서 날짜 값을 추출합니다.
  const getInputDate = useCallback((value?: string) => {
    if (!value) {
      return '';
    }
    const normalized = value.includes('T') ? value.replace('T', ' ') : value;
    if (normalized.length < 10) {
      return '';
    }
    return normalized.slice(0, 10);
  }, []);

  // API 응답 datetime에서 시간 값을 추출합니다.
  const getInputHour = useCallback((value?: string, defaultValue = '00') => {
    if (!value) {
      return defaultValue;
    }
    const normalized = value.includes('T') ? value.replace('T', ' ') : value;
    const timePart = normalized.slice(11, 16);
    if (!timePart) {
      return defaultValue;
    }
    if (timePart === '23:59') {
      return '24';
    }
    return timePart.slice(0, 2);
  }, []);

  // 썸네일 이미지를 검증합니다.
  const validateThumbnailImage = useCallback(async (file: File): Promise<string | null> => {
    if (!file.type.startsWith('image/')) {
      return '이미지 파일만 업로드할 수 있습니다.';
    }
    const previewUrl = URL.createObjectURL(file);
    try {
      const nextMessage = await new Promise<string | null>((resolve) => {
        const image = new Image();
        image.onload = () => {
          const isWidthMatch = image.width === 750;
          const isHeightMatch = image.height === 1024;
          URL.revokeObjectURL(previewUrl);
          if (!isWidthMatch || !isHeightMatch) {
            resolve('썸네일은 750x1024px만 가능합니다.');
            return;
          }
          resolve(null);
        };
        image.onerror = () => {
          URL.revokeObjectURL(previewUrl);
          resolve('이미지 파일을 확인해주세요.');
        };
        image.src = previewUrl;
      });
      return nextMessage;
    } catch {
      URL.revokeObjectURL(previewUrl);
      return '이미지 파일을 확인해주세요.';
    }
  }, []);

  // 썸네일 이미지 업로드를 처리합니다.
  const handleThumbnailUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!isEditMode || !exhibitionNo) {
      notifyError('기획전 등록 후 썸네일 업로드가 가능합니다.');
      return;
    }
    if (!file) {
      return;
    }
    const validationMessage = await validateThumbnailImage(file);
    if (validationMessage) {
      notifyError(validationMessage);
      return;
    }
    const usrNo = requireLoginUsrNo();
    if (!usrNo) {
      return;
    }
    const formData = new FormData();
    formData.append('exhibitionNo', String(exhibitionNo));
    formData.append('regNo', String(usrNo));
    formData.append('image', file);

    setThumbnailUploading(true);
    try {
      const responseData = await uploadExhibitionThumbnailApi(formData);
      const nextThumbnailUrl = String(responseData?.thumbnailUrl || '');
      if (!nextThumbnailUrl) {
        notifyError('썸네일 URL을 확인할 수 없습니다.');
        return;
      }
      setThumbnailUrl(nextThumbnailUrl);
      notifySuccess('썸네일이 업로드되었습니다.');
    } catch (error) {
      const message = extractApiErrorMessage(error, '썸네일 업로드에 실패했습니다.');
      notifyError(message);
    } finally {
      setThumbnailUploading(false);
    }
  }, [exhibitionNo, isEditMode, validateThumbnailImage]);

  // 탭 신규 행 키를 생성합니다.
  const buildNewTabRowKey = useCallback(() => {
    const next = tabSequenceRef.current;
    tabSequenceRef.current += 1;
    return `exhibition-tab-new-${Date.now()}-${next}`;
  }, []);

  // 탭 행 키를 보정합니다.
  const toExhibitionTabRow = useCallback((items: ExhibitionTabItem[]) => items.map((item, index) => ({
    ...item,
    rowKey: item.rowKey || buildNewTabRowKey(),
    dispOrd: item.dispOrd || index + 1,
    tabNm: item.tabNm?.trim() || `탭${index + 1}`,
    showYn: item.showYn === 'N' ? 'N' : 'Y',
  })), [buildNewTabRowKey]);

  // 상품 행 키를 보정합니다.
  const toExhibitionGoodsRow = useCallback((items: ExhibitionGoodsItem[]) => {
    return items.map((item, index) => ({
      ...item,
      rowKey: item.rowKey || `exhibition-goods-new-${Date.now()}-${index}`,
      dispOrd: item.dispOrd || index + 1,
      showYn: item.showYn === 'N' ? 'N' : 'Y',
    }));
  }, []);

  // 상태를 초기화합니다.
  const resetState = useCallback(() => {
    setLoading(false);
    setMasterSaving(false);
    setTabSaving(false);
    setGoodsSaving(false);
    setExhibitionNm('');
    setDispStartDate('');
    setDispEndDate('');
    setDispStartHour('00');
    setDispEndHour('24');
    setListShowYn('Y');
    setShowYn('Y');
    setExhibitionPcDesc('');
    setExhibitionMoDesc('');
    setThumbnailUrl('');
    setThumbnailUploading(false);
    setIsThumbnailPreviewOpen(false);
    setTabs([]);
    setGoodsRows([]);
    setSelectedTabRowKey('');
    tabSequenceRef.current = 1;
    setActivePanel('master');
  }, []);

  // 상세 데이터를 조회합니다.
  const fetchDetail = useCallback(async (targetExhibitionNo: number) => {
    setLoading(true);
    try {
      const detail = await fetchExhibitionDetailApi(targetExhibitionNo);
      setExhibitionNm(detail.exhibitionNm || '');
      setDispStartDate(getInputDate(detail.dispStartDt));
      setDispEndDate(getInputDate(detail.dispEndDt));
      setDispStartHour(getInputHour(detail.dispStartDt, '00'));
      setDispEndHour(getInputHour(detail.dispEndDt, '24'));
      setListShowYn(detail.listShowYn || 'Y');
      setShowYn(detail.showYn || 'Y');
      setThumbnailUrl(detail.thumbnailUrl || '');
      setExhibitionPcDesc(detail.exhibitionPcDesc || '');
      setExhibitionMoDesc(detail.exhibitionMoDesc || '');

      const loadedTabs = toExhibitionTabRow((detail.tabList || []).map((tab, index) => ({
        rowKey: String(tab.exhibitionTabNo || `tab-${targetExhibitionNo}-${index}`),
        exhibitionTabNo: tab.exhibitionTabNo,
        exhibitionNo: targetExhibitionNo,
        tabNm: tab.tabNm || '',
        dispStartDt: tab.dispStartDt,
        dispEndDt: tab.dispEndDt,
        dispOrd: tab.dispOrd || index + 1,
        showYn: tab.showYn || 'Y',
      })));
      const loadedGoods = toExhibitionGoodsRow((detail.goodsList || []).map((goods, index) => ({
        rowKey: `${goods.exhibitionTabNo || 0}_${goods.goodsId}_${index}`,
        exhibitionNo: targetExhibitionNo,
        exhibitionTabNo: goods.exhibitionTabNo,
        goodsId: goods.goodsId,
        imgUrl: goods.imgUrl,
        goodsNm: goods.goodsNm,
        erpStyleCd: goods.erpStyleCd,
        dispOrd: goods.dispOrd || index + 1,
        showYn: goods.showYn || 'Y',
      })));
      setTabs(loadedTabs);
      setGoodsRows(loadedGoods);
      setSelectedTabRowKey(loadedTabs[0]?.rowKey || '');
    } catch (error) {
      console.error('기획전 상세 조회에 실패했습니다.', error);
      notifyError('기획전 상세 조회에 실패했습니다.');
      onClose();
    } finally {
      setLoading(false);
    }
  }, [getInputDate, getInputHour, onClose, toExhibitionGoodsRow, toExhibitionTabRow]);

  // 마스터 저장용 페이로드를 생성합니다.
  const buildMasterPayload = useCallback((usrNo: number): ExhibitionSavePayload => {
    const payload: ExhibitionSavePayload = {
      exhibitionNo: exhibitionNo || undefined,
      exhibitionNm,
      dispStartDt: toApiDateTime(dispStartDate, dispStartHour),
      dispEndDt: toApiDateTime(dispEndDate, dispEndHour, true),
      listShowYn,
      showYn,
      exhibitionPcDesc,
      exhibitionMoDesc,
      regNo: isEditMode ? undefined : usrNo,
      udtNo: isEditMode ? usrNo : undefined,
    };
    return payload;
  }, [
    exhibitionNo,
    exhibitionNm,
    exhibitionMoDesc,
    exhibitionPcDesc,
    isEditMode,
    listShowYn,
    showYn,
    dispEndDate,
    dispEndHour,
    dispStartDate,
    dispStartHour,
    toApiDateTime,
  ]);

  // 탭 저장용 페이로드를 생성합니다.
  const buildTabSavePayload = useCallback((usrNo: number, forceDeleteGoodsWithTabs = false) => {
    const payload = {
      exhibitionNo: exhibitionNo || undefined,
      udtNo: usrNo,
      forceDeleteGoodsWithTabs,
      tabList: tabs.map((item, index) => ({
        ...item,
        rowKey: item.rowKey || buildNewTabRowKey(),
        exhibitionTabNo: item.exhibitionTabNo,
        exhibitionNo: exhibitionNo || undefined,
        tabNm: item.tabNm,
        dispStartDt: item.dispStartDt,
        dispEndDt: item.dispEndDt,
        dispOrd: index + 1,
        showYn: item.showYn || 'Y',
      })),
    };
    return payload;
  }, [exhibitionNo, tabs, buildNewTabRowKey]);

  // 상품 저장용 페이로드를 생성합니다.
  const buildGoodsSavePayload = useCallback((usrNo: number) => {
    return {
      exhibitionNo: exhibitionNo || undefined,
      udtNo: usrNo,
      goodsList: goodsRows.map((item) => ({
        rowKey: item.rowKey,
        exhibitionTabNo: item.exhibitionTabNo,
        exhibitionTabRowKey: item.exhibitionTabRowKey,
        exhibitionNo: exhibitionNo || undefined,
        goodsId: item.goodsId,
        dispOrd: item.dispOrd,
        showYn: item.showYn || 'Y',
      })),
    };
  }, [exhibitionNo, goodsRows]);

  // 마스터 정보를 저장합니다.
  const handleSaveMaster = useCallback(async () => {
    const usrNo = requireLoginUsrNo();
    if (!usrNo) {
      return;
    }
    const payload = buildMasterPayload(usrNo);
    setMasterSaving(true);
    try {
      if (isEditMode) {
        await saveExhibitionMasterApi(payload);
        notifySuccess('기획전이 수정되었습니다.');
        onSaved(exhibitionNo);
        return;
      }

      const responseData = await saveExhibitionMasterApi(payload);
      const createdNo = (responseData?.exhibitionNo as number) || (typeof responseData === 'number' ? responseData : null);
      notifySuccess('기획전이 등록되었습니다.');
      onSaved(createdNo || null);
    } catch (error) {
      const message = extractApiErrorMessage(error, '저장에 실패했습니다.');
      notifyError(message);
    } finally {
      setMasterSaving(false);
    }
  }, [buildMasterPayload, exhibitionNo, isEditMode, onSaved]);

  // 탭 정보를 저장합니다.
  const handleSaveTabs = useCallback(async () => {
    const usrNo = requireLoginUsrNo();
    if (!usrNo) {
      return;
    }
    if (!exhibitionNo) {
      notifyError('마스터정보 저장 후 탭을 저장해주세요.');
      return;
    }
    setTabSaving(true);
    try {
      await saveExhibitionTabApi(buildTabSavePayload(usrNo));
      notifySuccess('탭 정보가 저장되었습니다.');
      await fetchDetail(exhibitionNo);
    } catch (error) {
      const message = extractApiErrorMessage(error, '탭 저장에 실패했습니다.');
      if (String(message).includes('삭제할 탭에 등록된 상품이 있습니다')) {
        const confirmed = confirmAction('삭제 대상 탭에 등록된 상품도 함께 삭제하시겠습니까?');
        if (!confirmed) {
          return;
        }
        await saveExhibitionTabApi(buildTabSavePayload(usrNo, true));
        notifySuccess('탭 정보가 저장되었습니다.');
        await fetchDetail(exhibitionNo);
        return;
      }
      notifyError(message);
    } finally {
      setTabSaving(false);
    }
  }, [buildTabSavePayload, exhibitionNo, fetchDetail]);

  // 상품 정보를 저장합니다.
  const handleSaveGoods = useCallback(async () => {
    const usrNo = requireLoginUsrNo();
    if (!usrNo) {
      return;
    }
    if (!exhibitionNo) {
      notifyError('마스터정보 저장 후 상품을 저장해주세요.');
      return;
    }
    const hasUnsavedTabGoods = goodsRows.some((item) => !item.exhibitionTabNo || item.exhibitionTabNo < 1);
    if (hasUnsavedTabGoods) {
      notifyError('탭 저장을 먼저 진행한 뒤 상품 저장을 해주세요.');
      return;
    }
    setGoodsSaving(true);
    try {
      await saveExhibitionGoodsApi(buildGoodsSavePayload(usrNo));
      notifySuccess('상품 정보가 저장되었습니다.');
      await fetchDetail(exhibitionNo);
    } catch (error) {
      const message = extractApiErrorMessage(error, '상품 저장에 실패했습니다.');
      notifyError(message);
    } finally {
      setGoodsSaving(false);
    }
  }, [buildGoodsSavePayload, exhibitionNo, fetchDetail, goodsRows]);

  // 기획전을 삭제합니다.
  const handleDelete = useCallback(async () => {
    if (!exhibitionNo) {
      return;
    }
    const usrNo = requireLoginUsrNo();
    if (!usrNo) {
      return;
    }
    if (tabs.length > 0 && !confirmAction('기획전에 등록된 탭이 있습니다. 정말 삭제하시겠습니까?')) {
      return;
    }
    if (!confirmAction('기획전을 삭제하시겠습니까?')) {
      return;
    }
    setLoading(true);
    try {
      await deleteExhibitionApi(exhibitionNo, usrNo);
      notifySuccess('기획전이 삭제되었습니다.');
      onSaved();
    } catch (error) {
      const message = extractApiErrorMessage(error, '삭제에 실패했습니다.');
      notifyError(message);
    } finally {
      setLoading(false);
    }
  }, [exhibitionNo, onSaved, tabs.length]);

  // 팝업 오픈 시 상세 조회를 수행합니다.
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    if (exhibitionNo) {
      void fetchDetail(exhibitionNo);
      return;
    }
    resetState();
  }, [exhibitionNo, fetchDetail, isOpen, resetState]);

  // 팝업 닫힘 시 상태를 정리합니다.
  useEffect(() => {
    if (isOpen) {
      return;
    }
    resetState();
  }, [isOpen, resetState]);

  return {
    isEditMode,
    loading,
    masterSaving,
    tabSaving,
    goodsSaving,
    activePanel,
    exhibitionNm,
    dispStartDate,
    dispEndDate,
    dispStartHour,
    dispEndHour,
    listShowYn,
    showYn,
    exhibitionPcDesc,
    exhibitionMoDesc,
    thumbnailUrl,
    thumbnailUploading,
    isThumbnailPreviewOpen,
    tabs,
    goodsRows,
    selectedTabRowKey,
    hourOptions,
    pcDescEditor,
    moDescEditor,
    setActivePanel,
    setExhibitionNm,
    setDispStartDate,
    setDispEndDate,
    setDispStartHour,
    setDispEndHour,
    setListShowYn,
    setShowYn,
    setTabs,
    setGoodsRows,
    setSelectedTabRowKey,
    setIsThumbnailPreviewOpen,
    handleThumbnailUpload,
    handleSaveMaster,
    handleSaveTabs,
    handleSaveGoods,
    handleDelete,
  };
};

export default useExhibitionEdit;
