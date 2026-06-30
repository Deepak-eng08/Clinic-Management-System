import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../features/authSlice.js';
import { useTheme } from '../context/ThemeContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import {
  LayoutDashboard,
  Users,
  UserSquare2,
  Settings,
  Activity,
  CalendarDays,
  FileText,
  FolderOpen,
  CalendarCheck,
  Menu,
  X,
  LogOut,
  Sun,
  Moon,
  Stethoscope,
  Bell,
  User,
  HeartPulse
} from 'lucide-react';

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useSelector((state) => state.auth);
  const { darkMode, toggleDarkMode } = useTheme();
  const { toasts } = useSocket();
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login');
  };

  // Define Navigation based on role
  const getNavLinks = () => {
    switch (user?.role) {
      case 'admin':
        return [
          { name: 'Overview', path: '/admin', icon: LayoutDashboard },
          { name: 'Manage Doctors', path: '/admin/doctors', icon: UserSquare2 },
          { name: 'Manage Patients', path: '/admin/patients', icon: Users },
          { name: 'Clinic Settings', path: '/admin/settings', icon: Settings },
          { name: 'Audit Logs', path: '/admin/logs', icon: Activity },
        ];
      case 'doctor':
        return [
          { name: 'My Schedule', path: '/doctor', icon: LayoutDashboard },
          { name: 'Set Availability', path: '/doctor/availability', icon: CalendarDays },
          { name: 'My Patients', path: '/doctor/patients', icon: Users },
        ];
      case 'patient':
        return [
          { name: 'Find & Book', path: '/patient', icon: Stethoscope },
          { name: 'My Bookings', path: '/patient/appointments', icon: CalendarCheck },
          { name: 'Prescriptions', path: '/patient/prescriptions', icon: FileText },
          { name: 'Medical Folders', path: '/patient/records', icon: FolderOpen },
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-white border-r border-slate-200 dark:bg-slate-900 dark:border-slate-800/80 transition-transform duration-300 md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        {/* Brand Logo */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-100 dark:border-slate-800">
          <Link to="/" className="flex items-center gap-2 font-bold text-brand-600 dark:text-brand-400">
            <HeartPulse className="h-6 w-6 text-brand-500" />
            <span className="text-lg tracking-wide uppercase">Health Care </span>
          </Link>
          <button className="md:hidden text-slate-500 hover:text-slate-700" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800/50">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-950/40">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400">
              {user?.profileImage ? (
                <img src={user.profileImage} alt="User Avatar" className="h-full w-full rounded-full object-cover" />
              ) : (
                <User className="h-5 w-5" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold truncate text-slate-800 dark:text-slate-200">{user?.name}</h4>
              <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400 capitalize">
                {user?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Links */}
        <nav className="flex-1 space-y-1.5 px-4 py-4 overflow-y-auto">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3.5 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${isActive
                  ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-brand-500'
                  }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-brand-500'}`} />
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3.5 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/10 rounded-xl transition-all duration-200"
          >
            <LogOut className="h-5 w-5 text-red-400" />
            Logout Session
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden md:pl-64">
        {/* Top Navbar */}
        <header className="glass-nav flex h-16 items-center justify-between px-6 z-30">
          <div className="flex items-center gap-4">
            <button
              className="text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-100 md:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <h2 className="hidden sm:block text-sm font-medium text-slate-500 dark:text-slate-400">
              Welcome back, <span className="font-semibold text-slate-800 dark:text-slate-200">{user?.name}</span>
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Dark Mode Switcher */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800/60 dark:hover:bg-slate-700 dark:text-slate-300 transition-colors"
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* Notification Indicator badge */}
            <div className="relative">
              <button className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800/60 dark:hover:bg-slate-700 dark:text-slate-300 transition-colors">
                <Bell className="h-5 w-5" />
                {toasts.length > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-teal-500 animate-ping"></span>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Dynamic Pages Container */}
        <main className="flex-1 overflow-y-auto px-6 py-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
