import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useNavigation } from '../../context/NavigationContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { Card } from '../../components/common/Card.jsx';
import { FormField } from '../../components/common/FormField.jsx';
import { Button } from '../../components/common/Button.jsx';
import { ArrowLeft, LogIn, CheckCircle2 } from 'lucide-react';

export function CustomerLoginPage() {
  const { t, language } = useLanguage();
  const { navigate } = useNavigation();
  const { login, loginWithGoogle } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await login(email.trim(), password);
      setSuccess(true);
      setTimeout(() => {
        navigate('customer-dashboard');
      }, 800);
    } catch (err) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      await loginWithGoogle();
      setSuccess(true);
      setTimeout(() => {
        navigate('customer-dashboard');
      }, 800);
    } catch (err) {
      setError(err.message || 'Google sign-in failed or was cancelled.');
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
            <LogIn className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {language === 'ne' ? 'प्रयोगकर्ता लग इन' : 'Sign In to QUEUELESS'}
          </h1>
          <p className="text-xs text-slate-500">
            {language === 'ne'
              ? 'आफ्नो खातामा प्रवेश गरी टोकन र अपोइन्टमेन्ट व्यवस्थापन गर्नुहोस्।'
              : 'Sign in to access your queue tokens, appointment schedule, and portal controls.'}
          </p>
        </div>

        {success ? (
          <div className="p-6 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-700 mx-auto" />
            <h3 className="text-sm font-bold text-emerald-950">Signed In</h3>
            <p className="text-xs text-emerald-800">
              Redirecting to your portal...
            </p>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                {error}
              </div>
            )}

            <FormField
              id="login-email"
              label={language === 'ne' ? 'इमेल ठेगाना' : 'Email Address'}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
            />

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  {language === 'ne' ? 'गोप्य पासवर्ड' : 'Password'}
                </label>
                <button
                  type="button"
                  onClick={() => navigate('forgot-password')}
                  className="text-xs text-teal-800 hover:underline"
                >
                  {language === 'ne' ? 'पासवर्ड बिर्सनुभयो?' : 'Forgot password?'}
                </button>
              </div>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full px-3.5 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition-colors"
              />
            </div>

            <div className="pt-2 space-y-2.5">
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? 'Signing in...' : (language === 'ne' ? 'लग इन गर्नुहोस्' : 'Sign In')}
              </Button>

              <Button
                type="button"
                variant="outline"
                size="md"
                disabled={isSubmitting}
                onClick={handleGoogleSignIn}
                className="w-full"
              >
                {language === 'ne' ? 'Google मार्फत लग इन' : 'Continue with Google'}
              </Button>
            </div>

            <div className="pt-3 border-t border-slate-100 text-center space-y-2">
              <div className="text-xs text-slate-500">
                {language === 'ne' ? 'खाता छैन?' : "Don't have an account?"}
                {' '}
                <button
                  type="button"
                  onClick={() => navigate('customer-register')}
                  className="font-semibold text-teal-800 hover:underline"
                >
                  {language === 'ne' ? 'नयाँ दर्ता गर्नुहोस्' : 'Register here'}
                </button>
              </div>

              <div className="text-xs text-slate-500">
                {language === 'ne' ? 'संस्थागत दर्ता' : 'Represent an organization?'}
                {' '}
                <button
                  type="button"
                  onClick={() => navigate('org-register')}
                  className="font-semibold text-slate-700 hover:underline"
                >
                  {language === 'ne' ? 'संस्था दर्ता गर्नुहोस्' : 'Apply for Organization Portal'}
                </button>
              </div>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
