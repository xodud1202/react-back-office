'use client';

import React, { startTransition, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import api, { clearAuthData } from '@/utils/axios/axios';
import type { MenuItem } from '@/types/menu';
import type { User } from '@/store/common';
import { useAppSelector } from '@/utils/hooks/redux';

interface AdminLayoutProps {
  children: React.ReactNode;
  menuItems: MenuItem[];
  user: User | null;
}

interface IndexedMenuNode {
  key: string;
  parentKey: string | null;
  level: number;
  item: MenuItem;
  normalizedPath: string | null;
}

interface IndexedMenuTree {
  nodeMap: Record<string, IndexedMenuNode>;
  topLevelKeys: string[];
}

/**
 * 현재 경로 문자열을 라우팅 비교용 표준 경로로 정규화합니다.
 * @param rawPath 정규화할 원본 경로입니다.
 * @returns 비교에 사용할 표준 경로입니다.
 */
const normalizeRoutePath = (rawPath: string): string => {
  const [pathWithoutQuery] = rawPath.split('?');
  const [pathWithoutHash] = pathWithoutQuery.split('#');
  const trimmedPath = pathWithoutHash.trim();

  // 빈 경로는 루트 경로로 통일합니다.
  if (trimmedPath === '') {
    return '/';
  }

  const prefixedPath = trimmedPath.startsWith('/') ? trimmedPath : `/${trimmedPath}`;
  if (prefixedPath.length > 1 && prefixedPath.endsWith('/')) {
    return prefixedPath.slice(0, -1);
  }

  return prefixedPath;
};

/**
 * 메뉴 URL을 실제 라우팅 비교에 사용할 경로로 정규화합니다.
 * @param menuUrl 메뉴에 저장된 URL입니다.
 * @returns 비교 가능한 경로이며 이동 대상이 없으면 null입니다.
 */
const normalizeMenuPath = (menuUrl: string): string | null => {
  if (!menuUrl || menuUrl.trim() === '') {
    return null;
  }

  const normalized = normalizeRoutePath(menuUrl);
  return normalized === '/' ? null : normalized;
};

/**
 * 메뉴 트리를 인덱스 구조로 변환합니다.
 * @param items 원본 메뉴 트리입니다.
 * @returns 빠른 검색과 활성 메뉴 계산을 위한 인덱스 구조입니다.
 */
const buildIndexedMenuTree = (items: MenuItem[]): IndexedMenuTree => {
  const nodeMap: Record<string, IndexedMenuNode> = {};
  const topLevelKeys: string[] = [];

  /**
   * 메뉴 배열을 재귀적으로 순회하며 인덱스를 생성합니다.
   * @param menus 현재 레벨 메뉴 목록입니다.
   * @param parentKey 부모 메뉴 키입니다.
   * @param level 현재 메뉴 깊이입니다.
   */
  const walk = (menus: MenuItem[], parentKey: string | null, level: number) => {
    menus.forEach((menu, index) => {
      const key = parentKey === null ? `top-${index}` : `${parentKey}-${index}`;
      nodeMap[key] = {
        key,
        parentKey,
        level,
        item: menu,
        normalizedPath: normalizeMenuPath(menu.menuUrl),
      };

      // 1차 메뉴는 상단 메뉴 렌더링 용도로 별도 보관합니다.
      if (level === 1) {
        topLevelKeys.push(key);
      }

      if (menu.subMenus && menu.subMenus.length > 0) {
        walk(menu.subMenus, key, level + 1);
      }
    });
  };

  walk(items, null, 1);
  return { nodeMap, topLevelKeys };
};

/**
 * 현재 경로와 가장 잘 맞는 메뉴 키를 찾습니다.
 * @param nodeMap 메뉴 인덱스 맵입니다.
 * @param currentPath 현재 경로입니다.
 * @returns 활성 메뉴 키입니다.
 */
const findBestMatchedMenuKey = (
  nodeMap: Record<string, IndexedMenuNode>,
  currentPath: string,
): string | null => {
  let exactMatchKey: string | null = null;
  let longestPrefixMatchKey: string | null = null;
  let longestPrefixLength = -1;

  // 정확 일치를 우선하고, 없으면 가장 긴 접두 일치를 사용합니다.
  Object.values(nodeMap).forEach((node) => {
    if (!node.normalizedPath) {
      return;
    }

    if (node.normalizedPath === currentPath) {
      exactMatchKey = node.key;
      return;
    }

    const prefix = `${node.normalizedPath}/`;
    if (currentPath.startsWith(prefix) && node.normalizedPath.length > longestPrefixLength) {
      longestPrefixMatchKey = node.key;
      longestPrefixLength = node.normalizedPath.length;
    }
  });

  return exactMatchKey ?? longestPrefixMatchKey;
};

/**
 * 특정 메뉴의 모든 조상 메뉴 키를 수집합니다.
 * @param nodeMap 메뉴 인덱스 맵입니다.
 * @param menuKey 시작 메뉴 키입니다.
 * @returns 조상 메뉴 키 목록입니다.
 */
const collectAncestorKeys = (
  nodeMap: Record<string, IndexedMenuNode>,
  menuKey: string | null,
): string[] => {
  const ancestors: string[] = [];
  let cursor = menuKey ? nodeMap[menuKey] : undefined;

  while (cursor && cursor.parentKey) {
    ancestors.push(cursor.parentKey);
    cursor = nodeMap[cursor.parentKey];
  }

  return ancestors;
};

/**
 * 현재 메뉴 기준 최상위 1차 메뉴 키를 계산합니다.
 * @param nodeMap 메뉴 인덱스 맵입니다.
 * @param menuKey 현재 메뉴 키입니다.
 * @returns 활성 1차 메뉴 키입니다.
 */
const resolveTopMenuKey = (
  nodeMap: Record<string, IndexedMenuNode>,
  menuKey: string | null,
): string | null => {
  if (!menuKey || !nodeMap[menuKey]) {
    return null;
  }

  let cursor: IndexedMenuNode | undefined = nodeMap[menuKey];
  while (cursor && cursor.parentKey) {
    cursor = nodeMap[cursor.parentKey];
  }

  return cursor?.key ?? null;
};

/**
 * 관리자 공통 레이아웃을 렌더링합니다.
 * @param props 메뉴/사용자 정보와 자식 노드입니다.
 * @returns 상단/좌측 메뉴가 포함된 관리자 레이아웃입니다.
 */
const AdminLayout = ({ children, menuItems, user }: AdminLayoutProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const storeUserNm = useAppSelector((state) => state.auth.user?.userNm ?? '');
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedTopMenuKey, setSelectedTopMenuKey] = useState<string | null>(null);

  const indexedMenuTree = useMemo(() => buildIndexedMenuTree(menuItems), [menuItems]);
  const currentPath = useMemo(() => normalizeRoutePath(pathname || '/'), [pathname]);
  const matchedMenuKey = useMemo(
    () => findBestMatchedMenuKey(indexedMenuTree.nodeMap, currentPath),
    [currentPath, indexedMenuTree.nodeMap],
  );
  const matchedTopMenuKey = useMemo(
    () => resolveTopMenuKey(indexedMenuTree.nodeMap, matchedMenuKey),
    [indexedMenuTree.nodeMap, matchedMenuKey],
  );
  const matchedAncestorKeys = useMemo(
    () => collectAncestorKeys(indexedMenuTree.nodeMap, matchedMenuKey),
    [indexedMenuTree.nodeMap, matchedMenuKey],
  );
  const matchedAncestorKeySet = useMemo(() => new Set(matchedAncestorKeys), [matchedAncestorKeys]);
  const isMainPage = currentPath === '/main';
  const activeTopMenuKey = selectedTopMenuKey ?? (isMainPage ? null : matchedTopMenuKey);
  const activeTopMenuNode = activeTopMenuKey ? indexedMenuTree.nodeMap[activeTopMenuKey] : undefined;
  const displayUserNm = storeUserNm || user?.userNm || '관리자';

  useEffect(() => {
    // 경로가 바뀌면 모바일 사이드바를 닫습니다.
    setIsSidebarOpen(false);
  }, [currentPath]);

  useEffect(() => {
    // 현재 URL에 매칭되는 상단 메뉴가 있으면 선택 상태를 맞춥니다.
    if (!isMainPage && matchedTopMenuKey) {
      setSelectedTopMenuKey(matchedTopMenuKey);
    }
  }, [isMainPage, matchedTopMenuKey]);

  useEffect(() => {
    // 다른 1차 메뉴로 이동하면 관련 없는 펼침 상태를 제거합니다.
    if (!activeTopMenuKey) {
      setOpenMenus({});
      return;
    }

    setOpenMenus((prev) => {
      const filtered: Record<string, boolean> = {};
      Object.entries(prev).forEach(([key, value]) => {
        const isSameTopMenu = key === activeTopMenuKey || key.startsWith(`${activeTopMenuKey}-`);
        if (value && isSameTopMenu) {
          filtered[key] = value;
        }
      });
      return filtered;
    });
  }, [activeTopMenuKey]);

  useEffect(() => {
    // 활성 메뉴 조상은 자동으로 펼쳐서 현재 위치를 항상 노출합니다.
    if (!matchedMenuKey) {
      return;
    }

    setOpenMenus((prev) => {
      const next = { ...prev };
      matchedAncestorKeys.forEach((ancestorKey) => {
        next[ancestorKey] = true;
      });
      return next;
    });
  }, [matchedAncestorKeys, matchedMenuKey]);

  /**
   * 로그아웃을 수행한 뒤 로그인 화면으로 이동합니다.
   * @returns 비동기 로그아웃 처리 결과입니다.
   */
  const handleLogout = async () => {
    try {
      await api.post('/api/backoffice/logout');
    } catch (error) {
      console.error('로그아웃 요청 실패:', error);
    } finally {
      clearAuthData();
      startTransition(() => {
        router.replace('/login');
      });
    }
  };

  /**
   * 특정 메뉴의 펼침 상태를 반전합니다.
   * @param menuKey 토글할 메뉴 키입니다.
   */
  const toggleMenu = (menuKey: string) => {
    setOpenMenus((prev) => ({ ...prev, [menuKey]: !prev[menuKey] }));
  };

  /**
   * 모바일 화면에서 좌측 사이드바를 닫습니다.
   */
  const closeSidebarOnMobile = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 992) {
      setIsSidebarOpen(false);
    }
  };

  /**
   * 상단 1차 메뉴 클릭을 처리합니다.
   * @param menuKey 클릭한 상단 메뉴 키입니다.
   */
  const handleTopMenuClick = (menuKey: string) => {
    setSelectedTopMenuKey(menuKey);
    const selectedNode = indexedMenuTree.nodeMap[menuKey];
    if (!selectedNode) {
      return;
    }

    const nextPath = selectedNode.normalizedPath;
    if (nextPath) {
      startTransition(() => {
        router.push(nextPath);
      });
      return;
    }

    if (typeof window !== 'undefined' && window.innerWidth < 992) {
      setIsSidebarOpen(true);
    }
  };

  /**
   * 선택된 상단 메뉴 기준 LNB를 재귀 렌더링합니다.
   * @param items 현재 레벨 메뉴 목록입니다.
   * @param level 현재 렌더링 깊이입니다.
   * @param parentKey 부모 메뉴 키입니다.
   * @returns LNB 메뉴 목록입니다.
   */
  const renderLnbMenu = (
    items: MenuItem[],
    level = 2,
    parentKey = activeTopMenuKey ?? 'lnb-root',
  ) => items.map((item, index) => {
    const hasSubMenus = Boolean(item.subMenus && item.subMenus.length > 0);
    const menuKey = `${parentKey}-${index}`;
    const collapseId = `${menuKey}-collapse`;
    const isOpen = openMenus[menuKey] || matchedAncestorKeySet.has(menuKey);
    const isActive = matchedMenuKey === menuKey;
    const isAncestor = matchedAncestorKeySet.has(menuKey);
    const resolvedPath = normalizeMenuPath(item.menuUrl);
    const isHighlighted = isActive || isAncestor;
    const itemClassName = `nav-item${isHighlighted ? ' active' : ''}`;

    return (
      <li className={itemClassName} key={menuKey}>
        {hasSubMenus ? (
          <>
            <a
              href={`#${collapseId}`}
              className={`nav-link${isHighlighted ? ' active' : ''}`}
              aria-expanded={isOpen}
              aria-controls={collapseId}
              role="button"
              onClick={(event) => {
                event.preventDefault();
                toggleMenu(menuKey);
              }}
            >
              {level === 2 ? (
                <span className="menu-icon">
                  <i className="mdi mdi-menu"></i>
                </span>
              ) : null}
              <span className={`menu-title${isAncestor ? ' active' : ''}`}>{item.menuNm}</span>
              <i className="menu-arrow"></i>
            </a>
            <div className={`collapse ${isOpen ? 'show' : ''}`} id={collapseId}>
              <ul className="nav flex-column sub-menu">
                {renderLnbMenu(item.subMenus!, level + 1, menuKey)}
              </ul>
            </div>
          </>
        ) : (
          <>
            {resolvedPath ? (
              <Link className={`nav-link${isActive ? ' active' : ''}`} href={resolvedPath} onClick={closeSidebarOnMobile}>
                {level === 2 ? (
                  <>
                    <span className="menu-icon">
                      <i className="mdi mdi-menu"></i>
                    </span>
                    <span className="menu-title">{item.menuNm}</span>
                  </>
                ) : (
                  item.menuNm
                )}
              </Link>
            ) : (
              <a className={`nav-link${isActive ? ' active' : ''}`} href="#" onClick={(event) => event.preventDefault()}>
                {level === 2 ? (
                  <>
                    <span className="menu-icon">
                      <i className="mdi mdi-menu"></i>
                    </span>
                    <span className="menu-title">{item.menuNm}</span>
                  </>
                ) : (
                  item.menuNm
                )}
              </a>
            )}
          </>
        )}
      </li>
    );
  });

  return (
    <div className="container-scroller">
      <nav className={`sidebar sidebar-offcanvas ${isSidebarOpen ? 'active' : ''}`} id="sidebar">
        <div className="sidebar-brand-wrapper d-none d-lg-flex align-items-center justify-content-center fixed-top">
          <Link className="sidebar-brand brand-logo" href="/main">
            <Image
              src="https://image.xodud1202.kro.kr/publist/HDD1/Media/nas/upload/common/xodud1202_logo.png"
              alt="logo"
              width={160}
              height={40}
              priority
            />
          </Link>
          <Link className="sidebar-brand brand-logo-mini" href="/main">
            <Image
              src="https://image.xodud1202.kro.kr/publist/HDD1/Media/nas/image/common/xodud1202_icon_102x102.png"
              alt="logo"
              width={36}
              height={36}
              priority
            />
          </Link>
        </div>
        <ul className="nav">
          <li className="nav-item profile">
            <div className="profile-desc">
              <div className="profile-pic">
                <div className="count-indicator">
                  <Image
                    className="img-xs rounded-circle"
                    src="/assets/images/faces/face15.jpg"
                    alt="profile"
                    width={32}
                    height={32}
                  />
                  <span className="count bg-success"></span>
                </div>
                <div className="profile-name">
                  <h5 className="mb-0 font-weight-normal">{displayUserNm}</h5>
                  <span>관리자</span>
                </div>
              </div>
            </div>
          </li>
          {activeTopMenuNode ? (
            <li className="nav-item nav-category">
              <span className="nav-link">{activeTopMenuNode.item.menuNm}</span>
            </li>
          ) : null}
          {activeTopMenuNode ? renderLnbMenu(activeTopMenuNode.item.subMenus || []) : null}
        </ul>
      </nav>

      <div className="container-fluid page-body-wrapper">
        <nav className="navbar p-0 fixed-top d-flex flex-row">
          <div className="navbar-brand-wrapper d-flex d-lg-none align-items-center justify-content-center">
            <Link className="navbar-brand brand-logo-mini" href="/main">
              <Image
                src="https://image.xodud1202.kro.kr/publist/HDD1/Media/nas/image/common/xodud1202_icon_102x102.png"
                alt="logo"
                width={36}
                height={36}
                priority
              />
            </Link>
          </div>
          <div className="navbar-menu-wrapper top-menu-wrapper flex-grow d-flex align-items-stretch">
            <ul className="navbar-nav top-primary-menu">
              {indexedMenuTree.topLevelKeys.map((menuKey) => {
                const menuNode = indexedMenuTree.nodeMap[menuKey];
                if (!menuNode) {
                  return null;
                }

                const isTopMenuActive = activeTopMenuKey === menuKey;
                return (
                  <li className="nav-item" key={menuKey}>
                    <button
                      type="button"
                      className={`top-menu-button${isTopMenuActive ? ' active' : ''}`}
                      onClick={() => handleTopMenuClick(menuKey)}
                    >
                      {menuNode.item.menuNm}
                    </button>
                  </li>
                );
              })}
            </ul>
            <ul className="navbar-nav navbar-nav-right">
              <li className="nav-item dropdown border-left">
                <button className="nav-link btn btn-outline-light btn-sm" type="button" onClick={() => void handleLogout()}>
                  로그아웃
                </button>
              </li>
            </ul>
            <button
              className="navbar-toggler navbar-toggler-right d-lg-none align-self-center"
              type="button"
              onClick={() => setIsSidebarOpen((prev) => !prev)}
            >
              <span className="mdi mdi-format-line-spacing"></span>
            </button>
          </div>
        </nav>

        <div className="main-panel">
          <div className="content-wrapper">{children}</div>
          <footer className="footer">
            <div className="d-sm-flex justify-content-center justify-content-sm-between">
              <span className="text-muted text-center text-sm-left d-block d-sm-inline-block">
                저작권 © 2026
              </span>
              <span className="text-muted float-none float-sm-end d-block mt-1 mt-sm-0 text-center">
                관리자 시스템
              </span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
