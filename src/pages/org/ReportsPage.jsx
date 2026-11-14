import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { sampleOrganizations } from '../../data/sampleOrganizations.js';
import { Card } from '../../components/common/Card.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { apiFetch, downloadAuthenticatedCsv } from '../../services/apiClient.js';
import { BarChart3, Download, Calendar, Filter, CheckCircle2, Clock, RefreshCw } from 'lucide-react';

export function ReportsPage() {
  const { t } = useLanguage();
  const org = sampleOrganizations[0];

  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exported, setExported] = useState(false);

  const fetchOrgReports = () => {
    setLoading(true);
    apiFetch(`/api/admin/reports?orgId=${org.id}`)
      .then(r => r.json())
      .then(json => {
        if (json.success && json.data) {
          setReports(json.data);
        }
      })
      .catch(err => console.warn('Fetch org reports warning', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrgReports();
  }, []);

  const handleExport = async () => {
    setExported(true);
    try {
      await downloadAuthenticatedCsv(`/api/admin/reports/csv?orgId=${org.id}`, `${org.id}_report.csv`);
    } catch (err) {
      console.warn('Org CSV export error', err);
    } finally {
      setTimeout(() => setExported(false), 3500);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {t.orgPortalView.reports}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational metrics, customer throughput, and counter capacity reporting for {org.name}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchOrgReports}
            icon={RefreshCw}
          >
            Refresh Data
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleExport}
            icon={Download}
          >
            {t.reports.exportCsv}
          </Button>
        </div>
      </div>

      {exported && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          <span>Generating institutional CSV export from real Cloud Firestore records...</span>
        </div>
      )}

      {/* Period & Timezone Banner */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-teal-700" />
          <span>{t.reports.period}: <strong>{reports?.periodLabel || 'Last 30 Days (Rolling)'}</strong></span>
        </div>
        <div className="flex items-center gap-2 text-slate-500 font-mono">
          <Clock className="w-3.5 h-3.5 text-teal-700" />
          <span>{t.reports.nepalTime}</span>
        </div>
      </div>

      {/* Core Throughput Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 space-y-1">
          <div className="text-xs text-slate-500 font-medium">{t.reports.dailyServed}</div>
          <div className="text-3xl font-bold text-teal-800 tabular-nums">
            {reports?.dailyServed || 0}
          </div>
          <div className="text-[11px] text-slate-500">Citizens Completed Today</div>
        </Card>

        <Card className="p-5 space-y-1">
          <div className="text-xs text-slate-500 font-medium">{t.reports.weeklyServed}</div>
          <div className="text-3xl font-bold text-slate-900 tabular-nums">
            {reports?.weeklyServed || 0}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium">Last 7 Days Throughput</div>
        </Card>

        <Card className="p-5 space-y-1">
          <div className="text-xs text-slate-500 font-medium">{t.reports.monthlyServed}</div>
          <div className="text-3xl font-bold text-slate-900 tabular-nums">
            {reports?.monthlyServed || 0}
          </div>
          <div className="text-[11px] text-blue-700 font-medium">30-Day Rolling Total</div>
        </Card>

        <Card className="p-5 space-y-1">
          <div className="text-xs text-slate-500 font-medium">{t.reports.avgServiceTime}</div>
          <div className="text-3xl font-bold text-slate-900 tabular-nums">
            {reports?.avgServiceDuration != null ? (
              <>
                {reports.avgServiceDuration} <span className="text-sm font-normal text-slate-500">min</span>
              </>
            ) : (
              <span className="text-lg font-semibold text-slate-400">No timed data</span>
            )}
          </div>
          <div className="text-[11px] text-teal-700">
            {reports?.durationSampleCount ? `${reports.durationSampleCount} completed timed sessions` : 'Actual serving interval only'}
          </div>
        </Card>
      </div>

      {/* Completion & Dropout Rates */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 space-y-1 text-center">
          <div className="text-[11px] text-slate-500">{t.reports.completionRate}</div>
          <div className="text-2xl font-bold text-emerald-700 font-mono">
            {reports?.tokenCompletionRate || '0%'}
          </div>
        </Card>

        <Card className="p-4 space-y-1 text-center">
          <div className="text-[11px] text-slate-500">Appointment Completion</div>
          <div className="text-2xl font-bold text-teal-700 font-mono">
            {reports?.appointmentCompletionRate || '0%'}
          </div>
        </Card>

        <Card className="p-4 space-y-1 text-center">
          <div className="text-[11px] text-slate-500">{t.reports.cancelledTokens}</div>
          <div className="text-2xl font-bold text-rose-700 font-mono">
            {reports?.cancelledTokens || 0}
          </div>
        </Card>

        <Card className="p-4 space-y-1 text-center">
          <div className="text-[11px] text-slate-500">{t.reports.skippedTokens}</div>
          <div className="text-2xl font-bold text-amber-700 font-mono">
            {reports?.skippedTokens || 0}
          </div>
        </Card>
      </div>

      {/* Service & Counter Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 space-y-4">
          <h2 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Service Line Traffic Distribution
          </h2>

          <div className="divide-y divide-slate-100 text-xs">
            {reports?.serviceComparisons && reports.serviceComparisons.length > 0 ? (
              reports.serviceComparisons.map((s, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between">
                  <span className="font-semibold text-slate-900">{s.serviceName}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-emerald-700 font-semibold">{s.completed} served</span>
                    <span className="text-[11px] text-slate-400 font-mono">({s.total} total)</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-slate-400">No service traffic recorded.</div>
            )}
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Counter Desk Activity
          </h2>

          <div className="divide-y divide-slate-100 text-xs">
            {reports?.counterActivity && reports.counterActivity.length > 0 ? (
              reports.counterActivity.map((c, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between">
                  <span className="font-semibold text-slate-900">{c.counterName}</span>
                  <span className="font-mono text-teal-800 font-bold">{c.served} tokens handled</span>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-slate-400">No desk-specific traffic recorded.</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
