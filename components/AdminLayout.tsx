import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { deleteCookie, getCookie } from 'cookies-next';
import { useRouter } from 'next/router';
import api from '@/utils/axios/axios';
import { MenuItem } from '@/types/menu';

type AdminLayoutProps = {
  children: React.ReactNode;
};

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const router = useRouter();
  const [userNm, setUserNm] = useState('');
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const [resolvedMenuItems, setResolvedMenuItems] = useState<MenuItem[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    // 사용자명을 쿠키에서 조회합니다.
    const cookieUserNm = getCookie('userNm', { path: '/' });
    if (typeof cookieUserNm === 'string') {
      setUserNm(cookieUserNm);
    }
  }, []);

  useEffect(() => {
    // AdminLayout 진입 시 최신 메뉴를 조회합니다.
    let isMounted = true;

    // 메뉴 목록을 API로 조회합니다.
    const fetchMenuItems = async () => {
      const accessToken = getCookie('accessToken', { path: '/' });
      if (!accessToken) {
        router.replace('/login');
        return;
      }
      try {
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
  }, [router.asPath]);

  useEffect(() => {
    // 라우팅 변경 시 모바일 사이드바를 닫습니다.
    setIsSidebarOpen(false);
  }, [router.asPath]);

  // 로그아웃 처리 후 로그인 화면으로 이동합니다.
  const handleLogout = () => {
    localStorage.removeItem('refreshToken');

    // 로그인이 안되어있다는 말은, REFRESH_TOKEN을 삭제해야한다는 말과 동일함.
    deleteCookie('loginId', { path: '/' });
    deleteCookie('usrNm', { path: '/' });
    deleteCookie('refreshToken', { path: '/' });
    deleteCookie('accessToken', { path: '/' });
    router.replace('/login');
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

  // 템플릿 구조에 맞춰 메뉴를 재귀적으로 렌더링합니다.
  const renderMenu = (items: MenuItem[], level = 0, parentKey = 'menu') => {
    return items.map((item, index) => {
      const hasSubMenus = item.subMenus && item.subMenus.length > 0;
      const menuKey = `${parentKey}-${index}`;
      const collapseId = `${menuKey}-collapse`;
      const isOpen = openMenus[menuKey] || false;
      const itemClassName = level === 0 ? 'nav-item menu-items' : 'nav-item';

      return (
        <li className={itemClassName} key={menuKey}>
          {hasSubMenus ? (
            <>
              <a
                href={`#${collapseId}`}
                className="nav-link"
                data-bs-toggle="collapse"
                aria-expanded={isOpen}
                aria-controls={collapseId}
                role="button"
                onClick={(event) => {
                  event.preventDefault();
                  toggleMenu(menuKey);
                }}
              >
                {level === 0 && (
                  <span className="menu-icon">
                    <i className="mdi mdi-menu"></i>
                  </span>
                )}
                <span className="menu-title">{item.menuNm}</span>
                <i className="menu-arrow"></i>
              </a>
              <div className={`collapse ${isOpen ? 'show' : ''}`} id={collapseId}>
                <ul className="nav flex-column sub-menu">
                  {renderMenu(item.subMenus!, level + 1, menuKey)}
                </ul>
              </div>
            </>
          ) : (
            <Link className="nav-link" href={item.menuUrl} onClick={closeSidebarOnMobile}>
              {level === 0 ? (
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
          )}
        </li>
      );
    });
  };

  return (
    <div className="container-scroller">
      <nav className={`sidebar sidebar-offcanvas ${isSidebarOpen ? 'active' : ''}`} id="sidebar">
        <div className="sidebar-brand-wrapper d-none d-lg-flex align-items-center justify-content-center fixed-top">
          <Link className="sidebar-brand brand-logo" href="/main">
            <img src="https://image.xodud1202.kro.kr/publist/HDD1/Media/nas/upload/common/xodud1202_logo.png" alt="logo" />
          </Link>
          <Link className="sidebar-brand brand-logo-mini" href="/main">
            <img src="/assets/images/logo-mini.svg" alt="logo" />
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
          <li className="nav-item nav-category">
            <span className="nav-link">메뉴</span>
          </li>
          {renderMenu(resolvedMenuItems)}
        </ul>
      </nav>

      <div className="container-fluid page-body-wrapper">
        <nav className="navbar p-0 fixed-top d-flex flex-row">
          <div className="navbar-brand-wrapper d-flex d-lg-none align-items-center justify-content-center">
            <Link className="navbar-brand brand-logo-mini" href="/main">
              <img src="/assets/images/logo-mini.svg" alt="logo" />
            </Link>
          </div>
          <div className="navbar-menu-wrapper flex-grow d-flex align-items-stretch">
            <button className="navbar-toggler navbar-toggler align-self-center" type="button" data-toggle="minimize">
              <span className="mdi mdi-menu"></span>
            </button>
            <ul className="navbar-nav w-100">
              <li className="nav-item w-100">
                <form className="nav-link mt-2 mt-md-0 d-none d-lg-flex search">
                  <input type="text" className="form-control" placeholder="검색어를 입력하세요" />
                </form>
              </li>
            </ul>
            <ul className="navbar-nav navbar-nav-right">
              <li className="nav-item dropdown border-left">
                <button className="nav-link btn btn-outline-light btn-sm" type="button" onClick={handleLogout}>
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
