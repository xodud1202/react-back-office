'use client';

import React from 'react';
import BoardSearchForm from '@/components/board/BoardSearchForm';
import BoardListGrid from '@/components/board/BoardListGrid';
import BoardDetailModal from '@/components/board/BoardDetailModal';
import BoardEditModal from '@/components/board/BoardEditModal';
import useBoardListPage from '@/hooks/board/useBoardListPage';

// 게시판 관리 화면을 렌더링합니다.
const BoardList = () => {
  // 게시판 관리 화면 상태/이벤트를 조회합니다.
  const {
    detailDivList,
    loading,
    detailLoading,
    detailError,
    selectedBoard,
    isDetailModalOpen,
    isEditModalOpen,
    isCreateMode,
    editForm,
    editSaving,
    editError,
    quillRef,
    quillModules,
    quillFormats,
    handleEditorChange,
    handleSearch,
    handleSearchReset,
    handleGridReady,
    handleOpenDetail,
    handleCloseDetail,
    handleOpenEdit,
    handleOpenCreate,
    handleCloseEdit,
    handleEditChange,
    handleSubmitEdit,
    handleDeleteBoard,
  } = useBoardListPage();

  return (
    <>
      <div className="page-header">
        <h3 className="page-title"> 게시판 관리 </h3>
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><a href="#">게시판</a></li>
            <li className="breadcrumb-item active" aria-current="page">목록</li>
          </ol>
        </nav>
      </div>

      <BoardSearchForm
        detailDivList={detailDivList}
        loading={loading}
        onSubmit={handleSearch}
        onReset={handleSearchReset}
      />

      <BoardListGrid
        onGridReady={handleGridReady}
        onOpenDetail={handleOpenDetail}
        onDeleteBoard={handleDeleteBoard}
      />

      <div className="row">
        <div className="col-lg-12 d-flex justify-content-end mt-3">
          <button type="button" className="btn btn-primary" onClick={handleOpenCreate}>
            등록
          </button>
        </div>
      </div>

      <BoardDetailModal
        isOpen={isDetailModalOpen}
        loading={detailLoading}
        error={detailError}
        selectedBoard={selectedBoard}
        onClose={handleCloseDetail}
        onOpenEdit={handleOpenEdit}
      />

      <BoardEditModal
        isOpen={isEditModalOpen}
        isCreateMode={isCreateMode}
        detailDivList={detailDivList}
        editForm={editForm}
        editSaving={editSaving}
        editError={editError}
        onEditChange={handleEditChange}
        onSubmit={handleSubmitEdit}
        onClose={handleCloseEdit}
        quillRef={quillRef}
        quillModules={quillModules}
        quillFormats={quillFormats}
        onEditorChange={handleEditorChange}
      />
    </>
  );
};

export default BoardList;
