import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useNavigation } from '../../context/NavigationContext.jsx';
import { organizationService } from '../../services/organizationService.js';
import { sampleOrganizations } from '../../data/sampleOrganizations.js';
import { queueService } from '../../services/queueService.js';
import { playQueueChime } from '../../utils/audioChime.js';
import { Badge } from '../../components/common/Badge.jsx';
import { Button } from '../../components/common/Button.jsx';
import {
  Volume2,
  VolumeX,
  ArrowLeft,
  Tv
} from 'lucide-react';

export function KioskDisplayPage() {
  const { t } = useLanguage();
  const { navigate } = useNavigation();

  const [organizations, setOrganizations] = useState(sampleOrganizations);
  const [selectedOrgId, setSelectedOrgId] = useState(sampleOrganizations[0].id);

  useEffect(() => {
    let mounted = true;
    organizationService.getPublicDirectory().then(data => {
      if (mounted && Array.isArray(data) && data.length > 0) {
        setOrganizations(data);
        setSelectedOrgId(data[0].id);
      }
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  const selectedOrg = organizations.find(o => o.id === selectedOrgId) || organizations[0] || sampleOrganizations[0];
  const branches = selectedOrg.branches || [];
  const [selectedBranchId, setSelectedBranchId] = useState(branches[0]?.id || 'branch-01');
  const selectedBranch = branches.find(b => b.id === selectedBranchId) || branches[0] || { id: 'branch-01', name: 'Main Branch', counters: [] };

  const [tokens, setTokens] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const prevCalledTokenIdRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Poll non-PII public display endpoint so public lobby displays never leak customer phone/email
  useEffect(() => {
    if (!selectedBranch?.id) return;
    let active = true;

    const fetchDisplay = async () => {
      try {
        const liveTokens = await queueService.getPublicDisplayTokens(selectedBranch.id);
        if (!active) return;
        setTokens(liveTokens);

        const latestCalled = liveTokens.find(
          tok => String(tok.status || '').toLowerCase() === 'called'
        );
        if (latestCalled && latestCalled.id !== prevCalledTokenIdRef.current) {
          prevCalledTokenIdRef.current = latestCalled.id;
          if (soundEnabled) {
            playQueueChime();
          }
        }
      } catch {
        // silent retry on next poll
      }
    };

    fetchDisplay();
    const interval = setInterval(fetchDisplay, 4000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [selectedBranch?.id, soundEnabled]);

  const currentlyCalled = tokens.find(
    tok => ['called', 'serving'].includes(String(tok.status || '').toLowerCase())
  ) || null;

  const counterStatuses = (selectedBranch.counters || []).map(counter => {
    const activeToken = tokens.find(
      tok => tok.counterName === counter.name &&
        ['called', 'serving'].includes(String(tok.status || '').toLowerCase())
    );
    return {
      counter,
      token: activeToken || null
    };
  });

  const recentlyCalled = tokens.filter(
    tok => ['called', 'serving'].includes(String(tok.status || '').toLowerCase())
  ).slice(0, 6);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans select-none">
      {/* Top TV Header Bar */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('home')}
            icon={ArrowLeft}
            className="text-slate-400 hover:text-white"
          >
            {t.nav.backToHome}
          </Button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center font-bold text-white text-lg">
              Q
            </div>
            <div>
              <div className="text-xs uppercase font-mono tracking-widest text-teal-400">
                {t.displayScreen.title}
              </div>
              <h1 className="text-lg font-bold text-white flex items-center gap-2">
                <span>{selectedOrg.name}</span>
                <span className="text-slate-500">·</span>
                <span className="text-slate-300 font-normal text-sm">{selectedBranch.name}</span>
              </h1>
            </div>
          </div>
        </div>

        {/* Branch Switcher & Sound Toggle & Clock */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            aria-label="Select organization for lobby screen"
            value={selectedOrg.id}
            onChange={(e) => {
              const nextOrg = organizations.find(o => o.id === e.target.value);
              setSelectedOrgId(e.target.value);
              if (nextOrg?.branches?.[0]) setSelectedBranchId(nextOrg.branches[0].id);
            }}
            className="bg-slate-800 border border-slate-700 text-xs rounded-lg px-3 py-1.5 text-slate-200 cursor-pointer"
          >
            {organizations.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>

          <select
            aria-label="Select branch for lobby screen"
            value={selectedBranch.id}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-xs rounded-lg px-3 py-1.5 text-slate-200 cursor-pointer"
          >
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) playQueueChime();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              soundEnabled
                ? 'bg-teal-950 text-teal-300 border border-teal-800'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>{soundEnabled ? t.displayScreen.soundOn : t.displayScreen.soundOff}</span>
          </button>

          <div className="text-right font-mono text-sm text-teal-300 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 tabular-nums">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
        </div>
      </header>

      {/* Main Display Stage */}
      <main className="flex-1 p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto w-full">
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          <div className="flex-1 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950 border-2 border-teal-500/40 p-8 sm:p-12 flex flex-col justify-between shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 text-teal-300 pointer-events-none">
              <Tv className="w-64 h-64" />
            </div>

            <div className="space-y-2 relative z-10">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-mono tracking-widest uppercase border border-teal-500/30">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse" />
                {t.displayScreen.nowServing}
              </span>

              {currentlyCalled ? (
                <div className="space-y-4 pt-4">
                  <div className="text-6xl sm:text-8xl md:text-9xl font-mono font-extrabold tracking-tight text-white drop-shadow-md">
                    {currentlyCalled.tokenNumber}
                  </div>

                  <div className="space-y-1">
                    <div className="text-2xl sm:text-3xl font-bold text-teal-200">
                      {currentlyCalled.counterName || 'Service Counter'}
                    </div>
                    <div className="text-lg text-slate-300 font-medium">
                      {currentlyCalled.serviceName}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center space-y-3">
                  <div className="text-4xl sm:text-5xl font-mono text-slate-600 font-bold">
                    STANDBY
                  </div>
                  <p className="text-slate-400 text-sm max-w-md mx-auto">
                    Waiting for the next token to be called by service counters.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 relative z-10">
              <span>{t.displayScreen.waitingRoomNotice}</span>
              <span className="font-mono text-teal-400">{selectedOrg.timezone || 'Asia/Kathmandu'}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Volume2 className="w-4 h-4 text-teal-400" />
              <span>Lobby Announcement Chime Ready</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => playQueueChime()}
              className="border-slate-700 text-teal-300 hover:bg-slate-800"
            >
              Test Chime Tone
            </Button>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6 flex flex-col justify-between">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Active Counter Desks ({counterStatuses.length})
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {counterStatuses.map(({ counter, token }) => (
                <div
                  key={counter.id}
                  className={`p-4 rounded-xl border transition-all ${
                    token
                      ? 'bg-slate-800/90 border-teal-500/50 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-500'
                  }`}
                >
                  <div className="text-[11px] font-mono text-slate-400">
                    {t.displayScreen.desk} #{counter.number}
                  </div>
                  <div className="text-xs font-bold text-slate-200 truncate mt-0.5">
                    {counter.name}
                  </div>

                  <div className="mt-3 flex items-baseline justify-between">
                    <span className="text-xl font-mono font-bold text-white">
                      {token ? token.tokenNumber : '—'}
                    </span>
                    <Badge variant={token ? 'teal' : 'neutral'}>
                      {token ? String(token.status).toUpperCase() : 'Available'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 flex-1 flex flex-col justify-between">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {t.displayScreen.recentlyCalled}
            </h2>

            <div className="divide-y divide-slate-800 text-xs flex-1">
              {recentlyCalled.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No tokens currently called.
                </div>
              ) : (
                recentlyCalled.map((tok) => (
                  <div key={tok.id} className="py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-teal-400 bg-teal-950 px-2 py-0.5 rounded border border-teal-800">
                        {tok.tokenNumber}
                      </span>
                      <div className="text-[11px] text-slate-300 font-medium">{tok.serviceName}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-300 font-semibold block">{tok.counterName || 'Counter'}</span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {tok.calledAt ? new Date(tok.calledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
