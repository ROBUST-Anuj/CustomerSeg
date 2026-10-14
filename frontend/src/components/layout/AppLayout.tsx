import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BrainCircuit,
  Database,
  BarChart3,
  Megaphone,
  ShieldCheck,
  Settings,
  HelpCircle,
  Menu,
  X,
  LogOut,
  ChevronRight,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();

  const navItems = [
    { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Customers', path: '/customers', icon: Users },
    { name: 'Segmentation Studio', path: '/segmentation', icon: BrainCircuit, badge: 'AI/ML' },
    { name: 'Datasets', path: '/datasets', icon: Database },
    { name: 'Analytics & Reports', path: '/reports', icon: BarChart3 },
    { name: 'Campaigns', path: '/campaigns', icon: Megaphone },
    ...(isAdmin ? [{ name: 'Administration', path: '/admin', icon: ShieldCheck }] : []),
    { name: 'Settings', path: '/settings', icon: Settings },
    { name: 'Help & Documentation', path: '/help', icon: HelpCircle },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getPageTitle = () => {
    const item = navItems.find((n) => n.path === location.pathname);
    return item ? item.name : 'CustomerSeg Dashboard';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Topbar */}
      <div className="md:hidden bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-sm">
            CS
          </div>
          <span className="font-semibold text-lg tracking-tight">CustomerSeg</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-1.5 rounded-md text-slate-300 hover:text-white hover:bg-slate-800"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Sidebar for Desktop */}
      <aside
        className={`hidden md:flex flex-col bg-slate-900 border-r border-slate-800 text-slate-300 transition-all duration-300 z-30 ${
          collapsed ? 'w-20' : 'w-64'
        } min-h-screen select-none`}
      >
        {/* Brand header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
          <Link to="/" className="flex items-center space-x-3 overflow-hidden">
            <div className="h-9 w-9 min-w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center font-black text-white shadow-md">
              CS
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-white tracking-tight leading-tight text-base">CustomerSeg</span>
                <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">AI Segmentation</span>
              </div>
            )}
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Menu size={18} />
          </button>
        </div>

        {/* Academic Project Badge */}
        {!collapsed && (
          <div className="mx-3 mt-3 px-3 py-2 bg-slate-800/60 border border-slate-700/60 rounded-lg">
            <div className="flex items-center space-x-1.5 text-xs text-indigo-300 font-medium">
              <Sparkles size={13} />
              <span>IPS Academy Indore</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">Dept. of CSE (2026–27)</p>
          </div>
        )}

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
                title={collapsed ? item.name : undefined}
              >
                <Icon size={19} className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                {!collapsed && <span className="ml-3 truncate">{item.name}</span>}
                {!collapsed && item.badge && (
                  <span className="ml-auto text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User footer & Logout */}
        <div className="p-3 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="h-9 w-9 min-w-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-bold text-indigo-400">
                {user ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              {!collapsed && (
                <div className="flex flex-col truncate">
                  <span className="text-xs font-semibold text-white truncate">{user?.name || 'Guest User'}</span>
                  <span className="text-[11px] text-slate-400 capitalize">{user?.role || 'viewer'}</span>
                </div>
              )}
            </div>
            {!collapsed && (
              <button
                onClick={handleLogout}
                className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                title="Log out"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative w-72 bg-slate-900 border-r border-slate-800 text-white flex flex-col p-4 z-10">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold">CS</div>
                <span className="font-bold text-lg">CustomerSeg</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 py-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium ${
                      isActive ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Icon size={18} className="mr-3" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
              </div>
              <button onClick={handleLogout} className="p-2 text-rose-400 hover:bg-slate-800 rounded-lg">
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-slate-500">CustomerSeg</span>
            <ChevronRight size={14} className="text-slate-400" />
            <h1 className="text-base font-bold text-slate-800">{getPageTitle()}</h1>
          </div>

          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-semibold text-emerald-700 space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Services Operational</span>
            </div>

            <Link
              to="/"
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1"
            >
              <span>Landing Page</span>
              <ExternalLink size={12} />
            </Link>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
