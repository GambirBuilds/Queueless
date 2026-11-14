import React, { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useNavigation } from '../../context/NavigationContext.jsx';
import { organizationService } from '../../services/organizationService.js';
import { sampleOrganizations } from '../../data/sampleOrganizations.js';
import { industries } from '../../data/industries.js';
import { Card } from '../../components/common/Card.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Button } from '../../components/common/Button.jsx';
import { SearchInput } from '../../components/common/SearchInput.jsx';
import { EmptyState } from '../../components/common/EmptyState.jsx';
import { Modal } from '../../components/common/Modal.jsx';
import {
  Layers,
  Building2,
  Clock
} from 'lucide-react';

export function AvailableServicesPage() {
  const { language, t } = useLanguage();
  const { navigate } = useNavigation();

  const [organizations, setOrganizations] = useState(sampleOrganizations);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('all');
  const [activeServiceModal, setActiveServiceModal] = useState(null);

  useEffect(() => {
    let mounted = true;
    organizationService.getPublicDirectory().then(data => {
      if (mounted && Array.isArray(data) && data.length > 0) {
        setOrganizations(data);
      }
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  const allServices = useMemo(() => {
    const list = [];
    organizations.forEach((org) => {
      (org.services || []).forEach((srv) => {
        list.push({
          ...srv,
          orgId: org.id,
          orgName: org.name,
          orgNameNe: org.nameNe,
          industryId: org.industryId,
          industryName: org.industryName,
          city: org.city
        });
      });
    });
    return list;
  }, [organizations]);

  const filteredServices = useMemo(() => {
    return allServices.filter((srv) => {
      if (selectedIndustry !== 'all' && srv.industryId !== selectedIndustry) {
        return false;
      }
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = (srv.name + ' ' + (srv.nameNe || '') + ' ' + (srv.code || '') + ' ' + (srv.category || '')).toLowerCase().includes(query);
        const matchesOrg = (srv.orgName || '').toLowerCase().includes(query);
        if (!matchesName && !matchesOrg) return false;
      }
      return true;
    });
  }, [allServices, selectedIndustry, searchTerm]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <Badge variant="teal">{language === 'ne' ? 'लाइभ सेवा निर्देशिका' : 'Live Service Directory'}</Badge>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            {language === 'ne' ? 'उपलब्ध सेवा सूची' : 'Service Directory'}
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            {language === 'ne'
              ? 'सबै संस्थाका उपलब्ध सेवाहरू, कागजात आवश्यकता र अनुमानित समय हेर्नुहोस्।'
              : 'Browse all services across organizations with document requirements, estimated durations, and fees.'}
          </p>
        </div>
        <div className="text-xs text-slate-500 tabular-nums">
          {filteredServices.length} {t.common.serviceCount} listed
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center gap-3">
        <div className="flex-1 w-full">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search service name, document or code..."
          />
        </div>
        <select
          aria-label="Filter by industry"
          value={selectedIndustry}
          onChange={(e) => setSelectedIndustry(e.target.value)}
          className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg text-slate-800 cursor-pointer w-full sm:w-auto"
        >
          <option value="all">{t.common.allIndustries}</option>
          {industries.map((ind) => (
            <option key={ind.id} value={ind.id}>
              {language === 'ne' ? ind.nameNe : ind.name}
            </option>
          ))}
        </select>
      </div>

      {/* Services Grid */}
      {filteredServices.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No services match your search"
          description="Try adjusting your search criteria or resetting filters."
          actionLabel="Clear Search"
          onAction={() => { setSearchTerm(''); setSelectedIndustry('all'); }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredServices.map((srv) => (
            <Card key={`${srv.orgId}-${srv.id}`} className="space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <Badge variant="teal">{srv.industryName}</Badge>
                  <span className="font-mono text-slate-400">{srv.code}</span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {language === 'ne' && srv.nameNe ? srv.nameNe : srv.name}
                  </h3>
                  <button
                    type="button"
                    onClick={() => navigate('org-profile', { orgId: srv.orgId })}
                    className="text-xs text-teal-800 font-semibold hover:underline flex items-center gap-1 mt-0.5"
                  >
                    <Building2 className="w-3 h-3" />
                    <span>{srv.orgName}</span>
                  </button>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2">
                  {srv.description}
                </p>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>~{srv.estimatedDurationMinutes} {t.common.minutes}</span>
                  </div>
                  <span className="font-bold text-slate-900">
                    {srv.isPaid ? `${srv.feeCurrency || 'NPR'} ${srv.feeAmount}` : t.common.free}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveServiceModal(srv)}
                  className="text-xs text-slate-500 hover:text-slate-900 underline"
                >
                  {t.common.requirements}
                </button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setActiveServiceModal(srv)}
                >
                  {t.common.joinQueue}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Service Details & Token Modal */}
      <Modal
        isOpen={Boolean(activeServiceModal)}
        onClose={() => setActiveServiceModal(null)}
        title={activeServiceModal?.name || 'Service Details'}
        subtitle={`Offered by: ${activeServiceModal?.orgName}`}
        maxWidth="max-w-md"
        footer={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const s = activeServiceModal;
                setActiveServiceModal(null);
                navigate('book-appointment', { orgId: s.orgId, serviceId: s.id });
              }}
            >
              Book Appointment
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                const s = activeServiceModal;
                setActiveServiceModal(null);
                navigate('join-queue', { orgId: s.orgId, serviceId: s.id });
              }}
            >
              Get Token
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl space-y-2 border border-slate-200">
            <div className="flex justify-between">
              <span className="text-slate-500">{t.common.fee}:</span>
              <span className="font-semibold text-slate-900">
                {activeServiceModal?.isPaid
                  ? `${activeServiceModal.feeCurrency || 'NPR'} ${activeServiceModal.feeAmount}`
                  : 'Free of Cost'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{t.common.duration}:</span>
              <span className="font-semibold text-slate-900">~{activeServiceModal?.estimatedDurationMinutes} minutes</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="font-semibold text-slate-800">{t.common.requirements}:</div>
            {activeServiceModal?.requiredDocuments?.length > 0 ? (
              <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
                {activeServiceModal.requiredDocuments.map((doc, idx) => (
                  <li key={idx}>{doc}</li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-500">Standard valid government ID or reference number.</p>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
