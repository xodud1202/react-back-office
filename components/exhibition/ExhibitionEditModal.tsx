import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import api from '@/utils/axios/axios';
import { requireLoginUsrNo } from '@/utils/auth';
import useQuillImageUpload from '@/hooks/useQuillImageUpload';
import Modal from '@/components/common/Modal';
import type { BrandOption, CategoryOption, CommonCode, GoodsMerch } from '@/components/goods/types';
import type { ExhibitionDetail, ExhibitionGoodsItem, ExhibitionSavePayload, ExhibitionTabItem } from '@/components/exhibition/types';
import ExhibitionTabGoodsSection from '@/components/exhibition/ExhibitionTabGoodsSection';

// Quill 라이브러리를 동적으로 로딩합니다.
const ReactQuill = dynamic(
  async () => {
    const mod = await import('react-quill-new');
    return mod.default;
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
  const [dispStartDt, setDispStartDt] = useState('');
  const [dispEndDt, setDispEndDt] = useState('');
  const [listShowYn, setListShowYn] = useState('Y');
  const [showYn, setShowYn] = useState('Y');
  const [exhibitionPcDesc, setExhibitionPcDesc] = useState('');
  const [exhibitionMoDesc, setExhibitionMoDesc] = useState('');
  const [tabs, setTabs] = useState<ExhibitionTabItem[]>([]);
  const [goodsRows, setGoodsRows] = useState<ExhibitionGoodsItem[]>([]);
  const [selectedTabRowKey, setSelectedTabRowKey] = useState('');
  const tabSequenceRef = useRef(1);

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

  // datetime-local 형식을 API 형식으로 변환합니다.
  const toApiDateTime = useCallback((value?: string) => {
    if (!value) {
      return undefined;
    }
    return `${value.replace('T', ' ')}:00`;
  }, []);

  // API 응답 datetime을 datetime-local로 변환합니다.
  const toInputDateTime = useCallback((value?: string) => {
    if (!value) {
      return '';
    }
    if (value.includes('T')) {
      return value.slice(0, 16);
    }
    return value.replace(' ', 'T').slice(0, 16);
  }, []);

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
    setDispStartDt('');
    setDispEndDt('');
    setListShowYn('Y');
    setShowYn('Y');
    setExhibitionPcDesc('');
    setExhibitionMoDesc('');
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
      setDispStartDt(toInputDateTime(detail.dispStartDt));
      setDispEndDt(toInputDateTime(detail.dispEndDt));
      setListShowYn(detail.listShowYn || 'Y');
      setShowYn(detail.showYn || 'Y');
      setExhibitionPcDesc(detail.exhibitionPcDesc || '');
      setExhibitionMoDesc(detail.exhibitionMoDesc || '');

      const loadedTabs = toExhibitionTabRow((detail.tabList || []).map((tab, index) => ({
        rowKey: String(tab.exhibitionTabNo || `tab-${targetExhibitionNo}-${index}`),
        exhibitionTabNo: tab.exhibitionTabNo,
        exhibitionNo: targetExhibitionNo,
        tabNm: tab.tabNm || '',
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
  }, [onClose, toExhibitionGoodsRow, toExhibitionTabRow, toInputDateTime]);

  // 저장 시 기본 페이로드를 생성합니다.
  const buildPayload = useCallback((usrNo: number): ExhibitionSavePayload => {
    const payload: ExhibitionSavePayload = {
      exhibitionNo: exhibitionNo || undefined,
      exhibitionNm,
      dispStartDt: toApiDateTime(dispStartDt),
      dispEndDt: toApiDateTime(dispEndDt),
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
    dispEndDt,
    dispStartDt,
    exhibitionMoDesc,
    exhibitionPcDesc,
    isEditMode,
    listShowYn,
    showYn,
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
        <button type="button" className="btn btn-primary" onClick={handleSave} disabled={loading}>
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
              <input
                type="datetime-local"
                className="form-control"
                value={dispStartDt}
                onChange={(event) => setDispStartDt(event.target.value)}
              />
            </div>
          </div>
          <div className="col-md-3">
            <div className="form-group">
              <label>노출종료일시</label>
              <input
                type="datetime-local"
                className="form-control"
                value={dispEndDt}
                onChange={(event) => setDispEndDt(event.target.value)}
              />
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
    </Modal>
  );
};

export default ExhibitionEditModal;
