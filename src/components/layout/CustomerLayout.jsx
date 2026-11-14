import React from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useNavigation } from '../../context/NavigationContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { ProtectedPortalGate } from '../auth/ProtectedPortalGate.jsx';
import {
  LayoutDashboard,
  Ticket,
  Calendar,
  Bell,
  Settings,
  ArrowLeft,
  Globe,
  Search,
  LogOut
} from 'lucide-react';

export function CustomerLayout({ children }) {
  const { language, setLanguage, t } = useLanguage();
  const { currentView, navigate } = useNavigation();
  const { currentUser, userProfile, logout } = useAuth();

  const displayName = userProfile?.fullName || currentUser?.displayName || currentUser?.email || 'QUEUELESS Member';
  const displayContact = userProfile?.phone || currentUser?.email || '';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'QL';

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.warn('Logout error', e);
    }
    navigate('home');
  };

  const navItems = [
    { id: 'customer-dashboard', label: t.nav.dashboard, icon: LayoutDashboard },
    { id: 'customer-tokens', label: t.nav.myTokens, icon: Ticket },
    { id: 'customer-appointments', label: t.nav.myAppointments, icon: Calendar },
    { id: 'customer-notifications', label: t.nav.notifications, icon: Bell },
    { id: 'customer-settings', label: t.nav.profileSettings, icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      {/* Top Customer Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={() => navigate('home')}
                className="flex items-center gap-2 group"
              >
                <span className="text-lg font-bold tracking-tight text-slate-900">
                  QUEUELESS
                </span>
                <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                  {t.customerPortalView.welcome}
                </span>
              </button>

              <button
                type="button"
                onClick={() => navigate('discover')}
                className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-teal-800 transition-colors"
              >
                <Search className="w-3.5 h-3.5" />
                <span>{t.nav.discover}</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setLanguage(language === 'en' ? 'ne' : 'en')}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                aria-label="Toggle language"
              >
                <Globe className="w-3 h-3" />
                <span>{language === 'en' ? 'नेपाली' : 'EN'}</span>
              </button>

              {currentUser && (
                <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                  <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center text-xs font-semibold">
                    {initials}
                  </div>
                  <div className="hidden md:block text-left">
                    <div className="text-xs font-semibold text-slate-900 truncate max-w-36">{displayName}</div>
                    {displayContact && (
                      <div className="text-[10px] text-slate-500 truncate max-w-36">{displayContact}</div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    title={t.nav.logout}
                    aria-label={t.nav.logout}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <nav aria-label="Customer Portal Navigation" className="flex items-center gap-2 overflow-x-auto py-2 border-t border-slate-100 no-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(item.id)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <ProtectedPortalGate portalTitle="Customer Portal">
          {children}
        </ProtectedPortalGate>
      </main>

      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>QUEUELESS Digital Queue & Appointment Platform</span>
          <button
            type="button"
            onClick={() => navigate('discover')}
            className="text-teal-700 hover:underline inline-flex items-center gap-1 text-xs"
          >
            <span>{t.common.findService}</span>
            <ArrowLeft className="w-3 h-3 rotate-180" />
          </button>
        </div>
      </footer>
    </div>
  );
}
