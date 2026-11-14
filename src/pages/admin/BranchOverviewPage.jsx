import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { Table } from '../../components/common/Table.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Button } from '../../components/common/Button.jsx';
import { SearchInput } from '../../components/common/SearchInput.jsx';
import { apiFetch } from '../../services/apiClient.js';
import { GitBranch, MapPin, RefreshCw, Users, MonitorCheck } from 'lucide-react';

export function BranchOverviewPage() {
  const { t } = useLanguage();
  const [branches, setBranches] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchBranches = () => {
    setLoading(true);
    apiFetch('/api/admin/branches')
      .then(r => r.json())
      .then(json => {
        if (json.success && json.data) {
          setBranches(json.data);
        }
      })
      .catch(err => console.warn('Fetch branches error', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return branches;
    const q = searchTerm.toLowerCase();
    return branches.filter(b =>
      (b.name || '').toLowerCase().includes(q) ||
      (b.city || '').toLowerCase().includes(q) ||
      (b.address || '').toLowerCase().includes(q)
    );
  }, [branches, searchTerm]);

  const columns = [
    {
      header: 'Branch Facility',
      accessor: 'name',
      render: (row) => (
        <div>
          <div className="font-bold text-white text-xs">{row.name}</div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-slate-500" />
            <span>{row.address || 'Central Campus'}, {row.city || 'Kathmandu'}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Contact & Phone',
      accessor: 'phone',
      render: (row) => (
        <span className="font-mono text-xs text-slate-300">
          {row.phone || '+977 1-4000000'}
        </span>
      )
    },
    {
      header: 'Counters',
      accessor: 'counterCount',
      align: 'right',
      render: (row) => (
        <span className="font-mono text-xs text-slate-200 tabular-nums">
          {row.counterCount ?? (row.counters ? row.counters.length : 0)} Desks
        </span>
      )
    },
    {
      header: 'Waiting Citizens',
      accessor: 'waitingCount',
      align: 'right',
      render: (row) => (
        <span className="font-mono text-xs text-amber-400 tabular-nums font-bold">
          {row.waitingCount || 0}
        </span>
      )
    },
    {
      header: 'Serving Now',
      accessor: 'servingCount',
      align: 'right',
      render: (row) => (
        <span className="font-mono text-xs text-emerald-400 tabular-nums font-bold">
          {row.servingCount || 0}
        </span>
      )
    },
    {
      header: 'Completed Today',
      accessor: 'completedCount',
      align: 'right',
      render: (row) => (
        <span className="font-mono text-xs text-teal-400 tabular-nums font-bold">
          {row.completedCount || 0}
        </span>
      )
    },
    {
      header: 'Operating Status',
      accessor: 'isOperating',
      render: () => <Badge variant="teal">Operational</Badge>
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {t.adminPortalView.tabBranches}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Cross-organization branch oversight, physical desk capacity, and active queue loads.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchBranches}
            icon={RefreshCw}
            className="border-slate-700 bg-slate-800 text-slate-200"
          >
            Refresh
          </Button>

          <div className="w-64">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search branch or city..."
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
        <Table
          columns={columns}
          data={filtered}
          keyField="id"
          className="bg-slate-950 border-0"
        />
      </div>
    </div>
  );
}
