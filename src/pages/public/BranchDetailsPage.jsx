import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useNavigation } from '../../context/NavigationContext.jsx';
import { organizationService } from '../../services/organizationService.js';
import { sampleOrganizations } from '../../data/sampleOrganizations.js';
import { Card } from '../../components/common/Card.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Button } from '../../components/common/Button.jsx';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Phone
} from 'lucide-react';

export function BranchDetailsPage() {
  const { language, t } = useLanguage();
  const { viewParams, navigate } = useNavigation();
  const [organizations, setOrganizations] = useState(sampleOrganizations);

  useEffect(() => {
    let mounted = true;
    organizationService.getPublicDirectory().then(data => {
      if (mounted && Array.isArray(data) && data.length > 0) {
        setOrganizations(data);
      }
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  const orgId = viewParams?.orgId || organizations[0]?.id;
  const branchId = viewParams?.branchId || organizations[0]?.branches?.[0]?.id;

  const org = organizations.find((o) => o.id === orgId) || organizations[0] || sampleOrganizations[0];
  const branches = org.branches || [];
  const branch = branches.find((b) => b.id === branchId) || branches[0] || sampleOrganizations[0].branches[0];
  const counters = branch.counters || [];

  const branchServices = (org.services || []).filter((s) =>
    branch.serviceIds?.includes(s.id) || counters.some((c) => (c.serviceIds || []).includes(s.id))
  );
  const displayServices = branchServices.length > 0 ? branchServices : (org.services || []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <button
        type="button"
        onClick={() => navigate('org-profile', { orgId: org.id })}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to {org.name}</span>
      </button>

      {/* Branch Header */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="teal">{org.name}</Badge>
          <Badge variant="success">Active Branch</Badge>
          <span className="text-xs text-slate-500 font-mono">Branch ID: {branch.id}</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {language === 'ne' && branch.nameNe ? branch.nameNe : branch.name}
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
            <span>{branch.address}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400 shrink-0" />
            <span>{branch.operatingHours}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="font-mono">{branch.phone}</span>
          </div>
        </div>
      </div>

      {/* Counters Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            {t.common.counterCount} ({counters.length} Desks)
          </h2>
          <span className="text-xs text-slate-500">Service Counter Allocation</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {counters.map((counter) => (
            <Card key={counter.id} className="p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                  Counter #{counter.number}
                </span>
                <span className="text-[11px] text-emerald-700 font-medium">Ready</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900">{counter.name}</h3>
              <p className="text-[11px] text-slate-500">
                Services assigned: {(counter.serviceIds || []).length} categories
              </p>
            </Card>
          ))}
        </div>
      </div>

      {/* Available Services at this branch */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">
          Services Handled at this Location ({displayServices.length})
        </h2>

        <div className="space-y-3">
          {displayServices.map((service) => (
            <Card key={service.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-mono text-slate-400">{service.code}</span>
                  <span className="text-slate-300">·</span>
                  <span className="text-slate-600">{service.category}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {language === 'ne' && service.nameNe ? service.nameNe : service.name}
                </h3>
                <p className="text-xs text-slate-500 max-w-xl">
                  {service.description}
                </p>
              </div>

              <div className="flex items-center gap-4 shrink-0 self-end sm:self-center">
                <div className="text-right">
                  <div className="text-sm font-bold text-slate-900">
                    {service.isPaid ? `${service.feeCurrency || 'NPR'} ${service.feeAmount}` : 'Free'}
                  </div>
                  <div className="text-[10px] text-slate-500">~{service.estimatedDurationMinutes} min</div>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('join-queue', { orgId: org.id, branchId: branch.id, serviceId: service.id })}
                >
                  {t.common.joinQueue}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
