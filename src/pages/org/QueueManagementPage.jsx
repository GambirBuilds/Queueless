import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { organizationService } from '../../services/organizationService.js';
import { sampleOrganizations } from '../../data/sampleOrganizations.js';
import { queueService } from '../../services/queueService.js';
import { Card } from '../../components/common/Card.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Button } from '../../components/common/Button.jsx';
import { PauseCircle, PhoneCall, CheckCircle2, Play, XCircle } from 'lucide-react';

export function QueueManagementPage() {
  const { t } = useLanguage();
  const { userProfile, isAdmin } = useAuth();

  const [organizations, setOrganizations] = useState(sampleOrganizations);
  const [selectedOrgId, setSelectedOrgId] = useState(userProfile?.organizationId || sampleOrganizations[0].id);
  const [tokens, setTokens] = useState([]);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const loadOrgs = async () => {
    try {
      const data = await organizationService.getPublicDirectory();
      if (Array.isArray(data) && data.length > 0) {
        setOrganizations(data);
        if (userProfile?.organizationId) {
          setSelectedOrgId(userProfile.organizationId);
        }
      }
    } catch {
      // fallback already set
    }
  };

  useEffect(() => {
    loadOrgs();
  }, [userProfile?.organizationId]);

  const org = organizations.find(o => o.id === selectedOrgId) || organizations[0] || sampleOrganizations[0];
  const branches = org.branches || [];
  const [selectedBranchId, setSelectedBranchId] = useState(userProfile?.branchId || branches[0]?.id || 'branch-01');
  const branch = branches.find(b => b.id === selectedBranchId) || branches[0] || sampleOrganizations[0].branches[0];
  const counters = branch?.counters || [];
  const services = org.services || [];

  useEffect(() => {
    if (!branch?.id) return;
    const unsub = queueService.subscribeToBranchTokens(
      branch.id,
      (liveTokens) => setTokens(liveTokens),
      (err) => setError(err?.message || 'Queue listener error.')
    );
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [branch?.id]);

  const showNotice = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 3500);
  };

  const handleCallNext = async (counter) => {
    setError('');
    try {
      const assigned = await queueService.callNext({
        organizationId: org.id,
        branchId: branch.id,
        counterId: counter.id,
        serviceId: 'all'
      });
      showNotice(`Called ${assigned.tokenNumber} to ${counter.name}.`);
    } catch (err) {
      setError(err.message || 'No waiting tokens available.');
    }
  };

  const handleComplete = async (token, counter) => {
    setError('');
    try {
      await queueService.updateTokenStatus(token.id, 'completed', counter);
      showNotice(`Completed token ${token.tokenNumber}.`);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleHold = async (token) => {
    setError('');
    try {
      await queueService.updateTokenStatus(token.id, 'skipped');
      showNotice(`Placed token ${token.tokenNumber} on hold / skipped.`);
    } catch (err) {
      setError(err.message || 'Failed to place token on hold.');
    }
  };

  const handleToggleServiceQueue = async (service, status) => {
    setError('');
    try {
      await queueService.toggleQueueStatus({
        organizationId: org.id,
        branchId: branch.id,
        serviceId: service.id,
        status
      });
      showNotice(`${service.name} queue set to ${status.toUpperCase()}.`);
      await loadOrgs();
    } catch (err) {
      setError(err.message || 'Failed to update service queue status.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {t.orgPortalView.queueManagement}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Live branch desk supervision and service queue open/pause controls for <strong>{branch.name}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && organizations.length > 1 && (
            <select
              aria-label="Select organization"
              value={org.id}
              onChange={(e) => {
                setSelectedOrgId(e.target.value);
                const next = organizations.find(o => o.id === e.target.value);
                if (next?.branches?.[0]) setSelectedBranchId(next.branches[0].id);
              }}
              className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-700"
            >
              {organizations.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          )}
          <select
            aria-label="Select branch"
            value={branch.id}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            disabled={Boolean(userProfile?.branchId && !isAdmin)}
            className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-700"
          >
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
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

      {/* Service Queue Open / Pause / Close Controls */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Service Line Status Controls</h2>
          <span className="text-xs text-slate-500">
            Waiting across branch: {tokens.filter(t => String(t.status || '').toLowerCase() === 'waiting').length}
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {services.map((srv) => {
            const qStatus = String(srv.queueStatus || 'open').toLowerCase();
            const waitingForSrv = tokens.filter(
              tok => tok.serviceId === srv.id && String(tok.status || '').toLowerCase() === 'waiting'
            ).length;

            return (
              <div key={srv.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{srv.name}</span>
                    <Badge variant={qStatus === 'open' ? 'success' : qStatus === 'paused' ? 'warning' : 'danger'}>
                      {qStatus.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="text-slate-500">
                    Code: {srv.code} · {waitingForSrv} waiting in queue
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant={qStatus === 'open' ? 'primary' : 'outline'}
                    size="sm"
                    icon={Play}
                    disabled={qStatus === 'open'}
                    onClick={() => handleToggleServiceQueue(srv, 'open')}
                  >
                    Open
                  </Button>
                  <Button
                    variant={qStatus === 'paused' ? 'primary' : 'outline'}
                    size="sm"
                    icon={PauseCircle}
                    disabled={qStatus === 'paused'}
                    onClick={() => handleToggleServiceQueue(srv, 'paused')}
                  >
                    Pause
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={XCircle}
                    disabled={qStatus === 'closed'}
                    className="text-rose-600 hover:bg-rose-50"
                    onClick={() => handleToggleServiceQueue(srv, 'closed')}
                  >
                    Close
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Counter Terminals Station Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {counters.map((c) => {
          const activeToken = tokens.find(
            tok => tok.counterId === c.id && ['called', 'serving'].includes(String(tok.status || '').toLowerCase())
          );

          return (
            <Card key={c.id} className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-mono font-bold text-teal-800 bg-teal-50 px-3 py-1 rounded-md border border-teal-200">
                  Desk #{c.number}
                </span>
                <Badge variant={activeToken ? 'teal' : 'neutral'}>
                  {activeToken ? String(activeToken.status).toUpperCase() : 'IDLE'}
                </Badge>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">{c.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Terminal ID: {c.id}
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-1">
                <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                  Serving Token
                </span>
                <div className="text-2xl font-mono font-bold text-slate-900">
                  {activeToken ? activeToken.tokenNumber : '--'}
                </div>
                <p className="text-[11px] text-slate-500 truncate">
                  {activeToken ? `${activeToken.customerName} · ${activeToken.serviceName}` : 'Available for next call'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                {activeToken ? (
                  <>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={CheckCircle2}
                      onClick={() => handleComplete(activeToken, c)}
                    >
                      Complete
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={PauseCircle}
                      onClick={() => handleHold(activeToken)}
                    >
                      Hold
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    icon={PhoneCall}
                    className="col-span-2"
                    onClick={() => handleCallNext(c)}
                  >
                    Call Next Waiting
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
