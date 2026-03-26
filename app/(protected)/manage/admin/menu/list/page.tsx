'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import api from '@/utils/axios/axios';
import { requireLoginUsrNo } from '@/utils/auth';
import AdminMenuTree from '@/components/adminMenu/AdminMenuTree';
import AdminMenuDetailForm from '@/components/adminMenu/AdminMenuDetailForm';
import { AdminMenuContextMenuState, AdminMenuFormState, AdminMenuItem, AdminMenuTreeNode } from '@/components/adminMenu/types';

// 관리자 메뉴 관리를 처리하는 화면을 렌더링합니다.
const AdminMenuManage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [treeNodes, setTreeNodes] = useState<AdminMenuTreeNode[]>([]);
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});
  const [selectedMenuNo, setSelectedMenuNo] = useState<number | null>(null);
  const [formState, setFormState] = useState<AdminMenuFormState | null>(null);
  const [formMode, setFormMode] = useState<'idle' | 'create' | 'edit'>('idle');
  const [contextMenu, setContextMenu] = useState<AdminMenuContextMenuState | null>(null);

  // 메뉴 리스트를 트리 구조로 변환합니다.
  const buildTreeNodes = useCallback((list: AdminMenuItem[]) => {
    const nodeMap = new Map<number, AdminMenuTreeNode>();
    const roots: AdminMenuTreeNode[] = [];

    list.forEach((item) => {
      nodeMap.set(item.menuNo, { ...item, children: [] });
    });

    nodeMap.forEach((node) => {
      if (nodeMap.has(node.upMenuNo) && node.upMenuNo !== 0) {
        nodeMap.get(node.upMenuNo)!.children.push(node);
      } else {
        roots.push(node);
      }
    });

    // 메뉴 정렬 순서를 반영해 트리를 정렬합니다.
    const sortNodes = (nodes: AdminMenuTreeNode[]) => {
      nodes.sort((a, b) => {
        const orderA = a.sortSeq ?? 0;
        const orderB = b.sortSeq ?? 0;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        return a.menuNo - b.menuNo;
      });
      nodes.forEach((node) => {
        sortNodes(node.children);
      });
    };
    sortNodes(roots);
    return roots;
  }, []);

  // 메뉴 목록을 조회합니다.
  const fetchMenuList = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/admin/menu/manage/list');
      const list: AdminMenuItem[] = (response.data || []).map((item: AdminMenuItem) => ({
        ...item,
        menuUrl: item.menuUrl || '',
        useYn: item.useYn || 'Y',
        sortSeq: item.sortSeq,
        childCount: item.childCount ?? 0,
      }));
      setTreeNodes(buildTreeNodes(list));
    } catch (error) {
      console.error('메뉴 목록 조회에 실패했습니다.', error);
      alert('메뉴 목록 조회에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [buildTreeNodes]);

  // 첫 진입 시 메뉴 목록을 조회합니다.
  useEffect(() => {
    fetchMenuList();
  }, [fetchMenuList]);

  // 컨텍스트 메뉴를 바깥 클릭으로 닫습니다.
  useEffect(() => {
    if (!contextMenu) {
      return;
    }
    const handleClose = () => {
      setContextMenu(null);
    };
    window.addEventListener('click', handleClose);
    return () => {
      window.removeEventListener('click', handleClose);
    };
  }, [contextMenu]);

  // 트리 노드 확장 상태를 토글합니다.
  const handleToggleExpand = useCallback((menuNo: number) => {
    setExpandedMap((prev) => ({ ...prev, [menuNo]: !prev[menuNo] }));
  }, []);

  // 메뉴 상세를 조회해 폼으로 로딩합니다.
  const handleSelectMenu = useCallback(async (menuNo: number) => {
    try {
      const response = await api.get('/api/admin/menu/manage/detail', { params: { menuNo } });
      const detail = response.data;
      setSelectedMenuNo(menuNo);
      setFormMode('edit');
      setFormState({
        menuNo: detail.menuNo,
        upMenuNo: detail.upMenuNo,
        menuLevel: detail.menuLevel,
        menuNm: detail.menuNm || '',
        menuUrl: detail.menuUrl || '',
        sortSeq: detail.sortSeq,
        useYn: detail.useYn || 'Y',
      });
    } catch (error) {
      console.error('메뉴 상세 조회에 실패했습니다.', error);
      alert('메뉴 상세 조회에 실패했습니다.');
    }
  }, []);

  // 우클릭 메뉴에서 하위 메뉴 추가를 시작합니다.
  const handleContextMenu = useCallback((event: React.MouseEvent<HTMLDivElement>, item: AdminMenuItem) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      target: item,
    });
  }, []);

  // 최상위 메뉴 등록 모드로 전환합니다.
  const handleAddRootMenu = useCallback(() => {
    setFormMode('create');
    setSelectedMenuNo(null);
    setFormState({
      menuNo: 0,
      upMenuNo: 0,
      menuLevel: 1,
      menuNm: '',
      menuUrl: '',
      sortSeq: null,
      useYn: 'Y',
    });
  }, []);

  // 하위 메뉴 등록 모드로 전환합니다.
  const handleAddChildMenu = useCallback((parent: AdminMenuItem) => {
    setFormMode('create');
    setSelectedMenuNo(null);
    setFormState({
      menuNo: 0,
      upMenuNo: parent.menuNo,
      menuLevel: parent.menuLevel + 1,
      menuNm: '',
      menuUrl: '',
      sortSeq: null,
      useYn: 'Y',
    });
  }, []);

  // 메뉴 삭제를 요청합니다.
  const handleDeleteMenu = useCallback(async (menuNo: number) => {
    const ok = confirm('선택한 메뉴를 삭제하시겠습니까?');
    if (!ok) {
      return;
    }

    const usrNo = requireLoginUsrNo();
    if (!usrNo) {
      return;
    }

    try {
      const response = await api.post('/api/admin/menu/manage/delete', {
        menuNo,
        udtNo: usrNo,
      });
      if (response.data > 0) {
        alert('메뉴가 삭제되었습니다.');
        await fetchMenuList();
        if (selectedMenuNo === menuNo) {
          setSelectedMenuNo(null);
          setFormMode('idle');
          setFormState(null);
        }
        return;
      }
      alert('메뉴 삭제에 실패했습니다.');
    } catch (error) {
      console.error('메뉴 삭제에 실패했습니다.', error);
      const message = (error as any)?.response?.data?.message;
      alert(message || '메뉴 삭제에 실패했습니다.');
    }
  }, [fetchMenuList, selectedMenuNo]);

  // 폼 변경을 반영합니다.
  const handleFormChange = useCallback((field: keyof AdminMenuFormState, value: string) => {
    setFormState((prev) => {
      const nextState: AdminMenuFormState = prev ?? {
        menuNo: 0,
        upMenuNo: 0,
        menuLevel: 1,
        menuNm: '',
        menuUrl: '',
        sortSeq: null,
        useYn: 'Y',
      };

      if (field === 'sortSeq') {
        const parsed = value.trim() === '' ? null : Number(value);
        return { ...nextState, sortSeq: Number.isNaN(parsed) ? null : parsed };
      }
      if (field === 'menuNm') {
        return { ...nextState, menuNm: value };
      }
      if (field === 'menuUrl') {
        return { ...nextState, menuUrl: value };
      }
      if (field === 'useYn') {
        return { ...nextState, useYn: value };
      }
      return nextState;
    });
  }, []);

  // 폼 상태를 초기화합니다.
  const handleClearForm = useCallback(() => {
    setSelectedMenuNo(null);
    setFormMode('idle');
    setFormState(null);
  }, []);

  // 메뉴를 저장합니다.
  const handleSaveMenu = useCallback(async () => {
    if (!formState) {
      return;
    }
    if (formState.menuNm.trim() === '') {
      alert('메뉴명을 입력해주세요.');
      return;
    }

    const usrNo = requireLoginUsrNo();
    if (!usrNo) {
      return;
    }

    setIsSaving(true);
    try {
      if (formMode === 'create') {
        const response = await api.post('/api/admin/menu/manage/create', {
          upMenuNo: formState.upMenuNo,
          menuNm: formState.menuNm.trim(),
          menuUrl: formState.menuUrl.trim(),
          sortSeq: formState.sortSeq,
          useYn: formState.useYn,
          regNo: usrNo,
          udtNo: usrNo,
        });
        if (response.data > 0) {
          alert('메뉴가 등록되었습니다.');
          await fetchMenuList();
          const newMenuNo = Number(response.data);
          if (!Number.isNaN(newMenuNo) && newMenuNo > 0) {
            setTimeout(() => {
              void handleSelectMenu(newMenuNo);
            }, 0);
          }
          return;
        }
        alert('메뉴 등록에 실패했습니다.');
      } else if (formMode === 'edit') {
        const response = await api.post('/api/admin/menu/manage/update', {
          menuNo: formState.menuNo,
          menuNm: formState.menuNm.trim(),
          menuUrl: formState.menuUrl.trim(),
          sortSeq: formState.sortSeq,
          useYn: formState.useYn,
          udtNo: usrNo,
        });
        if (response.data > 0) {
          alert('메뉴가 저장되었습니다.');
          await fetchMenuList();
          await handleSelectMenu(formState.menuNo);
          return;
        }
        alert('메뉴 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('메뉴 저장에 실패했습니다.', error);
      const message = (error as any)?.response?.data?.message;
      alert(message || '메뉴 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  }, [fetchMenuList, formMode, formState, handleSelectMenu]);

  // 컨텍스트 메뉴 항목을 생성합니다.
  const contextMenuItems = useMemo(() => {
    if (!contextMenu) {
      return [];
    }
    const target = contextMenu.target;
    const items = [] as { label: string; onClick: () => void }[];

    if (target.menuLevel < 3 && !target.menuUrl?.trim()) {
      items.push({
        label: '하위 메뉴 추가',
        onClick: () => handleAddChildMenu(target),
      });
    }

    items.push({
      label: '메뉴 삭제',
      onClick: () => handleDeleteMenu(target.menuNo),
    });

    return items;
  }, [contextMenu, handleAddChildMenu, handleDeleteMenu]);

  return (
    <>
      <div className="page-header">
        <h3 className="page-title">메뉴 관리</h3>
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><a href="#">관리</a></li>
            <li className="breadcrumb-item active" aria-current="page">메뉴</li>
          </ol>
        </nav>
      </div>

      <div className="row">
        <div className="col-lg-4 grid-margin stretch-card">
          <div className="card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">메뉴 목록</h5>
                <div className="d-flex gap-2">
                  <button type="button" className="btn btn-outline-secondary btn-sm" onClick={fetchMenuList} disabled={isLoading}>
                    새로고침
                  </button>
                  <button type="button" className="btn btn-primary btn-sm" onClick={handleAddRootMenu}>
                    최상위 추가
                  </button>
                </div>
              </div>

              {isLoading ? (
                <div className="text-center text-muted">로딩 중...</div>
              ) : (
                <AdminMenuTree
                  nodes={treeNodes}
                  expandedMap={expandedMap}
                  selectedId={selectedMenuNo}
                  onToggle={handleToggleExpand}
                  onSelect={handleSelectMenu}
                  onContextMenu={handleContextMenu}
                />
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-8 grid-margin stretch-card">
          <AdminMenuDetailForm
            mode={formMode}
            formState={formState}
            loading={isSaving}
            onChange={handleFormChange}
            onSave={handleSaveMenu}
            onClear={handleClearForm}
          />
        </div>
      </div>

      {contextMenu && (
        <div
          className="card position-fixed"
          style={{
            top: contextMenu.y,
            left: contextMenu.x,
            zIndex: 1050,
            minWidth: '180px',
          }}
        >
          <div className="list-group list-group-flush">
            {contextMenuItems.map((item) => (
              <button
                key={item.label}
                type="button"
                className="list-group-item list-group-item-action"
                onClick={() => {
                  item.onClick();
                  setContextMenu(null);
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default AdminMenuManage;
