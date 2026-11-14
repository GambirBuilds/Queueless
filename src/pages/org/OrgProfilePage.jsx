import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { organizationService } from '../../services/organizationService.js';
import { Card } from '../../components/common/Card.jsx';
import { FormField } from '../../components/common/FormField.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export function OrgProfilePage() {
  const { t } = useLanguage();
  const { userProfile } = useAuth();

  const [org, setOrg] = useState(null);
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const list = await organizationService.getPublicDirectory();
        if (!active) return;
        const target = list.find(o => o.id === userProfile?.organizationId) || list[0];
        if (target) {
          const full = await organizationService.getOrganizationById(target.id);
          if (!active) return;
          const record = full || target;
          setOrg(record);
          setName(record.name || '');
          setTagline(record.tagline || '');
          setEmail(record.email || '');
          setPhone(record.phone || '');
          setWebsite(record.website || '');
          setDescription(record.description || record.about || '');
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [userProfile?.organizationId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!org?.id) return;
    setSaving(true);
    setError('');
    try {
      await organizationService.updateOrgProfile(org.id, {
        name: name.trim(),
        tagline: tagline.trim(),
        email: email.trim(),
        phone: phone.trim(),
        website: website.trim(),
        description: description.trim()
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 flex items-center justify-center text-slate-500 text-xs gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-teal-700" />
        <span>Loading organization profile...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Organization Profile & Accreditation
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure institutional profile, legal identifiers, and public branding.
          </p>
        </div>
        <Badge variant="teal">{org?.status || 'approved'}</Badge>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>Organization profile persisted to Cloud Firestore.</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-800">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6 space-y-4">
          <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Identity & Registration
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              id="org-legal-name"
              label="Legal Organization Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <FormField
              id="org-reg-num"
              label="Statutory Registration / License #"
              value={org?.registrationNumber || 'Registered'}
              disabled
              helperText="Verified against institutional registry"
            />
          </div>

          <FormField
            id="org-tagline"
            label="Public Tagline"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField
              id="org-phone"
              label="Official Contact Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <FormField
              id="org-email"
              label="Official Contact Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <FormField
              id="org-web"
              label="Public Website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>

          <FormField
            id="org-about"
            label="About & Departmental Scope"
            type="textarea"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
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
