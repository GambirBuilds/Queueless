import React, { useState, useEffect } from 'react';
import { useNavigation } from '../../context/NavigationContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { queueService } from '../../services/queueService.js';
import { Card } from '../../components/common/Card.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Button } from '../../components/common/Button.jsx';
import {
  ArrowLeft,
  RefreshCw
} from 'lucide-react';

export function QueueTrackingPage() {
  const { viewParams, navigate } = useNavigation();
  const { isStaff } = useAuth();
  const tokenId = viewParams?.tokenId || '';

  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!tokenId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubscribe = queueService.subscribeToToken(
      tokenId,
      (liveToken) => {
        setToken(liveToken);
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [tokenId]);

  const handleRefresh = async () => {
    if (!tokenId) return;
    setIsRefreshing(true);
    const refreshed = await queueService.getTokenById(tokenId);
    if (refreshed) setToken({ ...refreshed });
    setIsRefreshing(false);
  };

  const getStatusBadge = (status = 'waiting') => {
    const norm = String(status).toLowerCase();
    switch (norm) {
      case 'waiting':
        return <Badge variant="warning">Waiting in Line</Badge>;
      case 'called':
        return <Badge variant="teal">Token Called — Proceed to Counter</Badge>;
      case 'serving':
        return <Badge variant="info">Currently Serving</Badge>;
      case 'completed':
        return <Badge variant="success">Service Completed</Badge>;
      case 'skipped':
        return <Badge variant="neutral">Skipped / On Hold</Badge>;
      case 'cancelled':
        return <Badge variant="danger">Cancelled</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  if (loading && !token) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <RefreshCw className="w-8 h-8 text-teal-700 animate-spin mx-auto" />
        <h3 className="text-base font-bold text-slate-800">Connecting to Real-time Queue Stream...</h3>
        <p className="text-xs text-slate-500">Listening to live Cloud Firestore status updates.</p>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <h3 className="text-base font-bold text-slate-800">Token Not Found</h3>
        <p className="text-xs text-slate-500">Select an active token from My Tokens or join a queue.</p>
        <div className="flex justify-center gap-3">
          <Button variant="outline" onClick={() => navigate('customer-tokens')}>My Tokens</Button>
          <Button variant="primary" onClick={() => navigate('join-queue')}>Get a New Token</Button>
        </div>
      </div>
    );
  }

  const normStatus = String(token.status || '').toLowerCase();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <button
        type="button"
        onClick={() => navigate('customer-tokens')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to My Tokens</span>
      </button>

      {/* Main Digital Pass Card */}
      <Card className="p-6 sm:p-8 space-y-6 border-teal-200/80 bg-white">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded border border-teal-200">
              Live Token Pass · Firestore Sync
            </span>
            <h1 className="text-xl font-bold text-slate-900">Digital Queue Tracker</h1>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            icon={RefreshCw}
            className={isRefreshing ? 'animate-spin' : ''}
          >
            Refresh
          </Button>
        </div>

        {/* Big Spotlight Display */}
        <div className="p-6 rounded-2xl bg-teal-950 text-white text-center space-y-3">
          <span className="text-xs uppercase tracking-widest text-teal-400 font-semibold font-mono">
            YOUR QUEUE NUMBER
          </span>

          <div className="text-5xl sm:text-6xl font-mono font-extrabold tracking-tight text-white py-1">
            {token.tokenNumber}
          </div>

          <div className="flex items-center justify-center gap-2">
            {getStatusBadge(token.status)}
          </div>
        </div>

        {/* People Ahead & Counter Section */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-xs text-slate-500 font-medium">People Ahead of You</span>
            <div className="text-3xl font-bold text-slate-900 tabular-nums">
              {normStatus === 'completed' || normStatus === 'cancelled' ? '--' : (token.peopleAhead ?? 0)}
            </div>
            <span className="text-[10px] text-slate-400 font-mono">in this service line</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-xs text-slate-500 font-medium">Assigned Service Desk</span>
            <div className="text-2xl font-bold text-teal-800">
              {token.counterName || 'Pending Desk'}
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              {token.counterId ? `Desk #${token.counterId}` : 'Awaiting call'}
            </span>
          </div>
        </div>

        {/* Detailed Metadata Grid */}
        <div className="divide-y divide-slate-100 text-xs text-slate-600">
          <div className="py-2.5 flex justify-between">
            <span className="text-slate-400">Organization:</span>
            <span className="font-semibold text-slate-800 text-right">{token.orgName}</span>
          </div>

          <div className="py-2.5 flex justify-between">
            <span className="text-slate-400">Branch Location:</span>
            <span className="font-semibold text-slate-800 text-right">{token.branchName}</span>
          </div>

          <div className="py-2.5 flex justify-between">
            <span className="text-slate-400">Service Category:</span>
            <span className="font-semibold text-slate-800 text-right">{token.serviceName}</span>
          </div>

          <div className="py-2.5 flex justify-between">
            <span className="text-slate-400">Customer Name:</span>
            <span className="font-semibold text-slate-800 text-right">{token.customerName}</span>
          </div>

          <div className="py-2.5 flex justify-between">
            <span className="text-slate-400">Contact Telephone:</span>
            <span className="font-mono text-slate-700 text-right">{token.customerPhone}</span>
          </div>

          <div className="py-2.5 flex justify-between">
            <span className="text-slate-400">Issued Timestamp:</span>
            <span className="font-mono text-slate-700 text-right">
              {token.issuedAt ? new Date(token.issuedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
            </span>
          </div>

          <div className="py-2.5 flex justify-between">
            <span className="text-slate-400">Last System Update:</span>
            <span className="font-mono text-slate-700 text-right">
              {token.updatedAt ? new Date(token.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-between items-center pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('customer-dashboard')}
          >
            Go to Dashboard
          </Button>

          {isStaff && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('receptionist-queue', {}, 'org')}
            >
              Open Receptionist Desk
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
