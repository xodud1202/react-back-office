import { useCallback, useEffect, useState } from 'react';
import type { SelectionChangedEvent } from 'ag-grid-community';
import { requireLoginUsrNo } from '@/utils/auth';
import { extractApiErrorMessage } from '@/utils/api/error';
import { notifyError, notifySuccess } from '@/utils/ui/feedback';
import type { CommonCodeRow, EditFormState, EditMode } from '@/components/commonCode/types';
import { fetchCommonCodeChildListApi, fetchCommonCodeGroupListApi, saveCommonCodeApi } from '@/services/commonCodeApi';

/**
 * 공통코드 관리 화면 로직을 처리합니다.
 * @returns 화면 상태와 이벤트 핸들러입니다.
 */
const useCommonCodeManage = () => {
  const [searchGb, setSearchGb] = useState<'grpCd' | 'grpCdNm'>('grpCd');
  const [searchValue, setSearchValue] = useState('');
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
    const trimmedSearchValue = searchValue.trim();
    setGroupLoading(true);
    try {
      const list = await fetchCommonCodeGroupListApi({
        grpCd: searchGb === 'grpCd' ? (trimmedSearchValue || undefined) : undefined,
        grpCdNm: searchGb === 'grpCdNm' ? (trimmedSearchValue || undefined) : undefined,
      });
      // 조회 결과를 갱신하고 기존 선택과 불일치하면 하위 목록을 비웁니다.
      setGroupRows(list as CommonCodeRow[]);
      setSelectedGroup((prev) => {
        if (!prev) {
          setChildRows([]);
          return null;
        }
        const matched = (list as CommonCodeRow[]).find((item) => item.cd === prev.cd);
        if (!matched) {
          setChildRows([]);
          return null;
        }
        return matched;
      });
    } catch (error) {
      console.error('상위 그룹코드 조회에 실패했습니다.', error);
      notifyError('상위 그룹코드 조회에 실패했습니다.');
    } finally {
      setGroupLoading(false);
    }
  }, [searchGb, searchValue]);

  // 선택한 그룹코드 기준으로 하위 코드 목록을 조회합니다.
  const fetchChildList = useCallback(async (grpCd: string) => {
    setChildLoading(true);
    try {
      const list = await fetchCommonCodeChildListApi(grpCd);
      setChildRows(list as CommonCodeRow[]);
    } catch (error) {
      console.error('하위 코드 조회에 실패했습니다.', error);
      notifyError('하위 코드 조회에 실패했습니다.');
    } finally {
      setChildLoading(false);
    }
  }, []);

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
      notifyError('상위 그룹코드를 먼저 선택해주세요.');
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
      notifyError(validationMessage);
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
      const result = await saveCommonCodeApi(requestUri, payload);
      if (result > 0) {
        notifySuccess(isCreateMode ? '공통코드가 등록되었습니다.' : '공통코드가 수정되었습니다.');
        closeModal();
        await fetchGroupList();
        // 선택된 상위 코드가 존재하면 하위 목록을 다시 조회합니다.
        if (selectedGroup?.cd) {
          await fetchChildList(selectedGroup.cd);
        }
        return;
      }
      notifyError('공통코드 저장에 실패했습니다.');
    } catch (error) {
      console.error('공통코드 저장에 실패했습니다.', error);
      const message = extractApiErrorMessage(error, '공통코드 저장에 실패했습니다.');
      notifyError(message);
    } finally {
      setIsSaving(false);
    }
  }, [closeModal, editForm, editMode, fetchChildList, fetchGroupList, originCd, originGrpCd, selectedGroup?.cd, validateEditForm]);

  // 검색 폼 제출 시 상위 그룹코드 목록을 조회합니다.
  const handleSearchSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    fetchGroupList();
  }, [fetchGroupList]);

  // 검색조건을 초기화하고 목록을 재조회합니다.
  const handleSearchReset = useCallback(() => {
    setSearchGb('grpCd');
    setSearchValue('');
    setSelectedGroup(null);
    setChildRows([]);
  }, []);

  // 화면 초기 진입 시 상위 그룹코드 목록을 조회합니다.
  useEffect(() => {
    fetchGroupList();
  }, [fetchGroupList]);

  return {
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
  };
};

export default useCommonCodeManage;
