import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useNavigation } from '../../context/NavigationContext.jsx';
import { organizationService } from '../../services/organizationService.js';
import { industries } from '../../data/industries.js';
import { Card } from '../../components/common/Card.jsx';
import { FormField } from '../../components/common/FormField.jsx';
import { Button } from '../../components/common/Button.jsx';
import { ArrowLeft, Building2 } from 'lucide-react';

export function OrgRegisterPage() {
  const { t, language } = useLanguage();
  const { navigate } = useNavigation();

  const [formData, setFormData] = useState({
    name: '',
    industryId: 'healthcare',
    registrationNumber: '',
    email: '',
    phone: '',
    address: '',
    city: 'Kathmandu',
    province: 'Bagmati Province',
    website: '',
    description: '',
    ownerName: '',
    ownerEmail: '',
    ownerPhone: ''
  });

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const selIndustry = industries.find(i => i.id === formData.industryId);
    try {
      const result = await organizationService.submitRegistration({
        ...formData,
        industryName: selIndustry?.name || 'Configurable Service'
      });
      navigate('org-reg-success', { registrationId: result.id });
    } catch (err) {
      setError(err.message || 'Registration failed. Please check form inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const industryOptions = industries.map(ind => ({
    value: ind.id,
    label: language === 'ne' ? ind.nameNe : ind.name
  }));

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
      <button
        type="button"
        onClick={() => navigate('home')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>{t.nav.backToHome}</span>
      </button>

      <Card className="p-6 sm:p-8 space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-1">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center mx-auto mb-3">
            <Building2 className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {language === 'ne' ? 'संस्था दर्ता तथा अनबोर्डिङ' : 'Register Your Organization'}
          </h1>
          <p className="text-xs text-slate-500">
            {language === 'ne'
              ? 'अस्पताल, बैंक वा सरकारी निकायका लागि डिजिटल लाइन तथा अपोइन्टमेन्ट प्रणाली स्थापना गर्नुहोस्।'
              : 'Onboard your hospital, bank branch, municipal office, or automotive center to QUEUELESS.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
              {error}
            </div>
          )}

          {/* Section 1: Institutional Details */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">
              1. Institutional Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                id="org-name"
                label={language === 'ne' ? 'संस्थाको आधिकारिक नाम' : 'Organization Name'}
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g. Kathmandu Diagnostic Polyclinic"
                required
              />

              <FormField
                id="org-industry"
                label={language === 'ne' ? 'कार्य क्षेत्र' : 'Industry Sector'}
                type="select"
                value={formData.industryId}
                onChange={(e) => handleChange('industryId', e.target.value)}
                options={industryOptions}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                id="org-reg-no"
                label={language === 'ne' ? 'दर्ता / इजाजत नम्बर (वैकल्पिक)' : 'Business Registration Number (Optional)'}
                value={formData.registrationNumber}
                onChange={(e) => handleChange('registrationNumber', e.target.value)}
                placeholder="e.g. MED-NP-2024"
              />

              <FormField
                id="org-website"
                label={language === 'ne' ? 'वेबसाइट (वैकल्पिक)' : 'Official Website (Optional)'}
                value={formData.website}
                onChange={(e) => handleChange('website', e.target.value)}
                placeholder="https://example.org"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                id="org-email"
                label={language === 'ne' ? 'आधिकारिक सम्पर्क इमेल' : 'Contact Email'}
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="contact@organization.org"
                required
              />

              <FormField
                id="org-phone"
                label={language === 'ne' ? 'सम्पर्क फोन नम्बर' : 'Contact Phone'}
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+977 1-5521000"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                id="org-address"
                label={language === 'ne' ? 'ठेगाना (सडक / वडा)' : 'Headquarters Address'}
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Main Road, Ward 3"
                required
              />

              <FormField
                id="org-city"
                label={language === 'ne' ? 'शहर / जिल्ला' : 'City / Municipality'}
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder="Kathmandu"
                required
              />
            </div>

            <FormField
              id="org-desc"
              label={language === 'ne' ? 'संस्थाको संक्षिप्त विवरण' : 'Organization Description & Services Overview'}
              type="textarea"
              rows={3}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Describe your daily customer volume, service types, and branches..."
            />
          </div>

          {/* Section 2: Owner / Authorized Representative Information */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">
              2. Authorized Representative / Owner Information
            </h3>

            <FormField
              id="owner-name"
              label={language === 'ne' ? 'प्रतिनिधिको नाम' : 'Representative Full Name'}
              value={formData.ownerName}
              onChange={(e) => handleChange('ownerName', e.target.value)}
              placeholder="e.g. Dr. Anupama Thapa"
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                id="owner-email"
                label={language === 'ne' ? 'प्रतिनिधिको इमेल' : 'Representative Email'}
                type="email"
                value={formData.ownerEmail}
                onChange={(e) => handleChange('ownerEmail', e.target.value)}
                placeholder="anupama@organization.org"
                required
              />

              <FormField
                id="owner-phone"
                label={language === 'ne' ? 'प्रतिनिधिको मोबाइल' : 'Representative Mobile Phone'}
                type="tel"
                value={formData.ownerPhone}
                onChange={(e) => handleChange('ownerPhone', e.target.value)}
                placeholder="+977 9851000000"
              />
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500">
              Already registered?{' '}
              <button
                type="button"
                onClick={() => navigate('org-dashboard')}
                className="font-semibold text-teal-800 hover:underline"
              >
                Sign in to Organization Portal
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting Application...' : 'Submit Organization Application'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
