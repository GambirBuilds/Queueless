import React from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useNavigation } from '../../context/NavigationContext.jsx';
import { Card } from '../../components/common/Card.jsx';
import { Button } from '../../components/common/Button.jsx';
import { CheckCircle2, ShieldAlert, ArrowRight, FileText } from 'lucide-react';

export function OrgRegistrationSuccessPage() {
  const { language } = useLanguage();
  const { viewParams, navigate } = useNavigation();
  const registrationId = viewParams?.registrationId || 'org-reg-01';

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 space-y-6">
      <Card className="p-8 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
            Application ID: {registrationId}
          </span>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Organization Application Submitted
          </h1>
          <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
            Thank you for registering your organization with QUEUELESS. Your institutional application has entered the compliance verification queue.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs text-slate-600 space-y-2 max-w-lg mx-auto">
          <div className="font-semibold text-slate-900 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-teal-700" />
            <span>Verification Process Checklist:</span>
          </div>
          <ul className="list-disc list-inside space-y-1 pl-1">
            <li>Review of statutory business license or health accreditation</li>
            <li>Verification of authorized representative and official email</li>
            <li>Preliminary activation of multi-branch and counter routing consoles</li>
          </ul>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('org-verification-status', { registrationId })}
            icon={ArrowRight}
            iconPosition="right"
          >
            Check Verification Status
          </Button>
          <Button
            variant="outline"
            size="md"
            onClick={() => navigate('home')}
          >
            Return to Homepage
          </Button>
        </div>
      </Card>
    </div>
  );
}
