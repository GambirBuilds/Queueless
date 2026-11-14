import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { Table } from '../../components/common/Table.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Button } from '../../components/common/Button.jsx';
import { SearchInput } from '../../components/common/SearchInput.jsx';
import { apiFetch } from '../../services/apiClient.js';
import { Activity, Clock, RefreshCw, Users, AlertCircle } from 'lucide-react';

const PAGE_SIZE = 15;

export function QueueMonitoringPage() {
  const { t } = useLanguage();
  const [tokens, setTokens] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchTokens = () => {
    setLoading(true);
    apiFetch('/api/admin/queues')
      .then(r => r.json())
      .then(json => {
        if (json.success && json.data) {
          setTokens(json.data.tokens || []);
          setPage(1);
        }
      })
      .catch(err => console.warn('Fetch queues error', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTokens();
  }, []);

  const filtered = useMemo(() => {
    return tokens.filter(t => {
      if (statusFilter !== 'all' && (t.status || '').toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          (t.tokenNumber || '').toLowerCase().includes(q) ||
          (t.customerName || '').toLowerCase().includes(q) ||
          (t.orgName || '').toLowerCase().includes(q) ||
          (t.serviceName || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [tokens, statusFilter, searchTerm]);

  const columns = [
    {
      header: 'Token #',
      accessor: 'tokenNumber',
      render: (row) => (
        <span className="font-mono text-xs font-extrabold text-teal-400 bg-teal-950 px-2 py-0.5 rounded border border-teal-800">
          {row.tokenNumber}
        </span>
      )
    },
    {
      header: 'Citizen / Customer',
      accessor: 'customerName',
      render: (row) => (
        <div>
          <div className="font-bold text-white text-xs">{row.customerName}</div>
          <div className="text-[11px] text-slate-400 font-mono">{row.customerPhone}</div>
        </div>
      )
    },
    {
      header: 'Organization & Branch',
      accessor: 'orgName',
      render: (row) => (
        <div>
          <div className="text-xs text-slate-200 font-medium">{row.orgName || 'Hospital'}</div>
          <div className="text-[11px] text-slate-400">{row.branchName || 'Main Campus'}</div>
        </div>
      )
    },
    {
      header: 'Service Counter',
      accessor: 'serviceName',
      render: (row) => (
        <div>
          <div className="text-xs text-teal-300 font-semibold">{row.serviceName}</div>
          <div className="text-[11px] text-slate-400">{row.counterName || 'Awaiting Desk'}</div>
        </div>
      )
    },
    {
      header: 'Priority',
      accessor: 'priority',
      render: (row) => (
        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
          row.priority === 'Urgent' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
          row.priority === 'Senior Citizen' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
          'bg-slate-800 text-slate-300'
        }`}>
          {row.priority || 'Normal'}
        </span>
      )
    },
    {
      header: 'Pipeline Status',
      accessor: 'status',
      render: (row) => {
        const st = (row.status || '').toLowerCase();
        return (
          <Badge variant={
            st === 'serving' ? 'success' :
            st === 'called' ? 'teal' :
            st === 'waiting' ? 'warning' :
            st === 'completed' ? 'neutral' : 'danger'
          }>
            {row.status}
          </Badge>
        );
      }
    },
    {
      header: 'Issued At',
      accessor: 'issuedAt',
      render: (row) => (
        <span className="font-mono text-xs text-slate-400">
          {row.issuedAt ? new Date(row.issuedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {t.adminPortalView.tabQueues}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time cross-platform queue monitoring and token pipeline status.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTokens}
            icon={RefreshCw}
            className="border-slate-700 bg-slate-800 text-slate-200"
          >
            Refresh
          </Button>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
          >
            <option value="all">All Token Statuses</option>
            <option value="waiting">Waiting in Line</option>
            <option value="called">Called to Counter</option>
            <option value="serving">Currently Serving</option>
            <option value="completed">Completed Service</option>
            <option value="skipped">On-Hold / Skipped</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <div className="w-56 sm:w-64">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search token # or name..."
            />
          </div>
        </div>
      </div>

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
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} tokens
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
