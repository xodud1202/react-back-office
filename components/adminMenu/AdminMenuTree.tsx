import React, { useMemo } from 'react';
import { AdminMenuItem, AdminMenuTreeNode } from './types';

type AdminMenuTreeProps = {
  nodes: AdminMenuTreeNode[];
  expandedMap: Record<string, boolean>;
  selectedId: number | null;
  onToggle: (menuNo: number) => void;
  onSelect: (menuNo: number) => void;
  onContextMenu: (event: React.MouseEvent<HTMLDivElement>, item: AdminMenuItem) => void;
};

// 관리자 메뉴 트리를 렌더링합니다.
const AdminMenuTree = ({
  nodes,
  expandedMap,
  selectedId,
  onToggle,
  onSelect,
  onContextMenu,
}: AdminMenuTreeProps) => {
  // 트리 항목별 아이콘 클래스를 정의합니다.
  const iconClasses = useMemo(() => {
    return {
      expanded: 'mdi mdi-chevron-down',
      collapsed: 'mdi mdi-chevron-right',
      empty: 'mdi mdi-chevron-right text-muted',
    };
  }, []);

  // 재귀적으로 트리 노드를 렌더링합니다.
  const renderNodes = (items: AdminMenuTreeNode[], depth: number) => {
    return items.map((item) => {
      // 현재 노드 상태를 계산합니다.
      const hasChildren = (item.childCount ?? 0) > 0;
      const isExpanded = expandedMap[item.menuNo] || false;
      const isSelected = selectedId === item.menuNo;
      const paddingLeft = 12 + depth * 16;

      return (
        <div key={item.menuNo}>
          <div
            className={`d-flex align-items-center py-1 ${isSelected ? 'bg-light text-dark fw-bold' : ''}`}
            style={{ paddingLeft }}
            role="button"
            tabIndex={0}
            onClick={() => {
              // 메뉴를 선택해 상세를 조회합니다.
              onSelect(item.menuNo);
            }}
            onKeyDown={(event) => {
              // 엔터키로 메뉴를 선택합니다.
              if (event.key === 'Enter') {
                onSelect(item.menuNo);
              }
            }}
            onContextMenu={(event) => {
              // 우클릭 컨텍스트 메뉴를 엽니다.
              onContextMenu(event, item);
            }}
          >
            <button
              type="button"
              className="btn btn-link btn-sm p-0 me-2"
              disabled={!hasChildren}
              onClick={(event) => {
                // 하위 노드 토글을 처리합니다.
                event.stopPropagation();
                if (hasChildren) {
                  onToggle(item.menuNo);
                }
              }}
            >
              <i className={hasChildren ? (isExpanded ? iconClasses.expanded : iconClasses.collapsed) : iconClasses.empty}></i>
            </button>
            <span className="text-truncate" style={{ color: isSelected ? '#212529' : undefined }}>
              {item.menuNm}
            </span>
            {item.useYn === 'N' && (
              <span className="badge bg-dark ms-2">사용안함</span>
            )}
          </div>
          {hasChildren && isExpanded && item.children.length > 0 && <div>{renderNodes(item.children, depth + 1)}</div>}
        </div>
      );
    });
  };

  return (
    <div>
      {nodes.length === 0 ? (
        <div className="text-muted">등록된 메뉴가 없습니다.</div>
      ) : (
        renderNodes(nodes, 0)
      )}
    </div>
  );
};

export default AdminMenuTree;
