import React from 'react';
import Modal from '@/components/common/Modal';
import NewsImagePreviewModal from '@/components/common/NewsImagePreviewModal';
import type { BrandOption, CategoryOption, CommonCode, GoodsMerch } from '@/components/goods/types';
import ExhibitionMasterPanel from '@/components/exhibition/edit/ExhibitionMasterPanel';
import ExhibitionDetailPanel from '@/components/exhibition/edit/ExhibitionDetailPanel';
import useExhibitionEdit from '@/hooks/exhibition/useExhibitionEdit';

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
  // 기획전 편집 상태/이벤트를 조회합니다.
  const {
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
  } = useExhibitionEdit({
    isOpen,
    exhibitionNo,
    onClose,
    onSaved,
  });

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
              disabled={loading || masterSaving || tabSaving || goodsSaving}
            >
              삭제
            </button>
          )}
        </>
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
        <ExhibitionMasterPanel
          loading={loading}
          masterSaving={masterSaving}
          thumbnailUploading={thumbnailUploading}
          isEditMode={isEditMode}
          exhibitionNm={exhibitionNm}
          dispStartDate={dispStartDate}
          dispEndDate={dispEndDate}
          dispStartHour={dispStartHour}
          dispEndHour={dispEndHour}
          listShowYn={listShowYn}
          showYn={showYn}
          exhibitionPcDesc={exhibitionPcDesc}
          exhibitionMoDesc={exhibitionMoDesc}
          thumbnailUrl={thumbnailUrl}
          hourOptions={hourOptions}
          onChangeExhibitionNm={setExhibitionNm}
          onChangeDispStartDate={setDispStartDate}
          onChangeDispEndDate={setDispEndDate}
          onChangeDispStartHour={setDispStartHour}
          onChangeDispEndHour={setDispEndHour}
          onChangeListShowYn={setListShowYn}
          onChangeShowYn={setShowYn}
          onThumbnailUpload={handleThumbnailUpload}
          onOpenThumbnailPreview={() => setIsThumbnailPreviewOpen(true)}
          onSaveMaster={handleSaveMaster}
          pcDescEditor={pcDescEditor}
          moDescEditor={moDescEditor}
        />
      </div>

      <div style={{ display: activePanel === 'detail' ? 'block' : 'none' }}>
        <ExhibitionDetailPanel
          tabs={tabs}
          setTabs={setTabs}
          goodsRows={goodsRows}
          setGoodsRows={setGoodsRows}
          selectedTabRowKey={selectedTabRowKey}
          setSelectedTabRowKey={setSelectedTabRowKey}
          isEditMode={isEditMode}
          exhibitionNo={exhibitionNo}
          categoryOptions={categoryOptions}
          goodsStatList={goodsStatList}
          goodsDivList={goodsDivList}
          goodsMerchList={goodsMerchList}
          brandList={brandList}
          onSaveTabs={handleSaveTabs}
          tabSaving={tabSaving}
          onSaveGoods={handleSaveGoods}
          goodsSaving={goodsSaving}
        />
      </div>
      <NewsImagePreviewModal
        isOpen={isThumbnailPreviewOpen}
        imageUrl={thumbnailUrl}
        onClose={() => setIsThumbnailPreviewOpen(false)}
      />
    </Modal>
  );
};

export default ExhibitionEditModal;
