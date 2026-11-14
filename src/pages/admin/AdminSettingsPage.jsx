import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { Card } from '../../components/common/Card.jsx';
import { FormField } from '../../components/common/FormField.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { apiFetch } from '../../services/apiClient.js';
import { Sliders, CheckCircle2, Shield, Bell, AlertCircle, RefreshCw } from 'lucide-react';

export function AdminSettingsPage() {
  const { t } = useLanguage();

  const [settings, setSettings] = useState({
    platformName: 'QUEUELESS Digital Operations',
    defaultLanguage: 'en',
    primaryTimezone: 'Asia/Kathmandu',
    maintenanceMode: false,
    smsGateway: { provider: 'Sparrow SMS Nepal Gateway', status: 'UNAVAILABLE' },
    emailGateway: { provider: 'Transactional SMTP / SendGrid', status: 'UNAVAILABLE' },
    webPushGateway: { provider: 'Web Push (VAPID)', status: 'UNAVAILABLE' }
  });

  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchSettings = () => {
    setLoading(true);
    setErrorMsg('');
    apiFetch('/api/admin/settings')
      .then(r => r.json())
      .then(json => {
        if (json.success && json.data) {
          setSettings(json.data);
        } else if (json.error) {
          setErrorMsg(json.error);
        }
      })
      .catch(err => setErrorMsg(err.message || 'Failed to load settings.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const res = await apiFetch('/api/admin/settings', {
        method: 'POST',
        body: JSON.stringify({
          platformName: settings.platformName,
          defaultLanguage: settings.defaultLanguage,
          primaryTimezone: settings.primaryTimezone,
          maintenanceMode: settings.maintenanceMode
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to save platform settings.');
      if (json.data) setSettings(json.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3500);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save platform settings.');
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {t.adminPortalView.tabSettings}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure multi-tenant platform defaults, security policies, timezones, and communication gateways.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchSettings}
          icon={RefreshCw}
          className="border-slate-700 bg-slate-800 text-slate-200"
        >
          Reload
        </Button>
      </div>

      {saved && (
        <div className="p-3.5 rounded-xl bg-emerald-950 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Platform configuration updated and synchronized across all active workers.</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-950 border border-rose-800 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* General Settings */}
        <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
          <h2 className="text-xs font-semibold text-teal-400 uppercase tracking-wider">
            General Platform Governance
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Brand Identifier
              </label>
              <input
                type="text"
                value={settings.platformName}
                onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Default Bilingual Locale
              </label>
              <select
                value={settings.defaultLanguage}
                onChange={(e) => setSettings({ ...settings, defaultLanguage: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white"
              >
                <option value="en">English (Default)</option>
                <option value="ne">नेपाली (Nepali)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Default Institution Timezone
              </label>
              <select
                value={settings.primaryTimezone}
                onChange={(e) => setSettings({ ...settings, primaryTimezone: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white"
              >
                <option value="Asia/Kathmandu">Asia/Kathmandu (Nepal Standard Time, GMT+5:45)</option>
                <option value="Asia/Kolkata">Asia/Kolkata (IST, GMT+5:30)</option>
                <option value="Asia/Dhaka">Asia/Dhaka (BST, GMT+6:00)</option>
                <option value="UTC">UTC (Universal Coordinated Time)</option>
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                Used for sequence resets and appointment slots. Individual institutions may also configure localized branch timezones.
              </p>
            </div>
          </div>
        </div>

        {/* Telephony, SMS & Notification Gateways */}
        <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
          <h2 className="text-xs font-semibold text-teal-400 uppercase tracking-wider flex items-center gap-2">
            <Bell className="w-4 h-4" />
            <span>Communication Gateway & Dispatcher Status</span>
          </h2>

          <div className="space-y-3">
            <div className="p-4 bg-slate-900 rounded-lg border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div>
                <span className="font-bold text-white block">In-App Notification Center</span>
                <span className="text-slate-400 text-[11px]">Direct Firestore real-time customer event streaming</span>
              </div>
              <Badge variant="success">ACTIVE (Persistent)</Badge>
            </div>

            <div className="p-4 bg-slate-900 rounded-lg border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div>
                <span className="font-bold text-slate-200 block">SMS Gateway (Sparrow SMS / Nepal Telecom)</span>
                <span className="text-slate-400 text-[11px]">{settings.smsGateway?.status || 'UNAVAILABLE (Credentials not configured)'}</span>
              </div>
              <Badge variant={settings.smsGateway?.configured ? 'success' : 'neutral'}>
                {settings.smsGateway?.configured ? 'Configured' : 'Unconfigured (Safe Fallback)'}
              </Badge>
            </div>

            <div className="p-4 bg-slate-900 rounded-lg border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div>
                <span className="font-bold text-slate-200 block">Email Gateway (SendGrid / Transactional SMTP)</span>
                <span className="text-slate-400 text-[11px]">{settings.emailGateway?.status || 'UNAVAILABLE (Credentials not configured)'}</span>
              </div>
              <Badge variant={settings.emailGateway?.configured ? 'success' : 'neutral'}>
                {settings.emailGateway?.configured ? 'Configured' : 'Unconfigured (Safe Fallback)'}
              </Badge>
            </div>

            <div className="p-4 bg-slate-900 rounded-lg border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div>
                <span className="font-bold text-slate-200 block">Web Push Notifications (VAPID)</span>
                <span className="text-slate-400 text-[11px]">{settings.webPushGateway?.status || 'UNAVAILABLE'}</span>
              </div>
              <Badge variant={settings.webPushGateway?.configured ? 'success' : 'neutral'}>
                {settings.webPushGateway?.configured ? 'Configured' : 'Unconfigured (Safe Fallback)'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Security & Operational Controls */}
        <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
          <h2 className="text-xs font-semibold text-teal-400 uppercase tracking-wider flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span>Operational & Security Controls</span>
          </h2>

          <div className="flex items-center justify-between p-4 bg-slate-900 rounded-lg border border-slate-800">
            <div>
              <div className="text-xs font-bold text-white">Emergency Maintenance Mode</div>
              <div className="text-[11px] text-slate-400">
                Temporarily pause new customer digital queue token requests platform-wide.
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.maintenanceMode}
              onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
              className="w-4 h-4 text-teal-700 rounded cursor-pointer"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="submit" variant="primary">
            {t.common.save}
          </Button>
        </div>
      </form>
    </div>
  );
}
