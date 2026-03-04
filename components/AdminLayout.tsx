import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import api, { ensureAccessToken, clearAuthData } from '@/utils/axios/axios';
import { MenuItem } from '@/types/menu';
import { useAppSelector } from '@/utils/hooks/redux';

type AdminLayoutProps = {
  children: React.ReactNode;
};

type IndexedMenuNode = {
  key: string;
  parentKey: string | null;
  level: number;
  item: MenuItem;
  normalizedPath: string | null;
};

type IndexedMenuTree = {
  nodeMap: Record<string, IndexedMenuNode>;
  topLevelKeys: string[];
};

// 현재 경로 문자열을 라우팅 비교용 표준 경로로 정규화합니다.
const normalizeRoutePath = (rawPath: string): string => {
  // 쿼리스트링과 해시를 제거해 실제 경로만 비교합니다.
  const [pathWithoutQuery] = rawPath.split('?');
  const [pathWithoutHash] = pathWithoutQuery.split('#');
  const trimmedPath = pathWithoutHash.trim();

  // 빈 경로는 루트로 처리합니다.
  if (trimmedPath === '') {
    return '/';
  }

  // 슬래시 보정 후 마지막 슬래시는 루트가 아닐 때 제거합니다.
  const prefixedPath = trimmedPath.startsWith('/') ? trimmedPath : `/${trimmedPath}`;
  if (prefixedPath.length > 1 && prefixedPath.endsWith('/')) {
    return prefixedPath.slice(0, -1);
  }
  return prefixedPath;
};

// 메뉴 URL을 이동/하이라이트 비교 가능한 경로로 정규화합니다.
const normalizeMenuPath = (menuUrl: string): string | null => {
  // 비어있는 URL과 템플릿 기본값(/)은 이동 대상에서 제외합니다.
  if (!menuUrl || menuUrl.trim() === '') {
    return null;
  }
  const normalized = normalizeRoutePath(menuUrl);
  if (normalized === '/') {
    return null;
  }
  return normalized;
};

// 메뉴 트리를 인덱스로 변환해 빠른 경로 탐색/상위메뉴 계산에 사용합니다.
const buildIndexedMenuTree = (items: MenuItem[]): IndexedMenuTree => {
  const nodeMap: Record<string, IndexedMenuNode> = {};
  const topLevelKeys: string[] = [];

  // 재귀적으로 메뉴를 순회하면서 키 기반 인덱스를 구성합니다.
  const walk = (menus: MenuItem[], parentKey: string | null, level: number) => {
    menus.forEach((menu, index) => {
      // 부모 키+인덱스 조합으로 현재 메뉴의 고유 키를 생성합니다.
      const key = parentKey === null ? `top-${index}` : `${parentKey}-${index}`;
      nodeMap[key] = {
        key,
        parentKey,
        level,
        item: menu,
        normalizedPath: normalizeMenuPath(menu.menuUrl),
      };

      // 1차 메뉴 키는 상단 메뉴 렌더링을 위해 별도 수집합니다.
      if (level === 1) {
        topLevelKeys.push(key);
      }

      // 하위 메뉴가 있으면 동일 규칙으로 계속 인덱싱합니다.
      if (menu.subMenus && menu.subMenus.length > 0) {
        walk(menu.subMenus, key, level + 1);
      }
    });
  };

  walk(items, null, 1);
  return { nodeMap, topLevelKeys };
};

