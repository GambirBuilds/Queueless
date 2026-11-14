import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useNavigation } from '../../context/NavigationContext.jsx';
import { industries } from '../../data/industries.js';
import { sampleOrganizations } from '../../data/sampleOrganizations.js';
import { organizationService } from '../../services/organizationService.js';
import { Card } from '../../components/common/Card.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Button } from '../../components/common/Button.jsx';
import { EmptyState } from '../../components/common/EmptyState.jsx';
import { ArrowLeft, ArrowRight, MapPin, Building2, Layers } from 'lucide-react';

export function IndustryCategoryPage() {
  const { language, t } = useLanguage();
  const { viewParams, navigate } = useNavigation();
  const industryId = viewParams?.industryId || 'healthcare';
  const [organizations, setOrganizations] = useState(sampleOrganizations);

  useEffect(() => {
    let active = true;
    organizationService.getPublicDirectory().then(data => {
      if (active && Array.isArray(data) && data.length > 0) {
        setOrganizations(data);
      }
    });
    return () => { active = false; };
  }, []);

  const industry = industries.find((i) => i.id === industryId) || industries[0];
  const orgsInIndustry = organizations.filter((o) => o.industryId === industry.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back Link */}
      <button
        type="button"
        onClick={() => navigate('discover')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>{t.nav.backToDiscover}</span>
      </button>

      {/* Industry Header */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 space-y-3">
        <Badge variant="teal">
          {language === 'ne' ? 'क्षेत्रीय वर्ग' : 'Industry Category'}
        </Badge>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          {language === 'ne' ? industry.nameNe : industry.name}
        </h1>
        <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
          {language === 'ne' ? industry.descriptionNe : industry.description}
        </p>

        {/* Typical service types in this industry */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {language === 'ne' ? 'नमुना सेवाहरू' : 'Standard Services'}:
          </span>
          {industry.exampleServices.map((srv, idx) => (
            <span
              key={idx}
              className="text-xs bg-slate-100 border border-slate-200/60 text-slate-700 px-2.5 py-1 rounded-md"
            >
              {srv}
            </span>
          ))}
        </div>
      </div>

      {/* Organizations in this industry */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            {language === 'ne'
              ? `यस क्षेत्रका संस्थाहरू (${orgsInIndustry.length})`
              : `Registered Providers (${orgsInIndustry.length})`}
          </h2>
          <span className="text-xs text-slate-500">{t.common.demoNotice}</span>
        </div>

        {orgsInIndustry.length === 0 ? (
          <EmptyState
            icon={Building2}
            title={t.common.noResultsFound}
            description="No demonstration organizations currently listed under this sector."
            actionLabel={t.nav.backToDiscover}
            onAction={() => navigate('discover')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orgsInIndustry.map((org) => (
              <Card
                key={org.id}
                hoverable
                onClick={() => navigate('org-profile', { orgId: org.id })}
                className="flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-mono text-slate-600">{org.registrationNumber}</span>
                    <span>{org.city}</span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-800 transition-colors">
                    {language === 'ne' ? org.nameNe : org.name}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-2">
                    {language === 'ne' ? org.taglineNe : org.tagline}
                  </p>

                  <div className="pt-2 text-xs text-slate-500 space-y-1">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{org.branches[0]?.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      <span>{org.services.length} {t.common.serviceCount}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-teal-800">
                  <span>{t.common.viewDetails}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
