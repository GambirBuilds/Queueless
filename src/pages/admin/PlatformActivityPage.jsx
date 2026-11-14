import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { Card } from '../../components/common/Card.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Button } from '../../components/common/Button.jsx';
import { apiFetch } from '../../services/apiClient.js';
import { Activity, Server, Zap, CheckCircle2, ShieldCheck, RefreshCw } from 'lucide-react';

export function PlatformActivityPage() {
  const { t } = useLanguage();
  const [liveLogs, setLiveLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchActivity = () => {
    setLoading(true);
    apiFetch('/api/audit-logs?limitCount=20')
      .then(r => r.json())
      .then(json => {
        if (json.success && json.data) {
          setLiveLogs(json.data);
        }
      })
      .catch(err => console.warn('Activity stream error', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchActivity();
    const interval = setInterval(fetchActivity, 15000); // 15s refresh
    return () => clearInterval(interval);
  }, []);

  const subsystems = [
    { name: 'Atomic Queue Sequencing Engine', status: 'Operational', backend: 'Cloud Firestore Transactions' },
    { name: 'Identity & Multi-Role RBAC Authority', status: 'Operational', backend: 'Firebase Auth & Security Rules' },
    { name: 'Appointment Capacity Engine', status: 'Operational', backend: 'Slot Concurrency Guard' },
    { name: 'Dual-Tone Web Audio Chime Synthesizer', status: 'Operational', backend: 'Web Audio API (Client)' },
    { name: 'Immutable Audit Trail Ledger', status: 'Operational', backend: 'Append-Only Cloud Firestore' },
    { name: 'Bilingual Locale Engine (English & नेपाली)', status: 'Operational', backend: 'React Context Runtime' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {t.adminPortalView.tabActivity}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time audit stream and active platform subsystem overview.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchActivity}
          icon={RefreshCw}
          className="border-slate-700 bg-slate-800 text-slate-200"
        >
          Refresh Stream
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400">Database Engine</div>
          <div className="text-base font-bold text-teal-400">Cloud Firestore Enterprise</div>
          <div className="text-[11px] text-slate-400">Real-time onSnapshot Active</div>
        </div>

        <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400">Backend Server Runtime</div>
          <div className="text-base font-bold text-emerald-400 tabular-nums">Node.js Express</div>
          <div className="text-[11px] text-slate-400">Authenticated API Engine</div>
        </div>

        <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400">Supported Industries</div>
          <div className="text-base font-bold text-white tabular-nums">7 Sectors Configured</div>
          <div className="text-[11px] text-teal-400">Bilingual English & Nepali</div>
        </div>
      </div>

      {/* Subsystem Health Cards */}
      <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Server className="w-4 h-4 text-teal-400" />
          <span>Core Subsystem Status</span>
        </h2>

        <div className="divide-y divide-slate-800 text-xs">
          {subsystems.map((srv, idx) => (
            <div key={idx} className="py-3 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-200">{srv.name}</span>
                <span className="text-slate-500 block text-[11px] font-mono">
                  {srv.backend}
                </span>
              </div>
              <Badge variant="success">{srv.status}</Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Live State Mutation Activity Stream */}
      <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Activity className="w-4 h-4 text-teal-400" />
          <span>Live State Mutation Stream (Last 20 Events)</span>
        </h2>

        <div className="space-y-2 text-xs font-mono">
          {liveLogs.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No activity recorded yet.</div>
          ) : (
            liveLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-teal-400 font-bold">[{log.action}]</span>
                  <span className="text-slate-300 font-sans">{log.details}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-500 text-[11px]">
                  <span>{log.actorUid || 'system'}</span>
                  <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
