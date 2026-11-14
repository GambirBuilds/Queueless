import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { organizationService } from '../../services/organizationService.js';
import { Card } from '../../components/common/Card.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Modal } from '../../components/common/Modal.jsx';
import { FormField } from '../../components/common/FormField.jsx';
import { MapPin, Clock, Phone, Plus, Loader2 } from 'lucide-react';

export function BranchManagementPage() {
  const { t } = useLanguage();
  const { userProfile } = useAuth();

  const [orgId, setOrgId] = useState(userProfile?.organizationId || '');
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const [branchName, setBranchName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [hours, setHours] = useState('Sun - Fri: 09:00 AM - 05:00 PM');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const list = await organizationService.getPublicDirectory();
        if (!active) return;
        const target = list.find(o => o.id === userProfile?.organizationId) || list[0];
        if (target) {
          setOrgId(target.id);
          setBranches(target.branches || []);
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [userProfile?.organizationId]);

  const handleAddBranch = async (e) => {
    e.preventDefault();
    if (!branchName.trim() || !address.trim() || !phone.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    if (!orgId) {
      setError('Organization context not resolved.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const created = await organizationService.createBranch(orgId, {
        name: branchName.trim(),
        address: address.trim(),
        phone: phone.trim(),
        operatingHours: hours.trim(),
        timezone: 'Asia/Kathmandu',
        isOpen: true
      });
      setBranches(prev => [...prev, created]);
      setBranchName('');
      setAddress('');
      setPhone('');
      setModalOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {t.orgPortalView.branchManagement}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure regional campuses, hospital wings, and satellite service locations.
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={() => setModalOpen(true)} icon={Plus}>
          {t.common.addBranch}
        </Button>
      </div>

      {loading ? (
        <div className="py-12 flex items-center justify-center text-slate-500 text-xs gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-teal-700" />
          <span>Loading branches from Cloud Firestore...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {branches.map((b) => (
            <Card key={b.id} className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{b.name}</h3>
                  <span className="text-[11px] font-mono text-slate-400">ID: {b.id}</span>
                </div>
                <Badge variant={b.isOpen !== false ? 'success' : 'neutral'}>
                  {b.isOpen !== false ? 'Active' : 'Closed'}
                </Badge>
              </div>

              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{b.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{b.operatingHours}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-mono">{b.phone}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  {(b.counters || []).length} Active Desks Configured
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {b.timezone || 'Asia/Kathmandu'}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add New Operating Branch"
        subtitle="Establish a persistent regional location in Cloud Firestore"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleAddBranch} className="space-y-4 text-xs">
          <FormField
            id="new-branch-name"
            label="Branch Name"
            value={branchName}
            onChange={(e) => setBranchName(e.target.value)}
            placeholder="e.g. Biratnagar Diagnostic Center"
            required
          />
          <FormField
            id="new-branch-address"
            label="Physical Street Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. Main Road, Ward 4, Biratnagar"
            required
          />
          <FormField
            id="new-branch-phone"
            label="Direct Contact Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+977 21-524000"
            required
          />
          <FormField
            id="new-branch-hours"
            label="Operating Hours"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            required
          />

          {error && <p className="text-rose-600 text-xs">{error}</p>}

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="ghost" size="sm" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={saving}>
              {saving ? 'Saving...' : 'Save Branch'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
