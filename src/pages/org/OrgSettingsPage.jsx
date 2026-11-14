import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { organizationService } from '../../services/organizationService.js';
import { Card } from '../../components/common/Card.jsx';
import { FormField } from '../../components/common/FormField.jsx';
import { Button } from '../../components/common/Button.jsx';
import { CheckCircle2, AlertCircle, Bell, Clock, Loader2 } from 'lucide-react';

export function OrgSettingsPage() {
  const { t } = useLanguage();
  const { userProfile } = useAuth();

  const [orgId, setOrgId] = useState(userProfile?.organizationId || '');
  const [bufferTime, setBufferTime] = useState('5');
  const [maxAdvanceDays, setMaxAdvanceDays] = useState('7');
  const [smsNotificationOnCall, setSmsNotificationOnCall] = useState(false);
  const [audioChimeEnabled, setAudioChimeEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const list = await organizationService.getPublicDirectory();
        if (!active) return;
        const target = list.find(o => o.id === userProfile?.organizationId) || list[0];
        if (target) {
          const full = await organizationService.getOrganizationById(target.id);
          if (!active) return;
          setOrgId(target.id);
          const s = full?.operationalSettings;
          if (s) {
            setBufferTime(String(s.turnoverBufferMinutes ?? 5));
            setMaxAdvanceDays(String(s.maxAdvanceDays ?? 7));
            setSmsNotificationOnCall(Boolean(s.smsNotificationOnCall));
            setAudioChimeEnabled(s.audioChimeEnabled !== false);
          }
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [userProfile?.organizationId]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!orgId) return;
    setSaving(true);
    setError('');
    try {
      await organizationService.updateOrgSettings(orgId, {
        turnoverBufferMinutes: parseInt(bufferTime, 10) || 5,
        maxAdvanceDays: parseInt(maxAdvanceDays, 10) || 7,
        smsNotificationOnCall,
        audioChimeEnabled,
        autoRecallTimeoutMinutes: 3
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 flex items-center justify-center text-slate-500 text-xs gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-teal-700" />
        <span>Loading operational policy settings...</span>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Organization Operational Settings
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure queue cadence, lobby chime behavior, and appointment scheduling limits.
        </p>
      </div>

      {saved && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          <span>Operational settings saved to Cloud Firestore.</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-800">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="p-6 space-y-4">
          <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-700" />
            <span>Queue Cadence & Buffer Rules</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              id="buffer-mins"
              label="Counter Turnover Buffer (Minutes)"
              type="number"
              value={bufferTime}
              onChange={(e) => setBufferTime(e.target.value)}
              helperText="Rest period between consecutive ticket calls"
              required
            />

            <FormField
              id="max-days"
              label="Max Advance Appointment Booking (Days)"
              type="number"
              value={maxAdvanceDays}
              onChange={(e) => setMaxAdvanceDays(e.target.value)}
              helperText="How far ahead citizens can book slots"
              required
            />
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <Bell className="w-4 h-4 text-teal-700" />
            <span>Audio & Notification Triggers</span>
          </h3>

          <div className="space-y-3 text-xs">
            <label className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer">
              <div>
                <span className="font-semibold text-slate-900">SMS Notification When Turn is Approaching</span>
                <p className="text-slate-500 text-[11px]">Requires external SMS gateway keys configured on server</p>
              </div>
              <input
                type="checkbox"
                checked={smsNotificationOnCall}
                onChange={(e) => setSmsNotificationOnCall(e.target.checked)}
                className="w-4 h-4 text-teal-700 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer">
              <div>
                <span className="font-semibold text-slate-900">Audio Chime On Token Call</span>
                <p className="text-slate-500 text-[11px]">Play chime in lobby screen speakers on ticket call</p>
              </div>
              <input
                type="checkbox"
                checked={audioChimeEnabled}
                onChange={(e) => setAudioChimeEnabled(e.target.checked)}
                className="w-4 h-4 text-teal-700 rounded cursor-pointer"
              />
            </label>
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'Saving...' : t.common.save}
          </Button>
        </div>
      </form>
    </div>
  );
}
