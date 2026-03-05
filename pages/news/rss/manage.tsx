import React from 'react';
import PressGridPanel from '@/components/news/rss/PressGridPanel';
import CategoryGridPanel from '@/components/news/rss/CategoryGridPanel';
import useNewsRssManage from '@/hooks/news/useNewsRssManage';

// 뉴스 RSS 관리 화면을 렌더링합니다.
const NewsRssManagePage = () => {
  // 뉴스 RSS 관리 화면 상태/이벤트를 조회합니다.
  const {
    pressRows,
    categoryRows,
    selectedPressNo,
    pressLoading,
    categoryLoading,
    pressSaving,
    categorySaving,
    handlePressGridReady,
    handleCategoryGridReady,
    handlePressSelectionChanged,
    handleCategorySelectionChanged,
    handleAddPressRow,
    handleAddCategoryRow,
    handlePressCellValueChanged,
    handleCategoryCellValueChanged,
    handlePressRowDragEnd,
    handleCategoryRowDragEnd,
    handleSavePressRows,
    handleSaveCategoryRows,
    handleDeletePressRows,
    handleDeleteCategoryRows,
  } = useNewsRssManage();

  return (
    <>
      <div className="page-header">
        <h3 className="page-title">뉴스 RSS 관리</h3>
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><a href="#">뉴스</a></li>
            <li className="breadcrumb-item active" aria-current="page">RSS 관리</li>
          </ol>
        </nav>
      </div>

      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="d-flex gap-3" style={{ width: '100%' }}>
            <PressGridPanel
              rows={pressRows}
              loading={pressLoading}
              saving={pressSaving}
              onAddRow={handleAddPressRow}
              onSaveRows={handleSavePressRows}
              onDeleteRows={handleDeletePressRows}
              onGridReady={handlePressGridReady}
              onSelectionChanged={handlePressSelectionChanged}
              onCellValueChanged={handlePressCellValueChanged}
              onRowDragEnd={handlePressRowDragEnd}
            />
            <CategoryGridPanel
              rows={categoryRows}
              selectedPressNo={selectedPressNo}
              loading={categoryLoading}
              saving={categorySaving}
              onAddRow={handleAddCategoryRow}
              onSaveRows={handleSaveCategoryRows}
              onDeleteRows={handleDeleteCategoryRows}
              onGridReady={handleCategoryGridReady}
              onSelectionChanged={handleCategorySelectionChanged}
              onCellValueChanged={handleCategoryCellValueChanged}
              onRowDragEnd={handleCategoryRowDragEnd}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default NewsRssManagePage;
