import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { Card } from '../../components/common/Card.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Table } from '../../components/common/Table.jsx';
import { apiFetch, downloadAuthenticatedCsv } from '../../services/apiClient.js';
import {
  BarChart3,
  Download,
  Calendar,
  CheckCircle2,
  Clock,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Building
} from 'lucide-react';

export function PlatformReportsPage() {
  const { t } = useLanguage();
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadNotice, setDownloadNotice] = useState(false);

  const fetchReports = () => {
    setLoading(true);
    apiFetch('/api/admin/reports')
      .then(r => r.json())
      .then(json => {
        if (json.success && json.data) {
          setReports(json.data);
        }
      })
      .catch(err => console.warn('Fetch reports error', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleExportCsv = async () => {
    setDownloadNotice(true);
    try {
      await downloadAuthenticatedCsv('/api/admin/reports/csv', 'queueless_platform_report.csv');
    } catch (err) {
      console.warn('CSV export error', err);
    } finally {
      setTimeout(() => setDownloadNotice(false), 3500);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {t.adminPortalView.tabReports}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real persisted operational analytics, service throughput, and branch comparison benchmarks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchReports}
            icon={RefreshCw}
            className="border-slate-700 bg-slate-800 text-slate-200"
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleExportCsv}
            icon={Download}
          >
            Export Complete CSV Report
          </Button>
        </div>
      </div>

      {downloadNotice && (
        <div className="p-3.5 rounded-xl bg-teal-950 border border-teal-800 text-teal-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-teal-400" />
          <span>Generating and downloading CSV report from persistent Firestore records...</span>
        </div>
      )}

      {/* Reporting Period & Timezone Notice */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <Calendar className="w-4 h-4 text-teal-400" />
          <span>Reporting Window: <strong>{reports?.periodLabel || 'Last 30 Days (Rolling)'}</strong></span>
        </div>
        <div className="flex items-center gap-2 text-slate-400 font-mono">
          <Clock className="w-3.5 h-3.5 text-teal-400" />
          <span>Timezone: {reports?.timezone || 'Asia/Kathmandu (NPT)'}</span>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400 font-medium">{t.reports.dailyServed}</div>
          <div className="text-3xl font-bold text-teal-400 tabular-nums">
            {reports?.dailyServed || 0}
          </div>
          <div className="text-[11px] text-slate-400">Citizens Completed Today</div>
        </div>

        <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400 font-medium">{t.reports.weeklyServed}</div>
          <div className="text-3xl font-bold text-white tabular-nums">
            {reports?.weeklyServed || 0}
          </div>
          <div className="text-[11px] text-emerald-400 font-medium">Past 7 Days Throughput</div>
        </div>

        <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400 font-medium">{t.reports.monthlyServed}</div>
          <div className="text-3xl font-bold text-white tabular-nums">
            {reports?.monthlyServed || 0}
          </div>
          <div className="text-[11px] text-blue-400 font-medium">Monthly Served Total</div>
        </div>

        <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400 font-medium">{t.reports.avgServiceTime}</div>
          <div className="text-3xl font-bold text-white tabular-nums">
            {reports?.avgServiceDuration != null ? (
              <>
                {reports.avgServiceDuration} <span className="text-sm font-normal text-slate-400">min</span>
              </>
            ) : (
              <span className="text-lg font-semibold text-slate-400">No timed data</span>
            )}
          </div>
          <div className="text-[11px] text-teal-400">
            {reports?.durationSampleCount ? `${reports.durationSampleCount} completed timed sessions` : 'Actual serving interval only'}
          </div>
        </div>
      </div>

      {/* Secondary Rates Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-center">
          <div className="text-[11px] text-slate-400">{t.reports.completionRate}</div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            {reports?.tokenCompletionRate || '0%'}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-center">
          <div className="text-[11px] text-slate-400">Appointment Completion</div>
          <div className="text-2xl font-bold text-teal-400 font-mono">
            {reports?.appointmentCompletionRate || '0%'}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-center">
          <div className="text-[11px] text-slate-400">{t.reports.cancelledTokens}</div>
          <div className="text-2xl font-bold text-rose-400 font-mono">
            {reports?.cancelledTokens || 0}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-center">
          <div className="text-[11px] text-slate-400">{t.reports.skippedTokens}</div>
          <div className="text-2xl font-bold text-amber-400 font-mono">
            {reports?.skippedTokens || 0}
          </div>
        </div>
      </div>

      {/* Comparisons Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Branch Comparisons */}
        <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
          <h2 className="text-xs font-semibold text-teal-400 uppercase tracking-wider">
            Branch Traffic & Throughput Breakdown
          </h2>

          <div className="divide-y divide-slate-800 text-xs">
            {reports?.branchComparisons && reports.branchComparisons.length > 0 ? (
              reports.branchComparisons.map((b, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-white block">{b.branchName}</span>
                    <span className="text-slate-400 text-[11px]">{b.waiting || 0} currently waiting</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-emerald-400 font-bold">{b.completed || 0} completed</span>
                    <span className="text-[10px] text-slate-500 block">Total: {b.total}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-slate-500 text-center">No branch traffic recorded.</div>
            )}
          </div>
        </div>

        {/* Counter Activity */}
        <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
          <h2 className="text-xs font-semibold text-teal-400 uppercase tracking-wider">
            Counter Station Activity
          </h2>

          <div className="divide-y divide-slate-800 text-xs">
            {reports?.counterActivity && reports.counterActivity.length > 0 ? (
              reports.counterActivity.map((c, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between">
                  <span className="font-semibold text-slate-200">{c.counterName}</span>
                  <span className="font-mono text-teal-400 font-bold">{c.served} tokens handled</span>
                </div>
              ))
            ) : (
              <div className="p-4 text-slate-500 text-center">No desk-specific traffic recorded.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
