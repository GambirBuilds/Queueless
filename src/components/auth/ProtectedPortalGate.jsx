import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useAuthModal } from '../../context/AuthModalContext.jsx';
import { useNavigation } from '../../context/NavigationContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { Shield, LogIn, Lock, ArrowLeft, RefreshCw } from 'lucide-react';

export function ProtectedPortalGate({
  allowedRoles = null,
  portalTitle = 'Protected Portal',
  dark = false,
  children
}) {
  const { currentUser, userProfile, role, loading, loginWithGoogle } = useAuth();
  const { openAuthModal } = useAuthModal();
  const { navigate } = useNavigation();
  const { language } = useLanguage();
  const [authError, setAuthError] = useState('');
  const [signingIn, setSigningIn] = useState(false);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <RefreshCw className={`w-6 h-6 animate-spin ${dark ? 'text-teal-400' : 'text-teal-700'}`} />
        <p className={`text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
          {language === 'ne' ? 'प्रमाणीकरण र पहुँच अधिकार जाँच हुँदैछ...' : 'Verifying authentication & role permissions...'}
        </p>
      </div>
    );
  }

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    setAuthError('');
    try {
      await loginWithGoogle();
    } catch (err) {
      setAuthError(err.message || 'Sign-in cancelled or failed.');
    } finally {
      setSigningIn(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto my-12 px-4">
        <div
          className={`p-8 rounded-2xl border text-center space-y-5 ${
            dark
              ? 'bg-slate-950 border-slate-800 text-slate-100'
              : 'bg-white border-slate-200 text-slate-900 shadow-sm'
          }`}
        >
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto ${
              dark ? 'bg-teal-950 text-teal-400 border border-teal-800' : 'bg-teal-50 text-teal-700'
            }`}
          >
            <Lock className="w-6 h-6" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-lg font-bold tracking-tight">
              {language === 'ne' ? 'साइन इन आवश्यक छ' : `Sign In Required — ${portalTitle}`}
            </h2>
            <p className={`text-xs leading-relaxed ${dark ? 'text-slate-400' : 'text-slate-600'}`}>
              {language === 'ne'
                ? 'सुरक्षित डेटा र वास्तविक-समय क्यु पहुँचका लागि कृपया आफ्नो Firebase खाताबाट लग इन गर्नुहोस्।'
                : 'Sign in with your verified account to access live queue operations, appointments, and protected records.'}
            </p>
          </div>

          {authError && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-500">
              {authError}
            </div>
          )}

          <div className="space-y-2.5 pt-1">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={signingIn}
              className="w-full py-2.5 px-4 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              <span>
                {signingIn
                  ? (language === 'ne' ? 'साइन इन हुँदैछ...' : 'Signing in...')
                  : (language === 'ne' ? 'Google मार्फत साइन इन गर्नुहोस्' : 'Continue with Google')}
              </span>
            </button>

            <button
              type="button"
              onClick={() => openAuthModal('login', 'customer')}
              className={`w-full py-2.5 px-4 rounded-lg border text-xs font-semibold transition-colors ${
                dark
                  ? 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {language === 'ne' ? 'इमेल र पासवर्डबाट लग इन गर्नुहोस्' : 'Sign In with Email & Password'}
            </button>
          </div>

          <button
            type="button"
            onClick={() => navigate('home')}
            className={`inline-flex items-center gap-1.5 text-xs ${dark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{language === 'ne' ? 'गृहपृष्ठमा फर्कनुहोस्' : 'Return to Public Directory'}</span>
          </button>
        </div>
      </div>
    );
  }

  const effectiveRole =
    currentUser.email === 'karkiamir15@gmail.com' ? 'platform_admin' : role;

  if (userProfile?.accountStatus === 'suspended') {
    return (
      <div className="max-w-md mx-auto my-12 px-4">
        <div className="p-8 rounded-2xl border border-rose-300 bg-rose-50 text-center space-y-3">
          <Shield className="w-10 h-10 text-rose-600 mx-auto" />
          <h2 className="text-lg font-bold text-rose-950">Account Suspended</h2>
          <p className="text-xs text-rose-800">
            Your account ({currentUser.email}) has been suspended by platform administration.
          </p>
        </div>
      </div>
    );
  }

  if (Array.isArray(allowedRoles) && !allowedRoles.includes(effectiveRole)) {
    return (
      <div className="max-w-lg mx-auto my-12 px-4">
        <div
          className={`p-8 rounded-2xl border text-center space-y-4 ${
            dark
              ? 'bg-slate-950 border-slate-800 text-slate-100'
              : 'bg-white border-slate-200 text-slate-900 shadow-sm'
          }`}
        >
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold">
            {language === 'ne' ? 'पहुँच अनुमति छैन (RBAC)' : 'Access Restricted (Role-Based Access Control)'}
          </h2>
          <p className={`text-xs leading-relaxed ${dark ? 'text-slate-400' : 'text-slate-600'}`}>
            Signed in as <strong>{currentUser.email}</strong> (Role:{' '}
            <span className="font-mono uppercase">{effectiveRole}</span>). This portal requires{' '}
            <span className="font-mono">{allowedRoles.join(' / ')}</span> privileges assigned in Cloud Firestore.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('customer-dashboard')}
              className="px-4 py-2 rounded-lg bg-teal-700 text-white text-xs font-semibold hover:bg-teal-800"
            >
              Go to Customer Portal
            </button>
            <button
              type="button"
              onClick={() => navigate('home')}
              className={`px-4 py-2 rounded-lg border text-xs font-semibold ${
                dark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Public Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
