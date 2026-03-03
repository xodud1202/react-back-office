import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import api from '@/utils/axios/axios';
import { requireLoginUsrNo } from '@/utils/auth';
import useQuillImageUpload from '@/hooks/useQuillImageUpload';
import Modal from '@/components/common/Modal';
import NewsImagePreviewModal from '@/components/common/NewsImagePreviewModal';
import type { BrandOption, CategoryOption, CommonCode, GoodsMerch } from '@/components/goods/types';
import type { ExhibitionDetail, ExhibitionGoodsItem, ExhibitionSavePayload, ExhibitionTabItem } from '@/components/exhibition/types';
import ExhibitionTabGoodsSection from '@/components/exhibition/ExhibitionTabGoodsSection';

// Quill 라이브러리를 동적으로 로딩합니다.
const ReactQuill = dynamic(
  async () => {
    const mod = await import('react-quill-new');
    const Component = mod.default;
    const ForwardedQuill = React.forwardRef<any, React.ComponentProps<typeof Component>>((props, ref) => (
      <Component ref={ref} {...props} />
    ));
    ForwardedQuill.displayName = 'ExhibitionEditModalQuill';
    return ForwardedQuill;
  },
  { ssr: false }
);

interface ExhibitionEditModalProps {
  // 팝업 오픈 여부입니다.
  isOpen: boolean;
  // 수정 대상 기획전 번호입니다.
  exhibitionNo: number | null;
  // 닫기 처리입니다.
  onClose: () => void;
  // 저장 완료 처리입니다.
  onSaved: (exhibitionNo?: number | null) => void;
  // 상품 상태 코드 목록입니다.
  goodsStatList: CommonCode[];
  // 상품 구분 코드 목록입니다.
  goodsDivList: CommonCode[];
  // 상품 분류 목록입니다.
  goodsMerchList: GoodsMerch[];
  // 브랜드 목록입니다.
  brandList: BrandOption[];
  // 카테고리 목록입니다.
  categoryOptions: CategoryOption[];
}

