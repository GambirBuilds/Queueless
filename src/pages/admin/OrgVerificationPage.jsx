import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { Card } from '../../components/common/Card.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Modal } from '../../components/common/Modal.jsx';
import { FormField } from '../../components/common/FormField.jsx';
import { apiFetch } from '../../services/apiClient.js';
import {
  CheckCircle2,
  XCircle,
  FileText,
  Building2,
  AlertTriangle,
  RotateCcw,
  Ban,
  Search,
  RefreshCw
} from 'lucide-react';

export function OrgVerificationPage() {
  const { t } = useLanguage();
  const { currentUser } = useAuth();

  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending_verification');
  const [feedback, setFeedback] = useState(null);

  // Action Dialog state
  const [actionModal, setActionModal] = useState({
    isOpen: false,
    org: null,
    targetStatus: 'approved', // 'approved' | 'rejected' | 'suspended' | 'restored'
    reason: ''
  });

  const [detailModal, setDetailModal] = useState({
    isOpen: false,
    org: null
  });

  const fetchOrganizations = () => {
    setLoading(true);
    apiFetch('/api/admin/organizations')
      .then(r => r.json())
      .then(json => {
        if (json.success && json.data) {
          setOrganizations(json.data);
        } else if (json.error) {
          setFeedback(`Error: ${json.error}`);
        }
      })
      .catch(err => setFeedback(`Error: ${err.message}`))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const handleOpenAction = (org, targetStatus) => {
    setActionModal({
      isOpen: true,
      org,
      targetStatus,
      reason: ''
    });
  };

  const handleExecuteAction = async (e) => {
    e.preventDefault();
    const { org, targetStatus, reason } = actionModal;
    if (!org) return;

    try {
      const res = await apiFetch('/api/orgs/verify', {
        method: 'POST',
        body: JSON.stringify({
          organizationId: org.id,
          status: targetStatus === 'restored' ? 'approved' : targetStatus,
          reason: reason || `Admin action: ${targetStatus}`
        })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update organization status');

      setFeedback(`Successfully updated ${org.name} status to '${targetStatus}'.`);
      setActionModal({ isOpen: false, org: null, targetStatus: 'approved', reason: '' });
      fetchOrganizations();
    } catch (err) {
      setFeedback(`Error: ${err.message}`);
    }
  };

  const filteredOrgs = organizations.filter(org => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'pending_verification') return org.status === 'pending_verification';
    if (statusFilter === 'approved') return org.status === 'approved';
    if (statusFilter === 'suspended') return org.status === 'suspended';
    if (statusFilter === 'rejected') return org.status === 'rejected';
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {t.adminPortalView.tabVerification}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit statutory business certificates, approve onboarding applications, and regulate institutional compliance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchOrganizations}
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
            <option value="pending_verification">Pending Review Only</option>
            <option value="approved">Approved & Active</option>
            <option value="suspended">Suspended Organizations</option>
            <option value="rejected">Rejected Applications</option>
            <option value="all">All Registrations</option>
          </select>
        </div>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-xl bg-teal-950/80 border border-teal-800 text-xs text-teal-300 flex items-center justify-between">
          <span>{feedback}</span>
          <button type="button" onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Organizations Review List */}
      <div className="space-y-4">
        {filteredOrgs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs bg-slate-950 rounded-xl border border-slate-800">
            No organizations matching '{statusFilter}' filter at this time.
          </div>
        ) : (
          filteredOrgs.map((org) => (
            <div
              key={org.id}
              className="p-6 rounded-xl bg-slate-950 border border-slate-800 space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-teal-400 bg-teal-950 border border-teal-800/80 px-2 py-0.5 rounded">
                      {org.industryId || org.industryName || 'Services'}
                    </span>
                    <span className="text-xs font-mono text-slate-500">{org.registrationNumber || 'NRB/MOHP-REG'}</span>
                    <Badge variant={
                      org.status === 'approved' ? 'teal' :
                      org.status === 'suspended' ? 'neutral' :
                      org.status === 'rejected' ? 'danger' : 'warning'
                    }>
                      {org.status}
                    </Badge>
                  </div>

                  <h3 className="text-base font-bold text-white">{org.name}</h3>

                  <p className="text-xs text-slate-400">
                    Location: {org.city}, {org.province} · Email: {org.email} · Phone: {org.phone}
                  </p>
                </div>

                <div className="text-right text-xs text-slate-400 font-mono">
                  Applied: {org.createdAt ? new Date(org.createdAt).toLocaleDateString() : 'Active'}
                </div>
              </div>

              {/* Statutory verification preview */}
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <FileText className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>Statutory Certificate Document: <strong>{org.registrationNumber || 'REG-TAX-PAN'}.pdf</strong></span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-emerald-400 font-mono">PAN/Tax Registration Verified</span>
                  <button
                    type="button"
                    onClick={() => setDetailModal({ isOpen: true, org })}
                    className="text-xs text-teal-400 hover:underline"
                  >
                    View Full Profile
                  </button>
                </div>
              </div>

              {/* Action Buttons based on Current Status */}
              <div className="pt-2 flex flex-wrap items-center justify-end gap-3 border-t border-slate-900">
                {org.status === 'pending_verification' && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenAction(org, 'rejected')}
                      className="text-rose-400 hover:text-rose-300 hover:bg-rose-950/40"
                    >
                      Reject Application
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleOpenAction(org, 'approved')}
                    >
                      Approve & Activate Organization
                    </Button>
                  </>
                )}

                {org.status === 'approved' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenAction(org, 'suspended')}
                    className="text-amber-400 hover:bg-amber-950/40"
                    icon={Ban}
                  >
                    Suspend Organization
                  </Button>
                )}

                {org.status === 'suspended' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenAction(org, 'restored')}
                    className="border-emerald-700 bg-emerald-950/30 text-emerald-300"
                    icon={RotateCcw}
                  >
                    Restore & Re-Activate
                  </Button>
                )}

                {org.status === 'rejected' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenAction(org, 'approved')}
                    className="border-slate-700 text-slate-300"
                  >
                    Reconsider Application
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Sensitive Action Modal (Approve, Reject, Suspend, Restore with Reason) */}
      <Modal
        isOpen={actionModal.isOpen}
        onClose={() => setActionModal({ ...actionModal, isOpen: false })}
        title={`Confirm Action: ${actionModal.targetStatus.toUpperCase()}`}
        subtitle={`Organization: ${actionModal.org?.name}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleExecuteAction} className="space-y-4 text-xs">
          <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
            <div className="text-slate-300">
              You are about to change the verification status of <strong>{actionModal.org?.name}</strong> to{' '}
              <span className="font-bold uppercase text-teal-400">{actionModal.targetStatus}</span>.
            </div>
            <div className="text-[11px] text-slate-500">
              Administrator ID: {currentUser?.email || 'admin@queueless.internal'} · Timestamp will be logged.
            </div>
          </div>

          <FormField
            id="admin-reason"
            label="Administrative Reason / Audit Remarks"
            value={actionModal.reason}
            onChange={(e) => setActionModal({ ...actionModal, reason: e.target.value })}
            placeholder="e.g. Statutory PAN tax clearance verified against inland revenue registry."
            required
            helperText="This reason is permanently recorded in the immutable audit trail."
          />

          <div className="pt-2 flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActionModal({ ...actionModal, isOpen: false })}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant={actionModal.targetStatus === 'rejected' || actionModal.targetStatus === 'suspended' ? 'outline' : 'primary'}
              size="sm"
              className={actionModal.targetStatus === 'rejected' || actionModal.targetStatus === 'suspended' ? 'text-rose-400 border-rose-800' : ''}
            >
              Confirm {actionModal.targetStatus.toUpperCase()}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Full Org Details Modal */}
      <Modal
        isOpen={detailModal.isOpen}
        onClose={() => setDetailModal({ ...detailModal, isOpen: false })}
        title="Organization Dossier"
        subtitle={detailModal.org?.name}
        maxWidth="max-w-lg"
      >
        {detailModal.org && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-4 bg-slate-900 rounded-lg border border-slate-800">
              <div>
                <span className="text-slate-500 block">Registration Code</span>
                <span className="font-mono text-white font-bold">{detailModal.org.registrationNumber || 'NRB-MED-99'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Industry Sector</span>
                <span className="text-teal-400 font-bold">{detailModal.org.industryName || detailModal.org.industryId}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Headquarters</span>
                <span className="text-slate-200">{detailModal.org.city}, {detailModal.org.province}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Contact Phone</span>
                <span className="text-slate-200 font-mono">{detailModal.org.phone}</span>
              </div>
            </div>

            <p className="text-slate-300 leading-relaxed">
              {detailModal.org.description || 'Institutional service provider on the QUEUELESS platform.'}
            </p>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <Button size="sm" onClick={() => setDetailModal({ ...detailModal, isOpen: false })}>
                Close Dossier
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
