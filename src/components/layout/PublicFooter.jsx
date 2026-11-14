import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useNavigation } from '../../context/NavigationContext.jsx';
import { Globe, Shield, Terminal, Copy, Check } from 'lucide-react';

export function PublicFooter() {
  const { language, setLanguage, t } = useLanguage();
  const { navigate } = useNavigation();
  const [copiedLocalUrl, setCopiedLocalUrl] = useState(false);

  const localDevUrl = 'http://localhost:3000';
  const activeOrigin = typeof window !== 'undefined' ? window.location.origin : localDevUrl;

  const handleCopyLocalUrl = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(localDevUrl);
        setCopiedLocalUrl(true);
        setTimeout(() => setCopiedLocalUrl(false), 2000);
      }
    } catch {
      // Clipboard unavailable in restricted browser context
    }
  };

  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-800">
          {/* Brand & Mission */}
          <div className="md:col-span-1 space-y-3">
            <div className="text-white text-lg font-bold tracking-tight">QUEUELESS</div>
            <p className="text-slate-400 text-xs leading-relaxed">
              {t.brandTagline}. Eliminating physical queues through modern digital token infrastructure across Nepal.
            </p>
            <div className="flex items-center gap-2 pt-1 text-slate-400">
              <Shield className="w-4 h-4 text-teal-400 shrink-0" />
              <span>Enterprise Ready Architecture</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-2.5">
            <h5 className="text-white font-semibold uppercase tracking-wider text-[11px]">
              Customer Experience
            </h5>
            <ul className="space-y-2">
              <li>
                <button
                  type="button"
                  onClick={() => navigate('discover')}
                  className="hover:text-white transition-colors"
                >
                  {t.nav.discover}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('customer-dashboard')}
                  className="hover:text-white transition-colors"
                >
                  {t.nav.customerPortal}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('customer-tokens')}
                  className="hover:text-white transition-colors"
                >
                  {t.nav.myTokens}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('customer-appointments')}
                  className="hover:text-white transition-colors"
                >
                  {t.nav.myAppointments}
                </button>
              </li>
            </ul>
          </div>

          {/* Organizations */}
          <div className="space-y-2.5">
            <h5 className="text-white font-semibold uppercase tracking-wider text-[11px]">
              Organizations
            </h5>
            <ul className="space-y-2">
              <li>
                <button
                  type="button"
                  onClick={() => navigate('org-dashboard')}
                  className="hover:text-white transition-colors"
                >
                  {t.orgPortalView.dashboardTitle}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('org-branches')}
                  className="hover:text-white transition-colors"
                >
                  {t.orgPortalView.branchManagement}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('org-services')}
                  className="hover:text-white transition-colors"
                >
                  {t.orgPortalView.serviceManagement}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('org-counters')}
                  className="hover:text-white transition-colors"
                >
                  {t.orgPortalView.counterManagement}
                </button>
              </li>
            </ul>
          </div>

          {/* Platform & Language */}
          <div className="space-y-2.5">
            <h5 className="text-white font-semibold uppercase tracking-wider text-[11px]">
              Platform & Governance
            </h5>
            <ul className="space-y-2">
              <li>
                <button
                  type="button"
                  onClick={() => navigate('admin-overview')}
                  className="hover:text-white transition-colors"
                >
                  {t.nav.platformAdmin}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('admin-audit')}
                  className="hover:text-white transition-colors"
                >
                  {t.adminPortalView.tabAuditLogs}
                </button>
              </li>
              <li className="pt-2">
                <button
                  type="button"
                  onClick={() => setLanguage(language === 'en' ? 'ne' : 'en')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>{language === 'en' ? 'Switch to नेपाली' : 'Switch to English'}</span>
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Development Information Section (Visible in Local/Dev Mode Only) */}
        {import.meta.env.DEV && (
          <div className="mt-6 p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Terminal className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="space-y-1">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-200">
                  Development Information
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400 font-mono">
                  <span>
                    Local URL:{' '}
                    <a
                      href={localDevUrl}
                      className="text-teal-400 hover:text-teal-300 underline underline-offset-2"
                    >
                      {localDevUrl}
                    </a>
                  </span>
                  <span>Host: 0.0.0.0:3000</span>
                  <span>Active Origin: {activeOrigin}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyLocalUrl}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-[11px] font-mono text-slate-200 hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
            >
              {copiedLocalUrl ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied localhost:3000</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-teal-400" />
                  <span>Copy {localDevUrl}</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Disclaimer & Copyright */}
        <div className="pt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-slate-500">
          <p className="max-w-2xl leading-relaxed text-[11px]">
            <strong className="text-slate-400">Platform Notice:</strong> QUEUELESS Digital Queue &amp; Appointment Platform — Cloud Firestore real-time synchronization, atomic token sequencing, and role-based access control enabled. Sample institutions are pre-seeded for onboarding demonstration.
          </p>
          <div className="shrink-0 text-[11px]">
            © {new Date().getFullYear()} QUEUELESS Platform. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
