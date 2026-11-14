import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { notificationService } from '../../services/notificationService.js';
import { Card } from '../../components/common/Card.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Bell, Check, MessageSquare, Mail, AlertTriangle, RefreshCw } from 'lucide-react';

export function NotificationCenter() {
  const { language, t } = useLanguage();
  const { currentUser, userProfile, updateProfile } = useAuth();

  const [smsEnabled, setSmsEnabled] = useState(Boolean(userProfile?.notificationPreferences?.sms));
  const [emailEnabled, setEmailEnabled] = useState(Boolean(userProfile?.notificationPreferences?.email));
  const [savingPrefs, setSavingPrefs] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [gatewayStatus, setGatewayStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setSmsEnabled(Boolean(userProfile?.notificationPreferences?.sms));
    setEmailEnabled(Boolean(userProfile?.notificationPreferences?.email));
  }, [userProfile?.notificationPreferences]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [notifs, status] = await Promise.all([
        currentUser?.uid ? notificationService.getUserNotifications(currentUser.uid) : Promise.resolve([]),
        notificationService.getProviderStatus()
      ]);
      setNotifications(notifs);
      setGatewayStatus(status);
    } catch (err) {
      setError(err.message || 'Unable to load notifications.');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const togglePreference = async (channel) => {
    const nextPrefs = {
      inApp: true,
      sms: channel === 'sms' ? !smsEnabled : smsEnabled,
      email: channel === 'email' ? !emailEnabled : emailEnabled
    };
    setSmsEnabled(nextPrefs.sms);
    setEmailEnabled(nextPrefs.email);
    setSavingPrefs(true);
    setError('');
    try {
      await updateProfile({ notificationPreferences: nextPrefs });
    } catch (err) {
      setError(err.message || 'Failed to save notification preference.');
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      setError(err.message || 'Unable to mark notification as read.');
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.read);
    try {
      await Promise.all(unread.map(n => notificationService.markAsRead(n.id)));
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      setError(err.message || 'Unable to mark notifications as read.');
    }
  };

  const smsConfigured = Boolean(gatewayStatus?.sms?.configured);
  const emailConfigured = Boolean(gatewayStatus?.email?.configured);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {t.nav.notifications}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'ne'
              ? 'तपाईंको लाइन घोषणा, अपोइन्टमेन्ट र प्रणाली सूचनाहरू।'
              : 'Real-time queue announcements, appointment reminders, and alerts.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={loadData}
            icon={RefreshCw}
          >
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            icon={Check}
            disabled={notifications.every(n => n.read)}
          >
            Mark all as read
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
          {error}
        </div>
      )}

      {/* Channel Availability Banner */}
      {gatewayStatus && (!smsConfigured || !emailConfigured) && (
        <Card className="p-4 border-amber-200 bg-amber-50/70 flex items-start gap-3 text-xs text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <div className="font-semibold">Notification Channel Availability</div>
            <p className="text-amber-800">
              In-App Notifications are <strong>ACTIVE</strong>.{' '}
              {!smsConfigured && `SMS Gateway (${gatewayStatus.sms?.provider}): ${gatewayStatus.sms?.status}. `}
              {!emailConfigured && `Email Gateway (${gatewayStatus.email?.provider}): ${gatewayStatus.email?.status}.`}
            </p>
          </div>
        </Card>
      )}

      {/* Notification Preferences */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            {t.customerPortalView.notificationPref}
          </h3>
          {savingPrefs && <span className="text-[11px] text-slate-400">Saving...</span>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-4 h-4 text-teal-700" />
              <div>
                <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <span>{t.customerPortalView.smsAlerts}</span>
                  <Badge variant={smsConfigured ? 'success' : 'neutral'}>
                    {smsConfigured ? 'Configured' : 'Gateway Unavailable'}
                  </Badge>
                </div>
                <div className="text-[11px] text-slate-500">
                  {userProfile?.phone ? `Target: ${userProfile.phone}` : 'Add phone number in profile'}
                </div>
              </div>
            </div>
            <button
              type="button"
              aria-label="Toggle SMS notification preference"
              onClick={() => togglePreference('sms')}
              className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                smsEnabled ? 'bg-teal-700 justify-end' : 'bg-slate-300 justify-start'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white shadow-xs" />
            </button>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-blue-700" />
              <div>
                <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <span>{t.customerPortalView.emailAlerts}</span>
                  <Badge variant={emailConfigured ? 'success' : 'neutral'}>
                    {emailConfigured ? 'Configured' : 'Gateway Unavailable'}
                  </Badge>
                </div>
                <div className="text-[11px] text-slate-500">
                  {currentUser?.email || userProfile?.email || 'No email on profile'}
                </div>
              </div>
            </div>
            <button
              type="button"
              aria-label="Toggle Email notification preference"
              onClick={() => togglePreference('email')}
              className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                emailEnabled ? 'bg-teal-700 justify-end' : 'bg-slate-300 justify-start'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white shadow-xs" />
            </button>
          </div>
        </div>
      </Card>

      {/* Notifications List */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
          Recent Activity ({notifications.length})
        </h3>

        {loading ? (
          <Card className="p-8 text-center text-xs text-slate-500">Loading notifications...</Card>
        ) : notifications.length === 0 ? (
          <Card className="p-8 text-center text-xs text-slate-400">
            No notifications recorded yet. Queue calls and appointment updates will appear here.
          </Card>
        ) : (
          notifications.map((n) => (
            <Card
              key={n.id}
              onClick={() => !n.read && handleMarkRead(n.id)}
              className={`p-4 flex items-start gap-4 transition-colors ${
                !n.read ? 'border-teal-300 bg-teal-50/20 cursor-pointer' : 'bg-white'
              }`}
            >
              <div className="p-2 rounded-lg bg-slate-100 text-slate-600 shrink-0 mt-0.5">
                <Bell className="w-4 h-4" />
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <span>Via {n.channel || 'In-App'}</span>
                  {!n.read && <Badge variant="teal">Unread</Badge>}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
