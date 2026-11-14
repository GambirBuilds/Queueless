import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { organizationService } from '../../services/organizationService.js';
import { Badge } from '../../components/common/Badge.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Table } from '../../components/common/Table.jsx';
import { Modal } from '../../components/common/Modal.jsx';
import { FormField } from '../../components/common/FormField.jsx';
import { Plus, Loader2 } from 'lucide-react';

export function StaffManagementPage() {
  const { t } = useLanguage();
  const { userProfile } = useAuth();

  const [orgId, setOrgId] = useState(userProfile?.organizationId || '');
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('receptionist');
  const [counter, setCounter] = useState('Desk #1');

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const orgs = await organizationService.getPublicDirectory();
        const targetOrgId = userProfile?.organizationId || orgs[0]?.id;
        if (!active || !targetOrgId) return;
        setOrgId(targetOrgId);
        const list = await organizationService.getStaff(targetOrgId);
        if (active) setStaffList(list);
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [userProfile?.organizationId]);

  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !orgId) return;

    setSaving(true);
    setError('');
    try {
      const created = await organizationService.createStaff(orgId, {
        name: name.trim(),
        email: email.trim(),
        role,
        branchId: userProfile?.branchId || '',
        counter: counter.trim() || 'Unassigned'
      });
      setStaffList(prev => [...prev, created]);
      setName('');
      setEmail('');
      setModalOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      header: 'Staff Member',
      accessor: 'name',
      render: (row) => (
        <div>
          <div className="font-bold text-slate-900">{row.name}</div>
          <div className="text-xs text-slate-500">{row.email}</div>
        </div>
      )
    },
    {
      header: 'Assigned Role',
      accessor: 'role',
      render: (row) => <span className="font-medium text-slate-800 text-xs uppercase">{String(row.role).replace('_', ' ')}</span>
    },
    {
      header: 'Terminal / Desk',
      accessor: 'counter',
      render: (row) => <span className="font-mono text-xs text-slate-600">{row.counter}</span>
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <Badge variant="success">{row.status || 'Active'}</Badge>
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {t.orgPortalView.staffManagement}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage organization staff members, roles, and counter station terminals.
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={() => setModalOpen(true)} icon={Plus}>
          {t.common.addStaff}
        </Button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-12 flex items-center justify-center text-slate-500 text-xs gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-teal-700" />
          <span>Loading organization staff roster...</span>
        </div>
      ) : staffList.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-500 bg-white border border-slate-200 rounded-xl">
          No staff members registered yet for this organization. Use "Add Staff Member" to record an operator assignment.
        </div>
      ) : (
        <Table columns={columns} data={staffList} keyField="id" />
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Staff Member"
        subtitle="Record personnel assignment in Cloud Firestore"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleAddStaff} className="space-y-4 text-xs">
          <FormField
            id="st-name"
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Maya Adhikari"
            required
          />
          <FormField
            id="st-email"
            label="Official Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="maya@organization.org"
            required
          />
          <FormField
            id="st-role"
            label="Assigned System Role"
            type="select"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            options={[
              { value: 'receptionist', label: 'Receptionist / Queue Operator' },
              { value: 'service_staff', label: 'Service Counter Officer' },
              { value: 'branch_manager', label: 'Branch Manager / Supervisor' }
            ]}
          />
          <FormField
            id="st-counter"
            label="Default Counter Desk"
            value={counter}
            onChange={(e) => setCounter(e.target.value)}
            placeholder="e.g. Desk #2"
          />

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="ghost" size="sm" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={saving}>
              {saving ? 'Saving...' : 'Save Staff Member'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
