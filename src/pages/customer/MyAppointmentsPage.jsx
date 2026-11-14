import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useNavigation } from '../../context/NavigationContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { Card } from '../../components/common/Card.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Button } from '../../components/common/Button.jsx';
import { ConfirmDialog } from '../../components/common/ConfirmDialog.jsx';
import { Modal } from '../../components/common/Modal.jsx';
import {
  Calendar,
  Clock,
  MapPin,
  Building2
} from 'lucide-react';

import { appointmentService } from '../../services/appointmentService.js';

export function MyAppointmentsPage() {
  const { language, t } = useLanguage();
  const { navigate } = useNavigation();
  const { currentUser } = useAuth();

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [newSlot, setNewSlot] = useState('');
  const [rescheduleSaving, setRescheduleSaving] = useState(false);
  const [appointmentsList, setAppointmentsList] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUser?.uid) return;
    const unsub = appointmentService.subscribeToCustomerAppointments(
      currentUser.uid,
      (apts) => setAppointmentsList(apts),
      (err) => setError(err?.message || 'Unable to stream appointments.')
    );
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [currentUser?.uid]);

  const handleCancelClick = (apt) => {
    setSelectedAppointment(apt);
    setCancelModalOpen(true);
  };

  const confirmCancel = async () => {
    if (!selectedAppointment) return;
    setError('');
    try {
      await appointmentService.cancelAppointment(selectedAppointment.id);
      setCancelModalOpen(false);
      setSelectedAppointment(null);
    } catch (err) {
      setError(err.message || 'Failed to cancel appointment.');
      setCancelModalOpen(false);
    }
  };

  const openReschedule = (apt) => {
    const todayIso = new Date().toISOString().split('T')[0];
    setRescheduleTarget(apt);
    setNewDate(apt.appointmentDate >= todayIso ? apt.appointmentDate : todayIso);
    const defaultSlots = appointmentService.getAvailableSlots(30);
    setNewSlot(apt.timeSlot || defaultSlots[0]?.time || '10:00 AM - 10:30 AM');
    setError('');
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!rescheduleTarget) return;
    setRescheduleSaving(true);
    setError('');
    try {
      await appointmentService.rescheduleAppointment(rescheduleTarget.id, newDate, newSlot);
      setRescheduleTarget(null);
    } catch (err) {
      setError(err.message || 'Failed to reschedule appointment.');
    } finally {
      setRescheduleSaving(false);
    }
  };

  const slots = appointmentService.getAvailableSlots(30);
  const minDate = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {t.nav.myAppointments}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'ne'
              ? 'आफ्नो बुक गरिएका सेवा अपोइन्टमेन्टहरू व्यवस्थापन गर्नुहोस्।'
              : 'Manage your booked specialist and service consultations.'}
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => navigate('book-appointment')}
          icon={Calendar}
        >
          Book New Appointment
        </Button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {appointmentsList.length === 0 ? (
          <Card className="p-12 text-center text-slate-500 text-xs">
            {t.customerPortalView.noAppointments}
          </Card>
        ) : (
          appointmentsList.map((apt) => {
            const normStatus = String(apt.status || 'confirmed').toLowerCase();
            const isTerminal = ['cancelled', 'completed', 'rejected'].includes(normStatus);
            const badgeVariant = normStatus === 'cancelled' || normStatus === 'rejected'
              ? 'danger'
              : normStatus === 'completed'
              ? 'success'
              : 'info';

            return (
              <Card key={apt.id} className="p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Badge variant={badgeVariant}>{normStatus.toUpperCase()}</Badge>
                      <span className="text-xs font-mono text-slate-400">
                        Ref: {apt.referenceCode || apt.reference || apt.id}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">{apt.serviceName}</h3>

                    <div className="text-xs text-slate-600 flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{apt.orgName}</span>
                      <span>·</span>
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{apt.branchName}</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:items-end gap-1">
                    <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-teal-700" />
                      <span>{apt.appointmentDate || apt.date}</span>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-1.5 font-mono">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{apt.timeSlot}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-slate-500 text-[11px]">
                    Please arrive 10 minutes before your slot with required identification.
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('appointment-details', { appointmentId: apt.id })}
                    >
                      View Details
                    </Button>
                    {!isTerminal && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openReschedule(apt)}
                        >
                          Reschedule
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancelClick(apt)}
                          className="text-rose-600 hover:text-rose-800 hover:bg-rose-50"
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Reschedule Modal */}
      <Modal
        isOpen={Boolean(rescheduleTarget)}
        onClose={() => setRescheduleTarget(null)}
        title="Reschedule Appointment"
        subtitle={rescheduleTarget ? `${rescheduleTarget.serviceName} (${rescheduleTarget.referenceCode || rescheduleTarget.id})` : ''}
      >
        <form onSubmit={handleRescheduleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="reschedule-date" className="block text-xs font-semibold text-slate-700">
              New Appointment Date
            </label>
            <input
              id="reschedule-date"
              type="date"
              min={minDate}
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="reschedule-slot" className="block text-xs font-semibold text-slate-700">
              New Time Slot
            </label>
            <select
              id="reschedule-slot"
              value={newSlot}
              onChange={(e) => setNewSlot(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
            >
              {slots.map(s => (
                <option key={s.id} value={s.time}>{s.time}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setRescheduleTarget(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={rescheduleSaving}>
              {rescheduleSaving ? 'Updating...' : 'Confirm Reschedule'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={confirmCancel}
        title="Cancel Appointment"
        message={`Are you sure you want to cancel appointment ${selectedAppointment?.referenceCode || selectedAppointment?.id} for ${selectedAppointment?.serviceName}? This slot will be released back to the organization.`}
        confirmLabel="Yes, Cancel Booking"
        isDestructive
      />
    </div>
  );
}
