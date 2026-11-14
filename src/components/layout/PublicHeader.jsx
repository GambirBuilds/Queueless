import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useNavigation } from '../../context/NavigationContext.jsx';
import { useAuthModal } from '../../context/AuthModalContext.jsx';
import { Button } from '../common/Button.jsx';
import { Globe, Menu, X, ArrowRight, User, Building2, Shield } from 'lucide-react';

export function PublicHeader() {
  const { language, setLanguage, t } = useLanguage();
  const { currentView, navigate } = useNavigation();
  const { openAuthModal } = useAuthModal();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ne' : 'en');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xs border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text element wordmark */}
          <button
            type="button"
            onClick={() => navigate('home')}
            className="flex items-center gap-2 text-left group focus-visible:outline-teal-700"
          >
            <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-teal-800 transition-colors whitespace-nowrap shrink-0">
              QUEUELESS
            </span>
            <span className="hidden sm:inline-block text-[10px] font-mono font-medium text-teal-800 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded">
              v4.0-PROD
            </span>
          </button>

          {/* Zone 2: Concise navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              type="button"
              onClick={() => navigate('discover')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
                currentView === 'discover' ? 'text-teal-800 font-semibold' : ''
              }`}
            >
              {t.nav.discover}
            </button>
            <button
              type="button"
              onClick={() => navigate('kiosk-display')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 text-teal-700 font-semibold ${
                currentView === 'kiosk-display' ? 'text-teal-900' : ''
              }`}
            >
              {t.displayScreen.openLobbyScreen}
            </button>
            <button
              type="button"
              onClick={() => navigate('org-dashboard')}
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 text-slate-600"
            >
              {t.nav.forOrganizations}
            </button>
            <button
              type="button"
              onClick={() => navigate('admin-overview')}
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 text-slate-500 hover:text-slate-800 text-xs"
            >
              {t.nav.platformAdmin}
            </button>
          </nav>

          {/* Zone 3: Language switch & Primary actions */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Language Switcher */}
            <button
              type="button"
              onClick={toggleLanguage}
              aria-label="Switch between English and Nepali language"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200 focus-visible:outline-teal-700"
            >
              <Globe className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
              <span className="uppercase">{language === 'en' ? 'नेपाली' : 'English'}</span>
            </button>

            {/* Sign in Modal trigger */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => openAuthModal('login', 'customer')}
              className="hidden sm:inline-flex"
            >
              {t.nav.login}
            </Button>

            {/* Primary Action */}
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('discover')}
            >
              {t.common.findService}
            </Button>

            {/* Mobile menu trigger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle mobile navigation menu"
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-3 shadow-lg">
          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => { navigate('discover'); setMobileMenuOpen(false); }}
              className="flex items-center justify-between p-2.5 rounded-lg text-sm font-medium text-slate-800 hover:bg-slate-50 text-left"
            >
              <span>{t.nav.discover}</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>
            <button
              type="button"
              onClick={() => { navigate('home'); setMobileMenuOpen(false); }}
              className="flex items-center justify-between p-2.5 rounded-lg text-sm font-medium text-slate-800 hover:bg-slate-50 text-left"
            >
              <span>{t.nav.howItWorks}</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>
            <button
              type="button"
              onClick={() => { navigate('customer-dashboard'); setMobileMenuOpen(false); }}
              className="flex items-center justify-between p-2.5 rounded-lg text-sm font-medium text-slate-800 hover:bg-slate-50 text-left"
            >
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-teal-700" />
                <span>{t.nav.customerPortal}</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>
            <button
              type="button"
              onClick={() => { navigate('org-dashboard'); setMobileMenuOpen(false); }}
              className="flex items-center justify-between p-2.5 rounded-lg text-sm font-medium text-slate-800 hover:bg-slate-50 text-left"
            >
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-700" />
                <span>{t.nav.orgPortal}</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>
            <button
              type="button"
              onClick={() => { navigate('admin-overview'); setMobileMenuOpen(false); }}
              className="flex items-center justify-between p-2.5 rounded-lg text-sm font-medium text-slate-800 hover:bg-slate-50 text-left"
            >
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-700" />
                <span>{t.nav.platformAdmin}</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { openAuthModal('login', 'customer'); setMobileMenuOpen(false); }}
              className="flex-1"
            >
              {t.nav.login}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => { openAuthModal('register', 'org'); setMobileMenuOpen(false); }}
              className="flex-1"
            >
              {t.nav.register}
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
