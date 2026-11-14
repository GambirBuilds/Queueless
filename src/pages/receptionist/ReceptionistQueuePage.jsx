import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useNavigation } from '../../context/NavigationContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { organizationService } from '../../services/organizationService.js';
import { sampleOrganizations } from '../../data/sampleOrganizations.js';
import { queueService } from '../../services/queueService.js';
import { notificationService } from '../../services/notificationService.js';
import { playQueueChime } from '../../utils/audioChime.js';
import { Card } from '../../components/common/Card.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Modal } from '../../components/common/Modal.jsx';
import { FormField } from '../../components/common/FormField.jsx';
import { ConfirmDialog } from '../../components/common/ConfirmDialog.jsx';
import { SearchInput } from '../../components/common/SearchInput.jsx';
import {
  MonitorCheck,
  UserPlus,
  PhoneCall,
  Volume2,
  CheckCircle2,
  PauseCircle,
  XCircle,
  Users,
  Play,
  Tv
} from 'lucide-react';

export function ReceptionistQueuePage() {
  const { navigate } = useNavigation();
  const { userProfile, isAdmin } = useAuth();

  const [organizations, setOrganizations] = useState(sampleOrganizations);
  const [selectedOrgId, setSelectedOrgId] = useState(userProfile?.organizationId || sampleOrganizations[0].id);

  useEffect(() => {
    let mounted = true;
    organizationService.getPublicDirectory().then(data => {
      if (mounted && Array.isArray(data) && data.length > 0) {
        setOrganizations(data);
        if (userProfile?.organizationId) {
          setSelectedOrgId(userProfile.organizationId);
        }
      }
    }).catch(() => {});
    return () => { mounted = false; };
  }, [userProfile?.organizationId]);

  const org = organizations.find(o => o.id === selectedOrgId) || organizations[0] || sampleOrganizations[0];
  const branches = org.branches || sampleOrganizations[0].branches;
  const [selectedBranchId, setSelectedBranchId] = useState(userProfile?.branchId || branches[0]?.id || 'branch-01');
  const branch = branches.find(b => b.id === selectedBranchId) || branches[0];
  const counters = branch?.counters || [];
  const services = org.services || [];

  const [selectedCounterId, setSelectedCounterId] = useState(counters[0]?.id || 'cnt-01');
  const [selectedServiceId, setSelectedServiceId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (counters.length > 0 && !counters.some(c => c.id === selectedCounterId)) {
      setSelectedCounterId(counters[0].id);
    }
  }, [counters, selectedCounterId]);

  const [tokens, setTokens] = useState([]);
  const [feedbackNotice, setFeedbackNotice] = useState(null);

  useEffect(() => {
    if (!branch?.id) return;
    const unsubscribe = queueService.subscribeToBranchTokens(
      branch.id,
      (liveTokens) => setTokens(liveTokens),
      (err) => console.warn('Branch tokens stream error', err)
    );

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [branch?.id]);

  const [walkInModalOpen, setWalkInModalOpen] = useState(false);
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInServiceId, setWalkInServiceId] = useState(services[0]?.id || '');
  const [walkInPriority, setWalkInPriority] = useState('Normal');

  useEffect(() => {
    if (services.length > 0 && !services.some(s => s.id === walkInServiceId)) {
      setWalkInServiceId(services[0].id);
    }
  }, [services, walkInServiceId]);

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    actionType: null,
    targetToken: null,
    isDestructive: false
  });

  const selectedCounter = counters.find(c => c.id === selectedCounterId) || counters[0] || { id: selectedCounterId, number: 1, name: 'Counter 1' };

  const currentlyServingToken = useMemo(() => {
    return tokens.find(
      tok => tok.counterId === selectedCounterId &&
      ['serving', 'called'].includes(String(tok.status || '').toLowerCase())
    ) || null;
  }, [tokens, selectedCounterId]);

  const waitingTokens = useMemo(() => {
    return tokens.filter(tok => {
      if (String(tok.status || '').toLowerCase() !== 'waiting') return false;
      if (selectedServiceId !== 'all' && tok.serviceId !== selectedServiceId) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return String(tok.tokenNumber || '').toLowerCase().includes(q) ||
          String(tok.customerName || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [tokens, selectedServiceId, searchQuery]);

  const recentHistoryTokens = useMemo(() => {
    return tokens.filter(tok => {
      const st = String(tok.status || '').toLowerCase();
      return st === 'completed' || st === 'skipped' || st === 'cancelled';
    }).slice(0, 8);
  }, [tokens]);

  const showFeedback = (msg) => {
    setFeedbackNotice(msg);
    setTimeout(() => setFeedbackNotice(null), 3500);
  };

  const handleCallNext = async () => {
    if (currentlyServingToken) {
      showFeedback('Please complete or hold the current customer before calling next.');
      return;
    }

    try {
      const assigned = await queueService.callNext({
        organizationId: org.id,
        branchId: branch.id,
        counterId: selectedCounterId,
        serviceId: selectedServiceId
      });

      playQueueChime();
      showFeedback(`Called ${assigned.tokenNumber} to ${selectedCounter.name}`);
    } catch (err) {
      showFeedback(err.message || 'No waiting customers eligible for this desk.');
    }
  };

  const handleRecall = async () => {
    if (!currentlyServingToken) return;
    try {
      playQueueChime();
      await queueService.recallToken(currentlyServingToken.id, selectedCounterId);
      showFeedback(`Recalled & chime triggered for ${currentlyServingToken.tokenNumber}`);
    } catch (err) {
      showFeedback(err.message || 'Error recalling token');
    }
  };

  const handleMarkServing = async () => {
    if (!currentlyServingToken) return;
    try {
      await queueService.updateTokenStatus(currentlyServingToken.id, 'serving', selectedCounter);
      showFeedback(`Now serving ${currentlyServingToken.tokenNumber}`);
    } catch (err) {
      showFeedback(err.message);
    }
  };

  const handleCompleteService = async () => {
    if (!currentlyServingToken) return;
    try {
      await queueService.updateTokenStatus(currentlyServingToken.id, 'completed', selectedCounter);
      showFeedback(`Service completed for ${currentlyServingToken.tokenNumber}`);
    } catch (err) {
      showFeedback(err.message);
    }
  };

  const handleSkipPrompt = () => {
    if (!currentlyServingToken) return;
    setConfirmDialog({
      isOpen: true,
      title: 'Skip Customer (Put On Hold)',
      message: `Are you sure you want to skip ${currentlyServingToken.tokenNumber} (${currentlyServingToken.customerName})? The token will be placed in on-hold status.`,
      actionType: 'SKIP',
      targetToken: currentlyServingToken,
      isDestructive: false
    });
  };

  const handleCancelPrompt = (tok) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Cancel Queue Token',
      message: `Are you sure you want to cancel token ${tok.tokenNumber} (${tok.customerName})? This action cannot be reversed.`,
      actionType: 'CANCEL',
      targetToken: tok,
      isDestructive: true
    });
  };

  const handleConfirmAction = async () => {
    const { actionType, targetToken } = confirmDialog;
    if (!targetToken) return;

    try {
      if (actionType === 'SKIP') {
        await queueService.updateTokenStatus(targetToken.id, 'skipped');
        showFeedback(`Token ${targetToken.tokenNumber} moved to on-hold`);
      } else if (actionType === 'CANCEL') {
        await queueService.updateTokenStatus(targetToken.id, 'cancelled');
        showFeedback(`Token ${targetToken.tokenNumber} has been cancelled`);
      }
      setConfirmDialog(prev => ({ ...prev, isOpen: false }));
    } catch (err) {
      showFeedback(err.message);
      setConfirmDialog(prev => ({ ...prev, isOpen: false }));
    }
  };

  const handleRegisterWalkIn = async (e) => {
    e.preventDefault();
    if (!walkInName.trim() || !walkInPhone.trim()) return;

    try {
      const newToken = await queueService.registerWalkIn({
        branchId: branch.id,
        serviceId: walkInServiceId,
        customerName: walkInName.trim(),
        customerPhone: walkInPhone.trim(),
        priority: walkInPriority,
        org,
        counterId: selectedCounterId
      });

      setWalkInName('');
      setWalkInPhone('');
      setWalkInModalOpen(false);
      showFeedback(`Walk-in registered: Issued token ${newToken.tokenNumber}`);
    } catch (err) {
      showFeedback(err.message);
    }
  };

  const totalWaitingAll = tokens.filter(tok => String(tok.status || '').toLowerCase() === 'waiting').length;
  const activeStatusNorm = String(currentlyServingToken?.status || '').toLowerCase();

  return (
    <div className="space-y-6">
      {/* Top Console Controls */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase bg-teal-950 text-teal-400 border border-teal-800 px-2 py-0.5 rounded">
                Station Workstation
              </span>
              <span className="text-xs text-slate-400">{org.name} · {branch?.name}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
              Receptionist & Operator Queue Console
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {isAdmin && organizations.length > 1 && (
              <select
                aria-label="Select organization"
                value={org.id}
                onChange={(e) => {
                  setSelectedOrgId(e.target.value);
                  const nextOrg = organizations.find(o => o.id === e.target.value);
                  if (nextOrg?.branches?.[0]) setSelectedBranchId(nextOrg.branches[0].id);
                }}
                className="bg-slate-800 border border-slate-700 text-xs rounded-lg px-2.5 py-1.5 text-slate-200"
              >
                {organizations.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('kiosk-display')}
              icon={Tv}
              className="border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
            >
              Lobby Display Screen
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setWalkInModalOpen(true)}
              icon={UserPlus}
            >
              Register Walk-in Citizen
            </Button>
          </div>
        </div>

        {/* Counter and Service Selector Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800 text-xs">
          <div>
            <label htmlFor="branch-select" className="block text-[11px] text-slate-400 font-semibold uppercase mb-1">
              Branch
            </label>
            <select
              id="branch-select"
              value={branch?.id || ''}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              disabled={Boolean(userProfile?.branchId && !isAdmin)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="counter-select" className="block text-[11px] text-slate-400 font-semibold uppercase mb-1">
              Active Counter Station
            </label>
            <select
              id="counter-select"
              value={selectedCounterId}
              onChange={(e) => setSelectedCounterId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              {counters.map((c) => (
                <option key={c.id} value={c.id}>
                  Desk #{c.number} — {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="service-filter" className="block text-[11px] text-slate-400 font-semibold uppercase mb-1">
              Service Queue Filter
            </label>
            <select
              id="service-filter"
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="all">All Service Lines ({totalWaitingAll} waiting)</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {feedbackNotice && (
        <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
          <span className="font-medium">{feedbackNotice}</span>
        </div>
      )}

      {/* Main 2-Column Workstation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Serving Spotlight & Station Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-6 space-y-6 border-slate-300">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  CURRENT SERVICE TERMINAL
                </span>
                <h2 className="text-base font-bold text-slate-900">
                  {selectedCounter.name} (Desk #{selectedCounter.number})
                </h2>
              </div>
              <Badge variant={currentlyServingToken ? 'teal' : 'neutral'}>
                {currentlyServingToken ? String(currentlyServingToken.status).toUpperCase() : 'Station Idle'}
              </Badge>
            </div>

            {currentlyServingToken ? (
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-slate-900 text-white text-center space-y-2">
                  <span className="text-[10px] font-mono text-teal-400 uppercase tracking-widest">
                    CURRENTLY AT COUNTER
                  </span>
                  <div className="text-5xl sm:text-6xl font-mono font-extrabold text-white">
                    {currentlyServingToken.tokenNumber}
                  </div>
                  <div className="text-sm font-semibold text-slate-200">
                    {currentlyServingToken.customerName}
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    {currentlyServingToken.customerPhone}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Service:</span>
                    <span className="font-bold text-slate-900">{currentlyServingToken.serviceName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Registration Type:</span>
                    <span className="font-semibold text-slate-700">
                      {currentlyServingToken.isWalkIn ? 'Walk-in Customer' : 'Mobile Digital Pass'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Priority Level:</span>
                    <span className="font-semibold text-teal-800">{currentlyServingToken.priority}</span>
                  </div>
                </div>

                {/* Queue Operator Action Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                  {activeStatusNorm === 'called' ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleMarkServing}
                      icon={Play}
                    >
                      Start Serving
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleCompleteService}
                      icon={CheckCircle2}
                    >
                      Complete
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRecall}
                    icon={Volume2}
                  >
                    Recall Chime
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSkipPrompt}
                    icon={PauseCircle}
                    className="text-amber-800 hover:bg-amber-50"
                  >
                    Hold / Skip
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCancelPrompt(currentlyServingToken)}
                    icon={XCircle}
                    className="text-rose-600 hover:bg-rose-50"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-xl border border-dashed border-slate-200 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center mx-auto">
                  <MonitorCheck className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900">Counter Desk is Available</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    There is currently no customer being served at this desk. Call the next customer from the waiting line.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleCallNext}
                  disabled={waitingTokens.length === 0}
                  icon={PhoneCall}
                >
                  Call Next Customer ({waitingTokens.length} waiting)
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Waiting Queue List & Recent History (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-teal-700" />
                  <span>Waiting Customers ({waitingTokens.length})</span>
                </h3>
                <span className="text-[11px] text-slate-500">Ordered by arrival time</span>
              </div>
            </div>

            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search token # or name..."
            />

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {waitingTokens.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-lg">
                  No waiting customers match your filter.
                </div>
              ) : (
                waitingTokens.map((tok) => (
                  <div
                    key={tok.id}
                    className="p-3 rounded-lg border border-slate-200 bg-white hover:border-slate-300 transition-colors flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-extrabold text-teal-900 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded text-xs">
                        {tok.tokenNumber}
                      </span>
                      <div>
                        <div className="font-bold text-slate-900">{tok.customerName}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-36">{tok.serviceName}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {tok.priority && tok.priority !== 'Normal' && (
                        <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded font-medium">
                          {tok.priority}
                        </span>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            await queueService.updateTokenStatus(tok.id, 'called', selectedCounter);
                            playQueueChime();
                            if (tok.customerUid) {
                              notificationService.emit({
                                type: 'TOKEN_CALLED',
                                title: `Token ${tok.tokenNumber} Called`,
                                message: `Please proceed to ${selectedCounter.name}.`,
                                channel: 'In-App',
                                recipientUserId: tok.customerUid,
                                organizationId: org.id,
                                relatedId: tok.id
                              });
                            }
                            showFeedback(`Called ${tok.tokenNumber}`);
                          } catch (err) {
                            showFeedback(err.message);
                          }
                        }}
                      >
                        Call
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="p-5 space-y-3">
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Recent Completed / On-Hold
            </h3>

            <div className="divide-y divide-slate-100 text-xs">
              {recentHistoryTokens.length === 0 ? (
                <div className="py-4 text-center text-slate-400">No completed tokens yet today.</div>
              ) : (
                recentHistoryTokens.map((tok) => {
                  const stNorm = String(tok.status || '').toLowerCase();
                  return (
                    <div key={tok.id} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-600 font-semibold">{tok.tokenNumber}</span>
                        <span className="text-slate-800">{tok.customerName}</span>
                      </div>
                      <Badge variant={stNorm === 'completed' ? 'success' : stNorm === 'cancelled' ? 'danger' : 'neutral'}>
                        {stNorm.toUpperCase()}
                      </Badge>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Walk-in Registration Modal */}
      <Modal
        isOpen={walkInModalOpen}
        onClose={() => setWalkInModalOpen(false)}
        title="Register Walk-in Citizen"
        subtitle={`Generate on-the-spot queue token at ${branch?.name}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleRegisterWalkIn} className="space-y-4 text-xs">
          <FormField
            id="walkin-name"
            label="Citizen Full Name"
            value={walkInName}
            onChange={(e) => setWalkInName(e.target.value)}
            placeholder="e.g. Maya Devi Gurung"
            required
          />

          <FormField
            id="walkin-phone"
            label="Mobile Phone Number"
            type="tel"
            value={walkInPhone}
            onChange={(e) => setWalkInPhone(e.target.value)}
            placeholder="+977 98XXXXXXXX"
            required
          />

          <FormField
            id="walkin-service"
            label="Required Service Counter"
            type="select"
            value={walkInServiceId}
            onChange={(e) => setWalkInServiceId(e.target.value)}
            options={services.map(s => ({
              value: s.id,
              label: `${s.name} (${s.code}) - ${s.isPaid ? `${s.feeCurrency || 'NPR'} ${s.feeAmount}` : 'Free'}`
            }))}
            required
          />

          <FormField
            id="walkin-priority"
            label="Queue Priority Allocation"
            type="select"
            value={walkInPriority}
            onChange={(e) => setWalkInPriority(e.target.value)}
            options={[
              { value: 'Normal', label: 'Standard Ticket (First Come First Served)' },
              { value: 'Senior Citizen', label: 'Senior Citizen / Disabled Priority' },
              { value: 'Urgent', label: 'Urgent / Express Triage' }
            ]}
          />

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setWalkInModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Issue Walk-in Token
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
        confirmLabel={confirmDialog.actionType === 'SKIP' ? 'Put on Hold' : 'Cancel Token'}
        isDestructive={confirmDialog.isDestructive}
      />
    </div>
  );
}
