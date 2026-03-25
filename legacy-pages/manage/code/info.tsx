import React from 'react';
import CommonCodeSearchForm from '@/components/commonCode/CommonCodeSearchForm';
import CommonCodeGroupGrid from '@/components/commonCode/CommonCodeGroupGrid';
import CommonCodeChildGrid from '@/components/commonCode/CommonCodeChildGrid';
import CommonCodeEditModal from '@/components/commonCode/CommonCodeEditModal';
import useCommonCodeManage from '@/hooks/commonCode/useCommonCodeManage';

// 공통코드 관리 화면을 렌더링합니다.
const CommonCodeManagePage = () => {
  // 공통코드 관리 화면 상태/이벤트를 조회합니다.
  const {
    searchGb,
    searchValue,
    groupRows,
    childRows,
    selectedGroup,
    groupLoading,
    childLoading,
    isModalOpen,
    isSaving,
    editMode,
    editForm,
    setSearchGb,
    setSearchValue,
    handleSearchSubmit,
    handleSearchReset,
    handleGroupSelectionChanged,
    updateEditFormField,
    openCreateGroupModal,
    openCreateChildModal,
    openEditGroupModal,
    openEditChildModal,
    closeModal,
    saveCommonCode,
  } = useCommonCodeManage();

  return (
    <>
      <div className="page-header">
        <h3 className="page-title">공통코드 관리</h3>
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><a href="#">공통코드</a></li>
            <li className="breadcrumb-item active" aria-current="page">관리</li>
          </ol>
        </nav>
      </div>

      <CommonCodeSearchForm
        searchGb={searchGb}
        searchValue={searchValue}
        loading={groupLoading}
        onChangeSearchGb={setSearchGb}
        onChangeSearchValue={setSearchValue}
        onSubmit={handleSearchSubmit}
        onReset={handleSearchReset}
      />

      <div className="row">
        <CommonCodeGroupGrid
          rows={groupRows}
          loading={groupLoading}
          onCreate={openCreateGroupModal}
          onSelectionChanged={handleGroupSelectionChanged}
          onEdit={openEditGroupModal}
        />
        <CommonCodeChildGrid
          rows={childRows}
          loading={childLoading}
          selectedGroup={selectedGroup}
          onCreate={openCreateChildModal}
          onEdit={openEditChildModal}
        />
      </div>

      <CommonCodeEditModal
        isOpen={isModalOpen}
        editMode={editMode}
        isSaving={isSaving}
        editForm={editForm}
        onClose={closeModal}
        onSave={saveCommonCode}
        onChangeField={updateEditFormField}
      />
    </>
  );
};

export default CommonCodeManagePage;
