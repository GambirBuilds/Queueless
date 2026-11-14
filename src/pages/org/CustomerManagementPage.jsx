import React, { useState, useMemo, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config.js';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Table } from '../../components/common/Table.jsx';
import { Modal } from '../../components/common/Modal.jsx';
import { SearchInput } from '../../components/common/SearchInput.jsx';
import { Ticket, Calendar } from 'lucide-react';

export function CustomerManagementPage() {
  const { t } = useLanguage();
  const { userProfile } = useAuth();
  const orgId = userProfile?.organizationId || 'org-health-01';

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    Promise.all([
      getDocs(query(collection(db, 'queueTokens'), where('organizationId', '==', orgId))),
      getDocs(query(collection(db, 'appointments'), where('organizationId', '==', orgId)))
    ]).then(([tokensSnap, aptsSnap]) => {
      if (!mounted) return;
      const map = new Map();

      const ensureEntry = (key, record) => {
        if (!map.has(key)) {
          map.set(key, {
            id: key,
            name: record.customerName || 'Citizen',
            phone: record.customerPhone || '—',
            email: record.customerEmail || '—',
            lastVisited: record.issuedAt || record.createdAt || '',
            totalTokens: 0,
            queueHistory: [],
            appointmentHistory: []
          });
        }
        return map.get(key);
      };

      tokensSnap.docs.forEach(d => {
        const tok = d.data();
        const key = tok.customerUid || tok.customerPhone || d.id;
        const entry = ensureEntry(key, tok);
        entry.totalTokens += 1;
        if (tok.issuedAt && (!entry.lastVisited || tok.issuedAt > entry.lastVisited)) {
          entry.lastVisited = tok.issuedAt;
        }
        entry.queueHistory.push({
          token: tok.tokenNumber,
          service: tok.serviceName,
          date: tok.issuedAt ? new Date(tok.issuedAt).toLocaleDateString() : '',
          status: tok.status || 'waiting'
        });
      });

      aptsSnap.docs.forEach(d => {
        const apt = d.data();
        const key = apt.customerId || apt.customerPhone || d.id;
        const entry = ensureEntry(key, apt);
        if (apt.customerEmail && entry.email === '—') entry.email = apt.customerEmail;
        entry.appointmentHistory.push({
          reference: apt.referenceCode || d.id,
          service: apt.serviceName,
          date: apt.appointmentDate || '',
          status: apt.status || 'confirmed'
        });
      });

      setCustomers(Array.from(map.values()));
      setLoading(false);
    }).catch(() => {
      if (mounted) setLoading(false);
    });

    return () => { mounted = false; };
  }, [orgId]);

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return customers;
    const q = searchTerm.toLowerCase();
    return customers.filter(
      (c) => String(c.name).toLowerCase().includes(q) ||
        String(c.phone).includes(q) ||
        String(c.email).toLowerCase().includes(q)
    );
  }, [customers, searchTerm]);

  const columns = [
    {
      header: 'Customer Name',
      accessor: 'name',
      render: (row) => (
        <div>
          <div className="font-bold text-slate-900">{row.name}</div>
          <div className="text-xs text-slate-500">{row.email}</div>
        </div>
      )
    },
    {
      header: 'Mobile Phone',
      accessor: 'phone',
      render: (row) => <span className="font-mono text-xs text-slate-700">{row.phone}</span>
    },
    {
      header: 'Last Activity',
      accessor: 'lastVisited',
      render: (row) => (
        <span className="text-xs text-slate-600">
          {row.lastVisited ? new Date(row.lastVisited).toLocaleDateString() : '—'}
        </span>
      )
    },
    {
      header: 'Tokens Handled',
      accessor: 'totalTokens',
      align: 'right',
      render: (row) => (
        <span className="font-mono font-bold text-slate-900">{row.totalTokens}</span>
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
          onClick={() => setSelectedCustomer(row)}
        >
          View Record
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {t.orgPortalView.customerManagement}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tenant-scoped customer visit records derived from your organization tokens and appointments.
          </p>
        </div>

        <div className="w-full sm:w-72">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search customer name or phone..."
          />
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200">
          Loading organization customer records...
        </div>
      ) : (
        <Table
          columns={columns}
          data={filtered}
          keyField="id"
        />
      )}

      {/* Customer Record & History Modal */}
      <Modal
        isOpen={Boolean(selectedCustomer)}
        onClose={() => setSelectedCustomer(null)}
        title="Customer Record & History"
        subtitle={`ID: ${selectedCustomer?.id}`}
        maxWidth="max-w-lg"
      >
        {selectedCustomer && (
          <div className="space-y-5 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl space-y-2 border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500">Customer Name:</span>
                <span className="font-bold text-slate-900 text-sm">{selectedCustomer.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Contact Telephone:</span>
                <span className="font-mono text-slate-800">{selectedCustomer.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email Address:</span>
                <span className="text-slate-800">{selectedCustomer.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Tokens at Facility:</span>
                <span className="font-bold text-teal-800">{selectedCustomer.totalTokens}</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Ticket className="w-3.5 h-3.5 text-teal-700" />
                <span>Queue Token History ({selectedCustomer.queueHistory.length})</span>
              </span>

              {selectedCustomer.queueHistory.length === 0 ? (
                <div className="p-4 text-center text-slate-400 bg-slate-50 rounded-lg">
                  No queue tokens recorded.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                  {selectedCustomer.queueHistory.map((q, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between">
                      <div>
                        <span className="font-mono font-bold text-slate-900 mr-2">{q.token}</span>
                        <span className="text-slate-700">{q.service}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 text-[11px] font-mono">{q.date}</span>
                        <Badge variant={String(q.status).toLowerCase() === 'completed' ? 'success' : 'neutral'}>
                          {String(q.status).toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-700" />
                <span>Appointment Booking History ({selectedCustomer.appointmentHistory.length})</span>
              </span>

              {selectedCustomer.appointmentHistory.length === 0 ? (
                <div className="p-4 text-center text-slate-400 bg-slate-50 rounded-lg">
                  No appointment bookings recorded.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                  {selectedCustomer.appointmentHistory.map((a, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between">
                      <div>
                        <span className="font-mono text-slate-500 mr-2">{a.reference}</span>
                        <span className="text-slate-700 font-medium">{a.service}</span>
                      </div>
                      <Badge variant="info">{String(a.status).toUpperCase()}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
