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
  Phone,
  Mail,
  Globe,
  FileText,
  Calendar,
  Ticket,
  ChevronRight
} from 'lucide-react';

export function OrgProfilePage() {
  const { language, t } = useLanguage();
  const { viewParams, navigate } = useNavigation();
  const [activeTab, setActiveTab] = useState('branches');
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
  const org = organizations.find((o) => o.id === orgId) || organizations[0] || sampleOrganizations[0];
  const branches = org.branches || [];
  const services = org.services || [];

  const handleQueueAction = (service, type) => {
    if (type === 'token') {
      navigate('join-queue', { orgId: org.id, serviceId: service?.id });
    } else {
      navigate('book-appointment', { orgId: org.id, serviceId: service?.id });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button */}
      <button
        type="button"
        onClick={() => navigate('discover')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>{t.nav.backToDiscover}</span>
      </button>

      {/* Organization Header Card */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="teal">
                {language === 'ne' && org.industryNameNe ? org.industryNameNe : org.industryName}
              </Badge>
              <Badge variant={org.status === 'approved' ? 'success' : 'neutral'}>
                {String(org.status || 'approved').toUpperCase()}
              </Badge>
              {org.registrationNumber && (
                <span className="text-xs font-mono text-slate-400">
                  Reg: {org.registrationNumber}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {language === 'ne' && org.nameNe ? org.nameNe : org.name}
            </h1>

            <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
              {language === 'ne' && org.taglineNe ? org.taglineNe : (org.tagline || org.description)}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
            <Button
              variant="primary"
              size="sm"
              icon={Ticket}
              onClick={() => handleQueueAction(services[0], 'token')}
            >
              {t.common.joinQueue}
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={Calendar}
              onClick={() => handleQueueAction(services[0], 'appointment')}
            >
              {t.common.bookAppointment}
            </Button>
          </div>
        </div>

        {/* Contact Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-2.5">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
            <span>{org.city}, {org.province}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Phone className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="font-mono">{org.phone || 'Not listed'}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Mail className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="truncate">{org.email || 'Not listed'}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Globe className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="truncate">{org.website || 'Not listed'}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setActiveTab('branches')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'branches'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {t.common.branchCount} ({branches.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('services')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'services'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {t.common.serviceCount} ({services.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('about')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'about'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {language === 'ne' ? 'संस्था परिचय' : 'About Organization'}
          </button>
        </div>
      </div>

      {/* Tab 1: Branches */}
      {activeTab === 'branches' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">
            {language === 'ne' ? 'सञ्चालनमा रहेका शाखाहरू' : 'Operational Branches'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {branches.map((branch) => (
              <Card key={branch.id} className="space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-bold text-slate-900">
                      {language === 'ne' && branch.nameNe ? branch.nameNe : branch.name}
                    </h3>
                    <Badge variant="success">Open Today</Badge>
                  </div>

                  <p className="text-xs text-slate-600 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{branch.address}</span>
                  </p>

                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{branch.operatingHours}</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1">
                    <div className="font-semibold text-slate-700">
                      {t.common.counterCount}: {(branch.counters || []).length} active service desks
                    </div>
                    <div className="text-slate-500 text-[11px]">
                      {(branch.counters || []).map((c) => c.name).join(' · ')}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-mono">{branch.phone}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('branch-details', { orgId: org.id, branchId: branch.id })}
                    icon={ChevronRight}
                    iconPosition="right"
                  >
                    {t.common.viewDetails}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Services */}
      {activeTab === 'services' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">
            {language === 'ne' ? 'उपलब्ध सेवा सूची' : 'Service Directory'}
          </h2>

          <div className="space-y-4">
            {services.map((service) => (
              <Card key={service.id} className="p-6 space-y-4">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono text-slate-500">{service.code}</span>
                      <span className="text-slate-300">·</span>
                      <span className="font-medium text-teal-800">{service.category}</span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900">
                      {language === 'ne' && service.nameNe ? service.nameNe : service.name}
                    </h3>

                    <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                      {service.description}
                    </p>
                  </div>

                  <div className="flex md:flex-col items-center md:items-end gap-2 shrink-0">
                    <div className="text-right">
                      <div className="text-base font-bold text-slate-900 tabular-nums">
                        {service.isPaid ? `${service.feeCurrency || 'NPR'} ${service.feeAmount}` : t.common.free}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        ~{service.estimatedDurationMinutes} {t.common.minutes}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleQueueAction(service, 'token')}
                      >
                        {t.common.joinQueue}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQueueAction(service, 'appointment')}
                      >
                        {t.common.bookAppointment}
                      </Button>
                    </div>
                  </div>
                </div>

                {service.requiredDocuments && service.requiredDocuments.length > 0 && (
                  <div className="pt-3 border-t border-slate-100 bg-slate-50/70 p-3.5 rounded-lg space-y-2">
                    <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      <span>{t.common.requirements}:</span>
                    </div>
                    <ul className="text-xs text-slate-600 list-disc list-inside space-y-1 pl-1">
                      {service.requiredDocuments.map((doc, i) => (
                        <li key={i}>{doc}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: About */}
      {activeTab === 'about' && (
        <Card className="p-8 space-y-4">
          <h2 className="text-lg font-bold text-slate-900">
            {language === 'ne' ? 'संस्थाको पृष्ठभूमि' : 'Background & Accreditations'}
          </h2>
          <p className="text-sm text-slate-700 leading-relaxed">
            {language === 'ne' && org.aboutNe ? org.aboutNe : (org.about || org.description)}
          </p>
          <div className="pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block">Established</span>
              <span className="font-semibold text-slate-800">{org.establishedYear || 'Active'}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Accreditation</span>
              <span className="font-semibold text-slate-800">{org.registrationNumber || 'Registered'}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Headquarters</span>
              <span className="font-semibold text-slate-800">{org.city}, Nepal</span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
