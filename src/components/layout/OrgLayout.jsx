import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useNavigation } from '../../context/NavigationContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { sampleOrganizations } from '../../data/sampleOrganizations.js';
import { ProtectedPortalGate } from '../auth/ProtectedPortalGate.jsx';
import {
  LayoutDashboard,
  MapPin,
  Layers,
  MonitorCheck,
  Users,
  Activity,
  CalendarDays,
  UserCheck,
  BarChart3,
  Globe,
  LogOut,
  ChevronDown,
  Menu,
  X,
  ShieldCheck,
  Home,
  Sliders
} from 'lucide-react';

export function OrgLayout({ children }) {
  const { language, setLanguage, t } = useLanguage();
  const { currentView, navigate } = useNavigation();
  const { currentUser, role } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const activeOrg = sampleOrganizations[0];
  const [selectedBranchId, setSelectedBranchId] = useState(activeOrg.branches[0].id);

  const navItems = [
    { id: 'org-dashboard', label: t.orgPortalView.dashboardTitle || 'Overview', icon: LayoutDashboard },
    { id: 'org-branches', label: t.orgPortalView.branchManagement, icon: MapPin },
    { id: 'org-services', label: t.orgPortalView.serviceManagement, icon: Layers },
    { id: 'org-counters', label: t.orgPortalView.counterManagement, icon: MonitorCheck },
    { id: 'org-staff', label: t.orgPortalView.staffManagement, icon: Users },
    { id: 'receptionist-queue', label: t.orgPortalView.queueManagement, icon: Activity },
    { id: 'org-appointments', label: t.orgPortalView.appointmentManagement, icon: CalendarDays },
    { id: 'org-customers', label: t.orgPortalView.customerManagement, icon: UserCheck },
    { id: 'org-reports', label: t.orgPortalView.reports, icon: BarChart3 },
    { id: 'org-settings', label: t.common.settings || 'Settings', icon: Sliders },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row text-slate-900">
      {/* Mobile Top Header */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-200"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <span className="font-bold tracking-tight text-base">QUEUELESS Org</span>
        </div>
        <button
          type="button"
          onClick={() => setLanguage(language === 'en' ? 'ne' : 'en')}
          className="text-xs bg-slate-800 px-2.5 py-1 rounded text-slate-300"
        >
          {language === 'en' ? 'नेपाली' : 'EN'}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        aria-label="Organization Portal Navigation"
        className={`${
          sidebarOpen ? 'block' : 'hidden'
        } md:block w-full md:w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 md:sticky md:top-0 md:h-screen z-30`}
      >
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white font-bold text-lg tracking-tight">
              QUEUELESS
            </span>
            <span className="text-[10px] font-mono uppercase bg-teal-950 text-teal-400 border border-teal-800/60 px-1.5 py-0.5 rounded">
              Org Portal
            </span>
          </div>

          <div className="bg-slate-800/80 rounded-lg p-2.5 border border-slate-700/60">
            <div className="text-[11px] font-semibold text-white truncate">
              {activeOrg.name}
            </div>
            <div className="text-[10px] text-teal-400 mt-0.5 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              <span>{activeOrg.industryName}</span>
            </div>
          </div>
        </div>

        <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/50">
          <label htmlFor="org-branch-select" className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            {t.orgPortalView.branchSelector}
          </label>
          <div className="relative">
            <select
              id="org-branch-select"
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-md py-1.5 px-2.5 text-xs text-white appearance-none focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
            >
              {activeOrg.branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  navigate(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg text-left transition-colors ${
                  isActive
                    ? 'bg-teal-700 text-white font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-800 space-y-2 bg-slate-950/60">
          <div className="flex items-center justify-between text-xs px-2 text-slate-400">
            <button
              type="button"
              onClick={() => setLanguage(language === 'en' ? 'ne' : 'en')}
              className="flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'नेपाली' : 'English'}</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('home')}
              title="Return to Public Site"
              className="flex items-center gap-1 hover:text-white transition-colors text-[11px]"
            >
              <Home className="w-3 h-3" />
              <span>Public</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="hidden md:flex bg-white border-b border-slate-200 h-14 px-6 items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span>QUEUELESS</span>
            <span>/</span>
            <span className="font-medium text-slate-800">
              {navItems.find((n) => n.id === currentView)?.label || 'Dashboard'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded">
              <strong>{activeOrg.name}</strong>{currentUser ? ` · ${role}` : ''}
            </div>
            <button
              type="button"
              onClick={() => navigate('home')}
              className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 px-2 py-1 rounded hover:bg-slate-100"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Exit Portal</span>
            </button>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 flex-1 space-y-6 overflow-y-auto">
          <ProtectedPortalGate
            allowedRoles={['organization_owner', 'branch_manager', 'receptionist', 'service_staff', 'platform_admin']}
            portalTitle="Organization & Staff Operations"
          >
            {children}
          </ProtectedPortalGate>
        </main>
      </div>
    </div>
  );
}
