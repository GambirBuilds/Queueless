import React, { createContext, useContext, useState } from 'react';

const AuthModalContext = createContext(null);

export function AuthModalProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [initialMode, setInitialMode] = useState('login'); // 'login' | 'register'
  const [initialRole, setInitialRole] = useState('customer'); // 'customer' | 'org'

  const openAuthModal = (mode = 'login', role = 'customer') => {
    setInitialMode(mode);
    setInitialRole(role);
    setIsOpen(true);
  };

  const closeAuthModal = () => {
    setIsOpen(false);
  };

  return (
    <AuthModalContext.Provider
      value={{
        isOpen,
        initialMode,
        initialRole,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const context = useContext(AuthModalContext);
  if (!context) {
    throw new Error('useAuthModal must be used within an AuthModalProvider');
  }
  return context;
}
