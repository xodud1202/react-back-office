import React, { useMemo } from 'react';
import { CategoryItem, CategoryTreeNode } from './types';

type CategoryTreeProps = {
  nodes: CategoryTreeNode[];
  expandedMap: Record<string, boolean>;
  selectedId: string | null;
  onToggle: (categoryId: string) => void;
  onSelect: (categoryId: string) => void;
  onContextMenu: (event: React.MouseEvent<HTMLDivElement>, item: CategoryItem) => void;
};

// 카테고리 트리 목록을 렌더링합니다.
const CategoryTree = ({
  nodes,
  expandedMap,
  selectedId,
  onToggle,
  onSelect,
  onContextMenu,
}: CategoryTreeProps) => {
  // 트리 노드 렌더링을 위한 아이콘 클래스를 정의합니다.
  const iconClasses = useMemo(() => {
    // 상태별 아이콘 클래스를 반환합니다.
    return {
      expanded: 'mdi mdi-chevron-down',
      collapsed: 'mdi mdi-chevron-right',
      empty: 'mdi mdi-chevron-right text-muted',
    };
  }, []);

  // 트리 노드를 재귀적으로 렌더링합니다.
  const renderNodes = (items: CategoryTreeNode[], depth: number) => {
    // 현재 깊이에 해당하는 노드 목록을 구성합니다.
    return items.map((item) => {
      // 현재 노드의 렌더링 정보를 계산합니다.
      const hasChildren = (item.childCount ?? 0) > 0;
      const isExpanded = expandedMap[item.categoryId] || false;
      const isSelected = selectedId === item.categoryId;
      const paddingLeft = 12 + depth * 16;

      return (
        <div key={item.categoryId}>
          <div
            className={`d-flex align-items-center py-1 ${isSelected ? 'bg-light text-dark fw-bold' : ''}`}
            style={{ paddingLeft }}
            role="button"
            tabIndex={0}
            onClick={() => {
              // 카테고리를 선택합니다.
              onSelect(item.categoryId);
            }}
            onKeyDown={(event) => {
              // 엔터키로 카테고리를 선택합니다.
              if (event.key === 'Enter') {
                onSelect(item.categoryId);
              }
            }}
            onContextMenu={(event) => {
              // 우클릭 컨텍스트 메뉴를 표시합니다.
              onContextMenu(event, item);
            }}
          >
            <button
              type="button"
              className="btn btn-link btn-sm p-0 me-2"
              disabled={!hasChildren}
              onClick={(event) => {
                // 화살표 클릭 시 확장/축소합니다.
                event.stopPropagation();
                if (hasChildren) {
                  onToggle(item.categoryId);
                }
              }}
            >
              <i className={hasChildren ? (isExpanded ? iconClasses.expanded : iconClasses.collapsed) : iconClasses.empty}></i>
            </button>
            <span className="text-truncate" style={{ color: isSelected ? '#212529' : undefined }}>
              {item.categoryNm}
            </span>
            {item.showYn === 'N' && (
              <span className="badge bg-secondary ms-2">비노출</span>
            )}
          </div>
          {hasChildren && isExpanded && item.children.length > 0 && (
            <div>
              {renderNodes(item.children, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div>
      {nodes.length === 0 ? (
        <div className="text-muted">등록된 카테고리가 없습니다.</div>
      ) : (
        renderNodes(nodes, 0)
      )}
    </div>
  );
};

export default CategoryTree;
