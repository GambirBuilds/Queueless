import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useNavigation } from '../../context/NavigationContext.jsx';
import { useAuthModal } from '../../context/AuthModalContext.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Card } from '../../components/common/Card.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { FormField } from '../../components/common/FormField.jsx';
import { industries } from '../../data/industries.js';
import { sampleOrganizations } from '../../data/sampleOrganizations.js';
import { organizationService } from '../../services/organizationService.js';
import {
  ArrowRight,
  Search,
  CheckCircle,
  Building2,
  Clock,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  MapPin,
  Send,
  Layers,
  Activity,
  Landmark,
  ShoppingBag,
  Car,
  GraduationCap,
  Sparkles,
  Lock,
  FileCheck2,
  Users2
} from 'lucide-react';

export function HomePage() {
  const { language, t } = useLanguage();
  const { navigate } = useNavigation();
  const [featuredOrganizations, setFeaturedOrganizations] = useState(sampleOrganizations);

  useEffect(() => {
    let active = true;
    organizationService.getPublicDirectory().then(data => {
      if (active && Array.isArray(data) && data.length > 0) {
        setFeaturedOrganizations(data);
      }
    });
    return () => { active = false; };
  }, []);
  const { openAuthModal } = useAuthModal();

  // FAQ accordion state
  const [openFaq, setOpenFaq] = useState(0);

  // Contact form state
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    org: '',
    message: ''
  });
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactError, setContactError] = useState('');

  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (!contactForm.name.trim() || !contactForm.email.trim() || !contactForm.message.trim()) {
      setContactError(language === 'ne' ? 'कृपया सबै आवश्यक विवरण भर्नुहोस्।' : 'Please fill in all required fields.');
      return;
    }
    setContactError('');
    setContactSubmitted(true);
    setTimeout(() => {
      setContactForm({ name: '', email: '', org: '', message: '' });
      setContactSubmitted(false);
    }, 4000);
  };

  const getIndustryIcon = (iconName) => {
    switch (iconName) {
      case 'Activity': return Activity;
      case 'Building2': return Building2;
      case 'Landmark': return Landmark;
      case 'ShoppingBag': return ShoppingBag;
      case 'Car': return Car;
      case 'GraduationCap': return GraduationCap;
      default: return Sparkles;
    }
  };

  const faqs = [
    { q: t.faq.q1, a: t.faq.a1 },
    { q: t.faq.q2, a: t.faq.a2 },
    { q: t.faq.q3, a: t.faq.a3 },
    { q: t.faq.q4, a: t.faq.a4 },
  ];

  return (
    <div className="space-y-24 py-6">
      {/* 1. HERO SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-teal-50 border border-teal-200 text-xs font-semibold text-teal-900">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
            <span>{t.hero.badge} · {language === 'en' ? 'Bilingual Platform' : 'द्विभाषिक प्रणाली'}</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1] text-balance">
            {t.hero.title}
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
            {t.hero.subtitle}
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('discover')}
              icon={Search}
            >
              {t.hero.ctaPrimary}
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate('org-dashboard')}
              icon={Building2}
            >
              {t.hero.ctaSecondary}
            </Button>
          </div>

          {/* Key Platform Metrics / Trust Anchors */}
          <div className="pt-10 grid grid-cols-3 gap-4 max-w-xl mx-auto border-t border-slate-200/80 text-center">
            <div className="space-y-0.5">
              <div className="text-xl sm:text-2xl font-bold text-slate-900 tabular-nums">
                {t.hero.stat1Value}
              </div>
              <div className="text-xs text-slate-500 font-medium">{t.hero.stat1Label}</div>
            </div>
            <div className="space-y-0.5 border-x border-slate-200">
              <div className="text-xl sm:text-2xl font-bold text-teal-800">
                {t.hero.stat2Value}
              </div>
              <div className="text-xs text-slate-500 font-medium">{t.hero.stat2Label}</div>
            </div>
            <div className="space-y-0.5">
              <div className="text-xl sm:text-2xl font-bold text-slate-900">
                {t.hero.stat3Value}
              </div>
              <div className="text-xs text-slate-500 font-medium">{t.hero.stat3Label}</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. INDUSTRY CATEGORIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {language === 'ne' ? 'समर्थित ७ प्रमुख क्षेत्रहरू' : 'Supported Industry Sectors'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            {language === 'ne'
              ? 'अस्पतालदेखि सरकारी कार्यालयसम्म, प्रत्येक उद्योगका लागि विशेष काउन्टर तथा सेवा संरचना।'
              : 'Configurable digital queue workflows tailored for specialized departmental requirements.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {industries.map((ind) => {
            const Icon = getIndustryIcon(ind.icon);
            return (
              <Card
                key={ind.id}
                hoverable
                onClick={() => navigate('industry', { industryId: ind.id })}
                className="group flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-800 group-hover:bg-teal-700 group-hover:text-white transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-teal-800 transition-colors">
                      {language === 'ne' ? ind.nameNe : ind.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {language === 'ne' ? ind.descriptionNe : ind.description}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-teal-800">
                  <span>{t.common.viewServices}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* 3. HOW IT WORKS */}
      <section className="bg-white border-y border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {t.howItWorks.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              {t.howItWorks.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="text-xs font-mono font-bold text-teal-800 uppercase tracking-wider">Step 01</div>
              <h3 className="text-sm font-bold text-slate-900">{t.howItWorks.step1Title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{t.howItWorks.step1Desc}</p>
            </div>
            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="text-xs font-mono font-bold text-teal-800 uppercase tracking-wider">Step 02</div>
              <h3 className="text-sm font-bold text-slate-900">{t.howItWorks.step2Title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{t.howItWorks.step2Desc}</p>
            </div>
            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="text-xs font-mono font-bold text-teal-800 uppercase tracking-wider">Step 03</div>
              <h3 className="text-sm font-bold text-slate-900">{t.howItWorks.step3Title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{t.howItWorks.step3Desc}</p>
            </div>
            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="text-xs font-mono font-bold text-teal-800 uppercase tracking-wider">Step 04</div>
              <h3 className="text-sm font-bold text-slate-900">{t.howItWorks.step4Title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{t.howItWorks.step4Desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. BENEFITS: CITIZENS & ORGANIZATIONS (DUAL BENEFIT SECTION) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Customer Benefits */}
          <div className="p-8 rounded-2xl bg-white border border-slate-200 space-y-6">
            <div>
              <span className="text-xs font-semibold text-teal-800 uppercase tracking-wider">
                {language === 'ne' ? 'नागरिक लाभ' : 'Citizen Advantages'}
              </span>
              <h3 className="text-xl font-bold text-slate-900 mt-1">
                {t.customerBenefits.title}
              </h3>
              <p className="text-xs text-slate-500 mt-1">{t.customerBenefits.subtitle}</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{t.customerBenefits.b1Title}</h4>
                  <p className="text-xs text-slate-600 mt-0.5">{t.customerBenefits.b1Desc}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{t.customerBenefits.b2Title}</h4>
                  <p className="text-xs text-slate-600 mt-0.5">{t.customerBenefits.b2Desc}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{t.customerBenefits.b3Title}</h4>
                  <p className="text-xs text-slate-600 mt-0.5">{t.customerBenefits.b3Desc}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{t.customerBenefits.b4Title}</h4>
                  <p className="text-xs text-slate-600 mt-0.5">{t.customerBenefits.b4Desc}</p>
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('discover')}
              icon={Search}
            >
              {t.common.findService}
            </Button>
          </div>

          {/* Organization Benefits */}
          <div className="p-8 rounded-2xl bg-slate-900 text-white space-y-6">
            <div>
              <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider">
                {language === 'ne' ? 'संस्थागत लाभ' : 'Enterprise Operations'}
              </span>
              <h3 className="text-xl font-bold text-white mt-1">
                {t.orgBenefits.title}
              </h3>
              <p className="text-xs text-slate-400 mt-1">{t.orgBenefits.subtitle}</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Building2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-white">{t.orgBenefits.b1Title}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{t.orgBenefits.b1Desc}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Layers className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-white">{t.orgBenefits.b2Title}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{t.orgBenefits.b2Desc}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FileCheck2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-white">{t.orgBenefits.b3Title}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{t.orgBenefits.b3Desc}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-white">{t.orgBenefits.b4Title}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{t.orgBenefits.b4Desc}</p>
                </div>
              </div>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => openAuthModal('register', 'org')}
              icon={ArrowRight}
            >
              {language === 'ne' ? 'संस्था दर्ता गर्नुहोस्' : 'Register Organization'}
            </Button>
          </div>
        </div>
      </section>

      {/* 5. FEATURED DEMONSTRATION ORGANIZATIONS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              {t.featuredOrgs.title}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {t.featuredOrgs.disclaimer}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('discover')}
            icon={ArrowRight}
            iconPosition="right"
          >
            {t.common.exploreDirectory}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredOrganizations.slice(0, 3).map((org) => (
            <Card
              key={org.id}
              hoverable
              onClick={() => navigate('org-profile', { orgId: org.id })}
              className="flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <Badge variant="teal">
                    {language === 'ne' ? org.industryNameNe : org.industryName}
                  </Badge>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {org.city}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-800 transition-colors">
                    {language === 'ne' ? org.nameNe : org.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {language === 'ne' ? org.taglineNe : org.tagline}
                  </p>
                </div>

                <div className="pt-2 text-xs text-slate-600 space-y-1">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{org.branches[0]?.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{org.services.length} {t.common.serviceCount}</span>
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
      </section>

      {/* 6. TRUST & SECURITY */}
      <section className="bg-slate-50 border-y border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {t.trust.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              {t.trust.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-xl bg-white border border-slate-200 space-y-2">
              <ShieldCheck className="w-5 h-5 text-teal-700" />
              <h3 className="text-sm font-bold text-slate-900">{t.trust.t1Title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{t.trust.t1Desc}</p>
            </div>
            <div className="p-5 rounded-xl bg-white border border-slate-200 space-y-2">
              <Lock className="w-5 h-5 text-teal-700" />
              <h3 className="text-sm font-bold text-slate-900">{t.trust.t2Title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{t.trust.t2Desc}</p>
            </div>
            <div className="p-5 rounded-xl bg-white border border-slate-200 space-y-2">
              <FileCheck2 className="w-5 h-5 text-teal-700" />
              <h3 className="text-sm font-bold text-slate-900">{t.trust.t3Title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{t.trust.t3Desc}</p>
            </div>
            <div className="p-5 rounded-xl bg-white border border-slate-200 space-y-2">
              <Clock className="w-5 h-5 text-teal-700" />
              <h3 className="text-sm font-bold text-slate-900">{t.trust.t4Title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{t.trust.t4Desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FAQ SECTION */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {t.faq.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            {t.faq.subtitle}
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className="border border-slate-200 rounded-xl bg-white overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? -1 : index)}
                  className="w-full py-4 px-5 text-left flex items-center justify-between gap-4 font-semibold text-sm text-slate-900 hover:text-teal-800"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 8. CONTACT SECTION */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <Card className="p-8">
          <div className="text-center max-w-lg mx-auto mb-8 space-y-1">
            <h2 className="text-2xl font-bold text-slate-900">
              {t.contact.title}
            </h2>
            <p className="text-xs text-slate-500">
              {t.contact.subtitle}
            </p>
          </div>

          {contactSubmitted ? (
            <div className="p-6 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
              <CheckCircle className="w-8 h-8 text-emerald-700 mx-auto" />
              <h4 className="text-sm font-bold text-emerald-950">Inquiry Received</h4>
              <p className="text-xs text-emerald-800">{t.contact.successMsg}</p>
            </div>
          ) : (
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  id="contact-name"
                  label={t.contact.nameLabel}
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  placeholder="e.g. Suman Shrestha"
                  required
                />
                <FormField
                  id="contact-email"
                  label={t.contact.emailLabel}
                  type="email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  placeholder="suman@organization.org"
                  required
                />
              </div>

              <FormField
                id="contact-org"
                label={t.contact.orgLabel}
                value={contactForm.org}
                onChange={(e) => setContactForm({ ...contactForm, org: e.target.value })}
                placeholder="e.g. Lalitpur Health Clinic"
              />

              <FormField
                id="contact-msg"
                label={t.contact.messageLabel}
                type="textarea"
                rows={4}
                value={contactForm.message}
                onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                placeholder="Describe your inquiry or organization requirement..."
                required
              />

              {contactError && (
                <p className="text-xs text-rose-600 font-medium">{contactError}</p>
              )}

              <Button type="submit" variant="primary" size="md" icon={Send} className="w-full">
                {t.contact.sendButton}
              </Button>
            </form>
          )}
        </Card>
      </section>
    </div>
  );
}
