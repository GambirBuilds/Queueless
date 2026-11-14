import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useNavigation } from '../../context/NavigationContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { ProtectedPortalGate } from '../auth/ProtectedPortalGate.jsx';
import {
  ShieldAlert,
  CheckCircle,
  Users2,
  Building,
  Activity,
  FileText,
  Sliders,
  Globe,
  Home,
  LogOut,
  Menu,
  X
} from 'lucide-react';

export function AdminLayout({ children }) {
  const { language, setLanguage, t } = useLanguage();
  const { currentView, navigate } = useNavigation();
  const { currentUser } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const adminNav = [
    { id: 'admin-overview', label: t.adminPortalView.tabOverview, icon: ShieldAlert },
    { id: 'admin-organizations', label: t.adminPortalView.tabOrganizations, icon: Building },
    { id: 'admin-verification', label: t.adminPortalView.tabVerification, icon: CheckCircle },
    { id: 'admin-users', label: t.adminPortalView.tabUsers, icon: Users2 },
    { id: 'admin-branches', label: t.adminPortalView.tabBranches, icon: Building },
    { id: 'admin-queues', label: t.adminPortalView.tabQueues, icon: Activity },
    { id: 'admin-appointments', label: t.adminPortalView.tabAppointments, icon: CheckCircle },
    { id: 'admin-activity', label: t.adminPortalView.tabActivity, icon: Activity },
    { id: 'admin-audit', label: t.adminPortalView.tabAuditLogs, icon: FileText },
    { id: 'admin-reports', label: t.adminPortalView.tabReports, icon: FileText },
    { id: 'admin-settings', label: t.adminPortalView.tabSettings, icon: Sliders },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <div className="md:hidden bg-slate-950 p-4 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Toggle navigation menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-200"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <span className="font-bold text-sm text-teal-400">QUEUELESS Administration</span>
        </div>
        <button
          type="button"
          onClick={() => setLanguage(language === 'en' ? 'ne' : 'en')}
          className="text-xs bg-slate-800 px-2 py-1 rounded"
        >
          {language === 'en' ? 'नेपाली' : 'EN'}
        </button>
      </div>

      {/* Admin Sidebar */}
      <aside
        aria-label="Platform Administration Navigation"
        className={`${
          mobileMenuOpen ? 'block' : 'hidden'
        } md:block w-full md:w-64 bg-slate-950 border-r border-slate-800 flex flex-col shrink-0 md:sticky md:top-0 md:h-screen z-30`}
      >
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg text-white">QUEUELESS</span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
              Admin
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Platform Governance & Security</p>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {adminNav.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  navigate(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg text-left transition-colors ${
                  isActive
                    ? 'bg-teal-800 text-white font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 shrink-0 text-slate-400" />
                  <span>{item.label}</span>
                </div>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-2 text-xs text-slate-400">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setLanguage(language === 'en' ? 'ne' : 'en')}
              className="flex items-center gap-1.5 hover:text-white"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'नेपाली' : 'English'}</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('home')}
              className="flex items-center gap-1 hover:text-white"
            >
              <Home className="w-3 h-3" />
              <span>Public</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-900">
        <header className="hidden md:flex bg-slate-950/80 border-b border-slate-800 h-14 px-6 items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span>Admin Console</span>
            <span>/</span>
            <span className="text-slate-200 font-medium">
              {adminNav.find((n) => n.id === currentView)?.label || 'Overview'}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            {currentUser?.email && (
              <span className="text-[11px] font-mono text-slate-400">
                {currentUser.email}
              </span>
            )}
            <button
              type="button"
              onClick={() => navigate('home')}
              className="text-slate-400 hover:text-white flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Exit Admin</span>
            </button>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 flex-1 space-y-6 overflow-y-auto">
          <ProtectedPortalGate
            allowedRoles={['platform_admin']}
            portalTitle="Platform Administration"
            dark
          >
            {children}
          </ProtectedPortalGate>
        </main>
      </div>
    </div>
  );
}
