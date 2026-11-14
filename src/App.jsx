import React from 'react';
import { LanguageProvider, useLanguage } from './context/LanguageContext.jsx';
import { NavigationProvider, useNavigation } from './context/NavigationContext.jsx';
import { AuthModalProvider } from './context/AuthModalContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { AuthModal } from './components/auth/AuthModal.jsx';

// Public Layout & Pages
import { PublicHeader } from './components/layout/PublicHeader.jsx';
import { PublicFooter } from './components/layout/PublicFooter.jsx';
import { HomePage } from './pages/public/HomePage.jsx';
import { DiscoveryPage } from './pages/public/DiscoveryPage.jsx';
import { IndustryCategoryPage } from './pages/public/IndustryCategoryPage.jsx';
import { OrgProfilePage } from './pages/public/OrgProfilePage.jsx';
import { BranchDetailsPage } from './pages/public/BranchDetailsPage.jsx';
import { AvailableServicesPage } from './pages/public/AvailableServicesPage.jsx';

// Auth Pages
import { CustomerLoginPage } from './pages/auth/CustomerLoginPage.jsx';
import { CustomerRegisterPage } from './pages/auth/CustomerRegisterPage.jsx';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage.jsx';
import { OrgRegisterPage } from './pages/auth/OrgRegisterPage.jsx';

// Customer Portal Layout & Pages
import { CustomerLayout } from './components/layout/CustomerLayout.jsx';
import { CustomerDashboard } from './pages/customer/CustomerDashboard.jsx';
import { MyTokensPage } from './pages/customer/MyTokensPage.jsx';
import { MyAppointmentsPage } from './pages/customer/MyAppointmentsPage.jsx';
import { NotificationCenter } from './pages/customer/NotificationCenter.jsx';
import { CustomerSettingsPage } from './pages/customer/CustomerSettingsPage.jsx';
import { JoinQueuePage } from './pages/customer/JoinQueuePage.jsx';
import { QueueTrackingPage } from './pages/customer/QueueTrackingPage.jsx';
import { BookAppointmentPage } from './pages/customer/BookAppointmentPage.jsx';
import { AppointmentDetailsPage } from './pages/customer/AppointmentDetailsPage.jsx';

// Organization Portal Layout & Pages
import { OrgLayout } from './components/layout/OrgLayout.jsx';
import { OrgDashboard } from './pages/org/OrgDashboard.jsx';
import { OrgProfilePage as OrgAdminProfilePage } from './pages/org/OrgProfilePage.jsx';
import { BranchManagementPage } from './pages/org/BranchManagementPage.jsx';
import { ServiceManagementPage } from './pages/org/ServiceManagementPage.jsx';
import { CounterManagementPage } from './pages/org/CounterManagementPage.jsx';
import { StaffManagementPage } from './pages/org/StaffManagementPage.jsx';
import { QueueManagementPage } from './pages/org/QueueManagementPage.jsx';
import { AppointmentManagementPage } from './pages/org/AppointmentManagementPage.jsx';
import { CustomerManagementPage } from './pages/org/CustomerManagementPage.jsx';
import { ReportsPage } from './pages/org/ReportsPage.jsx';
import { ReceptionistQueuePage } from './pages/receptionist/ReceptionistQueuePage.jsx';
import { OrgRegistrationSuccessPage } from './pages/org/OrgRegistrationSuccessPage.jsx';
import { OrgVerificationStatusPage } from './pages/org/OrgVerificationStatusPage.jsx';
import { OrgSettingsPage } from './pages/org/OrgSettingsPage.jsx';

// Platform Administration Layout & Pages
import { AdminLayout } from './components/layout/AdminLayout.jsx';
import { AdminOverview } from './pages/admin/AdminOverview.jsx';
import { OrgVerificationPage } from './pages/admin/OrgVerificationPage.jsx';
import { UserManagementPage } from './pages/admin/UserManagementPage.jsx';
import { OrgManagementPage } from './pages/admin/OrgManagementPage.jsx';
import { BranchOverviewPage } from './pages/admin/BranchOverviewPage.jsx';
import { QueueMonitoringPage } from './pages/admin/QueueMonitoringPage.jsx';
import { AppointmentMonitoringPage } from './pages/admin/AppointmentMonitoringPage.jsx';
import { PlatformActivityPage } from './pages/admin/PlatformActivityPage.jsx';
import { AuditLogPage } from './pages/admin/AuditLogPage.jsx';
import { PlatformReportsPage } from './pages/admin/PlatformReportsPage.jsx';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage.jsx';
import { KioskDisplayPage } from './pages/public/KioskDisplayPage.jsx';
import { ErrorBoundary } from './components/common/ErrorBoundary.jsx';

