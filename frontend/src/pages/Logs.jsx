import { useState, useEffect, useMemo } from 'react';
import Icon from '../components/Icon';
import { fetchActivityFeed, fetchFraudFlags, fetchUsers, fetchLogDetails } from '../api/client';

export default function Logs() {
  const [activities, setActivities] = useState([]);
  const [fraudLogs, setFraudLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [levelFilter, setLevelFilter] = useState('All Levels');
  const [scopeFilter, setScopeFilter] = useState('Global Scope');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 6;
  const [users, setUsers] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [a, f, u] = await Promise.all([fetchActivityFeed(50), fetchFraudFlags(), fetchUsers()]);
        setActivities(a.data); setFraudLogs(f.data); setUsers(u.data);
      } catch (err) { setError(err.message); } finally { setLoading(false); }
    }
    load();
  }, []);

  const handleOpenLog = async (logId) => {
    try {
      const numericId = logId.replace(/[^0-9]/g, '') || 1;
      const res = await fetchLogDetails(numericId);
      alert("Telemetry Details:\n\n" + JSON.stringify(res.data, null, 2));
    } catch (e) {
      alert("Error loading log " + logId);
    }
  };

  const userMap = {};
  users.forEach(u => { userMap[u.id] = u; });

  const allLogs = useMemo(() => {
    const logs = [];
    activities.forEach((a, i) => {
      logs.push({
        id: `ACT-${i}`, timestamp: a.timestamp,
        level: a.type === 'referral_success' ? 'INFO' : 'WARN',
        module: a.type === 'referral_success' ? 'Referral' : 'Fraud',
        eventType: a.description?.split(' ').slice(0, 5).join(' ') || a.title,
        resourceId: a.user_id ? `USR-${String(a.user_id).padStart(3, '0')}` : (a.child_id ? `USR-${String(a.child_id).padStart(3, '0')}` : `SYS-${i}`),
      });
    });
    fraudLogs.forEach((f) => {
      const user = userMap[f.user_id];
      logs.push({
        id: `FRD-${f.id}`, timestamp: f.created_at,
        level: { cycle: 'CRITICAL', self: 'ALERT', velocity: 'WARN' }[f.reason] || 'WARN',
        module: { cycle: 'Auth', self: 'Auth', velocity: 'Payout' }[f.reason] || 'System',
        eventType: f.details || 'Fraud Detected',
        resourceId: user ? `${user.name} (#${f.user_id})` : `USR-${String(f.user_id).padStart(3, '0')}`,
      });
    });
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return logs;
  }, [activities, fraudLogs, userMap]);

  const filteredLogs = useMemo(() => allLogs.filter((log) => {
    return (levelFilter === 'All Levels' || log.level === levelFilter) &&
      (scopeFilter === 'Global Scope' || log.module === scopeFilter) &&
      (!search || log.eventType.toLowerCase().includes(search.toLowerCase()) || log.resourceId.toLowerCase().includes(search.toLowerCase()));
  }), [allLogs, levelFilter, scopeFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / perPage));
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * perPage, currentPage * perPage);

  const levelBadge = { INFO: 'bg-primary/10 text-primary', WARN: 'bg-orange-500/10 text-orange-400', CRITICAL: 'bg-error/10 text-error', ALERT: 'bg-tertiary/10 text-tertiary' };
  const moduleBadge = { Auth: 'bg-secondary/10 text-secondary', Referral: 'bg-primary/10 text-primary', Payout: 'bg-tertiary/10 text-tertiary', Fraud: 'bg-error/10 text-error' };

  const errorCount = allLogs.filter(l => l.level === 'CRITICAL' || l.level === 'ALERT').length;
  const errorDensity = allLogs.length > 0 ? ((errorCount / allLogs.length) * 100).toFixed(0) : 0;

  if (loading) return <div className="flex items-center justify-center h-[70vh]"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (error) return <div className="flex items-center justify-center h-[70vh]"><div className="glass-card rounded-xl p-8 text-center"><p className="text-error">{error}</p></div></div>;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-headline font-bold text-on-surface">Logs Intelligence</h1>
          <p className="text-sm text-on-surface-variant mt-1">Deep-level event auditing across the Obsidian ecosystem. Real-time monitoring of Auth, Referral, and Payout services.</p>
        </div>
        <span className="px-3 py-1.5 rounded-full bg-secondary/10 text-secondary text-[10px] font-label font-bold tracking-widest flex items-center gap-1.5 border border-secondary/20 shrink-0 uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse-dot" /> Live Stream
        </span>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div>
          <label className="block text-[9px] font-label text-on-surface-variant uppercase tracking-widest mb-1 ml-1">Level</label>
          <select value={levelFilter} onChange={(e) => { setLevelFilter(e.target.value); setCurrentPage(1); }}
            className="appearance-none bg-surface-container border border-outline-variant/20 rounded-lg px-4 py-2.5 pr-8 text-xs text-on-surface focus:outline-none focus:border-primary/30 cursor-pointer min-w-[140px]">
            <option>All Levels</option><option>INFO</option><option>WARN</option><option>ALERT</option><option>CRITICAL</option>
          </select>
        </div>
        <div>
          <label className="block text-[9px] font-label text-on-surface-variant uppercase tracking-widest mb-1 ml-1">Scope</label>
          <select value={scopeFilter} onChange={(e) => { setScopeFilter(e.target.value); setCurrentPage(1); }}
            className="appearance-none bg-surface-container border border-outline-variant/20 rounded-lg px-4 py-2.5 pr-8 text-xs text-on-surface focus:outline-none focus:border-primary/30 cursor-pointer min-w-[140px]">
            <option>Global Scope</option><option>Auth</option><option>Referral</option><option>Payout</option><option>Fraud</option>
          </select>
        </div>
        <div className="flex-1 max-w-md">
          <label className="block text-[9px] font-label text-on-surface-variant uppercase tracking-widest mb-1 ml-1">&nbsp;</label>
          <div className="relative">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40" size={16} />
            <input type="text" placeholder="Filter by Keyword, User ID, or Request Hash..." value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full bg-surface-container border border-outline-variant/20 rounded-lg pl-10 pr-4 py-2.5 text-xs text-on-surface placeholder-on-surface-variant/40 focus:outline-none focus:border-primary/30" />
          </div>
        </div>
        <div className="flex items-center gap-2 ml-auto mt-5">
          {['SYSTEM', 'AUDIT', 'LOG_EE_04'].map(t => (
            <span key={t} className="px-2 py-1 rounded bg-surface-container-high border border-outline-variant/10 text-[9px] font-label text-on-surface-variant uppercase tracking-widest">{t}</span>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl overflow-hidden fade-in">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-outline-variant/10">
            {['Timestamp', 'Level', 'Module', 'Event Type', 'User / Resource ID', ''].map((h, i) => (
              <th key={h || 'expand'} className={`${i === 5 ? 'text-center w-10' : 'text-left'} px-4 py-3 text-[10px] font-label text-on-surface-variant uppercase tracking-widest`}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {paginatedLogs.map((log) => (
              <tr key={log.id} className="border-b border-outline-variant/5 hover:bg-surface-container-low/50 transition-all">
                <td className="px-4 py-3.5 text-[11px] text-on-surface-variant font-label whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </td>
                <td className="px-4 py-3.5"><span className={`px-2 py-0.5 rounded text-[9px] font-label font-bold uppercase ${levelBadge[log.level] || 'bg-surface-variant text-on-surface-variant'}`}>{log.level}</span></td>
                <td className="px-4 py-3.5"><span className={`px-2 py-0.5 rounded text-[9px] font-label font-bold uppercase ${moduleBadge[log.module] || 'bg-surface-variant text-on-surface-variant'}`}>{log.module}</span></td>
                <td className="px-4 py-3.5 text-on-surface text-xs max-w-[200px] truncate">{log.eventType}</td>
                <td className="px-4 py-3.5 text-on-surface-variant font-label text-[11px]">{log.resourceId}</td>
                <td className="px-4 py-3.5 text-center">
                  <button onClick={() => handleOpenLog(log.id)} className="p-1.5 rounded-lg hover:bg-surface-container-high text-on-surface-variant/60 hover:text-on-surface transition-colors">
                    <Icon name="open_in_new" size={14} />
                  </button>
                </td>
              </tr>
            ))}
            {paginatedLogs.length === 0 && <tr><td colSpan="6" className="px-4 py-10 text-center text-on-surface-variant/50 text-xs">No log entries match your filters.</td></tr>}
          </tbody>
        </table>

        <div className="flex items-center justify-between px-4 py-3 border-t border-outline-variant/10">
          <span className="text-[11px] font-label text-on-surface-variant">
            Showing {Math.min((currentPage - 1) * perPage + 1, filteredLogs.length)}-{Math.min(currentPage * perPage, filteredLogs.length)} of {filteredLogs.length} log entries
          </span>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((page) => (
              <button key={page} onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-lg text-xs font-label transition-all ${currentPage === page ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:bg-surface-container-high'}`}>{page}</button>
            ))}
            {totalPages > 5 && <span className="text-on-surface-variant px-1">...</span>}
            <button onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))} disabled={currentPage === totalPages}
              className="w-8 h-8 rounded-lg text-on-surface-variant hover:bg-surface-container-high disabled:opacity-30"><Icon name="chevron_right" size={16} /></button>
          </div>
        </div>
      </div>

      {/* Bottom Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-5 fade-in">
          <p className="text-[9px] font-label text-on-surface-variant uppercase tracking-widest">Error Density</p>
          <p className="text-lg font-headline font-bold text-on-surface mt-1">{errorDensity}% of total</p>
          <div className="flex gap-1 mt-3">{Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={`flex-1 rounded-sm ${i < Math.ceil(Number(errorDensity) / 12.5) ? 'bg-error/25' : 'bg-surface-variant/50'}`} style={{ height: `${10 + Math.random() * 12}px` }} />
          ))}</div>
        </div>
        <div className="glass-card rounded-2xl p-5 fade-in">
          <p className="text-[9px] font-label text-on-surface-variant uppercase tracking-widest">Data Latency</p>
          <p className="text-lg font-headline font-bold text-on-surface mt-1">Normal: 42ms</p>
          <div className="w-full h-1.5 bg-surface-variant rounded-full mt-3 overflow-hidden"><div className="h-full bg-secondary rounded-full" style={{ width: '35%' }} /></div>
        </div>
        <div className="glass-card rounded-2xl p-5 fade-in">
          <p className="text-[9px] font-label text-on-surface-variant uppercase tracking-widest">Memory Pressure</p>
          <p className="text-lg font-headline font-bold text-on-surface mt-1">Stable at 64%</p>
          <div className="flex gap-1 mt-3">{Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={`flex-1 rounded-sm ${i < 5 ? 'bg-primary/25' : 'bg-surface-variant/50'}`} style={{ height: `${10 + Math.random() * 14}px` }} />
          ))}</div>
        </div>
        <div className="glass-card rounded-2xl p-5 fade-in">
          <p className="text-[9px] font-label text-on-surface-variant uppercase tracking-widest">Total Entries</p>
          <p className="text-lg font-headline font-bold text-on-surface mt-1">{allLogs.length.toLocaleString()}</p>
          <p className="text-[10px] text-on-surface-variant/60 mt-3">Across all services</p>
        </div>
      </div>
    </div>
  );
}
