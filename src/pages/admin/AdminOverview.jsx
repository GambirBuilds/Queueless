import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useNavigation } from '../../context/NavigationContext.jsx';
import { Card } from '../../components/common/Card.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Table } from '../../components/common/Table.jsx';
import { apiFetch } from '../../services/apiClient.js';
import {
  ShieldAlert,
  Building,
  CheckCircle,
  Users2,
  Activity,
  ArrowRight,
  FileText,
  Clock,
  RefreshCw,
  GitPullRequest
} from 'lucide-react';

export function AdminOverview() {
  const { t } = useLanguage();
  const { navigate } = useNavigation();

  const [stats, setStats] = useState({
    totalRegisteredCustomers: 0,
    totalOrganizations: 0,
    pendingOrganizations: 0,
    approvedOrganizations: 0,
    suspendedOrganizations: 0,
    totalBranches: 0,
    activeQueues: 0,
    tokensIssued: 0,
    completedServices: 0,
    totalAppointments: 0,
    tokensByStatus: { waiting: 0, called: 0, serving: 0, completed: 0, skipped: 0, cancelled: 0 },
    systemHealth: 'Operational',
    timezone: 'Asia/Kathmandu (NPT)'
  });

  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchStats = () => {
    setLoading(true);
    setErrorMsg('');
    Promise.all([
      apiFetch('/api/admin/overview-stats').then(r => r.json()),
      apiFetch('/api/audit-logs?limitCount=5').then(r => r.json())
    ])
      .then(([statsRes, logsRes]) => {
        if (statsRes.success && statsRes.data) {
          setStats(statsRes.data);
        } else if (statsRes.error) {
          setErrorMsg(statsRes.error);
        }
        if (logsRes.success && logsRes.data) {
          setRecentLogs(logsRes.data);
        }
      })
      .catch(err => setErrorMsg(err.message || 'Failed to load platform metrics.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const auditColumns = [
    {
      header: 'Timestamp',
      accessor: 'timestamp',
      render: (row) => (
        <span className="font-mono text-xs text-slate-400">
          {new Date(row.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      )
    },
    {
      header: 'Actor & ID',
      accessor: 'actorUid',
      render: (row) => (
        <div>
          <div className="font-bold text-slate-200 text-xs">{row.actorEmail || row.actorUid}</div>
          <span className="text-[10px] text-teal-400 font-mono">{row.actorRole || 'System Actor'}</span>
        </div>
      )
    },
    {
      header: 'Action',
      accessor: 'action',
      render: (row) => (
        <span className="font-mono text-xs text-teal-300 font-medium">
          {row.action}
        </span>
      )
    },
    {
      header: 'Details',
      accessor: 'details',
      render: (row) => <span className="text-xs text-slate-400">{row.details}</span>
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {t.adminPortalView.overviewTitle}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real database-backed platform governance, compliance, and institutional metrics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStats}
            icon={RefreshCw}
            className="border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
          >
            Refresh Data
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('admin-verification')}
            className="border-amber-700/60 bg-amber-950/40 text-amber-300 hover:bg-amber-900/60"
          >
            Review Pending ({stats.pendingOrganizations})
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('admin-reports')}
          >
            {t.adminPortalView.tabReports}
          </Button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-950 border border-rose-800 text-xs text-rose-300">
          {errorMsg}
        </div>
      )}

      {/* Primary KPI Grid (All Database Backed) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="text-[11px] text-slate-400 font-medium">Total Organizations</div>
          <div className="text-2xl font-bold text-white tabular-nums">
            {stats.totalOrganizations}
          </div>
          <div className="text-[10px] text-teal-400">
            {stats.approvedOrganizations} Approved · {stats.suspendedOrganizations} Suspended
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="text-[11px] text-slate-400 font-medium">Pending Verification</div>
          <div className="text-2xl font-bold text-amber-400 tabular-nums">
            {stats.pendingOrganizations}
          </div>
          <div className="text-[10px] text-amber-500/80">Awaiting approval</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="text-[11px] text-slate-400 font-medium">Total Branches</div>
          <div className="text-2xl font-bold text-white tabular-nums">
            {stats.totalBranches}
          </div>
          <div className="text-[10px] text-slate-400">Across Nepal</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="text-[11px] text-slate-400 font-medium">Tokens Issued</div>
          <div className="text-2xl font-bold text-teal-400 tabular-nums">
            {stats.tokensIssued}
          </div>
          <div className="text-[10px] text-emerald-400">{stats.completedServices} Completed</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="text-[11px] text-slate-400 font-medium">Appointments Booked</div>
          <div className="text-2xl font-bold text-white tabular-nums">
            {stats.totalAppointments}
          </div>
          <div className="text-[10px] text-slate-400">Persisted Records</div>
        </div>
      </div>

      {/* Queue Token Pipeline Status */}
      <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-teal-400 uppercase tracking-wider">
            Live System-Wide Token Distribution
          </h2>
          <span className="text-[11px] font-mono text-slate-400">{stats.timezone}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
          <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-center">
            <div className="text-[10px] text-slate-400 uppercase">Waiting</div>
            <div className="text-xl font-bold text-amber-400 font-mono mt-0.5">
              {stats.tokensByStatus?.waiting || 0}
            </div>
          </div>
          <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-center">
            <div className="text-[10px] text-slate-400 uppercase">Called</div>
            <div className="text-xl font-bold text-teal-400 font-mono mt-0.5">
              {stats.tokensByStatus?.called || 0}
            </div>
          </div>
          <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-center">
            <div className="text-[10px] text-slate-400 uppercase">Serving</div>
            <div className="text-xl font-bold text-emerald-400 font-mono mt-0.5">
              {stats.tokensByStatus?.serving || 0}
            </div>
          </div>
          <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-center">
            <div className="text-[10px] text-slate-400 uppercase">Completed</div>
            <div className="text-xl font-bold text-blue-400 font-mono mt-0.5">
              {stats.tokensByStatus?.completed || 0}
            </div>
          </div>
          <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-center">
            <div className="text-[10px] text-slate-400 uppercase">On-Hold / Skipped</div>
            <div className="text-xl font-bold text-slate-400 font-mono mt-0.5">
              {stats.tokensByStatus?.skipped || 0}
            </div>
          </div>
          <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-center">
            <div className="text-[10px] text-slate-400 uppercase">Cancelled</div>
            <div className="text-xl font-bold text-rose-400 font-mono mt-0.5">
              {stats.tokensByStatus?.cancelled || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => navigate('admin-organizations')}
          className="p-5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer space-y-2"
        >
          <div className="flex items-center justify-between">
            <Building className="w-5 h-5 text-teal-400" />
            <ArrowRight className="w-4 h-4 text-slate-500" />
          </div>
          <h2 className="text-sm font-bold text-white">Organization Registry</h2>
          <p className="text-xs text-slate-400">
            View, search, and manage legal entities across Healthcare, Banking, and Government sectors.
          </p>
        </div>

        <div
          onClick={() => navigate('admin-queues')}
          className="p-5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer space-y-2"
        >
          <div className="flex items-center justify-between">
            <Activity className="w-5 h-5 text-emerald-400" />
            <ArrowRight className="w-4 h-4 text-slate-500" />
          </div>
          <h2 className="text-sm font-bold text-white">Live Queue Monitor</h2>
          <p className="text-xs text-slate-400">
            Monitor real-time token traffic and active queue bottlenecks across all branches.
          </p>
        </div>

        <div
          onClick={() => navigate('admin-reports')}
          className="p-5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer space-y-2"
        >
          <div className="flex items-center justify-between">
            <FileText className="w-5 h-5 text-blue-400" />
            <ArrowRight className="w-4 h-4 text-slate-500" />
          </div>
          <h2 className="text-sm font-bold text-white">Reports & CSV Export</h2>
          <p className="text-xs text-slate-400">
            Audited daily, weekly, and monthly customer throughput with real data export.
          </p>
        </div>
      </div>

      {/* Recent Platform Audit Entries */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-400" />
            <span>Recent Audited Events</span>
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('admin-audit')}
            className="text-slate-400 hover:text-white"
          >
            Full Audit Log
          </Button>
        </div>

        <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950">
          <Table
            columns={auditColumns}
            data={recentLogs}
            keyField="id"
            className="bg-slate-950 border-0"
          />
        </div>
      </div>
    </div>
  );
}
