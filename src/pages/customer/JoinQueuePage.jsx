import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useNavigation } from '../../context/NavigationContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { organizationService } from '../../services/organizationService.js';
import { sampleOrganizations } from '../../data/sampleOrganizations.js';
import { queueService } from '../../services/queueService.js';
import { Card } from '../../components/common/Card.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Button } from '../../components/common/Button.jsx';
import { FormField } from '../../components/common/FormField.jsx';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Ticket,
  CheckCircle2,
  FileText
} from 'lucide-react';

export function JoinQueuePage() {
  const { t } = useLanguage();
  const { viewParams, navigate } = useNavigation();
  const { currentUser, userProfile } = useAuth();

  const [organizations, setOrganizations] = useState(sampleOrganizations);
  const [loadingOrgs, setLoadingOrgs] = useState(true);

  const initialOrgId = viewParams?.orgId || sampleOrganizations[0].id;
  const initialBranchId = viewParams?.branchId || null;
  const initialServiceId = viewParams?.serviceId || null;

  const [step, setStep] = useState(initialBranchId && initialServiceId ? 4 : 1);
  const [selectedOrgId, setSelectedOrgId] = useState(initialOrgId);
  const [selectedBranchId, setSelectedBranchId] = useState(initialBranchId);
  const [selectedServiceId, setSelectedServiceId] = useState(initialServiceId);

  const [customerName, setCustomerName] = useState(userProfile?.fullName || currentUser?.displayName || '');
  const [customerPhone, setCustomerPhone] = useState(userProfile?.phone || '');
  const [notes, setNotes] = useState('');
  const [confirmedCheck, setConfirmedCheck] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    organizationService.getPublicDirectory().then(data => {
      if (mounted && Array.isArray(data) && data.length > 0) {
        setOrganizations(data);
        if (!viewParams?.orgId) {
          setSelectedOrgId(data[0].id);
        }
      }
      if (mounted) setLoadingOrgs(false);
    }).catch(() => {
      if (mounted) setLoadingOrgs(false);
    });
    return () => { mounted = false; };
  }, [viewParams?.orgId]);

  useEffect(() => {
    if (userProfile) {
      if (!customerName && userProfile.fullName) setCustomerName(userProfile.fullName);
      if (!customerPhone && userProfile.phone) setCustomerPhone(userProfile.phone);
    }
  }, [userProfile, customerName, customerPhone]);

  const selectedOrg = organizations.find(o => o.id === selectedOrgId) || organizations[0] || sampleOrganizations[0];
  const branchesList = selectedOrg?.branches?.length ? selectedOrg.branches : sampleOrganizations[0].branches;
  const servicesList = selectedOrg?.services?.length ? selectedOrg.services : sampleOrganizations[0].services;
  const selectedBranch = branchesList.find(b => b.id === selectedBranchId) || branchesList[0];
  const selectedService = servicesList.find(s => s.id === selectedServiceId) || servicesList[0];

  const handleConfirmJoin = async (e) => {
    e.preventDefault();
    if (!confirmedCheck) {
      setError('Please review and confirm that you have all prerequisite documents ready.');
      return;
    }
    if (!customerName.trim() || !customerPhone.trim()) {
      setError('Full name and mobile phone number are required.');
      return;
    }
    setIsSubmitting(true);
    setError('');

    try {
      const token = await queueService.joinQueue({
        org: selectedOrg,
        branch: selectedBranch,
        service: selectedService,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        notes: notes.trim()
      });
      navigate('queue-tracker', { tokenId: token.id });
    } catch (err) {
      setError(err.message || 'Failed to join queue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <button
        type="button"
        onClick={() => {
          if (step > 1) setStep(step - 1);
          else navigate('discover');
        }}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>{step > 1 ? 'Previous Step' : t.nav.backToDiscover}</span>
      </button>

      {/* Progress Steps Header */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Ticket className="w-5 h-5 text-teal-700" />
            <span>Get a Digital Queue Token</span>
          </h1>
          <span className="text-xs font-semibold text-slate-500 font-mono">
            Step {step} of 4
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2 text-center text-[11px] font-semibold">
          <div className={`p-2 rounded-lg ${step >= 1 ? 'bg-teal-50 text-teal-800 border border-teal-200' : 'bg-slate-50 text-slate-400'}`}>
            1. Organization
          </div>
          <div className={`p-2 rounded-lg ${step >= 2 ? 'bg-teal-50 text-teal-800 border border-teal-200' : 'bg-slate-50 text-slate-400'}`}>
            2. Branch
          </div>
          <div className={`p-2 rounded-lg ${step >= 3 ? 'bg-teal-50 text-teal-800 border border-teal-200' : 'bg-slate-50 text-slate-400'}`}>
            3. Service
          </div>
          <div className={`p-2 rounded-lg ${step >= 4 ? 'bg-teal-50 text-teal-800 border border-teal-200' : 'bg-slate-50 text-slate-400'}`}>
            4. Confirm
          </div>
        </div>
      </div>

      {/* STEP 1: Select Organization */}
      {step === 1 && (
        <Card className="p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900">
            Step 1: Select Organization / Provider
          </h2>
          {loadingOrgs ? (
            <div className="text-xs text-slate-500 py-6 text-center">Loading active organizations...</div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {organizations.map((org) => (
                <div
                  key={org.id}
                  onClick={() => {
                    setSelectedOrgId(org.id);
                    if (org.branches?.[0]) setSelectedBranchId(org.branches[0].id);
                    setStep(2);
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedOrgId === org.id
                      ? 'border-teal-700 bg-teal-50/40 ring-1 ring-teal-700'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="teal">{org.industryName}</Badge>
                      <span className="text-xs text-slate-500">{org.city}</span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">{org.name}</h3>
                    <p className="text-xs text-slate-500">{org.tagline || org.description}</p>
                  </div>
                  <Button variant="outline" size="sm">Select</Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* STEP 2: Select Branch */}
      {step === 2 && (
        <Card className="p-6 space-y-4">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900">
              Step 2: Select Branch Location ({selectedOrg.name})
            </h2>
            <p className="text-xs text-slate-500">Choose the physical facility you will visit.</p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {branchesList.map((b) => (
              <div
                key={b.id}
                onClick={() => {
                  setSelectedBranchId(b.id);
                  if (servicesList[0]) setSelectedServiceId(servicesList[0].id);
                  setStep(3);
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  selectedBranchId === b.id
                    ? 'border-teal-700 bg-teal-50/40 ring-1 ring-teal-700'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900">{b.name}</h3>
                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{b.address}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{b.operatingHours}</span>
                  </div>
                </div>
                <Button variant="outline" size="sm">Select</Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* STEP 3: Select Service */}
      {step === 3 && (
        <Card className="p-6 space-y-4">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900">
              Step 3: Select Desired Service ({selectedBranch.name})
            </h2>
            <p className="text-xs text-slate-500">Choose the specific desk counter service you require.</p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {servicesList.map((srv) => {
              const queueClosed = srv.queueStatus === 'paused' || srv.queueStatus === 'closed';
              return (
                <div
                  key={srv.id}
                  onClick={() => {
                    if (queueClosed) return;
                    setSelectedServiceId(srv.id);
                    setStep(4);
                  }}
                  className={`p-4 rounded-xl border transition-all flex items-center justify-between ${
                    queueClosed
                      ? 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                      : selectedServiceId === srv.id
                      ? 'border-teal-700 bg-teal-50/40 ring-1 ring-teal-700 cursor-pointer'
                      : 'border-slate-200 hover:border-slate-300 cursor-pointer'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono text-slate-400">{srv.code}</span>
                      <span className="text-slate-300">·</span>
                      <span className="font-medium text-teal-800">{srv.category}</span>
                      {queueClosed && (
                        <Badge variant="warning">Queue {String(srv.queueStatus).toUpperCase()}</Badge>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">{srv.name}</h3>
                    <p className="text-xs text-slate-500 max-w-xl">{srv.description}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold text-slate-900">
                      {srv.isPaid ? `${srv.feeCurrency || 'NPR'} ${srv.feeAmount}` : 'Free'}
                    </div>
                    <div className="text-[10px] text-slate-500">~{srv.estimatedDurationMinutes} mins</div>
                    <Button variant="outline" size="sm" className="mt-2" disabled={queueClosed}>
                      {queueClosed ? 'Unavailable' : 'Choose'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* STEP 4: Review Instructions, Prerequisite Documents, & Confirm */}
      {step === 4 && (
        <form onSubmit={handleConfirmJoin} className="space-y-6">
          <Card className="p-6 space-y-5">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Step 4: Review Instructions & Confirm Token
            </h2>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-slate-500">Service:</span>
                  <div className="font-bold text-slate-900 text-sm">{selectedService.name}</div>
                  <div className="text-[11px] text-teal-800 font-mono mt-0.5">{selectedService.code} · {selectedService.category}</div>
                </div>
                <div className="text-right">
                  <span className="text-slate-500">Fee:</span>
                  <div className="font-bold text-slate-900 text-sm">
                    {selectedService.isPaid ? `${selectedService.feeCurrency || 'NPR'} ${selectedService.feeAmount}` : 'Free'}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-between">
                <div>
                  <span className="text-slate-500">Facility Location:</span>
                  <div className="font-semibold text-slate-800">{selectedOrg.name} — {selectedBranch.name}</div>
                  <div className="text-slate-500 text-[11px]">{selectedBranch.address}</div>
                </div>
                <div className="text-right">
                  <span className="text-slate-500">Est. Duration:</span>
                  <div className="font-semibold text-slate-800">~{selectedService.estimatedDurationMinutes} mins</div>
                </div>
              </div>
            </div>

            {selectedService.requiredDocuments?.length > 0 && (
              <div className="space-y-2 text-xs">
                <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-teal-700" />
                  <span>Required Documentation Checklist:</span>
                </div>
                <div className="p-3 bg-teal-50/50 border border-teal-200/80 rounded-xl space-y-1 text-slate-700">
                  {selectedService.requiredDocuments.map((doc, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-700 shrink-0 mt-0.5" />
                      <span>{doc}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <FormField
                id="q-name"
                label="Customer Full Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter your full name"
                required
              />

              <FormField
                id="q-phone"
                label="Mobile Phone (for Desk Lookup)"
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+977 98XXXXXXXX"
                required
                helperText="In-app real-time alerts are active on your account."
              />
            </div>

            <FormField
              id="q-notes"
              label="Special Notes or Accessibility Needs (Optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Senior citizen companion, wheelchair assistance..."
            />

            <div className="pt-2">
              <label className="flex items-start gap-2 cursor-pointer p-3 rounded-lg border border-slate-200 hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={confirmedCheck}
                  onChange={(e) => setConfirmedCheck(e.target.checked)}
                  className="w-4 h-4 text-teal-700 rounded mt-0.5 cursor-pointer"
                />
                <span className="text-xs text-slate-700">
                  I confirm that I have prepared the required documents listed above and agree to arrive promptly when my digital token is called.
                </span>
              </label>
            </div>

            {error && (
              <p className="text-xs text-rose-600 font-medium">{error}</p>
            )}

            <div className="pt-2 flex justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={() => setStep(3)}
              >
                Change Service
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={isSubmitting}
                icon={Ticket}
              >
                {isSubmitting ? 'Generating Digital Token...' : 'Confirm & Issue Queue Token'}
              </Button>
            </div>
          </Card>
        </form>
      )}
    </div>
  );
}
