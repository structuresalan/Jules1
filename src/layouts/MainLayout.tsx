import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Home, Frame, Layers, Wind, Database, Settings, LogOut, Menu, FolderOpen, FileText } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { signOut, auth } from '../firebase';
import { DisclaimerModal } from '../components/DisclaimerModal';
import simplifyStructLogo from '../assets/simplifystruct-logo.png';

const getProjectLabel = () => {
  try {
    const rawProjects = window.localStorage.getItem('struccalc.projects.v3');
    const activeProjectId = window.localStorage.getItem('struccalc.activeProject.v3');
    const mode = window.localStorage.getItem('struccalc.sessionMode.v3');

    if (mode === 'quick') return 'Quick Calculations';
    if (!rawProjects || !activeProjectId) return 'No project selected';

    const projects = JSON.parse(rawProjects) as Array<{ id: string; name: string }>;
    return projects.find((project) => project.id === activeProjectId)?.name ?? 'No project selected';
  } catch {
    return 'No project selected';
  }
};

export const MainLayout: React.FC = () => {
  const { user, mockLogout } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [projectLabel, setProjectLabel] = React.useState(getProjectLabel);

  React.useEffect(() => {
    setProjectLabel(getProjectLabel());
  }, [location.pathname]);

  const isProjectHome = location.pathname === '/';

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

  if (isProjectHome) {
    return <Outlet />;
  }

  const navItems = [
    { to: '/', icon: <FolderOpen size={18} />, label: 'Projects', end: true },
    { to: '/dashboard', icon: <Home size={18} />, label: 'Dashboard', end: true },
    { to: '/steel', icon: <Frame size={18} />, label: 'Steel Design' },
    { to: '/concrete', icon: <Layers size={18} />, label: 'Concrete Design' },
    { to: '/loads', icon: <Wind size={18} />, label: 'Loads' },
    { to: '/documents', icon: <FileText size={18} />, label: 'Documents' },
    { to: '/variables', icon: <Database size={18} />, label: 'Variables' },
    { to: '/settings', icon: <Settings size={18} />, label: 'Settings' },
  ];

  return (
    <div className="flex h-screen bg-white text-gray-800 font-sans relative">
      <DisclaimerModal />

      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-sm border"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        <Menu size={20} />
      </button>

      <div
        className={`fixed md:static inset-y-0 left-0 transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 transition duration-200 ease-in-out z-40 w-64 bg-gray-50 border-r border-gray-200 flex flex-col`}
      >
        <div className="p-6">
          <div className="flex items-center">
            <img src={simplifyStructLogo} alt="SimplifyStruct logo" className="h-9 max-w-[180px] rounded-sm bg-white object-contain" />
          </div>

          <div className="mt-4 rounded-lg border border-gray-200 bg-white p-3 text-sm">
            <div className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Current Project / Mode</div>
            <div className="mt-1 truncate font-semibold text-gray-900">{projectLabel}</div>
            <div className="mt-2 text-xs text-blue-600">Use Projects to open or create saved work.</div>
          </div>
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

      <div className="flex-1 overflow-auto">
        <main className="p-8 max-w-6xl mx-auto mt-10 md:mt-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