// 현재 URL과 가장 잘 맞는 메뉴 키를 찾습니다. (정확일치 우선, 접두일치 보조)
const findBestMatchedMenuKey = (nodeMap: Record<string, IndexedMenuNode>, currentPath: string): string | null => {
  let exactMatchKey: string | null = null;
  let longestPrefixMatchKey: string | null = null;
  let longestPrefixLength = -1;

  // 모든 메뉴를 순회하며 현재 URL과의 매칭 우선순위를 계산합니다.
  Object.values(nodeMap).forEach((node) => {
    if (!node.normalizedPath) {
      return;
    }

    // 정확히 동일한 경로가 있으면 즉시 우선 후보로 기록합니다.
    if (node.normalizedPath === currentPath) {
      exactMatchKey = node.key;
      return;
    }

    // 더 긴 경로가 일치할수록 구체적인 메뉴이므로 우선순위를 높입니다.
    const prefix = `${node.normalizedPath}/`;
    if (currentPath.startsWith(prefix) && node.normalizedPath.length > longestPrefixLength) {
      longestPrefixMatchKey = node.key;
      longestPrefixLength = node.normalizedPath.length;
    }
  });

  if (exactMatchKey) {
    return exactMatchKey;
  }
  return longestPrefixMatchKey;
};

// 특정 메뉴 키의 모든 상위 메뉴 키를 루트 방향으로 수집합니다.
const collectAncestorKeys = (nodeMap: Record<string, IndexedMenuNode>, menuKey: string | null): string[] => {
  const ancestors: string[] = [];
  let cursor = menuKey ? nodeMap[menuKey] : undefined;

  // 부모를 따라 올라가며 조상 키를 순서대로 저장합니다.
  while (cursor && cursor.parentKey) {
    ancestors.push(cursor.parentKey);
    cursor = nodeMap[cursor.parentKey];
  }

  return ancestors;
};

// 현재 메뉴 키에서 최상위(1차) 메뉴 키를 계산합니다.
const resolveTopMenuKey = (nodeMap: Record<string, IndexedMenuNode>, menuKey: string | null): string | null => {
  if (!menuKey || !nodeMap[menuKey]) {
    return null;
  }

  let cursor: IndexedMenuNode | undefined = nodeMap[menuKey];
  // parentKey가 없을 때까지 올라가면 1차 메뉴에 도달합니다.
  while (cursor && cursor.parentKey) {
    cursor = nodeMap[cursor.parentKey];
  }

  return cursor ? cursor.key : null;
};

