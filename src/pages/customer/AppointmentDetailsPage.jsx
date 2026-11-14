import React, { useState, useEffect } from 'react';
import { useNavigation } from '../../context/NavigationContext.jsx';
import { appointmentService } from '../../services/appointmentService.js';
import { Card } from '../../components/common/Card.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Button } from '../../components/common/Button.jsx';
import { ConfirmDialog } from '../../components/common/ConfirmDialog.jsx';
import { Modal } from '../../components/common/Modal.jsx';
import {
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  QrCode
} from 'lucide-react';

export function AppointmentDetailsPage() {
  const { viewParams, navigate } = useNavigation();
  const appointmentId = viewParams?.appointmentId || '';

  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newSlot, setNewSlot] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!appointmentId) {
      setLoading(false);
      return;
    }
    let isMounted = true;
    appointmentService.getAppointmentById(appointmentId).then(apt => {
      if (isMounted) {
        setAppointment(apt);
        setLoading(false);
      }
    }).catch(() => {
      if (isMounted) setLoading(false);
    });
    return () => { isMounted = false; };
  }, [appointmentId]);

  const handleConfirmCancel = async () => {
    if (!appointment) return;
    setError('');
    try {
      await appointmentService.cancelAppointment(appointment.id);
      setAppointment(prev => ({ ...prev, status: 'cancelled' }));
      setCancelModalOpen(false);
    } catch (err) {
      setError(err.message || 'Failed to cancel appointment.');
      setCancelModalOpen(false);
    }
  };

  const openReschedule = () => {
    if (!appointment) return;
    const todayIso = new Date().toISOString().split('T')[0];
    setNewDate(appointment.appointmentDate >= todayIso ? appointment.appointmentDate : todayIso);
    const slots = appointmentService.getAvailableSlots(30);
    setNewSlot(appointment.timeSlot || slots[0]?.time || '10:00 AM - 10:30 AM');
    setError('');
    setRescheduleOpen(true);
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!appointment) return;
    setSaving(true);
    setError('');
    try {
      const updated = await appointmentService.rescheduleAppointment(appointment.id, newDate, newSlot);
      setAppointment(prev => ({
        ...prev,
        appointmentDate: updated.appointmentDate || newDate,
        timeSlot: updated.timeSlot || newSlot,
        status: updated.status || 'rescheduled'
      }));
      setRescheduleOpen(false);
    } catch (err) {
      setError(err.message || 'Failed to reschedule appointment.');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !appointment) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <Clock className="w-8 h-8 text-teal-700 animate-spin mx-auto" />
        <h3 className="text-base font-bold text-slate-800">Loading Appointment Pass...</h3>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <h3 className="text-base font-bold text-slate-800">Appointment Record Not Found</h3>
        <div className="flex justify-center gap-3">
          <Button variant="outline" onClick={() => navigate('customer-appointments')}>My Appointments</Button>
          <Button variant="primary" onClick={() => navigate('book-appointment')}>Book New Consultation</Button>
        </div>
      </div>
    );
  }

  const normStatus = String(appointment.status || 'confirmed').toLowerCase();
  const isTerminal = ['cancelled', 'completed', 'rejected'].includes(normStatus);
  const badgeVariant = normStatus === 'cancelled' || normStatus === 'rejected'
    ? 'danger'
    : normStatus === 'completed'
    ? 'success'
    : 'info';

  const slots = appointmentService.getAvailableSlots(30);
  const minDate = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <button
        type="button"
        onClick={() => navigate('customer-appointments')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to My Appointments</span>
      </button>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
          {error}
        </div>
      )}

      <Card className="p-6 sm:p-8 space-y-6 bg-white">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant={badgeVariant}>
                {normStatus.toUpperCase()}
              </Badge>
              <span className="font-mono text-xs text-slate-500 font-bold">
                {appointment.referenceCode || appointment.id}
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">{appointment.serviceName}</h1>
            <p className="text-xs text-slate-500">{appointment.orgName} — {appointment.branchName}</p>
          </div>

          {!isTerminal && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={openReschedule}>
                Reschedule
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCancelModalOpen(true)}
                className="text-rose-600 border-rose-200 hover:bg-rose-50"
              >
                Cancel
              </Button>
            </div>
          )}
        </div>

        {/* Schedule Highlight Box */}
        <div className="p-5 rounded-xl bg-teal-50/70 border border-teal-200/80 flex items-center justify-between text-xs">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-teal-800 tracking-wider">Scheduled Window</span>
            <div className="text-base font-bold text-teal-950 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-teal-700" />
              <span>{appointment.appointmentDate || appointment.date}</span>
            </div>
            <div className="text-slate-600 font-mono flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{appointment.timeSlot}</span>
            </div>
          </div>

          <div className="w-14 h-14 bg-white rounded-lg border border-teal-200 p-1 flex flex-col items-center justify-center text-teal-800">
            <QrCode className="w-9 h-9" />
            <span className="text-[8px] font-mono">PASS</span>
          </div>
        </div>

        {/* Details Grid */}
        <div className="divide-y divide-slate-100 text-xs text-slate-600">
          <div className="py-2.5 flex justify-between">
            <span className="text-slate-400">Customer Name:</span>
            <span className="font-semibold text-slate-800">{appointment.customerName}</span>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="text-slate-400">Email Address:</span>
            <span className="font-semibold text-slate-800">{appointment.customerEmail}</span>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="text-slate-400">Telephone Number:</span>
            <span className="font-mono text-slate-800">{appointment.customerPhone}</span>
          </div>
          {appointment.notes && (
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-400">Notes / Remarks:</span>
              <span className="text-slate-700">{appointment.notes}</span>
            </div>
          )}
        </div>

        {/* Preparation instructions */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-teal-700" />
            <span>Before You Arrive:</span>
          </div>
          <ul className="list-disc list-inside text-slate-600 space-y-1 pl-1 text-[11px]">
            <li>Please arrive 10 minutes prior to your designated time slot.</li>
            <li>Present this reference code ({appointment.referenceCode || appointment.id}) at the reception counter.</li>
            <li>Bring your official government identity document and relevant supporting records.</li>
          </ul>
        </div>
      </Card>

      <Modal
        isOpen={rescheduleOpen}
        onClose={() => setRescheduleOpen(false)}
        title="Reschedule Appointment"
        subtitle={`${appointment.serviceName} (${appointment.referenceCode || appointment.id})`}
      >
        <form onSubmit={handleRescheduleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="detail-reschedule-date" className="block text-xs font-semibold text-slate-700">
              New Appointment Date
            </label>
            <input
              id="detail-reschedule-date"
              type="date"
              min={minDate}
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="detail-reschedule-slot" className="block text-xs font-semibold text-slate-700">
              New Time Slot
            </label>
            <select
              id="detail-reschedule-slot"
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
            <Button type="button" variant="ghost" size="sm" onClick={() => setRescheduleOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={saving}>
              {saving ? 'Updating...' : 'Confirm Reschedule'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={handleConfirmCancel}
        title="Cancel Appointment"
        message={`Are you sure you wish to cancel this appointment (${appointment.referenceCode || appointment.id})? The scheduled time slot will be made available for other citizens.`}
        confirmLabel="Yes, Cancel Booking"
        isDestructive
      />
    </div>
  );
}
