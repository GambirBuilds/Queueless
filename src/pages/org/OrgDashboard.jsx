import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config.js';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useNavigation } from '../../context/NavigationContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { organizationService } from '../../services/organizationService.js';
import { sampleOrganizations } from '../../data/sampleOrganizations.js';
import { Card } from '../../components/common/Card.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Table } from '../../components/common/Table.jsx';
import { Layers, MonitorCheck } from 'lucide-react';

export function OrgDashboard() {
  const { t } = useLanguage();
  const { navigate } = useNavigation();
  const { userProfile } = useAuth();

  const [organizations, setOrganizations] = useState(sampleOrganizations);
  const [liveWaitingCount, setLiveWaitingCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    organizationService.getPublicDirectory().then(data => {
      if (mounted && Array.isArray(data) && data.length > 0) {
        setOrganizations(data);
      }
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  const targetOrgId = userProfile?.organizationId || organizations[0]?.id;
  const org = organizations.find(o => o.id === targetOrgId) || organizations[0] || sampleOrganizations[0];
  const branches = org.branches || [];
  const branch = branches.find(b => b.id === userProfile?.branchId) || branches[0] || { id: '', name: 'Main Branch', counters: [] };
  const counters = branch.counters || [];
  const services = org.services || [];

  useEffect(() => {
    if (!org?.id) return;
    let mounted = true;
    getDocs(query(collection(db, 'queueTokens'), where('organizationId', '==', org.id)))
      .then(snap => {
        if (!mounted) return;
        const waiting = snap.docs.filter(d => String(d.data().status || '').toLowerCase() === 'waiting').length;
        setLiveWaitingCount(waiting);
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, [org?.id]);

  const counterColumns = [
    {
      header: 'Counter',
      accessor: 'number',
      render: (row) => (
        <span className="font-mono font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded">
          #{row.number}
        </span>
      )
    },
    {
      header: 'Desk Designation',
      accessor: 'name',
      render: (row) => <span className="font-semibold text-slate-900">{row.name}</span>
    },
    {
      header: 'Assigned Services',
      accessor: 'serviceIds',
      render: (row) => (
        <span className="text-slate-600 text-xs">
          {(row.serviceIds || []).length} Service Categories
        </span>
      )
    },
    {
      header: 'Operational Status',
      accessor: 'id',
      render: () => <Badge variant="success">Operational</Badge>
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {org.name}
            </h1>
            <Badge variant="teal">{org.industryName}</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Operations Console · Current Branch: <strong>{branch.name}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('org-services')}
            icon={Layers}
          >
            {t.orgPortalView.serviceManagement}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('org-counters')}
            icon={MonitorCheck}
          >
            {t.orgPortalView.counterManagement}
          </Button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 space-y-1">
          <div className="text-xs text-slate-500 font-medium">{t.orgPortalView.branchManagement}</div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums">
            {branches.length}
          </div>
          <div className="text-[11px] text-teal-700 font-medium">Registered Locations</div>
        </Card>

        <Card className="p-5 space-y-1">
          <div className="text-xs text-slate-500 font-medium">{t.orgPortalView.totalCounters}</div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums">
            {counters.length}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium">Configured Desks</div>
        </Card>

        <Card className="p-5 space-y-1">
          <div className="text-xs text-slate-500 font-medium">{t.orgPortalView.totalServices}</div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums">
            {services.length}
          </div>
          <div className="text-[11px] text-blue-700 font-medium">Active Offerings</div>
        </Card>

        <Card className="p-5 space-y-1">
          <div className="text-xs text-slate-500 font-medium">Waiting Queue Tokens</div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums">
            {liveWaitingCount}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">Live Across Organization</div>
        </Card>
      </div>

      {/* Active Branch Counters */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <MonitorCheck className="w-4 h-4 text-teal-700" />
            <span>Configured Service Counters ({branch.name})</span>
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('org-counters')}
          >
            Manage Counters
          </Button>
        </div>

        <Table
          columns={counterColumns}
          data={counters}
          keyField="id"
        />
      </div>

      {/* Services List Preview */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-700" />
            <span>Service Catalog ({services.length})</span>
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('org-services')}
          >
            Manage Services
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {services.slice(0, 4).map((srv) => (
            <Card key={srv.id} className="p-4 flex items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-mono text-slate-400">{srv.code}</span>
                  <span className="text-slate-300">·</span>
                  <span className="text-slate-500">{srv.category}</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900">{srv.name}</h4>
                <div className="text-xs text-slate-500">
                  ~{srv.estimatedDurationMinutes} mins · {srv.isPaid ? `${srv.feeCurrency || 'NPR'} ${srv.feeAmount}` : 'Free'}
                </div>
              </div>
              <Badge variant={srv.queueStatus === 'paused' ? 'warning' : srv.queueStatus === 'closed' ? 'danger' : 'teal'}>
                {String(srv.queueStatus || 'Active').toUpperCase()}
              </Badge>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
