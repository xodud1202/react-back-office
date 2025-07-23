import React, { useState, useEffect } from 'react';
import Link from 'next/link';

type AdminLayoutProps = {
  children: React.ReactNode;
};

type MenuItem = {
  menuNm: string;
  menuUrl: string;
  subMenus?: MenuItem[];
};

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const requestUri = '/api/admin/menu/list';
        // 컨트롤러가 GET 요청을 사용하므로 파라미터를 수정합니다.
        const requestParam = { method: 'GET' };

        await fetch('/api/backend-api', {
            method: 'POST', // 프록시 API는 POST를 통해 호출합니다.
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requestUri, requestParam })
        }).then(res => res.json()).then(res => {
          console.log('menu items:', res);
          setMenuItems(res || []);
        }).catch(e => {
          console.error('Error fetching menu items:', e);
        });
      } catch (error) {
        console.error('Error fetching menu items:', error);
      }
    };

    fetchMenuItems();
  }, []);

  const toggleMenu = (name: string) => {
    setOpenMenus((prev) => ({ ...prev, [name]: !prev[name] }));
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
              <Link
                href={item.menuUrl}
                className="block flex-grow py-2.5 px-4 rounded transition duration-200 hover:bg-gray-200"
              >
                {item.menuNm}
              </Link>
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
        <div className="p-4">
          <h1 className="text-2xl font-bold">Admin</h1>
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
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-200 p-4">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;