function AppRouter() {
  const { currentView, currentPortal } = useNavigation();

  // 0. Standalone Fullscreen Kiosk Display Mode
  if (currentView === 'kiosk-display') {
    return <KioskDisplayPage />;
  }

  // 1. Customer Portal Experience
  if (currentPortal === 'customer') {
    let viewContent = <CustomerDashboard />;
    if (currentView === 'customer-tokens') viewContent = <MyTokensPage />;
    else if (currentView === 'customer-appointments') viewContent = <MyAppointmentsPage />;
    else if (currentView === 'customer-notifications') viewContent = <NotificationCenter />;
    else if (currentView === 'customer-settings') viewContent = <CustomerSettingsPage />;
    else if (currentView === 'join-queue') viewContent = <JoinQueuePage />;
    else if (currentView === 'queue-tracker') viewContent = <QueueTrackingPage />;
    else if (currentView === 'book-appointment') viewContent = <BookAppointmentPage />;
    else if (currentView === 'appointment-details') viewContent = <AppointmentDetailsPage />;

    return <CustomerLayout>{viewContent}</CustomerLayout>;
  }

  // 2. Organization Portal Experience
  if (currentPortal === 'org') {
    let viewContent = <OrgDashboard />;
    if (currentView === 'org-profile') viewContent = <OrgAdminProfilePage />;
    else if (currentView === 'org-branches') viewContent = <BranchManagementPage />;
    else if (currentView === 'org-services') viewContent = <ServiceManagementPage />;
    else if (currentView === 'org-counters') viewContent = <CounterManagementPage />;
    else if (currentView === 'org-staff') viewContent = <StaffManagementPage />;
    else if (currentView === 'org-queues') viewContent = <QueueManagementPage />;
    else if (currentView === 'receptionist-queue') viewContent = <ReceptionistQueuePage />;
    else if (currentView === 'org-appointments') viewContent = <AppointmentManagementPage />;
    else if (currentView === 'org-customers') viewContent = <CustomerManagementPage />;
    else if (currentView === 'org-reports') viewContent = <ReportsPage />;
    else if (currentView === 'org-settings') viewContent = <OrgSettingsPage />;

    return <OrgLayout>{viewContent}</OrgLayout>;
  }

  // 3. Platform Administration Experience
  if (currentPortal === 'admin') {
    let viewContent = <AdminOverview />;
    if (currentView === 'admin-verification') viewContent = <OrgVerificationPage />;
    else if (currentView === 'admin-users') viewContent = <UserManagementPage />;
    else if (currentView === 'admin-organizations') viewContent = <OrgManagementPage />;
    else if (currentView === 'admin-branches') viewContent = <BranchOverviewPage />;
    else if (currentView === 'admin-queues') viewContent = <QueueMonitoringPage />;
    else if (currentView === 'admin-appointments') viewContent = <AppointmentMonitoringPage />;
    else if (currentView === 'admin-activity') viewContent = <PlatformActivityPage />;
    else if (currentView === 'admin-audit') viewContent = <AuditLogPage />;
    else if (currentView === 'admin-reports') viewContent = <PlatformReportsPage />;
    else if (currentView === 'admin-settings') viewContent = <AdminSettingsPage />;

    return <AdminLayout>{viewContent}</AdminLayout>;
  }

  // 4. Public Customer Experience (Default)
  let publicContent = <HomePage />;
  if (currentView === 'discover') publicContent = <DiscoveryPage />;
  else if (currentView === 'industry') publicContent = <IndustryCategoryPage />;
  else if (currentView === 'org-profile') publicContent = <OrgProfilePage />;
  else if (currentView === 'branch-details') publicContent = <BranchDetailsPage />;
  else if (currentView === 'services') publicContent = <AvailableServicesPage />;
  else if (currentView === 'customer-login') publicContent = <CustomerLoginPage />;
  else if (currentView === 'customer-register') publicContent = <CustomerRegisterPage />;
  else if (currentView === 'forgot-password') publicContent = <ForgotPasswordPage />;
  else if (currentView === 'org-register') publicContent = <OrgRegisterPage />;
  else if (currentView === 'org-reg-success') publicContent = <OrgRegistrationSuccessPage />;
  else if (currentView === 'org-verification-status') publicContent = <OrgVerificationStatusPage />;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-teal-100 selection:text-teal-900">
      <PublicHeader />
      <main className="flex-1">{publicContent}</main>
      <PublicFooter />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <AuthProvider>
          <NavigationProvider>
            <AuthModalProvider>
              <AppRouter />
              <AuthModal />
            </AuthModalProvider>
          </NavigationProvider>
        </AuthProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
