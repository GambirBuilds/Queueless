import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useNavigation } from '../../context/NavigationContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { Card } from '../../components/common/Card.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Modal } from '../../components/common/Modal.jsx';
import { ConfirmDialog } from '../../components/common/ConfirmDialog.jsx';
import {
  Ticket,
  Building2,
  MapPin,
  Clock
} from 'lucide-react';

import { queueService } from '../../services/queueService.js';

export function MyTokensPage() {
  const { language, t } = useLanguage();
  const { navigate } = useNavigation();
  const { currentUser, userProfile } = useAuth();
  const [selectedTokenModal, setSelectedTokenModal] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [customerTokens, setCustomerTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadTokens = useCallback(async () => {
    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const tokens = await queueService.getCustomerTokens(currentUser.uid, userProfile?.phone || '');
      setCustomerTokens(tokens);
    } catch (err) {
      setError(err.message || 'Unable to load your queue tokens.');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid, userProfile?.phone]);

  useEffect(() => {
    loadTokens();
  }, [loadTokens]);

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    try {
      await queueService.updateTokenStatus(cancelTarget.id, 'cancelled');
      setCancelTarget(null);
      await loadTokens();
    } catch (err) {
      setError(err.message || 'Failed to cancel token.');
      setCancelTarget(null);
    }
  };

  const activeTokens = customerTokens.filter(tok => {
    const st = String(tok.status || '').toLowerCase();
    return st !== 'completed' && st !== 'cancelled';
  });

  const pastTokens = customerTokens.filter(tok => {
    const st = String(tok.status || '').toLowerCase();
    return st === 'completed' || st === 'cancelled';
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {t.nav.myTokens}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'ne'
              ? 'आफ्नो सक्रिय लाइन स्थिति र डिजिटल प्रवेश पास हेर्नुहोस्।'
              : 'View your active queue position and digital entry pass.'}
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => navigate('join-queue')}
          icon={Ticket}
        >
          {t.common.joinQueue}
        </Button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
          {error}
        </div>
      )}

      {/* Active Tokens List */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
          {t.customerPortalView.activeTokens} ({activeTokens.length})
        </h2>

        {loading ? (
          <Card className="p-8 text-center text-xs text-slate-500">
            Loading queue tokens...
          </Card>
        ) : activeTokens.length === 0 ? (
          <Card className="p-8 text-center text-xs text-slate-400">
            {language === 'ne'
              ? 'तपाईंसँग हाल कुनै सक्रिय टोकन छैन।'
              : 'You have no active queue tokens right now.'}
          </Card>
        ) : (
          activeTokens.map((tok) => (
            <Card key={tok.id} className="p-6 border-teal-200/80 bg-white space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 flex flex-col items-center justify-center shrink-0 min-w-24">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-teal-600">TOKEN</span>
                    <span className="text-2xl font-mono font-extrabold text-teal-900">{tok.tokenNumber}</span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="teal">{String(tok.status || 'waiting').toUpperCase()}</Badge>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {tok.issuedAt ? new Date(tok.issuedAt).toLocaleString() : ''}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">{tok.serviceName}</h3>

                    <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {tok.orgName}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {tok.branchName}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0 self-end sm:self-start">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate('queue-tracker', { tokenId: tok.id })}
                  >
                    Track Progress
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedTokenModal(tok)}
                  >
                    Digital Pass
                  </Button>
                  {['waiting', 'called', 'skipped'].includes(String(tok.status || '').toLowerCase()) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-rose-600 hover:bg-rose-50"
                      onClick={() => setCancelTarget(tok)}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>Assigned Counter: <strong>{tok.counterName || 'Pending Desk Assignment'}</strong></span>
                </div>
                <div className="text-slate-500">
                  Payment: <strong>{tok.fee || 'Standard'}</strong>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Past Tokens */}
      <div className="space-y-3 pt-6 border-t border-slate-200">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
          Token History ({pastTokens.length})
        </h2>

        {pastTokens.length === 0 ? (
          <Card className="p-6 text-center text-xs text-slate-400">
            No completed or cancelled tokens yet.
          </Card>
        ) : (
          pastTokens.map((tok) => (
            <Card key={tok.id} className="p-4 flex items-center justify-between text-xs text-slate-600">
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded">
                  {tok.tokenNumber}
                </span>
                <div>
                  <div className="font-semibold text-slate-900">{tok.serviceName}</div>
                  <div className="text-slate-500 text-[11px]">{tok.orgName} · {tok.branchName}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-slate-400 font-mono text-[11px]">
                  {tok.issuedAt ? new Date(tok.issuedAt).toLocaleDateString() : ''}
                </span>
                <Badge variant={String(tok.status).toLowerCase() === 'cancelled' ? 'danger' : 'neutral'}>
                  {String(tok.status || 'completed').toUpperCase()}
                </Badge>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Digital Ticket Modal */}
      <Modal
        isOpen={Boolean(selectedTokenModal)}
        onClose={() => setSelectedTokenModal(null)}
        title="QUEUELESS Digital Pass"
        subtitle="Present this token screen to the counter officer"
        maxWidth="max-w-sm"
        footer={
          <Button variant="secondary" size="sm" onClick={() => setSelectedTokenModal(null)}>
            Close Pass
          </Button>
        }
      >
        <div className="text-center space-y-4 py-2">
          <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl">
            <div className="text-xs uppercase tracking-wider font-semibold text-teal-700">Digital Token</div>
            <div className="text-4xl font-mono font-extrabold text-teal-950 my-1">
              {selectedTokenModal?.tokenNumber}
            </div>
            <div className="text-xs text-teal-800 font-medium">
              {selectedTokenModal?.orgName}
            </div>
          </div>

          <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 text-xs text-left">
            <div className="flex justify-between">
              <span className="text-slate-500">Service:</span>
              <span className="font-semibold text-slate-800">{selectedTokenModal?.serviceName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Assigned Counter:</span>
              <span className="font-semibold text-slate-800">{selectedTokenModal?.counterName || 'Pending'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Issued Timestamp:</span>
              <span className="font-mono text-slate-700">
                {selectedTokenModal?.issuedAt ? new Date(selectedTokenModal.issuedAt).toLocaleString() : '--'}
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg text-[11px] text-slate-500 text-left">
            <strong>Checklist:</strong> Please have your original identification card ready before your token number is announced.
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleConfirmCancel}
        title="Leave Digital Queue"
        message={`Are you sure you want to cancel queue token ${cancelTarget?.tokenNumber} for ${cancelTarget?.serviceName}?`}
        confirmLabel="Cancel Token"
        isDestructive
      />
    </div>
  );
}
