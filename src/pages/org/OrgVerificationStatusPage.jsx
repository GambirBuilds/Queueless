import React, { useState, useEffect } from 'react';
import { useNavigation } from '../../context/NavigationContext.jsx';
import { organizationService } from '../../services/organizationService.js';
import { Badge } from '../../components/common/Badge.jsx';
import { Button } from '../../components/common/Button.jsx';
import { ArrowLeft, Clock, FileText, CheckCircle2 } from 'lucide-react';

export function OrgVerificationStatusPage() {
  const { viewParams, navigate } = useNavigation();
  const regId = viewParams?.registrationId || '';
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!regId) {
      setLoading(false);
      return;
    }
    let mounted = true;
    organizationService.getVerificationStatus(regId).then(data => {
      if (mounted) {
        setOrg(data);
        setLoading(false);
      }
    }).catch(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, [regId]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center text-xs text-slate-500">
        Loading organization verification status...
      </div>
    );
  }

  if (!org) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Application Record Not Found</h2>
        <p className="text-xs text-slate-500">
          We could not find an organization registration matching ID: {regId || '(missing)'}.
        </p>
        <Button variant="primary" size="sm" onClick={() => navigate('home')}>
          Return to Home
        </Button>
      </div>
    );
  }

  const statusNorm = String(org.status || 'pending_verification').toLowerCase();
  const isApproved = statusNorm === 'approved';

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
      <button
        type="button"
        onClick={() => navigate('home')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Home</span>
      </button>

      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant={isApproved ? 'success' : 'warning'}>{statusNorm.toUpperCase()}</Badge>
              <span className="font-mono text-xs text-slate-400">Application: {org.id}</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{org.name}</h1>
            <p className="text-xs text-slate-500">{org.industryName} · {org.city}</p>
          </div>

          {isApproved && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('org-dashboard')}
              >
                Open Org Portal
              </Button>
            </div>
          )}
        </div>

        {/* Verification Progress Steps */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Onboarding Verification Stages
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-900">1. Application Lodgement</span>
                <p className="text-slate-500 mt-0.5">Application data received and persisted in Cloud Firestore.</p>
              </div>
            </div>

            <div className={`p-3.5 rounded-xl border flex items-start gap-3 ${isApproved ? 'bg-slate-50 border-slate-200' : 'bg-amber-50/50 border-amber-200'}`}>
              {isApproved ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div>
                <span className="font-semibold text-slate-900">2. Document & License Validation</span>
                <p className="text-slate-600 mt-0.5">
                  Platform compliance officers verify statutory certificates ({org.registrationNumber || 'Pending review'}).
                </p>
              </div>
            </div>

            <div className={`p-3.5 rounded-xl border flex items-start gap-3 ${isApproved ? 'bg-emerald-50/60 border-emerald-200' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
              {isApproved ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <span className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</span>
              )}
              <div>
                <span className="font-semibold text-slate-700">3. Production Activation</span>
                <p className="text-slate-500 mt-0.5">Live queue token dispatching and organization portal access enabled.</p>
              </div>
            </div>
          </div>
        </div>

        {org.statutoryDocsSubmitted?.length > 0 && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-slate-500" />
              <span>Submitted Documentation Records:</span>
            </div>
            <ul className="list-disc list-inside text-slate-600 space-y-1 pl-1">
              {org.statutoryDocsSubmitted.map((doc, i) => (
                <li key={i} className="font-mono text-[11px]">{doc}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
