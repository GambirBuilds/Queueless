import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useNavigation } from '../../context/NavigationContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { authService } from '../../services/authService.js';
import { Card } from '../../components/common/Card.jsx';
import { FormField } from '../../components/common/FormField.jsx';
import { Button } from '../../components/common/Button.jsx';
import { ArrowLeft, UserPlus, CheckCircle2 } from 'lucide-react';

export function CustomerRegisterPage() {
  const { t, language } = useLanguage();
  const { navigate } = useNavigation();
  const { register, loginWithGoogle } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    const validation = authService.validateRegistration(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      setIsSubmitting(false);
      return;
    }

    try {
      await register({
        email: formData.email.trim(),
        password: formData.password,
        fullName: formData.fullName.trim(),
        phone: formData.phoneNumber.trim()
      });
      setSuccess(true);
      setTimeout(() => {
        navigate('customer-dashboard');
      }, 900);
    } catch (err) {
      setErrors({ form: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsSubmitting(true);
    setErrors({});
    try {
      await loginWithGoogle();
      setSuccess(true);
      setTimeout(() => {
        navigate('customer-dashboard');
      }, 900);
    } catch (err) {
      setErrors({ form: err.message || 'Google sign-in failed.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 space-y-6">
      <button
        type="button"
        onClick={() => navigate('home')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>{t.nav.backToHome}</span>
      </button>

      <Card className="p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-1">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center mx-auto mb-3">
            <UserPlus className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {language === 'ne' ? 'सेवाग्राही नयाँ खाता खोल्नुहोस्' : 'Create Customer Account'}
          </h1>
          <p className="text-xs text-slate-500">
            {language === 'ne'
              ? 'डिजिटल टोकन लिन र पालो स्थिति हेर्न निःशुल्क खाता दर्ता गर्नुहोस्।'
              : 'Register to manage queue tokens, view position in line, and book appointments.'}
          </p>
        </div>

        {success ? (
          <div className="p-6 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-700 mx-auto" />
            <h3 className="text-sm font-bold text-emerald-950">Registration Successful</h3>
            <p className="text-xs text-emerald-800">
              Welcome to QUEUELESS. Redirecting to your Customer Portal...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.form && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                {errors.form}
              </div>
            )}

            <FormField
              id="reg-fullname"
              label={language === 'ne' ? 'पूरा नाम' : 'Full Name'}
              value={formData.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              placeholder="e.g. Sita Adhikari"
              required
              error={errors.fullName}
            />

            <FormField
              id="reg-email"
              label={language === 'ne' ? 'इमेल ठेगाना' : 'Email Address'}
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="name@example.com"
              required
              error={errors.email}
            />

            <FormField
              id="reg-phone"
              label={language === 'ne' ? 'मोबाइल नम्बर' : 'Mobile Phone Number'}
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => handleChange('phoneNumber', e.target.value)}
              placeholder="+977 98XXXXXXXX"
              required
              error={errors.phoneNumber}
              helperText="Used for desk lookup and token verification"
            />

            <FormField
              id="reg-password"
              label={language === 'ne' ? 'गोप्य पासवर्ड' : 'Password'}
              type="password"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              placeholder="At least 8 characters"
              required
              error={errors.password}
            />

            <FormField
              id="reg-conf-password"
              label={language === 'ne' ? 'पासवर्ड पुष्टि गर्नुहोस्' : 'Confirm Password'}
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              placeholder="Re-type password"
              required
              error={errors.confirmPassword}
            />

            <div className="pt-2 space-y-2.5">
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? 'Creating Account...' : (language === 'ne' ? 'खाता बनाउनुहोस्' : 'Create Customer Account')}
              </Button>

              <Button
                type="button"
                variant="outline"
                size="md"
                disabled={isSubmitting}
                onClick={handleGoogleSignUp}
                className="w-full"
              >
                {language === 'ne' ? 'Google मार्फत दर्ता गर्नुहोस्' : 'Continue with Google'}
              </Button>
            </div>

            <div className="pt-3 border-t border-slate-100 text-center space-y-2">
              <div className="text-xs text-slate-500">
                {language === 'ne' ? 'पहिले नै खाता छ?' : 'Already have an account?'}
                {' '}
                <button
                  type="button"
                  onClick={() => navigate('customer-login')}
                  className="font-semibold text-teal-800 hover:underline"
                >
                  {language === 'ne' ? 'यहाँ लग इन गर्नुहोस्' : 'Sign in here'}
                </button>
              </div>

              <div className="text-xs text-slate-500">
                {language === 'ne' ? 'संस्थागत प्रयोगकर्ता हुनुहुन्छ?' : 'Represent an organization?'}
                {' '}
                <button
                  type="button"
                  onClick={() => navigate('org-register')}
                  className="font-semibold text-slate-700 hover:underline"
                >
                  {language === 'ne' ? 'संस्था दर्ता गर्नुहोस्' : 'Register your organization'}
                </button>
              </div>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
