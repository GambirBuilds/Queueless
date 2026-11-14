import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useNavigation } from '../../context/NavigationContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { organizationService } from '../../services/organizationService.js';
import { sampleOrganizations } from '../../data/sampleOrganizations.js';
import { appointmentService } from '../../services/appointmentService.js';
import { Card } from '../../components/common/Card.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Button } from '../../components/common/Button.jsx';
import { FormField } from '../../components/common/FormField.jsx';
import {
  ArrowLeft,
  Calendar,
  CalendarDays
} from 'lucide-react';

function getUpcomingDateOptions(count = 4) {
  const options = [];
  const base = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const iso = d.toISOString().split('T')[0];
    const label = i === 0
      ? `Today (${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`
      : i === 1
      ? `Tomorrow (${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`
      : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    options.push({ date: iso, label });
  }
  return options;
}

export function BookAppointmentPage() {
  const { t } = useLanguage();
  const { viewParams, navigate } = useNavigation();
  const { currentUser, userProfile } = useAuth();

  const [organizations, setOrganizations] = useState(sampleOrganizations);
  const [loadingOrgs, setLoadingOrgs] = useState(true);

  const upcomingDates = useMemo(() => getUpcomingDateOptions(4), []);

  const initialOrgId = viewParams?.orgId || sampleOrganizations[0].id;
  const [step, setStep] = useState(1);
  const [selectedOrgId, setSelectedOrgId] = useState(initialOrgId);
  const [selectedBranchId, setSelectedBranchId] = useState(sampleOrganizations[0].branches[0].id);
  const [selectedServiceId, setSelectedServiceId] = useState(sampleOrganizations[0].services[0].id);

  const [selectedDate, setSelectedDate] = useState(upcomingDates[0]?.date || new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState('');

  const [customerName, setCustomerName] = useState(userProfile?.fullName || currentUser?.displayName || '');
  const [customerEmail, setCustomerEmail] = useState(currentUser?.email || userProfile?.email || '');
  const [customerPhone, setCustomerPhone] = useState(userProfile?.phone || '');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    organizationService.getPublicDirectory().then(data => {
      if (mounted && Array.isArray(data) && data.length > 0) {
        setOrganizations(data);
        if (!viewParams?.orgId) {
          setSelectedOrgId(data[0].id);
          if (data[0].branches?.[0]) setSelectedBranchId(data[0].branches[0].id);
          if (data[0].services?.[0]) setSelectedServiceId(data[0].services[0].id);
        }
      }
      if (mounted) setLoadingOrgs(false);
    }).catch(() => {
      if (mounted) setLoadingOrgs(false);
    });
    return () => { mounted = false; };
  }, [viewParams?.orgId]);

  useEffect(() => {
    if (userProfile) {
      if (!customerName && userProfile.fullName) setCustomerName(userProfile.fullName);
      if (!customerEmail && (currentUser?.email || userProfile.email)) {
        setCustomerEmail(currentUser?.email || userProfile.email);
      }
      if (!customerPhone && userProfile.phone) setCustomerPhone(userProfile.phone);
    }
  }, [userProfile, currentUser?.email, customerName, customerEmail, customerPhone]);

  const selectedOrg = organizations.find(o => o.id === selectedOrgId) || organizations[0] || sampleOrganizations[0];
  const branchesList = selectedOrg?.branches?.length ? selectedOrg.branches : sampleOrganizations[0].branches;
  const servicesList = selectedOrg?.services?.length ? selectedOrg.services : sampleOrganizations[0].services;
  const selectedBranch = branchesList.find(b => b.id === selectedBranchId) || branchesList[0];
  const selectedService = servicesList.find(s => s.id === selectedServiceId) || servicesList[0];

  const slots = appointmentService.getAvailableSlots(selectedService.estimatedDurationMinutes);
  const activeSlot = selectedSlot && slots.some(s => s.time === selectedSlot)
    ? selectedSlot
    : (slots[0]?.time || '09:00 AM - 09:30 AM');

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!customerName.trim() || !customerEmail.trim() || !customerPhone.trim()) {
      setError('Full name, email address, and mobile phone are required.');
      return;
    }
    setIsSubmitting(true);
    setError('');

    try {
      const newAppointment = await appointmentService.bookAppointment({
        org: selectedOrg,
        branch: selectedBranch,
        service: selectedService,
        date: selectedDate,
        timeSlot: activeSlot,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim(),
        notes: notes.trim()
      });
      navigate('appointment-details', { appointmentId: newAppointment.id });
    } catch (err) {
      setError(err.message || 'Failed to book appointment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <button
        type="button"
        onClick={() => {
          if (step > 1) setStep(step - 1);
          else navigate('discover');
        }}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>{step > 1 ? 'Previous Step' : t.nav.backToDiscover}</span>
      </button>

      {/* Progress Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-teal-700" />
            <span>Book a Specialist Appointment</span>
          </h1>
          <span className="text-xs font-mono font-semibold text-slate-500">
            Step {step} of 5
          </span>
        </div>

        <div className="grid grid-cols-5 gap-2 text-center text-[10px] font-semibold">
          <div className={`p-1.5 rounded-lg ${step >= 1 ? 'bg-teal-50 text-teal-800 border border-teal-200' : 'bg-slate-50 text-slate-400'}`}>1. Org</div>
          <div className={`p-1.5 rounded-lg ${step >= 2 ? 'bg-teal-50 text-teal-800 border border-teal-200' : 'bg-slate-50 text-slate-400'}`}>2. Branch</div>
          <div className={`p-1.5 rounded-lg ${step >= 3 ? 'bg-teal-50 text-teal-800 border border-teal-200' : 'bg-slate-50 text-slate-400'}`}>3. Service</div>
          <div className={`p-1.5 rounded-lg ${step >= 4 ? 'bg-teal-50 text-teal-800 border border-teal-200' : 'bg-slate-50 text-slate-400'}`}>4. Slot</div>
          <div className={`p-1.5 rounded-lg ${step >= 5 ? 'bg-teal-50 text-teal-800 border border-teal-200' : 'bg-slate-50 text-slate-400'}`}>5. Review</div>
        </div>
      </div>

      {/* STEP 1: Select Org */}
      {step === 1 && (
        <Card className="p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900">Step 1: Choose Organization</h2>
          {loadingOrgs ? (
            <div className="text-xs text-slate-500 py-6 text-center">Loading active organizations...</div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {organizations.map((org) => (
                <div
                  key={org.id}
                  onClick={() => {
                    setSelectedOrgId(org.id);
                    if (org.branches?.[0]) setSelectedBranchId(org.branches[0].id);
                    setStep(2);
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedOrgId === org.id
                      ? 'border-teal-700 bg-teal-50/40 ring-1 ring-teal-700'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <Badge variant="teal">{org.industryName}</Badge>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">{org.name}</h3>
                    <p className="text-xs text-slate-500">{org.city}, {org.province}</p>
                  </div>
                  <Button variant="outline" size="sm">Select</Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* STEP 2: Select Branch */}
      {step === 2 && (
        <Card className="p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900">Step 2: Choose Branch Location</h2>
          <div className="grid grid-cols-1 gap-3">
            {branchesList.map((b) => (
              <div
                key={b.id}
                onClick={() => {
                  setSelectedBranchId(b.id);
                  if (servicesList[0]) setSelectedServiceId(servicesList[0].id);
                  setStep(3);
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  selectedBranchId === b.id
                    ? 'border-teal-700 bg-teal-50/40 ring-1 ring-teal-700'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{b.name}</h3>
                  <p className="text-xs text-slate-500">{b.address}</p>
                  <span className="text-[11px] text-slate-400 font-mono">{b.operatingHours}</span>
                </div>
                <Button variant="outline" size="sm">Select</Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* STEP 3: Select Service */}
      {step === 3 && (
        <Card className="p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900">Step 3: Choose Service</h2>
          <div className="grid grid-cols-1 gap-3">
            {servicesList.map((srv) => (
              <div
                key={srv.id}
                onClick={() => {
                  setSelectedServiceId(srv.id);
                  setStep(4);
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  selectedServiceId === srv.id
                    ? 'border-teal-700 bg-teal-50/40 ring-1 ring-teal-700'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-slate-400">{srv.code}</span>
                    <span className="text-xs text-teal-800 font-medium">{srv.category}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{srv.name}</h3>
                  <div className="text-xs text-slate-500">
                    Duration: ~{srv.estimatedDurationMinutes} mins · {srv.isPaid ? `${srv.feeCurrency || 'NPR'} ${srv.feeAmount}` : 'Free'}
                  </div>
                </div>
                <Button variant="outline" size="sm">Select</Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* STEP 4: Choose Date and Time Slot */}
      {step === 4 && (
        <Card className="p-6 space-y-6">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900">Step 4: Select Appointment Date & Time</h2>
            <p className="text-xs text-slate-500">Select an available consultation window.</p>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Appointment Date
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {upcomingDates.map((d) => (
                <button
                  key={d.date}
                  type="button"
                  onClick={() => setSelectedDate(d.date)}
                  className={`p-3 rounded-xl border text-xs font-medium text-center transition-colors ${
                    selectedDate === d.date
                      ? 'border-teal-700 bg-teal-50 text-teal-900 font-bold'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600 pt-1">
              <label htmlFor="custom-apt-date" className="font-medium">Or pick another date:</label>
              <input
                id="custom-apt-date"
                type="date"
                min={upcomingDates[0]?.date}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Available Time Slots
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {slots.map((slot) => (
                <button
                  key={slot.id}
                  type="button"
                  disabled={!slot.available}
                  onClick={() => setSelectedSlot(slot.time)}
                  className={`p-2.5 rounded-lg border text-xs font-mono transition-colors ${
                    !slot.available
                      ? 'opacity-40 bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                      : activeSlot === slot.time
                      ? 'border-teal-700 bg-teal-50 text-teal-900 font-bold'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer'
                  }`}
                >
                  {slot.time}
                  {!slot.available && <span className="block text-[10px] text-rose-500 font-sans">Booked</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={() => setStep(5)}
            >
              Continue to Details
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 5: Customer Details, Review & Confirm */}
      {step === 5 && (
        <form onSubmit={handleConfirmBooking} className="space-y-6">
          <Card className="p-6 space-y-5">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Step 5: Customer Details & Booking Confirmation
            </h2>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Service:</span>
                <span className="font-bold text-slate-900">{selectedService.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Facility:</span>
                <span className="font-semibold text-slate-800">{selectedOrg.name} — {selectedBranch.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Scheduled Time:</span>
                <span className="font-bold text-teal-800 font-mono">{selectedDate} ({activeSlot})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Service Fee:</span>
                <span className="font-semibold text-slate-800">
                  {selectedService.isPaid ? `${selectedService.feeCurrency || 'NPR'} ${selectedService.feeAmount}` : 'Free of Cost'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField
                id="apt-cust-name"
                label="Full Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Your full name"
                required
              />
              <FormField
                id="apt-cust-email"
                label="Confirmation Email"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="name@example.com"
                required
              />
              <FormField
                id="apt-cust-phone"
                label="Mobile Phone"
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+977 98XXXXXXXX"
                required
              />
            </div>

            <FormField
              id="apt-notes"
              label="Appointment Notes or Reference (Optional)"
              type="textarea"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Follow-up consultation, previous report..."
            />

            {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

            <div className="pt-2 flex justify-end gap-3">
              <Button type="button" variant="ghost" size="md" onClick={() => setStep(4)}>
                Change Date / Time
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={isSubmitting}
                icon={Calendar}
              >
                {isSubmitting ? 'Confirming Appointment...' : 'Confirm Appointment Booking'}
              </Button>
            </div>
          </Card>
        </form>
      )}
    </div>
  );
}
