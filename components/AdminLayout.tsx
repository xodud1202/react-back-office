import React, {ComponentType, useEffect, useState} from 'react';
import dynamic from 'next/dynamic';
import Cookies from "universal-cookie";
import {useRouter} from "next/router";

type AdminLayoutProps = {
  children: React.ReactNode;
};

type MenuItem = {
  menuNm: string;
  menuUrl: string;
  subMenus?: MenuItem[];
};

// 탭 정보를 위한 타입
type Tab = {
  name: string;
  href: string;
  Component: ComponentType<any>;
};

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const router = useRouter();
  const cookies = new Cookies();
  const [loginId, setLoginId] = useState('');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [openTabs, setOpenTabs] = useState<Tab[]>([]);
  const [activeTab, setActiveTab] = useState<string>('');

  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const requestUri = '/api/admin/menu/list';
        const requestParam = { method: 'GET' };

        const response = await fetch('/api/backend-api', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requestUri, requestParam })
        });

        if (response.ok) {
          const data = await response.json();
          setMenuItems(data || []);
        } else {
          console.error('Failed to fetch menu items');
        }
      } catch (error) {
        console.error('Error fetching menu items:', error);
      }
    };

    const cookies = new Cookies(); // ← 아무 인자 없이 사용 (문제 발생 가능)
    const cookieLoginId = cookies.get('loginId'); // 서버에서는 쿠키가 없음
    if (cookieLoginId) {
      setLoginId(cookieLoginId);
    }

    fetchMenuItems();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('refreshToken');

    // 로그인이 안되어있다는 말은, REFRESH_TOKEN을 삭제해야한다는 말과 동일함.
    cookies.remove('loginId', { path: '/' });
    cookies.remove('usrNm', { path: '/' });
    cookies.remove('refreshToken', { path: '/' });
    cookies.remove('accessToken', { path: '/' });
    router.replace('/login');
  };

  const toggleMenu = (name: string) => {
    setOpenMenus((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const handleMenuClick = (menu: MenuItem) => {
    if (!openTabs.some(tab => tab.href === menu.menuUrl)) {
      const PageComponent = dynamic(() => import(`../pages${menu.menuUrl}`).catch(() => <div>페이지를 로드할 수 없습니다.</div>));
      setOpenTabs([...openTabs, { name: menu.menuNm, href: menu.menuUrl, Component: PageComponent }]);
    }
    setActiveTab(menu.menuUrl);
  };

  const handleCloseTab = (href: string) => {
    const newTabs = openTabs.filter(tab => tab.href !== href);
    setOpenTabs(newTabs);
    if (activeTab === href && newTabs.length > 0) {
      setActiveTab(newTabs[newTabs.length - 1].href);
    } else if (newTabs.length === 0) {
      setActiveTab('');
    }
  };

  const renderMenu = (items: MenuItem[], level = 0) => {
    return items.map((item) => {
      const hasSubMenus = item.subMenus && item.subMenus.length > 0;
      const isOpen = openMenus[item.menuNm] || false;

      return (
        <div key={item.menuNm} style={{ paddingLeft: `${level * 16}px` }}>
          <div className="flex items-center justify-between w-full">
            {hasSubMenus ? (
              <div
                onClick={() => toggleMenu(item.menuNm)}
                className="flex items-center justify-between flex-grow py-2.5 px-4 rounded transition duration-200 hover:bg-gray-200 cursor-pointer"
              >
                <span>{item.menuNm}</span>
                <svg
                  className={`w-4 h-4 transition-transform ${
                    isOpen ? 'rotate-90' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 5l7 7-7 7"
                  ></path>
                </svg>
              </div>
            ) : (
              <a
                onClick={() => handleMenuClick(item)}
                className="block flex-grow py-2.5 px-4 rounded transition duration-200 hover:bg-gray-200 cursor-pointer"
              >
                {item.menuNm}
              </a>
            )}
          </div>
          {hasSubMenus && isOpen && (
            <div>{renderMenu(item.subMenus!, level + 1)}</div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`bg-white text-black transition-all duration-300 ${
          isSidebarOpen ? 'w-64' : 'w-0'
        } overflow-hidden`}
      >
        <div>
          <div className="h-[73px] flex items-center pl-[20px] text-center">
            <img
                src="/images/common/project-logo-512x125.png"
                alt="Project Logo"
                className="object-contain w-[70%]"
            />
          </div>
          <nav className="mt-10">{renderMenu(menuItems)}</nav>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex justify-between items-center p-4 bg-white border-b">
          <div>
            <button onClick={() => setSidebarOpen(!isSidebarOpen)}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16m-7 6h7"
                />
              </svg>
            </button>
          </div>
          <div>
            <div className="mr-4 inline-block">{ loginId } 님</div>
            <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              로그아웃
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-200 p-4">
          <div className="tabs-container bg-white shadow-sm">
            {openTabs.map(tab => (
              <button
                key={tab.href}
                onClick={() => setActiveTab(tab.href)}
                className={`px-4 py-2 text-sm font-medium transition-colors duration-150 ${
                  activeTab === tab.href
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.name}
                <span onClick={(e) => { e.stopPropagation(); handleCloseTab(tab.href); }} className="ml-2 text-xs font-bold">x</span>
              </button>
            ))}
          </div>
          <div className="pages-container mt-4">
            {openTabs.map(tab => (
              <div key={tab.href} style={{ display: activeTab === tab.href ? 'block' : 'none' }}>
                <tab.Component />
              </div>
            ))}
            {openTabs.length === 0 && children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;