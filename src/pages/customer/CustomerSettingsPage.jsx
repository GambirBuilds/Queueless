import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { Card } from '../../components/common/Card.jsx';
import { FormField } from '../../components/common/FormField.jsx';
import { Button } from '../../components/common/Button.jsx';
import { CheckCircle2, Globe, User, AlertCircle } from 'lucide-react';

export function CustomerSettingsPage() {
  const { language, setLanguage, t } = useLanguage();
  const { currentUser, userProfile, updateProfile } = useAuth();

  const [fullName, setFullName] = useState(userProfile?.fullName || currentUser?.displayName || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (userProfile) {
      setFullName(userProfile.fullName || currentUser?.displayName || '');
      setPhone(userProfile.phone || '');
    }
  }, [userProfile, currentUser?.displayName]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSavedSuccess(false);

    try {
      await updateProfile({
        fullName,
        phone,
        preferredLanguage: language
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save profile settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          {t.nav.profileSettings}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          {language === 'ne'
            ? 'आफ्नो व्यक्तिगत विवरण, सम्पर्क जानकारी र भाषा प्राथमिकता व्यवस्थापन गर्नुहोस्।'
            : 'Manage your personal identity, contact information, and platform language.'}
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-xs text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          <span>Profile preferences saved to your account.</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-xs text-rose-800">
          <AlertCircle className="w-4 h-4 text-rose-700" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="p-6 space-y-4">
          <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <User className="w-3.5 h-3.5" />
            <span>Personal Information</span>
          </h3>

          <FormField
            id="cust-name"
            label={t.auth.nameLabel}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              id="cust-email"
              label={t.auth.emailLabel}
              type="email"
              value={currentUser?.email || userProfile?.email || ''}
              disabled
              helperText="Account email is tied to authentication."
            />
            <FormField
              id="cust-phone"
              label={t.auth.phoneLabel}
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+977 98XXXXXXXX"
            />
          </div>
        </Card>

        {/* Language & Regional Settings */}
        <Card className="p-6 space-y-4">
          <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <Globe className="w-3.5 h-3.5" />
            <span>Interface Language</span>
          </h3>

          <div className="grid grid-cols-2 gap-3 max-w-sm">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`p-3 rounded-xl border text-left transition-colors ${
                language === 'en'
                  ? 'border-teal-700 bg-teal-50/50 text-teal-900 font-bold'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="text-sm">English</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Default System Language</div>
            </button>

            <button
              type="button"
              onClick={() => setLanguage('ne')}
              className={`p-3 rounded-xl border text-left transition-colors ${
                language === 'ne'
                  ? 'border-teal-700 bg-teal-50/50 text-teal-900 font-bold'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="text-sm">नेपाली</div>
              <div className="text-[10px] text-slate-500 mt-0.5">नेपाली अनुवाद</div>
            </button>
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'Saving...' : t.common.save}
          </Button>
        </div>
      </form>
    </div>
  );
}
