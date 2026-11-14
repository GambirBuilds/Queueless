import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { industries } from '../../data/industries.js';
import { Table } from '../../components/common/Table.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Button } from '../../components/common/Button.jsx';
import { SearchInput } from '../../components/common/SearchInput.jsx';
import { Modal } from '../../components/common/Modal.jsx';
import { apiFetch } from '../../services/apiClient.js';
import { Building, MapPin, RefreshCw, Eye } from 'lucide-react';

export function OrgManagementPage() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);

  const [detailModal, setDetailModal] = useState({
    isOpen: false,
    org: null
  });

  const fetchOrgs = () => {
    setLoading(true);
    apiFetch('/api/admin/organizations')
      .then(r => r.json())
      .then(json => {
        if (json.success && json.data) {
          setOrganizations(json.data);
        }
      })
      .catch(err => console.warn('Fetch orgs warning', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrgs();
  }, []);

  const filtered = useMemo(() => {
    return organizations.filter((org) => {
      if (selectedIndustry !== 'all' && (org.industryId || org.industryName) !== selectedIndustry) {
        return false;
      }
      if (selectedStatus !== 'all' && org.status !== selectedStatus) {
        return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          (org.name || '').toLowerCase().includes(q) ||
          (org.city || '').toLowerCase().includes(q) ||
          (org.registrationNumber || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [organizations, searchTerm, selectedIndustry, selectedStatus]);

  const columns = [
    {
      header: 'Organization Name',
      accessor: 'name',
      render: (row) => (
        <div>
          <div className="font-bold text-white text-xs">{row.name}</div>
          <div className="text-[11px] font-mono text-slate-400">{row.registrationNumber || 'REG-PENDING'}</div>
        </div>
      )
    },
    {
      header: 'Industry Sector',
      accessor: 'industryName',
      render: (row) => (
        <span className="text-xs text-teal-400 font-medium">
          {row.industryName || row.industryId}
        </span>
      )
    },
    {
      header: 'Headquarters',
      accessor: 'city',
      render: (row) => <span className="text-xs text-slate-300">{row.city || 'Kathmandu'}, {row.province || 'Bagmati'}</span>
    },
    {
      header: 'Branches',
      accessor: 'branchCount',
      align: 'right',
      render: (row) => (
        <span className="font-mono text-xs text-slate-200 tabular-nums">
          {row.branchCount || (row.branches ? row.branches.length : 1)}
        </span>
      )
    },
    {
      header: 'Tokens Issued',
      accessor: 'totalTokensIssued',
      align: 'right',
      render: (row) => (
        <span className="font-mono text-xs text-teal-400 tabular-nums font-bold">
          {row.totalTokensIssued || 0}
        </span>
      )
    },
    {
      header: 'Compliance Status',
      accessor: 'status',
      render: (row) => (
        <Badge variant={
          row.status === 'approved' ? 'teal' :
          row.status === 'suspended' ? 'neutral' :
          row.status === 'rejected' ? 'danger' : 'warning'
        }>
          {row.status || 'Active'}
        </Badge>
      )
    },
    {
      header: 'Actions',
      accessor: 'id',
      align: 'right',
      render: (row) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setDetailModal({ isOpen: true, org: row })}
          icon={Eye}
          className="border-slate-700 text-slate-300 hover:text-white"
        >
          Details
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {t.adminPortalView.tabOrganizations}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Registry of all registered institutions across 7 sectors with live queue traffic.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchOrgs}
            icon={RefreshCw}
            className="border-slate-700 bg-slate-800 text-slate-200"
          >
            Refresh
          </Button>

          <select
            value={selectedIndustry}
            onChange={(e) => setSelectedIndustry(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
          >
            <option value="all">{t.common.allIndustries}</option>
            {industries.map((ind) => (
              <option key={ind.id} value={ind.id}>
                {ind.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
          >
            <option value="all">All Statuses</option>
            <option value="approved">Approved & Active</option>
            <option value="pending_verification">Pending Review</option>
            <option value="suspended">Suspended</option>
          </select>

          <div className="w-56 sm:w-64">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search name or location..."
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

      {/* Organization Details Modal */}
      <Modal
        isOpen={detailModal.isOpen}
        onClose={() => setDetailModal({ ...detailModal, isOpen: false })}
        title="Institution Overview"
        subtitle={detailModal.org?.name}
        maxWidth="max-w-lg"
      >
        {detailModal.org && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-4 bg-slate-900 rounded-lg border border-slate-800">
              <div>
                <span className="text-slate-500 block">Registration Code</span>
                <span className="font-mono text-white font-bold">{detailModal.org.registrationNumber || 'NRB-001'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Industry Sector</span>
                <span className="text-teal-400 font-bold">{detailModal.org.industryName || detailModal.org.industryId}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Branches</span>
                <span className="text-white font-bold">{detailModal.org.branchCount || 1} Registered</span>
              </div>
              <div>
                <span className="text-slate-500 block">Total Tokens Issued</span>
                <span className="text-emerald-400 font-mono font-bold">{detailModal.org.totalTokensIssued || 0}</span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 block font-semibold mb-1">Description</span>
              <p className="text-slate-300 leading-relaxed">
                {detailModal.org.description || 'Verified institutional service provider on the QUEUELESS platform.'}
              </p>
            </div>

            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex justify-between items-center">
              <div>
                <span className="text-slate-400 block">Contact Email</span>
                <span className="text-slate-200">{detailModal.org.email || 'contact@example.org'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Contact Phone</span>
                <span className="text-slate-200 font-mono">{detailModal.org.phone || '+977 1-4000000'}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button size="sm" onClick={() => setDetailModal({ ...detailModal, isOpen: false })}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
