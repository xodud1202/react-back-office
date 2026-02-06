import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { ColDef, ICellRendererParams, SelectionChangedEvent } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import Modal from '@/components/common/Modal';
import api from '@/utils/axios/axios';
import { requireLoginUsrNo } from '@/utils/auth';

interface CommonCodeRow {
  grpCd: string;
  cd: string;
  cdNm: string;
  cdDesc?: string | null;
  useYn: string;
  dispOrd?: number | null;
}

type EditMode = 'create-group' | 'edit-group' | 'create-child' | 'edit-child';

interface EditFormState {
  grpCd: string;
  cd: string;
  cdNm: string;
  cdDesc: string;
  useYn: string;
  dispOrd: string;
}

// 공통코드 관리 화면을 렌더링합니다.
const CommonCodeManagePage = () => {
  const [grpCdSearch, setGrpCdSearch] = useState('');
  const [grpCdNmSearch, setGrpCdNmSearch] = useState('');
  const [groupRows, setGroupRows] = useState<CommonCodeRow[]>([]);
  const [childRows, setChildRows] = useState<CommonCodeRow[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<CommonCodeRow | null>(null);
  const [groupLoading, setGroupLoading] = useState(false);
  const [childLoading, setChildLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editMode, setEditMode] = useState<EditMode>('create-group');
  const [originGrpCd, setOriginGrpCd] = useState('');
  const [originCd, setOriginCd] = useState('');
  const [editForm, setEditForm] = useState<EditFormState>({
    grpCd: 'ROOT',
    cd: '',
    cdNm: '',
    cdDesc: '',
    useYn: 'Y',
    dispOrd: '1',
  });

  // 검색 조건 기준으로 상위 그룹코드 목록을 조회합니다.
  const fetchGroupList = useCallback(async () => {
    setGroupLoading(true);
    try {
      const response = await api.get('/api/admin/common/code/manage/group/list', {
        params: {
          grpCd: grpCdSearch.trim() || undefined,
          grpCdNm: grpCdNmSearch.trim() || undefined,
        },
      });
      const list = (response.data || []) as CommonCodeRow[];
      // 조회 결과를 갱신하고 기존 선택과 불일치하면 하위 목록을 비웁니다.
      setGroupRows(list);
      setSelectedGroup((prev) => {
        if (!prev) {
          setChildRows([]);
          return null;
        }
        const matched = list.find((item) => item.cd === prev.cd);
        if (!matched) {
          setChildRows([]);
          return null;
        }
        return matched;
      });
    } catch (error) {
      console.error('상위 그룹코드 조회에 실패했습니다.', error);
      alert('상위 그룹코드 조회에 실패했습니다.');
    } finally {
      setGroupLoading(false);
    }
  }, [grpCdNmSearch, grpCdSearch]);

  // 선택한 그룹코드 기준으로 하위 코드 목록을 조회합니다.
  const fetchChildList = useCallback(async (grpCd: string) => {
    setChildLoading(true);
    try {
      const response = await api.get('/api/admin/common/code/manage/child/list', {
        params: { grpCd },
      });
      setChildRows((response.data || []) as CommonCodeRow[]);
    } catch (error) {
      console.error('하위 코드 조회에 실패했습니다.', error);
      alert('하위 코드 조회에 실패했습니다.');
    } finally {
      setChildLoading(false);
    }
  }, []);

  // 화면 초기 진입 시 상위 그룹코드 목록을 조회합니다.
  useEffect(() => {
    fetchGroupList();
  }, [fetchGroupList]);

  // 상위 그룹코드 그리드 선택 변경을 처리합니다.
  const handleGroupSelectionChanged = useCallback((event: SelectionChangedEvent<CommonCodeRow>) => {
    const selected = event.api.getSelectedRows()[0] || null;
    // 선택 상태를 저장하고 하위 코드 목록을 갱신합니다.
    setSelectedGroup(selected);
    if (!selected) {
      setChildRows([]);
      return;
    }
    fetchChildList(selected.cd);
  }, [fetchChildList]);

  // 등록/수정 팝업 입력 상태를 갱신합니다.
  const updateEditFormField = useCallback((field: keyof EditFormState, value: string) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  // 상위 그룹코드 등록 팝업을 엽니다.
  const openCreateGroupModal = useCallback(() => {
    setEditMode('create-group');
    setOriginGrpCd('ROOT');
    setOriginCd('');
    setEditForm({
      grpCd: 'ROOT',
      cd: '',
      cdNm: '',
      cdDesc: '',
      useYn: 'Y',
      dispOrd: '1',
    });
    setIsModalOpen(true);
  }, []);

  // 하위 코드 등록 팝업을 엽니다.
  const openCreateChildModal = useCallback(() => {
    if (!selectedGroup) {
      alert('상위 그룹코드를 먼저 선택해주세요.');
      return;
    }
    setEditMode('create-child');
    setOriginGrpCd(selectedGroup.cd);
    setOriginCd('');
    setEditForm({
      grpCd: selectedGroup.cd,
      cd: '',
      cdNm: '',
      cdDesc: '',
      useYn: 'Y',
      dispOrd: '1',
    });
    setIsModalOpen(true);
  }, [selectedGroup]);

  // 상위 그룹코드 수정 팝업을 엽니다.
  const openEditGroupModal = useCallback((row: CommonCodeRow) => {
    setEditMode('edit-group');
    setOriginGrpCd(row.grpCd);
    setOriginCd(row.cd);
    setEditForm({
      grpCd: row.grpCd || 'ROOT',
      cd: row.cd || '',
      cdNm: row.cdNm || '',
      cdDesc: row.cdDesc || '',
      useYn: row.useYn || 'Y',
      dispOrd: row.dispOrd == null ? '1' : String(row.dispOrd),
    });
    setIsModalOpen(true);
  }, []);

  // 하위 코드 수정 팝업을 엽니다.
  const openEditChildModal = useCallback((row: CommonCodeRow) => {
    setEditMode('edit-child');
    setOriginGrpCd(row.grpCd);
    setOriginCd(row.cd);
    setEditForm({
      grpCd: row.grpCd || '',
      cd: row.cd || '',
      cdNm: row.cdNm || '',
      cdDesc: row.cdDesc || '',
      useYn: row.useYn || 'Y',
      dispOrd: row.dispOrd == null ? '1' : String(row.dispOrd),
    });
    setIsModalOpen(true);
  }, []);

  // 등록/수정 팝업을 닫습니다.
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setOriginGrpCd('');
    setOriginCd('');
  }, []);

  // 공통코드 저장 입력값을 검증합니다.
  const validateEditForm = useCallback(() => {
    const trimmedGrpCd = editForm.grpCd.trim();
    const trimmedCd = editForm.cd.trim();
    const trimmedCdNm = editForm.cdNm.trim();
    const trimmedCdDesc = editForm.cdDesc.trim();
    const koreanPattern = /[ㄱ-ㅎㅏ-ㅣ가-힣]/;
    // 필수값을 점검합니다.
    if (trimmedGrpCd === '') {
      return '그룹코드를 입력해주세요.';
    }
    if (trimmedCd === '') {
      return '코드를 입력해주세요.';
    }
    if (trimmedCdNm === '') {
      return '코드명을 입력해주세요.';
    }
    // 형식 및 길이 제약을 점검합니다.
    if (koreanPattern.test(trimmedGrpCd)) {
      return '그룹코드는 한글을 입력할 수 없습니다.';
    }
    if (koreanPattern.test(trimmedCd)) {
      return '코드는 한글을 입력할 수 없습니다.';
    }
    if (trimmedGrpCd.length > 20) {
      return '그룹코드는 20자 이내로 입력해주세요.';
    }
    if (trimmedCd.length > 20) {
      return '코드는 20자 이내로 입력해주세요.';
    }
    if (trimmedCdNm.length > 50) {
      return '코드명은 50자 이내로 입력해주세요.';
    }
    if (trimmedCdDesc.length > 60) {
      return '코드 설명은 60자 이내로 입력해주세요.';
    }
    return null;
  }, [editForm]);

  // 공통코드 등록/수정을 저장합니다.
  const saveCommonCode = useCallback(async () => {
    const validationMessage = validateEditForm();
    if (validationMessage) {
      alert(validationMessage);
      return;
    }

    const usrNo = requireLoginUsrNo();
    if (!usrNo) {
      return;
    }

    const dispOrdParsed = Number(editForm.dispOrd);
    const dispOrd = Number.isNaN(dispOrdParsed) ? 1 : dispOrdParsed;
    const isCreateMode = editMode === 'create-group' || editMode === 'create-child';
    const requestUri = isCreateMode
      ? '/api/admin/common/code/manage/create'
      : '/api/admin/common/code/manage/update';

    const payload: Record<string, any> = {
      grpCd: editForm.grpCd.trim(),
      cd: editForm.cd.trim(),
      cdNm: editForm.cdNm.trim(),
      cdDesc: editForm.cdDesc.trim(),
      useYn: editForm.useYn,
      dispOrd,
      udtNo: usrNo,
    };
    // 수정 모드에서는 원본 키를 함께 전달합니다.
    if (isCreateMode) {
      payload.regNo = usrNo;
    } else {
      payload.originGrpCd = originGrpCd;
      payload.originCd = originCd;
    }

    setIsSaving(true);
    try {
      const response = await api.post(requestUri, payload);
      if (response.data > 0) {
        alert(isCreateMode ? '공통코드가 등록되었습니다.' : '공통코드가 수정되었습니다.');
        closeModal();
        await fetchGroupList();
        // 선택된 상위 코드가 존재하면 하위 목록을 다시 조회합니다.
        if (selectedGroup?.cd) {
          await fetchChildList(selectedGroup.cd);
        }
        return;
      }
      alert('공통코드 저장에 실패했습니다.');
    } catch (error) {
      console.error('공통코드 저장에 실패했습니다.', error);
      const message = (error as any)?.response?.data?.message;
      alert(message || '공통코드 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  }, [closeModal, editForm, editMode, fetchChildList, fetchGroupList, originCd, originGrpCd, selectedGroup?.cd, validateEditForm]);

  // 상위 그룹코드 그리드 컬럼을 정의합니다.
  const groupColumnDefs = useMemo<ColDef<CommonCodeRow>[]>(() => [
    { headerName: '그룹코드', field: 'cd', width: 160 },
    {
      headerName: '그룹코드명',
      field: 'cdNm',
      flex: 1,
      cellClass: 'text-start',
      cellRenderer: (params: ICellRendererParams<CommonCodeRow>) => {
        const row = params.data;
        if (!row) {
          return params.value ?? '';
        }
        return (
          <button
            type="button"
            className="btn p-0 fw-bold text-start"
            onClick={() => openEditGroupModal(row)}
          >
            {params.value}
          </button>
        );
      },
    },
    { headerName: '사용여부', field: 'useYn', width: 100 },
    { headerName: '정렬순서', field: 'dispOrd', width: 110 },
  ], [openEditGroupModal]);

  // 하위 코드 그리드 컬럼을 정의합니다.
  const childColumnDefs = useMemo<ColDef<CommonCodeRow>[]>(() => [
    { headerName: '그룹코드', field: 'grpCd', width: 160 },
    { headerName: '코드', field: 'cd', width: 160 },
    {
      headerName: '코드명',
      field: 'cdNm',
      flex: 1,
      cellClass: 'text-start',
      cellRenderer: (params: ICellRendererParams<CommonCodeRow>) => {
        const row = params.data;
        if (!row) {
          return params.value ?? '';
        }
        return (
          <button
            type="button"
            className="btn p-0 fw-bold text-start"
            onClick={() => openEditChildModal(row)}
          >
            {params.value}
          </button>
        );
      },
    },
    { headerName: '사용여부', field: 'useYn', width: 100 },
    { headerName: '정렬순서', field: 'dispOrd', width: 110 },
  ], [openEditChildModal]);

  // ag-grid 기본 컬럼 옵션을 정의합니다.
  const defaultColDef = useMemo<ColDef>(() => ({
    resizable: true,
    sortable: false,
    cellClass: 'text-center',
  }), []);

  // 현재 모달 제목을 반환합니다.
  const modalTitle = useMemo(() => {
    if (editMode === 'create-group') {
      return '상위 그룹코드 등록';
    }
    if (editMode === 'edit-group') {
      return '상위 그룹코드 수정';
    }
    if (editMode === 'create-child') {
      return '하위 코드 등록';
    }
    return '하위 코드 수정';
  }, [editMode]);

  // 코드 입력란 비활성화 여부를 반환합니다.
  const isCdDisabled = useMemo(() => {
    return editMode === 'edit-group' || editMode === 'edit-child';
  }, [editMode]);

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

      <div className="row">
        <div className="col-lg-12 grid-margin stretch-card">
          <div className="card">
            <div className="card-body">
              <div className="row g-2">
                <div className="col-md-4">
                  <label className="form-label mb-1">그룹코드</label>
                  <input
                    type="text"
                    className="form-control"
                    value={grpCdSearch}
                    onChange={(event) => setGrpCdSearch(event.target.value)}
                    maxLength={20}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label mb-1">그룹코드명</label>
                  <input
                    type="text"
                    className="form-control"
                    value={grpCdNmSearch}
                    onChange={(event) => setGrpCdNmSearch(event.target.value)}
                    maxLength={50}
                  />
                </div>
                <div className="col-md-4 d-flex align-items-end justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => {
                      // 검색조건을 초기화한 뒤 목록을 조회합니다.
                      setGrpCdSearch('');
                      setGrpCdNmSearch('');
                      setSelectedGroup(null);
                      setChildRows([]);
                    }}
                  >
                    초기화
                  </button>
                  <button type="button" className="btn btn-primary" onClick={fetchGroupList}>
                    검색
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-6 grid-margin stretch-card">
          <div className="card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h5 className="mb-0">상위 그룹코드 목록</h5>
                <button type="button" className="btn btn-primary btn-sm" onClick={openCreateGroupModal}>
                  추가
                </button>
              </div>
              {groupLoading && (
                <div className="text-muted small mb-2">조회 중...</div>
              )}
              <div className="ag-theme-alpine-dark header-center" style={{ width: '100%', height: '520px' }}>
                <AgGridReact<CommonCodeRow>
                  rowData={groupRows}
                  columnDefs={groupColumnDefs}
                  defaultColDef={defaultColDef}
                  rowSelection="single"
                  onSelectionChanged={handleGroupSelectionChanged}
                  overlayNoRowsTemplate="데이터가 없습니다."
                  getRowId={(params) => `${params.data?.grpCd || ''}__${params.data?.cd || ''}`}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-6 grid-margin stretch-card">
          <div className="card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h5 className="mb-0">하위 코드 목록</h5>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={openCreateChildModal}
                  disabled={!selectedGroup}
                >
                  추가
                </button>
              </div>
              {childLoading && (
                <div className="text-muted small mb-2">조회 중...</div>
              )}
              <div className="ag-theme-alpine-dark header-center" style={{ width: '100%', height: '520px' }}>
                <AgGridReact<CommonCodeRow>
                  rowData={childRows}
                  columnDefs={childColumnDefs}
                  defaultColDef={defaultColDef}
                  overlayNoRowsTemplate={selectedGroup ? '데이터가 없습니다.' : '상위 그룹코드를 선택해주세요.'}
                  getRowId={(params) => `${params.data?.grpCd || ''}__${params.data?.cd || ''}`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={modalTitle}
        width="620px"
        footerActions={(
          <button type="button" className="btn btn-primary" onClick={saveCommonCode} disabled={isSaving}>
            {isSaving ? '저장중...' : '저장'}
          </button>
        )}
      >
        <div className="row g-2">
          <div className="col-md-6">
            <label className="form-label mb-1">GRP_CD</label>
            <input
              type="text"
              className="form-control"
              value={editForm.grpCd}
              disabled
              maxLength={20}
              onChange={(event) => updateEditFormField('grpCd', event.target.value)}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label mb-1">CD</label>
            <input
              type="text"
              className="form-control"
              value={editForm.cd}
              maxLength={20}
              disabled={isCdDisabled}
              onChange={(event) => updateEditFormField('cd', event.target.value)}
            />
          </div>
          <div className="col-md-12">
            <label className="form-label mb-1">코드명</label>
            <input
              type="text"
              className="form-control"
              value={editForm.cdNm}
              maxLength={50}
              onChange={(event) => updateEditFormField('cdNm', event.target.value)}
            />
          </div>
          <div className="col-md-12">
            <label className="form-label mb-1">코드 설명</label>
            <input
              type="text"
              className="form-control"
              value={editForm.cdDesc}
              maxLength={60}
              onChange={(event) => updateEditFormField('cdDesc', event.target.value)}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label mb-1">정렬순서</label>
            <input
              type="number"
              className="form-control"
              value={editForm.dispOrd}
              onChange={(event) => updateEditFormField('dispOrd', event.target.value)}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label mb-1">사용여부</label>
            <select
              className="form-select"
              value={editForm.useYn}
              onChange={(event) => updateEditFormField('useYn', event.target.value)}
            >
              <option value="Y">Y</option>
              <option value="N">N</option>
            </select>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default CommonCodeManagePage;
