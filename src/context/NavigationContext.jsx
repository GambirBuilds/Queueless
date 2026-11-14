import React, { createContext, useContext, useState, useEffect } from 'react';

const NavigationContext = createContext(null);

export function NavigationProvider({ children }) {
  // Current view name and associated parameters
  const [currentView, setCurrentView] = useState('home');
  const [viewParams, setViewParams] = useState({});

  // Active portal layout mode: 'public' | 'customer' | 'org' | 'admin'
  const getPortalFromView = (view) => {
    // Auth & Institutional Onboarding entry flows belong to the clean public shell
    if (
      view === 'customer-login' ||
      view === 'customer-register' ||
      view === 'forgot-password' ||
      view === 'org-register' ||
      view === 'org-reg-success' ||
      view === 'org-verification-status'
    ) {
      return 'public';
    }

    // Customer private portal
    if (
      view.startsWith('customer-') ||
      view === 'queue-tracker' ||
      view === 'appointment-details' ||
      view === 'join-queue' ||
      view === 'book-appointment'
    ) {
      return 'customer';
    }

    // Organization staff, receptionist & admin portal
    if (view.startsWith('org-') || view === 'receptionist-queue') {
      return 'org';
    }

    // Platform Superadmin portal
    if (view.startsWith('admin-')) {
      return 'admin';
    }

    return 'public';
  };

  const currentPortal = getPortalFromView(currentView);

  const navigate = (view, params = {}) => {
    setCurrentView(view);
    setViewParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <NavigationContext.Provider
      value={{
        currentView,
        viewParams,
        currentPortal,
        navigate,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}
