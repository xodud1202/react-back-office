import React, { useCallback, useEffect, useMemo, useState } from 'react';
import api from '@/utils/axios/axios';
import { getLoginUsrNo } from '@/utils/auth';
import CategoryTree from '@/components/category/CategoryTree';
import CategoryDetailForm from '@/components/category/CategoryDetailForm';
import {
  CategoryContextMenuState,
  CategoryFormState,
  CategoryItem,
  CategoryTreeNode,
} from '@/components/category/types';

// 카테고리 관리 화면을 렌더링합니다.
const CategoryManage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [treeNodes, setTreeNodes] = useState<CategoryTreeNode[]>([]);
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [formState, setFormState] = useState<CategoryFormState | null>(null);
  const [formMode, setFormMode] = useState<'idle' | 'create' | 'edit'>('idle');
  const [contextMenu, setContextMenu] = useState<CategoryContextMenuState | null>(null);

  // 카테고리 목록을 트리 구조로 변환합니다.
  const buildTreeNodes = useCallback((list: CategoryItem[]) => {
    // 노드 맵과 루트 노드를 준비합니다.
    const nodeMap = new Map<string, CategoryTreeNode>();
    const roots: CategoryTreeNode[] = [];

    list.forEach((item) => {
      // 카테고리 정보를 노드 맵에 적재합니다.
      nodeMap.set(item.categoryId, { ...item, children: [] });
    });

    nodeMap.forEach((node) => {
      // 상위 카테고리 유무에 따라 루트/자식으로 구분합니다.
      if (node.parentCategoryId && nodeMap.has(node.parentCategoryId)) {
        // 상위 노드의 자식으로 등록합니다.
        nodeMap.get(node.parentCategoryId)!.children.push(node);
      } else {
        // 루트 노드로 등록합니다.
        roots.push(node);
      }
    });

    // 정렬 순서 기준으로 트리를 정렬합니다.
    const sortNodes = (nodes: CategoryTreeNode[]) => {
      nodes.sort((a, b) => {
        // 정렬 순서와 코드 기준으로 정렬합니다.
        const ordA = a.dispOrd ?? 0;
        const ordB = b.dispOrd ?? 0;
        if (ordA !== ordB) {
          return ordA - ordB;
        }
        return a.categoryId.localeCompare(b.categoryId);
      });
      nodes.forEach((node) => {
        // 하위 노드를 재귀적으로 정렬합니다.
        sortNodes(node.children);
      });
    };
    sortNodes(roots);

    return roots;
  }, []);

  // 카테고리 목록을 조회합니다.
  const fetchCategoryList = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/admin/category/manage/list');
      const list: CategoryItem[] = (response.data || []).map((item: CategoryItem) => {
        // 응답 데이터를 화면용 형식으로 변환합니다.
        return {
          ...item,
          parentCategoryId: item.parentCategoryId || null,
          categoryLevel: item.categoryLevel ?? null,
          dispOrd: item.dispOrd ?? null,
          showYn: item.showYn || 'Y',
        };
      });
      // 목록 및 트리 상태를 갱신합니다.
      setTreeNodes(buildTreeNodes(list));
    } catch (error) {
      console.error('카테고리 목록 조회에 실패했습니다.', error);
      alert('카테고리 목록 조회에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [buildTreeNodes]);

  // 다음 카테고리 코드를 조회합니다.
  const fetchNextCategoryId = useCallback(async (parentCategoryId: string | null) => {
    try {
      const response = await api.get('/api/admin/category/manage/next-id', {
        params: { parentCategoryId: parentCategoryId || undefined },
      });
      return response.data?.categoryId as string;
    } catch (error) {
      console.error('카테고리 코드 조회에 실패했습니다.', error);
      alert('카테고리 코드 조회에 실패했습니다.');
      return '';
    }
  }, []);

  // 화면 진입 시 카테고리 목록을 조회합니다.
  useEffect(() => {
    // 초기 카테고리 목록을 조회합니다.
    fetchCategoryList();
  }, [fetchCategoryList]);

  // 컨텍스트 메뉴가 열렸을 때 외부 클릭으로 닫습니다.
  useEffect(() => {
    if (!contextMenu) {
      return;
    }
    const handleClose = () => {
      // 컨텍스트 메뉴를 닫습니다.
      setContextMenu(null);
    };
    window.addEventListener('click', handleClose);
    return () => {
      // 이벤트 리스너를 해제합니다.
      window.removeEventListener('click', handleClose);
    };
  }, [contextMenu]);

  // 트리 확장 상태를 토글합니다.
  const handleToggleExpand = useCallback((categoryId: string) => {
    // 확장 상태를 갱신합니다.
    setExpandedMap((prev) => ({ ...prev, [categoryId]: !prev[categoryId] }));
  }, []);

  // 카테고리를 선택하여 상세 정보를 조회합니다.
  const handleSelectCategory = useCallback(async (categoryId: string) => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/admin/category/manage/detail', { params: { categoryId } });
      const detail = response.data as CategoryItem;
      // 상세 정보를 폼 상태로 변환합니다.
      setSelectedCategoryId(categoryId);
      setFormMode('edit');
      setFormState({
        categoryId: detail.categoryId,
        parentCategoryId: detail.parentCategoryId || null,
        categoryLevel: detail.categoryLevel ?? null,
        categoryNm: detail.categoryNm || '',
        dispOrd: detail.dispOrd ?? null,
        showYn: detail.showYn || 'Y',
      });
    } catch (error) {
      console.error('카테고리 상세 조회에 실패했습니다.', error);
      alert('카테고리 상세 조회에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 우클릭 컨텍스트 메뉴를 엽니다.
  const handleContextMenu = useCallback((event: React.MouseEvent<HTMLDivElement>, item: CategoryItem) => {
    event.preventDefault();
    // 컨텍스트 메뉴 위치를 저장합니다.
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      target: item,
    });
  }, []);

  // 최상위 카테고리 추가 모드로 전환합니다.
  const handleAddRootCategory = useCallback(async () => {
    // 다음 카테고리 코드를 조회합니다.
    const nextCategoryId = await fetchNextCategoryId(null);
    // 등록 모드로 폼을 초기화합니다.
    setFormMode('create');
    setSelectedCategoryId(null);
    setFormState({
      categoryId: nextCategoryId,
      parentCategoryId: null,
      categoryLevel: null,
      categoryNm: '',
      dispOrd: null,
      showYn: 'Y',
    });
  }, [fetchNextCategoryId]);

  // 하위 카테고리 추가 모드로 전환합니다.
  const handleAddChildCategory = useCallback(async (parent: CategoryItem) => {
    // 다음 카테고리 코드를 조회합니다.
    const nextCategoryId = await fetchNextCategoryId(parent.categoryId);
    // 등록 모드로 폼을 초기화합니다.
    setFormMode('create');
    setSelectedCategoryId(null);
    setFormState({
      categoryId: nextCategoryId,
      parentCategoryId: parent.categoryId,
      categoryLevel: parent.categoryLevel != null ? parent.categoryLevel + 1 : null,
      categoryNm: '',
      dispOrd: null,
      showYn: 'Y',
    });
  }, [fetchNextCategoryId]);

  // 카테고리 삭제를 처리합니다.
  const handleDeleteCategory = useCallback(async (categoryId: string) => {
    const ok = confirm('선택한 카테고리를 삭제하시겠습니까?');
    if (!ok) {
      return;
    }

    const usrNo = getLoginUsrNo();
    if (!usrNo) {
      alert('로그인 사용자 정보를 확인할 수 없습니다.');
      return;
    }

    try {
      const response = await api.post('/api/admin/category/manage/delete', {
        categoryId,
        udtNo: usrNo,
      });
      if (response.data > 0) {
        alert('카테고리가 삭제되었습니다.');
        // 목록과 폼 상태를 갱신합니다.
        await fetchCategoryList();
        if (selectedCategoryId === categoryId) {
          setSelectedCategoryId(null);
          setFormMode('idle');
          setFormState(null);
        }
        return;
      }
      alert('카테고리 삭제에 실패했습니다.');
    } catch (error) {
      console.error('카테고리 삭제에 실패했습니다.', error);
      const message = (error as any)?.response?.data?.message;
      alert(message || '카테고리 삭제에 실패했습니다.');
    }
  }, [fetchCategoryList, selectedCategoryId]);

  // 폼 입력값을 변경합니다.
  const handleFormChange = useCallback((field: keyof CategoryFormState, value: string) => {
    // 입력 필드별 변환 로직을 적용합니다.
    setFormState((prev) => {
      const nextState: CategoryFormState = prev ?? {
        categoryId: '',
        parentCategoryId: null,
        categoryLevel: null,
        categoryNm: '',
        dispOrd: null,
        showYn: 'Y',
      };

      if (field === 'dispOrd') {
        const parsed = value.trim() === '' ? null : Number(value);
        return { ...nextState, dispOrd: Number.isNaN(parsed) ? null : parsed };
      }
      if (field === 'categoryId') {
        return { ...nextState, categoryId: value };
      }
      if (field === 'categoryNm') {
        return { ...nextState, categoryNm: value };
      }
      if (field === 'showYn') {
        return { ...nextState, showYn: value };
      }
      return { ...nextState, [field]: value };
    });
  }, []);

  // 폼 상태를 초기화합니다.
  const handleClearForm = useCallback(() => {
    // 선택 상태와 폼을 초기화합니다.
    setSelectedCategoryId(null);
    setFormMode('idle');
    setFormState(null);
  }, []);

  // 카테고리 저장을 처리합니다.
  const handleSaveCategory = useCallback(async () => {
    if (!formState) {
      return;
    }

    if (formState.categoryId.trim() === '') {
      alert('카테고리 코드를 입력해주세요.');
      return;
    }
    if (formState.categoryNm.trim() === '') {
      alert('카테고리명을 입력해주세요.');
      return;
    }

    const usrNo = getLoginUsrNo();
    if (!usrNo) {
      alert('로그인 사용자 정보를 확인할 수 없습니다.');
      return;
    }

    setIsSaving(true);
    try {
      if (formMode === 'create') {
        const response = await api.post('/api/admin/category/manage/create', {
          categoryId: formState.categoryId,
          parentCategoryId: formState.parentCategoryId,
          categoryNm: formState.categoryNm.trim(),
          dispOrd: formState.dispOrd,
          showYn: formState.showYn,
          regNo: usrNo,
          udtNo: usrNo,
        });
        if (response.data > 0) {
          alert('카테고리가 등록되었습니다.');
          await fetchCategoryList();
          await handleSelectCategory(formState.categoryId.trim());
          return;
        }
        alert('카테고리 등록에 실패했습니다.');
      } else if (formMode === 'edit') {
        const response = await api.post('/api/admin/category/manage/update', {
          categoryId: formState.categoryId,
          categoryNm: formState.categoryNm.trim(),
          dispOrd: formState.dispOrd,
          showYn: formState.showYn,
          udtNo: usrNo,
        });
        if (response.data > 0) {
          alert('카테고리가 저장되었습니다.');
          await fetchCategoryList();
          await handleSelectCategory(formState.categoryId);
          return;
        }
        alert('카테고리 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('카테고리 저장에 실패했습니다.', error);
      const message = (error as any)?.response?.data?.message;
      alert(message || '카테고리 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  }, [fetchCategoryList, formMode, formState, handleSelectCategory]);

  // 컨텍스트 메뉴 내용을 구성합니다.
  const contextMenuItems = useMemo(() => {
    if (!contextMenu) {
      return [];
    }
    const target = contextMenu.target;
    // 컨텍스트 메뉴 항목을 구성합니다.
    return [
      {
        label: '하위 카테고리 추가',
        onClick: () => {
          // 하위 카테고리 추가 모드로 전환합니다.
          handleAddChildCategory(target);
        },
      },
      {
        label: '카테고리 삭제',
        onClick: () => {
          // 카테고리 삭제를 요청합니다.
          handleDeleteCategory(target.categoryId);
        },
      },
    ];
  }, [contextMenu, handleAddChildCategory, handleDeleteCategory]);

  return (
    <>
      <div className="page-header">
        <h3 className="page-title">카테고리 관리</h3>
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><a href="#">카테고리</a></li>
            <li className="breadcrumb-item active" aria-current="page">관리</li>
          </ol>
        </nav>
      </div>

      <div className="row">
        <div className="col-lg-4 grid-margin stretch-card">
          <div className="card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">카테고리 목록</h5>
                <div className="d-flex gap-2">
                  <button type="button" className="btn btn-outline-secondary btn-sm" onClick={fetchCategoryList} disabled={isLoading}>
                    새로고침
                  </button>
                  <button type="button" className="btn btn-primary btn-sm" onClick={handleAddRootCategory}>
                    최상위 추가
                  </button>
                </div>
              </div>

              {isLoading ? (
                <div className="text-center text-muted">로딩 중...</div>
              ) : (
                <CategoryTree
                  nodes={treeNodes}
                  expandedMap={expandedMap}
                  selectedId={selectedCategoryId}
                  onToggle={handleToggleExpand}
                  onSelect={handleSelectCategory}
                  onContextMenu={handleContextMenu}
                />
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-8 grid-margin stretch-card">
          <CategoryDetailForm
            mode={formMode}
            formState={formState}
            loading={isSaving}
            onChange={handleFormChange}
            onSave={handleSaveCategory}
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
                  // 컨텍스트 메뉴 동작을 실행합니다.
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

export default CategoryManage;
