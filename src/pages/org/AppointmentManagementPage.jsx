import React, { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { appointmentService } from '../../services/appointmentService.js';
import { Badge } from '../../components/common/Badge.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Table } from '../../components/common/Table.jsx';
import { Modal } from '../../components/common/Modal.jsx';
import { ConfirmDialog } from '../../components/common/ConfirmDialog.jsx';
import {
  CalendarDays,
  CheckCircle2,
  XCircle,
  UserCheck
} from 'lucide-react';

export function AppointmentManagementPage() {
  const { t } = useLanguage();
  const { userProfile } = useAuth();
  const orgId = userProfile?.organizationId || 'org-health-01';

  const [appointments, setAppointments] = useState([]);
  const [selectedDateFilter, setSelectedDateFilter] = useState('all');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newSlot, setNewSlot] = useState('10:00 AM - 10:30 AM');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    action: null,
    target: null,
    isDestructive: false
  });

  useEffect(() => {
    const unsub = appointmentService.subscribeToOrgAppointments(
      orgId,
      (apts) => setAppointments(apts),
      (err) => setError(err?.message || 'Unable to load appointments.')
    );
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [orgId]);

  const showNotice = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 3500);
  };

  const uniqueDates = useMemo(() => {
    const dates = new Set(appointments.map(a => a.appointmentDate).filter(Boolean));
    return Array.from(dates).sort();
  }, [appointments]);

  const filtered = useMemo(() => {
    if (selectedDateFilter === 'all') return appointments;
    return appointments.filter(a => a.appointmentDate === selectedDateFilter);
  }, [appointments, selectedDateFilter]);

  const handleUpdateStatus = async (apt, nextStatus) => {
    setError('');
    try {
      await appointmentService.updateAppointmentStatus(apt.id, nextStatus);
      setSelectedAppointment(null);
      showNotice(`Appointment status updated to ${nextStatus}.`);
    } catch (err) {
      setError(err.message || 'Status update failed.');
    }
  };

  const handleConfirmAction = async () => {
    const { action, target } = confirmDialog;
    if (target && action) {
      await handleUpdateStatus(target, action);
    }
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAppointment) return;
    setError('');
    try {
      await appointmentService.rescheduleAppointment(selectedAppointment.id, newDate, newSlot);
      setRescheduleModalOpen(false);
      setSelectedAppointment(null);
      showNotice(`Appointment rescheduled to ${newDate} (${newSlot}).`);
    } catch (err) {
      setError(err.message || 'Failed to reschedule appointment.');
    }
  };

  const getStatusBadge = (status = 'confirmed') => {
    const norm = String(status).toLowerCase();
    switch (norm) {
      case 'confirmed': return <Badge variant="info">Confirmed</Badge>;
      case 'arrived': return <Badge variant="teal">Customer Arrived</Badge>;
      case 'completed': return <Badge variant="success">Completed</Badge>;
      case 'rescheduled': return <Badge variant="warning">Rescheduled</Badge>;
      case 'cancelled': return <Badge variant="danger">Cancelled</Badge>;
      case 'rejected': return <Badge variant="danger">Rejected</Badge>;
      default: return <Badge variant="neutral">{norm.toUpperCase()}</Badge>;
    }
  };

  const columns = [
    {
      header: 'Customer Details',
      accessor: 'customerName',
      render: (row) => (
        <div>
          <div className="font-bold text-slate-900">{row.customerName}</div>
          <div className="text-xs text-slate-500 font-mono">{row.customerPhone}</div>
        </div>
      )
    },
    {
      header: 'Service Requested',
      accessor: 'serviceName',
      render: (row) => (
        <div>
          <span className="font-medium text-slate-800">{row.serviceName}</span>
          <span className="text-[10px] text-slate-400 font-mono block">Ref: {row.referenceCode || row.id}</span>
        </div>
      )
    },
    {
      header: 'Date & Time Slot',
      accessor: 'appointmentDate',
      render: (row) => (
        <span className="font-mono text-xs text-slate-700">
          {row.appointmentDate} at {row.timeSlot}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => getStatusBadge(row.status)
    },
    {
      header: 'Actions',
      accessor: 'id',
      align: 'right',
      render: (row) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSelectedAppointment(row);
            setNewDate(row.appointmentDate || new Date().toISOString().split('T')[0]);
            setNewSlot(row.timeSlot || '10:00 AM - 10:30 AM');
          }}
        >
          Manage
        </Button>
      )
    }
  ];

  const slots = appointmentService.getAvailableSlots(30);
  const minDate = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {t.orgPortalView.appointmentManagement}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage scheduled customer consultations, mark arrivals, reschedule, or complete sessions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            aria-label="Filter appointments by date"
            value={selectedDateFilter}
            onChange={(e) => setSelectedDateFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-700"
          >
            <option value="all">All Dates ({appointments.length})</option>
            {uniqueDates.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {notice && (
        <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          {error}
        </div>
      )}

      <Table
        columns={columns}
        data={filtered}
        keyField="id"
      />

      {/* Appointment Detail & Actions Modal */}
      <Modal
        isOpen={Boolean(selectedAppointment && !rescheduleModalOpen)}
        onClose={() => setSelectedAppointment(null)}
        title="Manage Appointment"
        subtitle={`Reference: ${selectedAppointment?.referenceCode || selectedAppointment?.id}`}
        maxWidth="max-w-md"
      >
        {selectedAppointment && (() => {
          const normStatus = String(selectedAppointment.status || '').toLowerCase();
          const isTerminal = ['completed', 'cancelled', 'rejected'].includes(normStatus);
          return (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl space-y-2 border border-slate-200">
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer:</span>
                  <span className="font-bold text-slate-900">{selectedAppointment.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Service:</span>
                  <span className="font-semibold text-slate-800">{selectedAppointment.serviceName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date & Slot:</span>
                  <span className="font-mono font-semibold text-teal-900">
                    {selectedAppointment.appointmentDate} ({selectedAppointment.timeSlot})
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Current Status:</span>
                  <span>{getStatusBadge(selectedAppointment.status)}</span>
                </div>
              </div>

              {!isTerminal && (
                <div className="space-y-2 pt-2">
                  <span className="font-semibold text-slate-700 block">Status Actions:</span>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleUpdateStatus(selectedAppointment, 'arrived')}
                      disabled={normStatus === 'arrived'}
                      icon={UserCheck}
                    >
                      Mark Arrived
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateStatus(selectedAppointment, 'completed')}
                      icon={CheckCircle2}
                    >
                      Mark Completed
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRescheduleModalOpen(true)}
                      icon={CalendarDays}
                    >
                      Reschedule
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmDialog({
                        isOpen: true,
                        title: 'Cancel Appointment',
                        message: `Cancel appointment for ${selectedAppointment.customerName}?`,
                        action: 'cancelled',
                        target: selectedAppointment,
                        isDestructive: true
                      })}
                      className="text-rose-600 hover:bg-rose-50"
                      icon={XCircle}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </Modal>

      {/* Reschedule Modal */}
      <Modal
        isOpen={rescheduleModalOpen}
        onClose={() => setRescheduleModalOpen(false)}
        title="Reschedule Appointment"
        subtitle={`Reference: ${selectedAppointment?.referenceCode || selectedAppointment?.id}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleRescheduleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label htmlFor="org-resched-date" className="block text-xs font-semibold text-slate-700">
              New Appointment Date
            </label>
            <input
              id="org-resched-date"
              type="date"
              min={minDate}
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="org-resched-slot" className="block text-xs font-semibold text-slate-700">
              New Time Slot
            </label>
            <select
              id="org-resched-slot"
              value={newSlot}
              onChange={(e) => setNewSlot(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white"
            >
              {slots.map(s => (
                <option key={s.id} value={s.time}>{s.time}</option>
              ))}
            </select>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setRescheduleModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Confirm Reschedule
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={handleConfirmAction}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel="Confirm"
        isDestructive={confirmDialog.isDestructive}
      />
    </div>
  );
}