// 기획전 등록/수정 팝업입니다.
const ExhibitionEditModal = ({
  isOpen,
  exhibitionNo,
  onClose,
  onSaved,
  goodsStatList,
  goodsDivList,
  goodsMerchList,
  brandList,
  categoryOptions,
}: ExhibitionEditModalProps) => {
  const [loading, setLoading] = useState(false);
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

  const pcDescEditor = useQuillImageUpload({
    toolbarOptions: quillToolbarOptions,
    formats: quillFormatsOptions,
    onChange: setExhibitionPcDesc,
    editorId: 'exhibition-pc-desc',
  });
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

  // API 응답 datetime에서 시간(selectBox) 값을 추출합니다.
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

  // 썸네일 이미지를 프론트에서 검증합니다.
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
      alert('기획전 등록 후 썸네일 업로드가 가능합니다.');
      return;
    }
    if (!file) {
      return;
    }
    const validationMessage = await validateThumbnailImage(file);
    if (validationMessage) {
      alert(validationMessage);
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
      const response = await api.post('/api/admin/exhibition/thumbnail/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const nextThumbnailUrl = String(response.data?.thumbnailUrl || '');
      if (!nextThumbnailUrl) {
        alert('썸네일 URL을 확인할 수 없습니다.');
        return;
      }
      setThumbnailUrl(nextThumbnailUrl);
      alert('썸네일이 업로드되었습니다.');
    } catch (error: any) {
      const message = error?.response?.data?.message || '썸네일 업로드에 실패했습니다.';
      alert(message);
    } finally {
      setThumbnailUploading(false);
    }
  }, [exhibitionNo, isEditMode, validateThumbnailImage]);

  // 행 키를 생성합니다.
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

  // 팝업 상태를 리셋합니다.
  const resetState = useCallback(() => {
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
      const response = await api.get('/api/admin/exhibition/detail', {
        params: { exhibitionNo: targetExhibitionNo },
      });
      const detail = (response.data || {}) as ExhibitionDetail;
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
      alert('기획전 상세 조회에 실패했습니다.');
      onClose();
    } finally {
      setLoading(false);
    }
  }, [getInputDate, getInputHour, onClose, toExhibitionGoodsRow, toExhibitionTabRow]);

  // 저장 시 기본 페이로드를 생성합니다.
  const buildPayload = useCallback((usrNo: number): ExhibitionSavePayload => {
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

    if (isEditMode) {
      payload.tabList = tabs.map((item, index) => ({
        ...item,
        rowKey: item.rowKey || buildNewTabRowKey(),
        exhibitionTabNo: item.exhibitionTabNo,
        exhibitionNo: exhibitionNo || undefined,
        tabNm: item.tabNm,
        dispStartDt: item.dispStartDt,
        dispEndDt: item.dispEndDt,
        dispOrd: index + 1,
        showYn: item.showYn || 'Y',
      }));

      payload.goodsList = goodsRows.map((item) => ({
        rowKey: item.rowKey,
        exhibitionTabNo: item.exhibitionTabNo,
        exhibitionTabRowKey: item.exhibitionTabRowKey,
        exhibitionNo: exhibitionNo || undefined,
        goodsId: item.goodsId,
        dispOrd: item.dispOrd,
        showYn: item.showYn || 'Y',
      }));
    }

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
    tabs,
    goodsRows,
    buildNewTabRowKey,
    toApiDateTime,
  ]);

  // 저장을 처리합니다.
  const handleSave = useCallback(async () => {
    const usrNo = requireLoginUsrNo();
    if (!usrNo) {
      return;
    }
    const payload = buildPayload(usrNo);
    setLoading(true);
    try {
      if (isEditMode) {
        await api.post('/api/admin/exhibition/update', payload);
        alert('기획전이 수정되었습니다.');
        onSaved(exhibitionNo);
        return;
      }

      const response = await api.post('/api/admin/exhibition/create', payload);
      const createdNo = (response.data?.exhibitionNo as number) || (typeof response.data === 'number' ? response.data : null);
      alert('기획전이 등록되었습니다.');
      onSaved(createdNo || null);
    } catch (error: any) {
      const message = error?.response?.data?.message || '저장에 실패했습니다.';
      alert(message);
    } finally {
      setLoading(false);
    }
  }, [buildPayload, exhibitionNo, isEditMode, onSaved]);

  // 삭제를 처리합니다.
  const handleDelete = useCallback(async () => {
    if (!exhibitionNo) {
      return;
    }
    const usrNo = requireLoginUsrNo();
    if (!usrNo) {
      return;
    }
    if (tabs.length > 0 && !window.confirm('기획전에 등록된 탭이 있습니다. 정말 삭제하시겠습니까?')) {
      return;
    }
    if (!window.confirm('기획전을 삭제하시겠습니까?')) {
      return;
    }
    setLoading(true);
    try {
      await api.post('/api/admin/exhibition/delete', { exhibitionNo, udtNo: usrNo });
      alert('기획전이 삭제되었습니다.');
      onSaved();
    } catch (error: any) {
      const message = error?.response?.data?.message || '삭제에 실패했습니다.';
      alert(message);
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? '기획전 수정' : '기획전 등록'}
      footerLeftActions={(
        <>
          {isEditMode && (
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleDelete}
              disabled={loading}
            >
              삭제
            </button>
          )}
        </>
      )}
      footerActions={(
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleSave}
          disabled={loading || thumbnailUploading}
        >
          {loading ? '저장중...' : '저장'}
        </button>
      )}
      width="92vw"
      contentHeight="88vh"
    >
      <ul className="nav nav-tabs mb-3">
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link text-secondary ${activePanel === 'master' ? 'active' : ''}`}
            onClick={() => setActivePanel('master')}
          >
            마스터정보
          </button>
        </li>
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link text-secondary ${activePanel === 'detail' ? 'active' : ''}`}
            onClick={() => setActivePanel('detail')}
          >
            탭&상품
          </button>
        </li>
      </ul>

      <div style={{ display: activePanel === 'master' ? 'block' : 'none' }}>
        <div className="row">
          <div className="col-md-5">
            <div className="form-group">
              <label>기획전명</label>
              <input
                type="text"
                className="form-control"
                value={exhibitionNm}
                onChange={(event) => setExhibitionNm(event.target.value)}
                maxLength={50}
              />
            </div>
          </div>
          <div className="col-md-3">
            <div className="form-group">
              <label>노출시작일시</label>
              <div className="d-flex gap-2">
                <input
                  type="date"
                  className="form-control"
                  value={dispStartDate}
                  onChange={(event) => setDispStartDate(event.target.value)}
                />
                <select className="form-select w-auto" value={dispStartHour} onChange={(event) => setDispStartHour(event.target.value)}>
                  {hourOptions.map((hour) => (
                    <option key={hour} value={hour}>
                      {hour}시
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="form-group">
              <label>노출종료일시</label>
              <div className="d-flex gap-2">
                <input
                  type="date"
                  className="form-control"
                  value={dispEndDate}
                  onChange={(event) => setDispEndDate(event.target.value)}
                />
                <select className="form-select w-auto" value={dispEndHour} onChange={(event) => setDispEndHour(event.target.value)}>
                  {hourOptions.map((hour) => (
                    <option key={hour} value={hour}>
                      {hour}시
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-md-2">
            <div className="form-group">
              <label>리스트노출여부</label>
              <select className="form-select" value={listShowYn} onChange={(event) => setListShowYn(event.target.value)}>
                <option value="Y">Y</option>
                <option value="N">N</option>
              </select>
            </div>
          </div>
          <div className="col-md-2">
            <div className="form-group">
              <label>노출여부</label>
              <select className="form-select" value={showYn} onChange={(event) => setShowYn(event.target.value)}>
                <option value="Y">Y</option>
                <option value="N">N</option>
              </select>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-md-3">
            <div className="form-group">
              <label>기획전 썸네일(750x1024)</label>
              <input
                type="file"
                className="form-control"
                accept="image/*"
                onChange={handleThumbnailUpload}
                disabled={loading || thumbnailUploading || !isEditMode}
              />
              <small className="text-muted d-block mt-1">
                {isEditMode ? '썸네일 업로드를 통해 노출 이미지를 등록해주세요.' : '기획전 등록 후 썸네일 업로드가 가능합니다.'}
              </small>
            </div>
          </div>
          <div className="col-md-3">
            <div className="form-group">
              <label>썸네일 미리보기</label>
              {thumbnailUrl ? (
                <img
                  src={thumbnailUrl}
                  alt="기획전 썸네일"
                  className="border rounded"
                  style={{ width: '100%', maxHeight: '140px', objectFit: 'contain', cursor: 'pointer' }}
                  onClick={() => setIsThumbnailPreviewOpen(true)}
                />
              ) : (
                <div className="text-muted">등록된 썸네일이 없습니다.</div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-3">
          <label className="d-block mb-2">PC 상세</label>
          <ReactQuill
            id="exhibition-pc-desc"
            ref={pcDescEditor.quillRef}
            theme="snow"
            className="board-editor"
            value={exhibitionPcDesc}
            onChange={pcDescEditor.handleEditorChange}
            modules={pcDescEditor.quillModules}
            formats={pcDescEditor.quillFormats}
          />
        </div>
        <div className="mt-4">
          <label className="d-block mb-2">MO 상세</label>
          <ReactQuill
            id="exhibition-mo-desc"
            ref={moDescEditor.quillRef}
            theme="snow"
            className="board-editor"
            value={exhibitionMoDesc}
            onChange={moDescEditor.handleEditorChange}
            modules={moDescEditor.quillModules}
            formats={moDescEditor.quillFormats}
          />
        </div>
      </div>

      <div style={{ display: activePanel === 'detail' ? 'block' : 'none' }}>
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
          onSave={handleSave}
          saving={loading}
        />
      </div>

      <style jsx>{`
        :global(.board-editor .ql-container) {
          height: 280px;
        }
        :global(.board-editor .ql-editor) {
          min-height: 280px;
        }
        :global(.board-editor .ql-editor img) {
          width: unset;
          max-width: 100%;
          height: auto;
          border-radius: 0;
        }
      `}</style>
      <NewsImagePreviewModal
        isOpen={isThumbnailPreviewOpen}
        imageUrl={thumbnailUrl}
        onClose={() => setIsThumbnailPreviewOpen(false)}
      />
    </Modal>
  );
};

export default ExhibitionEditModal;
