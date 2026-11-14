import React, { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useNavigation } from '../../context/NavigationContext.jsx';
import { sampleOrganizations } from '../../data/sampleOrganizations.js';
import { organizationService } from '../../services/organizationService.js';
import { industries } from '../../data/industries.js';
import { Card } from '../../components/common/Card.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Button } from '../../components/common/Button.jsx';
import { SearchInput } from '../../components/common/SearchInput.jsx';
import { EmptyState } from '../../components/common/EmptyState.jsx';
import {
  Building2,
  MapPin,
  Clock,
  Layers,
  Filter,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Info
} from 'lucide-react';

export function DiscoveryPage() {
  const { language, t } = useLanguage();
  const { navigate, viewParams } = useNavigation();

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

  // Search & filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState(viewParams?.industryId || 'all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [onlyOpen, setOnlyOpen] = useState(false);

  // Available unique cities in dataset
  const cities = useMemo(() => {
    const set = new Set();
    organizations.forEach((org) => {
      if (org.city) set.add(org.city);
    });
    return Array.from(set);
  }, [organizations]);

  // Filtered organizations
  const filteredOrgs = useMemo(() => {
    return organizations.filter((org) => {
      // Industry filter
      if (selectedIndustry !== 'all' && org.industryId !== selectedIndustry) {
        return false;
      }
      // City filter
      if (selectedCity !== 'all' && org.city !== selectedCity) {
        return false;
      }
      // Open branches filter
      if (onlyOpen && !(org.branches || []).some(b => b.isOpen !== false)) {
        return false;
      }
      // Search query across name, tagline, services, and branches
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = ((org.name || '') + ' ' + (org.nameNe || '')).toLowerCase().includes(query);
        const matchesTagline = ((org.tagline || '') + ' ' + (org.taglineNe || '')).toLowerCase().includes(query);
        const matchesServices = (org.services || []).some(
          (s) => ((s.name || '') + ' ' + (s.nameNe || '') + ' ' + (s.category || '')).toLowerCase().includes(query)
        );
        const matchesBranches = (org.branches || []).some(
          (b) => ((b.name || '') + ' ' + (b.address || '')).toLowerCase().includes(query)
        );
        if (!matchesName && !matchesTagline && !matchesServices && !matchesBranches) {
          return false;
        }
      }
      return true;
    });
  }, [organizations, searchTerm, selectedIndustry, selectedCity, onlyOpen]);

  const resetAllFilters = () => {
    setSearchTerm('');
    setSelectedIndustry('all');
    setSelectedCity('all');
    setOnlyOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200 mb-2">
            <Info className="w-3.5 h-3.5" />
            <span>{t.common.demoNotice}</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {t.nav.discover}
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            {language === 'ne'
              ? 'अस्पताल, बैंक, सरकारी कार्यालय र सेवा केन्द्रहरू खोज्नुहोस् र शाखा विवरण हेर्नुहोस्।'
              : 'Browse accredited organizations and municipal service points offering digital queue management.'}
          </p>
        </div>

        {/* Counter of results */}
        <div className="text-xs text-slate-500 tabular-nums">
          {language === 'ne'
            ? `कुल ${filteredOrgs.length} वटा संस्था भेटिए`
            : `Showing ${filteredOrgs.length} organizations`}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder={t.nav.searchPlaceholder}
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              aria-label="Filter by industry"
              className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-700 cursor-pointer"
            >
              <option value="all">{t.common.allIndustries}</option>
              {industries.map((ind) => (
                <option key={ind.id} value={ind.id}>
                  {language === 'ne' ? ind.nameNe : ind.name}
                </option>
              ))}
            </select>

            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              aria-label="Filter by location"
              className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-700 cursor-pointer"
            >
              <option value="all">{t.common.allLocations}</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>

            {(searchTerm || selectedIndustry !== 'all' || selectedCity !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetAllFilters}
                icon={RotateCcw}
                title={t.common.resetFilters}
              >
                {t.common.resetFilters}
              </Button>
            )}
          </div>
        </div>

        {/* Industry Pill Quick Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-100 no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedIndustry('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              selectedIndustry === 'all'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
            }`}
          >
            {t.common.allIndustries}
          </button>
          {industries.map((ind) => (
            <button
              type="button"
              key={ind.id}
              onClick={() => setSelectedIndustry(ind.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                selectedIndustry === ind.id
                  ? 'bg-teal-800 text-white'
                  : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
              }`}
            >
              {language === 'ne' ? ind.nameNe : ind.name}
            </button>
          ))}
        </div>
      </div>

      {/* Organizations Results Grid */}
      {filteredOrgs.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={t.common.noResultsFound}
          description={t.common.tryAdjustingFilters}
          actionLabel={t.common.resetFilters}
          onAction={resetAllFilters}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrgs.map((org) => (
            <Card
              key={org.id}
              hoverable
              onClick={() => navigate('org-profile', { orgId: org.id })}
              className="flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Meta row */}
                <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                  <Badge variant="teal">
                    {language === 'ne' ? org.industryNameNe : org.industryName}
                  </Badge>
                  <span className="font-mono text-[11px] text-slate-500">
                    {org.city}, {org.province}
                  </span>
                </div>

                {/* Title & Tagline */}
                <div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-800 transition-colors">
                    {language === 'ne' ? org.nameNe : org.name}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                    {language === 'ne' ? org.taglineNe : org.tagline}
                  </p>
                </div>

                {/* Branches Preview */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center justify-between text-slate-500 text-[11px]">
                    <span className="font-medium uppercase tracking-wider">{t.common.branchCount}:</span>
                    <span className="tabular-nums font-semibold text-slate-700">{org.branches.length}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{org.branches[0]?.name}</span>
                  </div>
                </div>

                {/* Services preview tags */}
                <div className="space-y-1 pt-1">
                  <div className="text-[11px] text-slate-500 uppercase tracking-wider font-medium">
                    {t.common.serviceCount} ({org.services.length}):
                  </div>
                  <div className="flex flex-wrap gap-1 text-[11px] text-slate-600">
                    {org.services.slice(0, 3).map((srv) => (
                      <span key={srv.id} className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                        {language === 'ne' ? srv.nameNe : srv.name}
                      </span>
                    ))}
                    {org.services.length > 3 && (
                      <span className="text-slate-400 self-center">+{org.services.length - 3} more</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-teal-800">
                <span>{t.common.viewDetails}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
