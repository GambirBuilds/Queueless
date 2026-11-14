import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useNavigation } from '../../context/NavigationContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { Card } from '../../components/common/Card.jsx';
import { FormField } from '../../components/common/FormField.jsx';
import { Button } from '../../components/common/Button.jsx';
import { ArrowLeft, KeyRound, CheckCircle2 } from 'lucide-react';

export function ForgotPasswordPage() {
  const { language } = useLanguage();
  const { navigate } = useNavigation();
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await resetPassword(email.trim());
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to dispatch reset email.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 space-y-6">
      <button
        type="button"
        onClick={() => navigate('customer-login')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>{language === 'ne' ? 'लग इनमा फर्कनुहोस्' : 'Back to Login'}</span>
      </button>

      <Card className="p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-1">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center mx-auto mb-3">
            <KeyRound className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {language === 'ne' ? 'पासवर्ड रिसेट गर्नुहोस्' : 'Reset Password'}
          </h1>
          <p className="text-xs text-slate-500">
            {language === 'ne'
              ? 'आफ्नो दर्ता भएको इमेल प्रविष्ट गर्नुहोस्, हामी निर्देशन पठाउनेछौं।'
              : 'Enter your registered email address and we will send you password recovery instructions.'}
          </p>
        </div>

        {success ? (
          <div className="p-6 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-700 mx-auto" />
            <h3 className="text-sm font-bold text-emerald-950">Reset Email Dispatched</h3>
            <p className="text-xs text-emerald-800">
              If an account is associated with <strong>{email}</strong>, a password reset link has been sent to your inbox.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('customer-login')}
              className="mt-2"
            >
              Return to Sign In
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                {error}
              </div>
            )}

            <FormField
              id="reset-email"
              label={language === 'ne' ? 'दर्ता भएको इमेल' : 'Registered Email Address'}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
            />

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? 'Sending...' : (language === 'ne' ? 'रिसेट लिङ्क पठाउनुहोस्' : 'Send Reset Link')}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
