import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { Table } from '../../components/common/Table.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { SearchInput } from '../../components/common/SearchInput.jsx';
import { Button } from '../../components/common/Button.jsx';
import { apiFetch, downloadAuthenticatedCsv } from '../../services/apiClient.js';
import { FileText, Download, ShieldCheck, RefreshCw } from 'lucide-react';

const PAGE_SIZE = 15;

export function AuditLogPage() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [exportErr, setExportErr] = useState('');

  const fetchLogs = () => {
    setLoading(true);
    apiFetch('/api/audit-logs?limitCount=150')
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) {
          setLogs(json.data);
          setPage(1);
        }
      })
      .catch(err => console.warn('Audit logs fetch warning', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleExportCsv = async () => {
    setExportErr('');
    try {
      await downloadAuthenticatedCsv('/api/admin/reports/csv', 'queueless_audit_report.csv');
    } catch (err) {
      setExportErr(err.message);
    }
  };

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      if (actionFilter !== 'all' && l.action !== actionFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          (l.actorUid || '').toLowerCase().includes(q) ||
          (l.actorEmail || '').toLowerCase().includes(q) ||
          (l.action || '').toLowerCase().includes(q) ||
          (l.entityType || '').toLowerCase().includes(q) ||
          (l.details || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [searchTerm, actionFilter, logs]);

  const uniqueActions = useMemo(() => {
    return Array.from(new Set(logs.map(l => l.action).filter(Boolean)));
  }, [logs]);

  const columns = [
    {
      header: 'Timestamp',
      accessor: 'timestamp',
      render: (row) => (
        <span className="font-mono text-xs text-slate-400">
          {row.timestamp ? new Date(row.timestamp).toLocaleString() : '—'}
        </span>
      )
    },
    {
      header: 'Actor UID / Email',
      accessor: 'actorUid',
      render: (row) => (
        <div>
          <div className="font-bold text-white text-xs">{row.actorEmail || row.actorUid || 'System Operator'}</div>
          <span className="text-[10px] text-teal-400 font-mono">Platform Entity</span>
        </div>
      )
    },
    {
      header: 'Audit Action',
      accessor: 'action',
      render: (row) => (
        <span className="font-mono text-xs text-teal-300 font-semibold">
          {row.action}
        </span>
      )
    },
    {
      header: 'Impacted Entity',
      accessor: 'entityType',
      render: (row) => (
        <div>
          <span className="text-xs text-slate-200 block">{row.entityType || 'Entity'}</span>
          <span className="text-[10px] font-mono text-slate-500">{row.entityId || ''}</span>
        </div>
      )
    },
    {
      header: 'Audit Trail Remarks',
      accessor: 'details',
      render: (row) => <span className="text-xs text-slate-400">{row.details}</span>
    },
    {
      header: 'Integrity',
      accessor: 'status',
      render: () => <Badge variant="success">Immutable</Badge>
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {t.adminPortalView.tabAuditLogs}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Immutable, append-only ledger of organizational state transitions and sensitive administrative mutations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLogs}
            icon={RefreshCw}
            className="border-slate-700 bg-slate-800 text-slate-200"
          >
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            icon={Download}
            className="border-teal-700/60 bg-teal-950/40 text-teal-300 hover:bg-teal-900/60"
          >
            Export Log CSV
          </Button>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
          >
            <option value="all">All Actions</option>
            {uniqueActions.map(action => (
              <option key={action} value={action}>{action}</option>
            ))}
          </select>

          <div className="w-56 sm:w-64">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search action, actor, or entity..."
            />
          </div>
        </div>
      </div>

      {exportErr && (
        <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-800 text-xs text-rose-300">
          {exportErr}
        </div>
      )}

      <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
        <Table
          columns={columns}
          data={filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)}
          keyField="id"
          className="bg-slate-950 border-0"
        />
        {filtered.length > PAGE_SIZE && (
          <div className="px-4 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} audit events
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="border-slate-700 text-slate-300">
                Prev
              </Button>
              <Button variant="outline" size="sm" disabled={page * PAGE_SIZE >= filtered.length} onClick={() => setPage(p => p + 1)} className="border-slate-700 text-slate-300">
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
