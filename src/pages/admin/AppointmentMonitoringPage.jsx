import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { Table } from '../../components/common/Table.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Button } from '../../components/common/Button.jsx';
import { SearchInput } from '../../components/common/SearchInput.jsx';
import { apiFetch } from '../../services/apiClient.js';
import { Calendar, Clock, RefreshCw, FileText, CheckCircle2 } from 'lucide-react';

const PAGE_SIZE = 15;

export function AppointmentMonitoringPage() {
  const { t } = useLanguage();
  const [appointments, setAppointments] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchAppointments = () => {
    setLoading(true);
    apiFetch('/api/admin/appointments')
      .then(r => r.json())
      .then(json => {
        if (json.success && json.data) {
          setAppointments(json.data);
          setPage(1);
        }
      })
      .catch(err => console.warn('Fetch appointments error', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const filtered = useMemo(() => {
    return appointments.filter(a => {
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          (a.referenceCode || '').toLowerCase().includes(q) ||
          (a.customerName || '').toLowerCase().includes(q) ||
          (a.orgName || '').toLowerCase().includes(q) ||
          (a.serviceName || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [appointments, statusFilter, searchTerm]);

  const columns = [
    {
      header: 'Booking Ref',
      accessor: 'referenceCode',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-teal-400">
          {row.referenceCode}
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
      header: 'Service & Facility',
      accessor: 'serviceName',
      render: (row) => (
        <div>
          <div className="text-xs text-white font-medium">{row.serviceName}</div>
          <div className="text-[11px] text-slate-400">{row.orgName} · {row.branchName}</div>
        </div>
      )
    },
    {
      header: 'Appointment Schedule',
      accessor: 'appointmentDate',
      render: (row) => (
        <div>
          <div className="font-mono text-xs text-slate-200">{row.appointmentDate}</div>
          <div className="text-[11px] text-teal-300 font-mono">{row.timeSlot}</div>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <Badge variant={
          row.status === 'confirmed' ? 'teal' :
          row.status === 'completed' ? 'success' :
          row.status === 'rescheduled' || row.status === 'pending' ? 'warning' : 'danger'
        }>
          {row.status}
        </Badge>
      )
    },
    {
      header: 'Created On',
      accessor: 'createdAt',
      render: (row) => (
        <span className="font-mono text-xs text-slate-400">
          {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—'}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {t.adminPortalView.tabAppointments}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            System-wide scheduled booking registry with capacity validation and status tracking.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAppointments}
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
            <option value="all">All Appointments</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <div className="w-56 sm:w-64">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search ref #, citizen, org..."
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
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} appointments
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
