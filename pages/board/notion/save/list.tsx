import React from 'react';
import NotionSearchForm from '@/components/notion/NotionSearchForm';
import NotionListGrid from '@/components/notion/NotionListGrid';
import NotionCategorySortModal from '@/components/notion/NotionCategorySortModal';
import useNotionSaveList from '@/hooks/notion/useNotionSaveList';

// 관리자 Notion 저장 목록 화면을 렌더링합니다.
const NotionSaveListPage = () => {
  // Notion 저장 목록 상태/이벤트를 조회합니다.
  const {
    loading,
    categoryLoading,
    searchForm,
    categoryOptions,
    isSortModalOpen,
    sortRows,
    sortSaving,
    handleSearchFormChange,
    handleSearch,
    handleReset,
    handleOpenSortModal,
    handleCloseSortModal,
    handleSaveSort,
    handleGridReady,
    handleSortGridReady,
    handleSortSelectionChanged,
    handleSortRowDragEnd,
    moveSelectedSortRow,
  } = useNotionSaveList();

  return (
    <>
      <div className="page-header">
        <h3 className="page-title"> Notion 저장 게시글 관리 </h3>
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><a href="#">게시판</a></li>
            <li className="breadcrumb-item active" aria-current="page">Notion 저장 목록</li>
          </ol>
        </nav>
      </div>

      <NotionSearchForm
        searchForm={searchForm}
        categoryLoading={categoryLoading}
        categoryOptions={categoryOptions}
        loading={loading}
        onChange={handleSearchFormChange}
        onSearch={handleSearch}
        onReset={handleReset}
        onOpenSortModal={handleOpenSortModal}
      />

      <NotionListGrid onGridReady={handleGridReady} />

      <NotionCategorySortModal
        isOpen={isSortModalOpen}
        sortRows={sortRows}
        sortSaving={sortSaving}
        onClose={handleCloseSortModal}
        onSave={handleSaveSort}
        onMoveRow={moveSelectedSortRow}
        onGridReady={handleSortGridReady}
        onSelectionChanged={handleSortSelectionChanged}
        onRowDragEnd={handleSortRowDragEnd}
      />
    </>
  );
};

export default NotionSaveListPage;