// 관리자 공통 레이아웃을 렌더링합니다.
const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const router = useRouter();
  const userNm = useAppSelector((state) => state.auth.user?.userNm ?? '');
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const [resolvedMenuItems, setResolvedMenuItems] = useState<MenuItem[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedTopMenuKey, setSelectedTopMenuKey] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    // 로그인 사용자의 메뉴 트리를 조회해 화면 상태를 초기화합니다.
    const fetchMenuItems = async () => {
      try {
        await ensureAccessToken();
        const response = await api.get('/api/admin/menu/list');
        if (isMounted) {
          setResolvedMenuItems(response.data || []);
        }
      } catch (error) {
        console.error('메뉴 조회 실패:', error);
      }
    };

    fetchMenuItems();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    // 라우팅 변경 시 모바일 사이드바를 닫습니다.
    setIsSidebarOpen(false);
  }, [router.asPath]);

  // 로그아웃 처리 후 로그인 화면으로 이동합니다.
  const handleLogout = async () => {
    try {
      await api.post('/api/backoffice/logout');
    } catch (error) {
      console.error('로그아웃 요청 실패:', error);
    } finally {
      clearAuthData();
      router.replace('/login');
    }
  };

  // 메뉴 접힘 상태를 토글합니다.
  const toggleMenu = (name: string) => {
    setOpenMenus((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  // 모바일 화면에서 사이드바를 닫습니다.
  const closeSidebarOnMobile = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 992) {
      setIsSidebarOpen(false);
    }
  };

  // 메뉴 데이터에서 상단/좌측 메뉴 계산용 인덱스를 생성합니다.
  const indexedMenuTree = useMemo(() => buildIndexedMenuTree(resolvedMenuItems), [resolvedMenuItems]);
  // 현재 URL을 표준 경로로 변환합니다.
  const currentPath = useMemo(() => normalizeRoutePath(router.asPath), [router.asPath]);
  // 현재 URL과 가장 잘 맞는 메뉴 키를 계산합니다.
  const matchedMenuKey = useMemo(
    () => findBestMatchedMenuKey(indexedMenuTree.nodeMap, currentPath),
    [indexedMenuTree.nodeMap, currentPath]
  );
  // 현재 URL 기준으로 활성 1차 메뉴 키를 계산합니다.
  const matchedTopMenuKey = useMemo(
    () => resolveTopMenuKey(indexedMenuTree.nodeMap, matchedMenuKey),
    [indexedMenuTree.nodeMap, matchedMenuKey]
  );
  // 현재 URL 기준 조상 메뉴 목록을 계산합니다.
  const matchedAncestorKeys = useMemo(
    () => collectAncestorKeys(indexedMenuTree.nodeMap, matchedMenuKey),
    [indexedMenuTree.nodeMap, matchedMenuKey]
  );
  const matchedAncestorKeySet = useMemo(() => new Set(matchedAncestorKeys), [matchedAncestorKeys]);
  // 메인 화면은 좌측 LNB를 항상 숨깁니다.
  const isMainPage = currentPath === '/main';
  // URL 기반 활성 메뉴를 우선 적용하고, 미매칭 시 마지막 선택 1차 메뉴를 사용합니다.
  const activeTopMenuKey = selectedTopMenuKey ?? (isMainPage ? null : matchedTopMenuKey);
  const activeTopMenuNode = activeTopMenuKey ? indexedMenuTree.nodeMap[activeTopMenuKey] : undefined;
  // 좌측 사이드바 프레임은 항상 노출하고, 메뉴 목록만 선택 상태에 따라 표시합니다.
  const shouldShowSidebar = true;

  useEffect(() => {
    // URL 매칭 결과가 있으면 1차 메뉴 선택 상태를 동기화합니다.
    if (!isMainPage && matchedTopMenuKey) {
      setSelectedTopMenuKey(matchedTopMenuKey);
    }
  }, [isMainPage, matchedTopMenuKey]);

  useEffect(() => {
    // 1차 메뉴 변경 시 다른 트리의 펼침 상태를 초기화합니다.
    if (!activeTopMenuKey) {
      setOpenMenus({});
      return;
    }
    setOpenMenus((prev) => {
      const filtered: Record<string, boolean> = {};
      Object.entries(prev).forEach(([key, value]) => {
        const sameTopMenu = key === activeTopMenuKey || key.startsWith(`${activeTopMenuKey}-`);
        if (value && sameTopMenu) {
          filtered[key] = value;
        }
      });
      return filtered;
    });
  }, [activeTopMenuKey]);

  useEffect(() => {
    // 현재 URL의 조상 메뉴는 자동으로 펼쳐서 활성 메뉴를 항상 보이게 합니다.
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

  // 상단 1차 메뉴 클릭을 처리합니다.
  const handleTopMenuClick = async (menuKey: string) => {
    // 클릭 시 즉시 선택 상태를 저장해 LNB 전환을 반영합니다.
    setSelectedTopMenuKey(menuKey);
    const selectedNode = indexedMenuTree.nodeMap[menuKey];
    if (!selectedNode) {
      return;
    }

    // URL이 있으면 즉시 해당 화면으로 이동합니다.
    if (selectedNode.normalizedPath) {
      await router.push(selectedNode.normalizedPath);
      return;
    }

    // URL이 없는 1차 메뉴는 LNB만 전환하고 모바일에서는 패널을 열어줍니다.
    if (typeof window !== 'undefined' && window.innerWidth < 992) {
      setIsSidebarOpen(true);
    }
  };

  // 활성 1차 메뉴 하위(2~3차)만 좌측 LNB에 렌더링합니다.
  const renderLnbMenu = (items: MenuItem[], level = 2, parentKey = activeTopMenuKey ?? 'lnb-root') => {
    return items.map((item, index) => {
      const hasSubMenus = item.subMenus && item.subMenus.length > 0;
      const menuKey = `${parentKey}-${index}`;
      const collapseId = `${menuKey}-collapse`;
      const isOpen = openMenus[menuKey] || matchedAncestorKeySet.has(menuKey);
      const isActive = matchedMenuKey === menuKey;
      const isAncestor = matchedAncestorKeySet.has(menuKey);
      const resolvedPath = normalizeMenuPath(item.menuUrl);
      // 현재 메뉴 또는 조상 메뉴(상위 2차 포함)는 활성 스타일을 적용합니다.
      const isHighlighted = isActive || isAncestor;
      const itemClassName = `nav-item${isHighlighted ? ' active' : ''}`;

      return (
        <li className={itemClassName} key={menuKey}>
          {hasSubMenus ? (
            <>
              <a
                href={`#${collapseId}`}
                className={`nav-link${isHighlighted ? ' active' : ''}`}
                data-bs-toggle="collapse"
                aria-expanded={isOpen}
                aria-controls={collapseId}
                role="button"
                onClick={(event) => {
                  event.preventDefault();
                  toggleMenu(menuKey);
                }}
              >
                {level === 2 && (
                  <span className="menu-icon">
                    <i className="mdi mdi-menu"></i>
                  </span>
                )}
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
  };

  return (
    <div className={`container-scroller ${shouldShowSidebar ? '' : 'no-sidebar-layout'}`.trim()}>
      {shouldShowSidebar && (
        <nav className={`sidebar sidebar-offcanvas ${isSidebarOpen ? 'active' : ''}`} id="sidebar">
          <div className="sidebar-brand-wrapper d-none d-lg-flex align-items-center justify-content-center fixed-top">
            <Link className="sidebar-brand brand-logo" href="/main">
              <img src="https://image.xodud1202.kro.kr/publist/HDD1/Media/nas/upload/common/xodud1202_logo.png" alt="logo" />
            </Link>
            <Link className="sidebar-brand brand-logo-mini" href="/main">
              <img src="https://image.xodud1202.kro.kr/publist/HDD1/Media/nas/image/common/xodud1202_icon_102x102.png" alt="logo" />
            </Link>
          </div>
          <ul className="nav">
            <li className="nav-item profile">
              <div className="profile-desc">
                <div className="profile-pic">
                  <div className="count-indicator">
                    <img className="img-xs rounded-circle" src="/assets/images/faces/face15.jpg" alt="profile" />
                    <span className="count bg-success"></span>
                  </div>
                  <div className="profile-name">
                    <h5 className="mb-0 font-weight-normal">{userNm || '관리자'}</h5>
                    <span>관리자</span>
                  </div>
                </div>
              </div>
            </li>
            {activeTopMenuNode && (
              <li className="nav-item nav-category">
                <span className="nav-link">{activeTopMenuNode.item.menuNm}</span>
              </li>
            )}
            {activeTopMenuNode ? renderLnbMenu(activeTopMenuNode.item.subMenus || []) : null}
          </ul>
        </nav>
      )}

      <div className={`container-fluid page-body-wrapper ${shouldShowSidebar ? '' : 'without-sidebar'}`.trim()}>
        <nav className="navbar p-0 fixed-top d-flex flex-row">
          <div className="navbar-brand-wrapper d-flex d-lg-none align-items-center justify-content-center">
            <Link className="navbar-brand brand-logo-mini" href="/main">
              <img src="https://image.xodud1202.kro.kr/publist/HDD1/Media/nas/image/common/xodud1202_icon_102x102.png" alt="logo" />
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
                      onClick={() => {
                        void handleTopMenuClick(menuKey);
                      }}
                    >
                      {menuNode.item.menuNm}
                    </button>
                  </li>
                );
              })}
            </ul>
            <ul className="navbar-nav navbar-nav-right">
              <li className="nav-item dropdown border-left">
                <button className="nav-link btn btn-outline-light btn-sm" type="button" onClick={handleLogout}>
                  로그아웃
                </button>
              </li>
            </ul>
            {shouldShowSidebar && (
              <button
                className="navbar-toggler navbar-toggler-right d-lg-none align-self-center"
                type="button"
                onClick={() => setIsSidebarOpen((prev) => !prev)}
              >
                <span className="mdi mdi-format-line-spacing"></span>
              </button>
            )}
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


