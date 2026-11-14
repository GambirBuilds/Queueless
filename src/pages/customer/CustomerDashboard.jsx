import React from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useNavigation } from '../../context/NavigationContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { Card } from '../../components/common/Card.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Button } from '../../components/common/Button.jsx';
import {
  Ticket,
  Calendar,
  Bell,
  Search,
  Building2
} from 'lucide-react';

import { queueService } from '../../services/queueService.js';
import { appointmentService } from '../../services/appointmentService.js';
import { notificationService } from '../../services/notificationService.js';

export function CustomerDashboard() {
  const { language, t } = useLanguage();
  const { navigate } = useNavigation();
  const { currentUser, userProfile } = useAuth();

  const [customerTokens, setCustomerTokens] = React.useState([]);
  const [appointments, setAppointments] = React.useState([]);
  const [unreadNotifications, setUnreadNotifications] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let isMounted = true;
    if (!currentUser?.uid) {
      setLoading(false);
      return () => { isMounted = false; };
    }

    Promise.all([
      queueService.getCustomerTokens(currentUser.uid, userProfile?.phone || ''),
      notificationService.getUserNotifications(currentUser.uid)
    ]).then(([tokens, notifs]) => {
      if (!isMounted) return;
      const active = tokens.filter(tok => {
        const s = String(tok.status || '').toLowerCase();
        return s !== 'completed' && s !== 'cancelled';
      });
      setCustomerTokens(active);
      setUnreadNotifications(notifs.filter(n => !n.read).length);
      setLoading(false);
    }).catch(() => {
      if (isMounted) setLoading(false);
    });

    const unsub = appointmentService.subscribeToCustomerAppointments(currentUser.uid, (apts) => {
      if (isMounted) {
        const upcoming = apts.filter(a => {
          const s = String(a.status || '').toLowerCase();
          return s !== 'cancelled' && s !== 'completed';
        });
        setAppointments(upcoming);
      }
    });

    return () => {
      isMounted = false;
      if (typeof unsub === 'function') unsub();
    };
  }, [currentUser?.uid, userProfile?.phone]);

  const displayName = userProfile?.fullName || currentUser?.displayName || (language === 'ne' ? 'नागरिक' : 'Citizen');

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-teal-800 uppercase tracking-wider">
            {t.customerPortalView.welcome}
          </span>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            {language === 'ne' ? `नमस्ते, ${displayName}` : `Welcome back, ${displayName}`}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {t.customerPortalView.overviewDesc}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('join-queue')}
            icon={Ticket}
          >
            {language === 'ne' ? 'नयाँ टोकन लिनुहोस्' : 'Get Queue Token'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('book-appointment')}
            icon={Calendar}
          >
            {language === 'ne' ? 'अपोइन्टमेन्ट लिनुहोस्' : 'Book Appointment'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('discover')}
            icon={Search}
          >
            {t.common.findService}
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card
          hoverable
          onClick={() => navigate('customer-tokens')}
          className="p-5 flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
            <Ticket className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums">
              {loading ? '...' : customerTokens.length}
            </div>
            <div className="text-xs text-slate-500 font-medium">
              {t.customerPortalView.activeTokens}
            </div>
          </div>
        </Card>

        <Card
          hoverable
          onClick={() => navigate('customer-appointments')}
          className="p-5 flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums">
              {appointments.length}
            </div>
            <div className="text-xs text-slate-500 font-medium">
              {t.customerPortalView.scheduledAppointments}
            </div>
          </div>
        </Card>

        <Card
          hoverable
          onClick={() => navigate('customer-notifications')}
          className="p-5 flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums">
              {loading ? '...' : unreadNotifications}
            </div>
            <div className="text-xs text-slate-500 font-medium">
              {t.customerPortalView.notificationsTitle}
            </div>
          </div>
        </Card>
      </div>

      {/* Active Tokens Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Ticket className="w-4 h-4 text-teal-700" />
            <span>{t.customerPortalView.activeTokens}</span>
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('customer-tokens')}
          >
            {t.common.viewDetails}
          </Button>
        </div>

        {customerTokens.length === 0 ? (
          <Card className="p-8 text-center text-xs text-slate-400">
            {language === 'ne'
              ? 'कुनै सक्रिय लाइन टोकन छैन। डिजिटल लाइनमा जोडिन माथि "नयाँ टोकन लिनुहोस्" मा क्लिक गर्नुहोस्।'
              : 'No active queue tokens. Click "Get Queue Token" above to join a digital line.'}
          </Card>
        ) : (
          customerTokens.map((tok) => (
            <Card key={tok.id} className="p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-mono font-extrabold text-teal-800 bg-teal-50 px-3 py-1 rounded-lg border border-teal-200">
                    {tok.tokenNumber}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{tok.serviceName}</h3>
                    <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{tok.orgName}</span>
                      <span>·</span>
                      <span>{tok.branchName}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Badge variant="teal">{String(tok.status || 'waiting').toUpperCase()}</Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('queue-tracker', { tokenId: tok.id })}
                  >
                    {language === 'ne' ? 'स्थिति हेर्नुहोस्' : 'Track Progress'}
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Scheduled Appointments Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-700" />
            <span>{t.customerPortalView.scheduledAppointments}</span>
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('customer-appointments')}
          >
            {t.common.viewDetails}
          </Button>
        </div>

        {appointments.length === 0 ? (
          <Card className="p-8 text-center text-xs text-slate-400">
            {t.customerPortalView.noAppointments}
          </Card>
        ) : (
          appointments.map((apt) => (
            <Card key={apt.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <Badge variant="info">{String(apt.status || 'confirmed').toUpperCase()}</Badge>
                <h3 className="text-sm font-bold text-slate-900">{apt.serviceName}</h3>
                <p className="text-xs text-slate-500">
                  {apt.orgName} — {apt.branchName}
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-600">
                <div className="text-right">
                  <div className="font-semibold text-slate-900">{apt.appointmentDate || apt.date}</div>
                  <div className="text-slate-500 font-mono text-[11px]">{apt.timeSlot}</div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('appointment-details', { appointmentId: apt.id })}
                >
                  {language === 'ne' ? 'व्यवस्थापन' : 'Manage'}
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
