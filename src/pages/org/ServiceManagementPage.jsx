import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { organizationService } from '../../services/organizationService.js';
import { Card } from '../../components/common/Card.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Modal } from '../../components/common/Modal.jsx';
import { FormField } from '../../components/common/FormField.jsx';
import { Plus, Loader2 } from 'lucide-react';

export function ServiceManagementPage() {
  const { t } = useLanguage();
  const { userProfile } = useAuth();

  const [orgId, setOrgId] = useState(userProfile?.organizationId || '');
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState('');
  const [duration, setDuration] = useState('15');
  const [fee, setFee] = useState('0');
  const [isPaid, setIsPaid] = useState(false);
  const [docRequirements, setDocRequirements] = useState('');
  const [description, setDescription] = useState('');
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
          setServices(target.services || []);
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [userProfile?.organizationId]);

  const handleAddService = async (e) => {
    e.preventDefault();
    if (!name.trim() || !code.trim() || !category.trim()) {
      setError('Please provide service name, unique code, and category.');
      return;
    }
    if (!orgId) {
      setError('Organization context not resolved.');
      return;
    }

    const docs = docRequirements
      .split('\n')
      .map((d) => d.trim())
      .filter(Boolean);

    setSaving(true);
    setError('');
    try {
      const created = await organizationService.createService(orgId, {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        category: category.trim(),
        estimatedDurationMinutes: parseInt(duration, 10) || 15,
        feeAmount: isPaid ? parseInt(fee, 10) || 0 : 0,
        feeCurrency: 'NPR',
        isPaid,
        requiredDocuments: docs.length > 0 ? docs : ['Government Identity Document'],
        description: description.trim() || 'Configured custom service offering.'
      });

      setServices(prev => [...prev, created]);
      setName('');
      setCode('');
      setCategory('');
      setDuration('15');
      setFee('0');
      setIsPaid(false);
      setDocRequirements('');
      setDescription('');
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
            {t.orgPortalView.serviceManagement}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Define specialized services, processing duration buffers, document criteria, and fees.
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={() => setModalOpen(true)} icon={Plus}>
          {t.common.addService}
        </Button>
      </div>

      {loading ? (
        <div className="py-12 flex items-center justify-center text-slate-500 text-xs gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-teal-700" />
          <span>Loading service catalog...</span>
        </div>
      ) : (
        <div className="space-y-4">
          {services.map((srv) => (
            <Card key={srv.id} className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                      {srv.code}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-slate-600 font-medium">{srv.category}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{srv.name}</h3>
                  <p className="text-xs text-slate-600 max-w-2xl">{srv.description}</p>
                </div>

                <div className="flex sm:flex-col items-end gap-2 shrink-0">
                  <Badge variant="teal">Active Offering</Badge>
                  <div className="text-xs font-semibold text-slate-800 tabular-nums">
                    {srv.isPaid ? `${srv.feeCurrency || 'NPR'} ${srv.feeAmount}` : 'Free'}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    ~{srv.estimatedDurationMinutes} mins buffer
                  </div>
                </div>
              </div>

              {srv.requiredDocuments && (
                <div className="pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                  <span className="font-semibold text-slate-700">Required Documents:</span>
                  <ul className="list-disc list-inside space-y-0.5 pl-1 text-[11px]">
                    {srv.requiredDocuments.map((docItem, idx) => (
                      <li key={idx}>{docItem}</li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Configure New Custom Service"
        subtitle="Persists directly to Cloud Firestore for public queue discovery"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleAddService} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              id="srv-name"
              label="Service Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ultrasound Abdomen Scan"
              required
            />
            <FormField
              id="srv-code"
              label="Token Prefix / Code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. USG"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              id="srv-category"
              label="Category / Department"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Diagnostic Radiology"
              required
            />
            <FormField
              id="srv-duration"
              label="Expected Duration (Minutes)"
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              required
            />
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">Is this a paid service?</span>
              <input
                type="checkbox"
                checked={isPaid}
                onChange={(e) => setIsPaid(e.target.checked)}
                className="w-4 h-4 text-teal-700 rounded cursor-pointer"
              />
            </div>
            {isPaid && (
              <FormField
                id="srv-fee"
                label="Fee Amount (NPR)"
                type="number"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                placeholder="500"
              />
            )}
          </div>

          <FormField
            id="srv-desc"
            label="Service Description"
            type="textarea"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief explanation of the counter process..."
          />

          <FormField
            id="srv-docs"
            label="Required Documents Checklist (One per line)"
            type="textarea"
            rows={3}
            value={docRequirements}
            onChange={(e) => setDocRequirements(e.target.value)}
            placeholder="Citizenship Certificate&#10;Doctor Order Prescription"
          />

          {error && <p className="text-rose-600 text-xs">{error}</p>}

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="ghost" size="sm" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={saving}>
              {saving ? 'Saving...' : 'Save Service'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
