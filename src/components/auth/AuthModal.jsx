import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal.jsx';
import { FormField } from '../common/FormField.jsx';
import { Button } from '../common/Button.jsx';
import { useAuthModal } from '../../context/AuthModalContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useNavigation } from '../../context/NavigationContext.jsx';
import { CheckCircle2, User, Building2 } from 'lucide-react';

export function AuthModal() {
  const { isOpen, closeAuthModal, initialMode, initialRole } = useAuthModal();
  const { login, register, loginWithGoogle } = useAuth();
  const { t, language } = useLanguage();
  const { navigate } = useNavigation();

  const [mode, setMode] = useState(initialMode || 'login'); // 'login' | 'register'
  const [role, setRole] = useState(initialRole || 'customer'); // 'customer' | 'org'

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [successInfo, setSuccessInfo] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode || 'login');
      setRole(initialRole || 'customer');
      setErrors({});
      setSuccessInfo(null);
      setSubmitting(false);
    }
  }, [isOpen, initialMode, initialRole]);

  const validate = () => {
    const errs = {};
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      errs.email = t.auth.errors.emailInvalid;
    }
    if (!password || password.length < 8) {
      errs.password = t.auth.errors.passwordShort;
    }
    if (mode === 'register') {
      if (!fullName.trim()) {
        errs.fullName = t.auth.errors.nameRequired;
      }
      if (!phone.trim() || phone.length < 8) {
        errs.phone = t.auth.errors.phoneRequired;
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setErrors({});

    try {
      if (mode === 'login') {
        await login(email.trim(), password);
      } else {
        await register({
          email: email.trim(),
          password,
          fullName: fullName.trim(),
          phone: phone.trim()
        });
      }

      const targetView = mode === 'register' && role === 'org'
        ? 'org-register'
        : role === 'org'
        ? 'org-dashboard'
        : 'customer-dashboard';

      setSuccessInfo({
        message: mode === 'login'
          ? `Signed in as ${email}`
          : `Account created for ${fullName}`,
        targetView
      });

      setTimeout(() => {
        closeAuthModal();
        navigate(targetView);
      }, 800);
    } catch (err) {
      setErrors({ email: err.message || 'Authentication failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setSubmitting(true);
    setErrors({});
    try {
      await loginWithGoogle();
      closeAuthModal();
      navigate(role === 'org' ? 'org-dashboard' : 'customer-dashboard');
    } catch (err) {
      setErrors({ email: err.message || 'Google sign-in failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeAuthModal}
      title={mode === 'login' ? t.auth.loginTitle : t.auth.registerTitle}
      subtitle={language === 'ne' ? 'Firebase सुरक्षा प्रमाणीकरण' : 'Secured via Firebase Authentication'}
      maxWidth="max-w-md"
    >
      {successInfo ? (
        <div className="py-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h4 className="text-base font-semibold text-slate-900">
            {mode === 'login' ? 'Signed In' : 'Account Created'}
          </h4>
          <p className="text-xs text-slate-600 max-w-xs mx-auto">
            {successInfo.message}. Redirecting...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role Switcher Tab */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => { setRole('customer'); setErrors({}); }}
              className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-colors ${
                role === 'customer'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>{t.auth.customerTab}</span>
            </button>
            <button
              type="button"
              onClick={() => { setRole('org'); setErrors({}); }}
              className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-colors ${
                role === 'org'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>{t.auth.orgTab}</span>
            </button>
          </div>

          {mode === 'register' && (
            <>
              <FormField
                id="full-name"
                label={t.auth.nameLabel}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Sita Adhikari"
                required
                error={errors.fullName}
              />

              <FormField
                id="phone-number"
                label={t.auth.phoneLabel}
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +977 98XXXXXXXX"
                required
                error={errors.phone}
                helperText="Used for desk lookup and token verification"
              />
            </>
          )}

          <FormField
            id="auth-email"
            label={t.auth.emailLabel}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            required
            error={errors.email}
          />

          <FormField
            id="auth-password"
            label={t.auth.passwordLabel}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            required
            error={errors.password}
          />

          <div className="pt-2 space-y-2">
            <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
              {submitting
                ? 'Please wait...'
                : mode === 'login'
                ? t.auth.submitLogin
                : role === 'org'
                ? 'Create Account & Register Org'
                : t.auth.submitRegister}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={submitting}
              onClick={handleGoogleLogin}
            >
              {language === 'ne' ? 'Google मार्फत जारी राख्नुहोस्' : 'Continue with Google'}
            </Button>
          </div>

          <div className="text-center pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setErrors({});
              }}
              className="text-xs text-teal-800 hover:text-teal-950 font-medium hover:underline"
            >
              {mode === 'login' ? t.auth.switchToRegister : t.auth.switchToLogin}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
