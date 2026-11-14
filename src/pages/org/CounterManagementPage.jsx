import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { organizationService } from '../../services/organizationService.js';
import { Card } from '../../components/common/Card.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Modal } from '../../components/common/Modal.jsx';
import { FormField } from '../../components/common/FormField.jsx';
import { Plus, Power, Loader2 } from 'lucide-react';

export function CounterManagementPage() {
  const { t } = useLanguage();
  const { userProfile } = useAuth();

  const [org, setOrg] = useState(null);
  const [selectedBranchId, setSelectedBranchId] = useState(userProfile?.branchId || '');
  const [counters, setCounters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const [counterNumber, setCounterNumber] = useState('');
  const [counterName, setCounterName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const list = await organizationService.getPublicDirectory();
        if (!active) return;
        const target = list.find(o => o.id === userProfile?.organizationId) || list[0];
        if (target) {
          setOrg(target);
          const branches = target.branches || [];
          const defaultBranch = branches.find(b => b.id === userProfile?.branchId) || branches[0];
          if (defaultBranch) {
            setSelectedBranchId(defaultBranch.id);
            setCounters((defaultBranch.counters || []).map(c => ({ ...c, status: c.status || 'Active' })));
          }
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [userProfile?.organizationId, userProfile?.branchId]);

  const branches = org?.branches || [];
  const activeBranch = branches.find(b => b.id === selectedBranchId) || branches[0];

  const handleBranchSwitch = (bId) => {
    setSelectedBranchId(bId);
    const branch = branches.find(b => b.id === bId);
    setCounters((branch?.counters || []).map(c => ({ ...c, status: c.status || 'Active' })));
  };

  const handleAddCounter = async (e) => {
    e.preventDefault();
    if (!counterNumber.trim() || !counterName.trim()) {
      setError('Please provide counter number and desk designation.');
      return;
    }
    if (!org?.id || !activeBranch?.id) {
      setError('Branch context unavailable.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const created = await organizationService.createCounter(org.id, {
        branchId: activeBranch.id,
        number: counterNumber.trim(),
        name: counterName.trim(),
        serviceIds: (org.services || []).slice(0, 1).map(s => s.id)
      });
      setCounters(prev => [...prev, created]);
      setCounterNumber('');
      setCounterName('');
      setModalOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (counter) => {
    if (!org?.id) return;
    const nextStatus = counter.status === 'Active' ? 'On Break' : 'Active';
    try {
      const updated = await organizationService.toggleCounterStatus(org.id, counter.id, nextStatus);
      setCounters(prev => prev.map(c => (c.id === counter.id ? { ...c, status: updated.status } : c)));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {t.orgPortalView.counterManagement}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage physical service desks and availability for{' '}
            <strong>{activeBranch?.name || 'selected branch'}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {branches.length > 1 && (
            <select
              value={selectedBranchId}
              onChange={(e) => handleBranchSwitch(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800"
            >
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          )}
          <Button variant="primary" size="sm" onClick={() => setModalOpen(true)} icon={Plus}>
            {t.common.addCounter}
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-12 flex items-center justify-center text-slate-500 text-xs gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-teal-700" />
          <span>Loading branch service counters...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {counters.map((c) => (
            <Card key={c.id} className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <span className="text-sm font-mono font-extrabold text-teal-800 bg-teal-50 px-3 py-1 rounded-md border border-teal-200">
                  Desk #{c.number}
                </span>
                <Badge variant={c.status === 'Active' ? 'success' : 'warning'}>
                  {c.status}
                </Badge>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">{c.name}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Assigned Services: {(c.serviceIds || []).length} categories
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => toggleStatus(c)}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer"
                >
                  <Power className="w-3.5 h-3.5 text-slate-400" />
                  <span>{c.status === 'Active' ? 'Set Break' : 'Set Active'}</span>
                </button>

                <span className="text-[11px] font-mono text-slate-400">{c.id}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create New Service Desk"
        subtitle="Persists physical counter desk assignment to Cloud Firestore"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleAddCounter} className="space-y-4 text-xs">
          <FormField
            id="c-num"
            label="Counter Number / Code"
            value={counterNumber}
            onChange={(e) => setCounterNumber(e.target.value)}
            placeholder="e.g. 6 or Express-1"
            required
          />
          <FormField
            id="c-name"
            label="Desk Designation / Signage Name"
            value={counterName}
            onChange={(e) => setCounterName(e.target.value)}
            placeholder="e.g. Special Priority & Senior Citizen Desk"
            required
          />

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="ghost" size="sm" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={saving}>
              {saving ? 'Saving...' : 'Save Counter'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
