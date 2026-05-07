import React from 'react';
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Frame, Layers, Wind, Database, Settings, LogOut, Menu, FolderOpen } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { signOut, auth } from '../firebase';
import { DisclaimerModal } from '../components/DisclaimerModal';
import { useProjects } from '../context/ProjectContext';

export const MainLayout: React.FC = () => {
  const { user, mockLogout } = useAuth();
  const { activeProject, sessionMode } = useProjects();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  const isProjectHome = location.pathname === '/';
  const isQuickMode = location.pathname.startsWith('/quick') || sessionMode === 'quick';
  const basePath = isQuickMode ? '/quick' : '/workspace';

  const handleLogout = async () => {
    if (auth) {
      try {
        await signOut(auth);
      } catch (error) {
        console.error("Error signing out", error);
      }
    } else {
      mockLogout();
    }
  };

  const navItems = [
    { to: '/', icon: <FolderOpen size={18} />, label: 'Projects', end: true },
    { to: basePath, icon: <Home size={18} />, label: 'Dashboard', end: true },
    { to: `${basePath}/steel`, icon: <Frame size={18} />, label: 'Steel Design' },
    { to: `${basePath}/concrete`, icon: <Layers size={18} />, label: 'Concrete Design' },
    { to: `${basePath}/loads`, icon: <Wind size={18} />, label: 'Loads' },
    { to: `${basePath}/variables`, icon: <Database size={18} />, label: 'Variables' },
    { to: `${basePath}/settings`, icon: <Settings size={18} />, label: 'Settings' },
  ];

  if (isProjectHome) {
    return <Outlet />;
  }

  return (
    <div className="flex h-screen bg-white text-gray-800 font-sans relative">
      <DisclaimerModal />

      {/* Mobile Sidebar Toggle */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-sm border"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        <Menu size={20} />
      </button>

      {/* Sidebar */}
      <div
        className={`fixed md:static inset-y-0 left-0 transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 transition duration-200 ease-in-out z-40 w-64 bg-gray-50 border-r border-gray-200 flex flex-col`}
      >
        <div className="p-6">
          <h1 className="text-xl font-semibold tracking-tight text-gray-900 flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded-md"></div>
            StrucCalc
          </h1>

          <Link to="/" className="mt-4 block rounded-lg border border-gray-200 bg-white p-3 text-sm hover:border-blue-200 hover:bg-blue-50">
            <div className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
              {isQuickMode ? 'Mode' : 'Active Project'}
            </div>
            <div className="mt-1 truncate font-semibold text-gray-900">
              {isQuickMode ? 'Quick Calculations' : activeProject?.name ?? 'No project selected'}
            </div>
            {!isQuickMode && activeProject?.projectNumber && (
              <div className="mt-1 truncate text-xs text-gray-500">{activeProject.projectNumber}</div>
            )}
            <div className="mt-2 text-xs font-medium text-blue-600">Change / Open Projects</div>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-gray-200 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 flex flex-col gap-4">
          <div className="flex items-center justify-between px-3">
            <span className="text-sm font-medium text-gray-600 truncate max-w-[140px]">
              {user?.email}
            </span>
            <button
              onClick={handleLogout}
              className="p-1 text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded-md transition-colors"
              title="Log out"
            >
              <LogOut size={16} />
            </button>
          </div>

          <div className="px-3 text-[10px] text-gray-400 leading-tight">
            NOT FOR CONSTRUCTION. Engineer of Record must verify all calculations. By using this tool, you accept the Terms of Use and liability disclaimer.
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <main className="p-8 max-w-6xl mx-auto mt-10 md:mt-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
