import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { Card } from '../../components/common/Card.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Table } from '../../components/common/Table.jsx';
import { SearchInput } from '../../components/common/SearchInput.jsx';
import { Modal } from '../../components/common/Modal.jsx';
import { FormField } from '../../components/common/FormField.jsx';
import { apiFetch } from '../../services/apiClient.js';
import { Users2, Shield, Search, RefreshCw, UserCheck, UserX } from 'lucide-react';

const PAGE_SIZE = 15;

export function UserManagementPage() {
  const { t } = useLanguage();
  const { currentUser } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const [page, setPage] = useState(1);

  // Edit user modal
  const [editUserModal, setEditUserModal] = useState({
    isOpen: false,
    user: null,
    accountStatus: 'active',
    role: 'customer'
  });

  const fetchUsers = () => {
    setLoading(true);
    apiFetch('/api/admin/users')
      .then(r => r.json())
      .then(json => {
        if (json.success && json.data) {
          setUsers(json.data);
          setPage(1);
        } else if (json.error) {
          setFeedback(`Error: ${json.error}`);
        }
      })
      .catch(err => setFeedback(`Error: ${err.message}`))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenEdit = (user) => {
    setEditUserModal({
      isOpen: true,
      user,
      accountStatus: user.accountStatus || 'active',
      role: user.role || 'customer'
    });
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    const { user, accountStatus, role } = editUserModal;
    if (!user) return;

    try {
      const res = await apiFetch('/api/admin/users/update-status', {
        method: 'POST',
        body: JSON.stringify({
          userId: user.id || user.uid,
          accountStatus,
          role
        })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update user');

      setFeedback(`User ${user.email || user.fullName} updated successfully.`);
      setEditUserModal({ isOpen: false, user: null, accountStatus: 'active', role: 'customer' });
      fetchUsers();
    } catch (err) {
      setFeedback(`Error: ${err.message}`);
    }
  };

  const filtered = useMemo(() => {
    return users.filter(u => {
      if (roleFilter !== 'all' && (u.role || 'customer') !== roleFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          (u.fullName || '').toLowerCase().includes(q) ||
          (u.email || '').toLowerCase().includes(q) ||
          (u.role || '').toLowerCase().includes(q) ||
          (u.phone || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [users, searchTerm, roleFilter]);

  const columns = [
    {
      header: 'Citizen / User Identity',
      accessor: 'fullName',
      render: (row) => (
        <div>
          <div className="font-bold text-white text-xs">{row.fullName || 'Anonymous User'}</div>
          <div className="text-[11px] text-slate-400 font-mono">{row.email || row.phone || 'No email provided'}</div>
        </div>
      )
    },
    {
      header: 'System RBAC Role',
      accessor: 'role',
      render: (row) => {
        const role = row.role || 'customer';
        const isSuper = role === 'platform_admin';
        return (
          <span className={`font-mono text-[11px] px-2 py-0.5 rounded font-semibold ${
            isSuper ? 'bg-rose-950 text-rose-300 border border-rose-800' :
            role === 'organization_owner' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
            role === 'receptionist' || role === 'service_staff' ? 'bg-teal-950 text-teal-300 border border-teal-800' :
            'bg-slate-800 text-slate-300'
          }`}>
            {role.toUpperCase()}
          </span>
        );
      }
    },
    {
      header: 'Account Status',
      accessor: 'accountStatus',
      render: (row) => (
        <Badge variant={(row.accountStatus || 'active') === 'active' ? 'success' : 'danger'}>
          {row.accountStatus || 'active'}
        </Badge>
      )
    },
    {
      header: 'Created On',
      accessor: 'createdAt',
      render: (row) => (
        <span className="font-mono text-xs text-slate-400">
          {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : 'Active'}
        </span>
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
          onClick={() => handleOpenEdit(row)}
          className="border-slate-700 text-slate-300 hover:text-white"
        >
          Manage
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {t.adminPortalView.tabUsers}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Role-Based Access Control (RBAC) directory across system operators, staff, and citizens.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchUsers}
            icon={RefreshCw}
            className="border-slate-700 bg-slate-800 text-slate-200"
          >
            Refresh
          </Button>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
          >
            <option value="all">All Roles</option>
            <option value="customer">Customers / Citizens</option>
            <option value="organization_owner">Organization Owners</option>
            <option value="branch_manager">Branch Managers</option>
            <option value="receptionist">Receptionists</option>
            <option value="service_staff">Service Staff</option>
            <option value="platform_admin">Platform Administrators</option>
          </select>

          <div className="w-56 sm:w-64">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search email, name or role..."
            />
          </div>
        </div>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-xl bg-teal-950/80 border border-teal-800 text-xs text-teal-300 flex items-center justify-between">
          <span>{feedback}</span>
          <button type="button" onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">✕</button>
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
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} users
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

      {/* Edit User Modal */}
      <Modal
        isOpen={editUserModal.isOpen}
        onClose={() => setEditUserModal({ ...editUserModal, isOpen: false })}
        title="Manage User Account & RBAC Privileges"
        subtitle={editUserModal.user?.fullName || editUserModal.user?.email}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveUser} className="space-y-4 text-xs">
          <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
            <div className="text-slate-300 font-medium">User UID: {editUserModal.user?.id || editUserModal.user?.uid}</div>
            <div className="text-[11px] text-slate-500 font-mono">{editUserModal.user?.email || editUserModal.user?.phone}</div>
          </div>

          <FormField
            id="user-role"
            label="System RBAC Role"
            type="select"
            value={editUserModal.role}
            onChange={(e) => setEditUserModal({ ...editUserModal, role: e.target.value })}
            options={[
              { value: 'customer', label: 'Customer / Citizen' },
              { value: 'organization_owner', label: 'Organization Owner' },
              { value: 'branch_manager', label: 'Branch Manager' },
              { value: 'receptionist', label: 'Receptionist / Desk Operator' },
              { value: 'service_staff', label: 'Service Staff' },
              { value: 'platform_admin', label: 'Platform Administrator (Super Admin)' }
            ]}
          />

          <FormField
            id="user-status"
            label="Account Status"
            type="select"
            value={editUserModal.accountStatus}
            onChange={(e) => setEditUserModal({ ...editUserModal, accountStatus: e.target.value })}
            options={[
              { value: 'active', label: 'Active (Permitted to sign in)' },
              { value: 'suspended', label: 'Suspended (Access Revoked)' }
            ]}
          />

          <div className="pt-2 flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditUserModal({ ...editUserModal, isOpen: false })}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save User Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
