import { useState, useEffect } from 'react';
import Icon from '../components/Icon';
import { fetchMetrics, fetchActivityFeed, fetchFraudFlags, fetchUsers, fetchReferrals, triggerSimulation, exportDashboardReport } from '../api/client';

const DashboardTreeNode = ({ node, level = 0 }) => {
  if (!node) return null;
  const isRoot = level === 0;
  return (
    <div className="flex flex-col items-center relative shrink-0">
      <div className={`inline-flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all z-10 shrink-0 ${isRoot ? 'bg-primary-container border-primary/30 text-on-primary-container shadow-md' : 'bg-surface-container border-outline-variant/20 text-on-surface hover:border-primary/30 hover:bg-surface-container-high'}`}>
        <div className={`w-9 h-9 min-w-9 min-h-9 rounded-full ${isRoot ? 'bg-primary text-white shadow-lg' : 'bg-surface-variant text-on-surface-variant'} flex items-center justify-center text-sm font-bold shrink-0`}>
          {node.name?.charAt(0)?.toUpperCase()}
        </div>
        <div className="whitespace-nowrap">
          <p className="font-semibold text-sm leading-tight">{node.name}</p>
          <p className="text-[10px] opacity-70 mt-0.5 font-mono">#{String(node.id).padStart(4, '0')}</p>
        </div>
      </div>

      {node.children && node.children.length > 0 && (
        <div className="relative pt-8 flex justify-center shrink-0">
          <div className="absolute top-0 left-1/2 w-[2px] h-8 bg-outline-variant/30 -translate-x-1/2" />
          
          <div className="flex justify-center gap-8 relative shrink-0">
             {node.children.map((child, i) => {
               const isFirst = i === 0;
               const isLast = i === node.children.length - 1;
               const isOnly = node.children.length === 1;
               
               return (
                 <div key={child.id} className="relative pt-8 flex flex-col items-center shrink-0">
                   {!isOnly && (
                     <div className={`absolute top-0 h-[2px] bg-outline-variant/30 ${
                         isFirst ? 'left-1/2 right-0' :
                         isLast ? 'left-0 right-1/2' :
                         'left-0 right-0'
                     }`} />
                   )}
                   
                   <div className="absolute top-0 left-1/2 w-[2px] h-8 bg-outline-variant/30 -translate-x-1/2" />
                   
                   <DashboardTreeNode node={child} level={level + 1} />
                 </div>
               );
             })}
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Metric Card (glass-card style from code.html) ─────── */
function MetricCard({ icon, iconColor, label, value, badge, badgeColor, borderColor, extra }) {
  return (
    <div className={`glass-card p-5 rounded-xl glow-primary transition-all duration-500 hover:scale-[1.02] ${borderColor || ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${iconColor}`}>
          <Icon name={icon} size={20} />
        </div>
        {badge && (
          <span className={`text-[10px] font-label uppercase tracking-widest ${badgeColor}`}>{badge}</span>
        )}
        {extra}
      </div>
      <p className="text-on-surface-variant text-[10px] font-label uppercase tracking-widest mb-1">{label}</p>
      <h3 className="text-2xl font-headline font-bold text-on-surface">{value}</h3>
    </div>
  );
}

/* ─── Intelligence Network ───────────────────────────────── */
function IntelligenceNetwork({ users, referrals, onSimulate, isSimulating, onExportReport }) {
  const [viewMode, setViewMode] = useState('network');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showClusters, setShowClusters] = useState(false);
  
  const [networkNodes, setNetworkNodes] = useState([]);
  const [networkLinks, setNetworkLinks] = useState([]);

  // Compute absolute roots and tree structures for "Tree View"
  const referredUserIds = new Set(referrals.map(r => r.child_id));
  const rootUsers = users.filter(u => !referredUserIds.has(u.id));

  const buildTree = (rootId, visited = new Set()) => {
    if (visited.has(rootId)) return null;
    visited.add(rootId);
    const rootUser = users.find(u => u.id === rootId);
    if (!rootUser) return null;
    const childrenNodes = referrals
      .filter(r => r.parent_id === rootId)
      .map(r => buildTree(r.child_id, new Set(visited)))
      .filter(Boolean);
    return { ...rootUser, children: childrenNodes };
  };

  // Compute dynamic scattered graph for "Network View"
  useEffect(() => {
    // Take up to 40 most recent connections
    const recentReferrals = referrals.slice(-40);
    const activeIds = new Set();
    recentReferrals.forEach(r => { activeIds.add(r.parent_id); activeIds.add(r.child_id); });
    if(users[0]) activeIds.add(users[0].id);

    const activeUsers = users.filter(u => activeIds.has(u.id)).slice(0, 40);
    
    const nodes = activeUsers.map((u, i) => {
       if (i === 0) return { ...u, x: 50, y: 50 };
       // Golden ratio spread
       const angle = (i * 137.5) % 360;
       const r = 10 + ((i * 4) % 35); // 10% to 45% radius
       const x = 50 + r * Math.cos(angle * Math.PI / 180);
       const y = 50 + r * Math.sin(angle * Math.PI / 180);
       return { ...u, x, y };
    });

    const links = recentReferrals.map((r, i) => {
      const parent = nodes.find(n => n.id === r.parent_id);
      const child = nodes.find(n => n.id === r.child_id);
      return parent && child ? { 
        id: `link-${i}`, 
        x1: parent.x, y1: parent.y, x2: child.x, y2: child.y,
        isGolden: (parent.id === users[0]?.id) 
      } : null;
    }).filter(Boolean);

    setNetworkNodes(nodes);
    setNetworkLinks(links);
  }, [users, referrals]);

  return (
    <section className={`glass-card rounded-xl overflow-hidden flex flex-col fade-in transition-all duration-500 z-40 ${isExpanded ? 'fixed top-24 left-[17rem] right-8 bottom-8 bg-background/95 backdrop-blur-3xl shadow-[0_0_100px_rgba(46,91,255,0.15)] ring-1 ring-outline-variant/50' : 'relative min-h-[500px]'}`}>
      <div className="p-8 pb-0 flex flex-wrap justify-between items-center z-10 gap-4">
        <div>
          <h2 className="text-xl font-headline font-bold text-on-surface">Intelligence Network</h2>
          <p className="text-on-surface-variant text-sm font-body">Real-time mapping &middot; {referrals.length} connections &middot; {users.length} nodes</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={onSimulate} 
            disabled={isSimulating}
            className="px-4 py-2 rounded-lg text-xs font-label uppercase tracking-widest transition-all shadow-sm flex items-center gap-2 bg-secondary text-white hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icon name="science" size={16} /> {isSimulating ? 'Simulating...' : 'Stress Test (100 Users)'}
          </button>
          <button 
            onClick={onExportReport} 
            className="px-4 py-2 rounded-lg text-xs font-label uppercase tracking-widest transition-all shadow-sm flex items-center gap-2 bg-surface-container-high border border-outline-variant/20 hover:bg-surface-bright text-on-surface-variant hover:text-on-surface"
          >
            <Icon name="download" size={16} /> Export
          </button>
          <div className="flex p-1 bg-surface-container-high rounded-lg border border-outline-variant/20">
            <button onClick={() => setViewMode('network')} className={`px-3 py-1.5 rounded text-[10px] font-label uppercase tracking-widest transition-all ${viewMode === 'network' ? 'bg-primary-container text-on-primary-container shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}>Network</button>
            <button onClick={() => setViewMode('tree')} className={`px-3 py-1.5 rounded text-[10px] font-label uppercase tracking-widest transition-all ${viewMode === 'tree' ? 'bg-primary-container text-on-primary-container shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}>Tree View</button>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setIsExpanded(!isExpanded)} className={`px-4 py-2 rounded-lg text-xs font-label uppercase tracking-widest border transition-colors ${isExpanded ? 'bg-surface-variant text-on-surface border-outline-variant/50' : 'bg-surface-container-high text-on-surface-variant border-outline-variant/20 hover:bg-surface-bright'}`}>
              <span className="flex items-center gap-2"><Icon name={isExpanded ? 'fullscreen_exit' : 'fullscreen'} size={16}/> {isExpanded ? 'Collapse' : 'Expand'}</span>
            </button>
            <button onClick={() => setShowClusters(!showClusters)} className={`px-4 py-2 rounded-lg text-xs font-label uppercase tracking-widest transition-all shadow-sm flex items-center gap-2 ${showClusters ? 'bg-tertiary-container text-on-tertiary-container hover:brightness-110' : 'bg-primary-container text-on-primary-container hover:brightness-110'}`}>
              <Icon name={showClusters ? 'visibility_off' : 'scatter_plot'} size={16} />
              {showClusters ? 'Hide Clusters' : 'Identify Clusters'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 relative p-8 overflow-hidden group min-h-[400px]">
        {viewMode === 'tree' ? (
          <div className="absolute inset-0 m-8 z-20 overflow-auto custom-scrollbar bg-surface-container-low/50 border border-outline-variant/20 rounded-2xl p-6 fade-in">
             <h3 className="text-xs font-label text-on-surface-variant uppercase tracking-widest mb-6 border-b border-outline-variant/20 pb-3 flex items-center gap-2 sticky left-0"><Icon name="account_tree" size={16}/> Full Organizational Tree</h3>
             {rootUsers.length > 0 ? (
               <div className="flex gap-16 items-start min-w-max pb-12 pt-4 px-4">
                 {rootUsers.map(root => <DashboardTreeNode key={root.id} node={buildTree(root.id)} />)}
               </div>
             ) : (
               <p className="text-on-surface-variant text-sm italic">No network data yet.</p>
             )}
          </div>
        ) : (
          <div className="absolute inset-0 fade-in flex items-center justify-center">
            {/* Background Rings */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30%] h-[50%] rounded-[100px] border border-outline-variant/10"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[90%] rounded-[200px] border border-outline-variant/5"></div>

            {/* Clusters Glow */}
            {showClusters && (
              <>
                <div className="absolute left-[30%] top-[35%] w-[45%] h-[50%] bg-primary/10 rounded-[120px] border border-primary/20 pointer-events-none blur-md animate-pulse z-0" style={{ animationDuration: '4s' }}></div>
                <div className="absolute right-[15%] top-[15%] w-[30%] h-[40%] bg-tertiary/10 rounded-[80px] border border-tertiary/20 pointer-events-none blur-md animate-pulse z-0" style={{ animationDuration: '3s', animationDelay: '1s' }}></div>
              </>
            )}

            <svg className="absolute inset-0 w-full h-full z-10" style={{ minHeight: '100%' }}>
              <defs>
                <marker id="arrow-primary" markerWidth="6" markerHeight="6" refX="10" refY="3" orient="auto"><polygon points="0 0, 6 3, 0 6" fill="#2e5bff" /></marker>
                <marker id="arrow-default" markerWidth="6" markerHeight="6" refX="10" refY="3" orient="auto"><polygon points="0 0, 6 3, 0 6" fill="rgba(255,255,255,0.2)" /></marker>
              </defs>
              {networkLinks.map(link => (
                <line 
                  key={link.id} 
                  x1={`${link.x1}%`} y1={`${link.y1}%`} x2={`${link.x2}%`} y2={`${link.y2}%`} 
                  stroke={link.isGolden ? "#2e5bff" : "rgba(255,255,255,0.15)"} 
                  strokeWidth={link.isGolden ? "1.5" : "1"} 
                  strokeDasharray={link.isGolden ? "4 4" : "0"}
                  markerEnd={`url(#${link.isGolden ? 'arrow-primary' : 'arrow-default'})`} 
                />
              ))}
            </svg>

            {/* Nodes */}
            {networkNodes.map((node, i) => {
              const isRoot = i === 0;
              return (
                <div key={node.id} className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group/node cursor-pointer transition-transform duration-300 hover:scale-110" style={{ left: `${node.x}%`, top: `${node.y}%` }}>
                  {isRoot && <div className="absolute -inset-4 bg-primary/20 rounded-full blur-xl animate-pulse"></div>}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-base font-bold relative z-10 ${isRoot ? 'bg-primary-container p-1 ring-4 ring-primary' : 'bg-surface-container-highest border border-outline-variant/30 hover:border-primary/50'}`}>
                    <div className={isRoot ? 'w-full h-full rounded-full border-2 border-white/20 bg-surface-container-highest flex items-center justify-center' : ''}>
                      {node.name?.charAt(0)?.toUpperCase()}
                    </div>
                  </div>
                  <div className={`absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] font-label font-bold px-2 py-0.5 rounded uppercase whitespace-nowrap opacity-0 group-hover/node:opacity-100 transition-opacity ${isRoot ? 'bg-primary text-on-primary' : 'bg-surface-variant text-on-surface-variant'}`}>
                    {node.name}
                  </div>
                </div>
              );
            })}
            
            {networkNodes.length === 0 && (
              <p className="text-on-surface-variant/50 uppercase tracking-widest text-xs font-label text-center">No Activity Yet</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

/* ─── Fraud Monitoring ───────────────────────────────────── */
function FraudMonitoring({ fraudLogs }) {
  const typeConfig = {
    cycle: { icon: 'cycle', label: 'Cycle Blocked', bg: 'bg-error/10', text: 'text-error', border: 'border-error/20', barColor: 'bg-error', barWidth: '92%' },
    velocity: { icon: 'speed', label: 'Velocity Alert', bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20', barColor: 'bg-orange-400', barWidth: '65%' },
    self: { icon: 'person_pin', label: 'Self Referral', bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20', barColor: 'bg-yellow-400', barWidth: '48%' },
  };

  return (
    <section className="glass-card rounded-xl p-8 flex flex-col h-[450px] fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Icon name="shield_with_heart" className="text-tertiary" size={22} />
          <h2 className="text-xl font-headline font-bold">Fraud Monitoring</h2>
        </div>
        <span className="px-3 py-1 rounded-full bg-tertiary-container/20 text-tertiary text-[10px] font-label uppercase tracking-widest">Real-time Stream</span>
      </div>
      <div className="flex-1 overflow-y-auto pr-2">
        <table className="w-full text-left border-separate" style={{ borderSpacing: '0 12px' }}>
          <thead>
            <tr className="text-[10px] font-label text-on-surface-variant uppercase tracking-widest">
              <th className="pb-2 pl-4">User ID</th>
              <th className="pb-2">Violation Type</th>
              <th className="pb-2">Risk Level</th>
              <th className="pb-2 text-right pr-4">Timestamp</th>
            </tr>
          </thead>
          <tbody className="text-sm font-body">
            {fraudLogs.slice(0, 5).map((log) => {
              const cfg = typeConfig[log.reason] || typeConfig.self;
              return (
                <tr key={log.id} className="bg-surface-container-low/50 hover:bg-surface-container-high transition-all duration-200 cursor-help group/row">
                  <td className="py-4 pl-4 rounded-l-lg font-label text-xs">#{String(log.id).padStart(4, '0')}</td>
                  <td>
                    <div className="flex flex-col gap-1">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase ${cfg.bg} ${cfg.text} border ${cfg.border} w-fit`}>
                        <Icon name={cfg.icon} size={14} filled />
                        {cfg.label}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="w-24 h-1.5 bg-surface-variant rounded-full overflow-hidden">
                      <div className={`h-full ${cfg.barColor}`} style={{ width: cfg.barWidth }}></div>
                    </div>
                  </td>
                  <td className="py-4 text-right pr-4 rounded-r-lg text-on-surface-variant text-xs">
                    {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                </tr>
              );
            })}
            {fraudLogs.length === 0 && (
              <tr><td colSpan="4" className="py-8 text-center text-on-surface-variant/50 text-xs">No fraud events detected</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ─── Live Activity Feed ─────────────────────────────────── */
function LiveActivityFeed({ activities }) {
  const typeConfig = {
    referral_success: { icon: 'person_add', color: 'bg-secondary/10 text-secondary border-secondary/20', shadow: 'shadow-[0_0_10px_rgba(208,188,255,0.2)]', badge: 'bg-secondary/10 text-secondary border-secondary/20', badgeText: 'Verified' },
    cycle_blocked: { icon: 'block', color: 'bg-error/10 text-error border-error/20', shadow: 'shadow-[0_0_10px_rgba(255,180,171,0.2)]', badge: 'bg-error/10 text-error border-error/20', badgeText: 'Prevented' },
    self_referral_blocked: { icon: 'person_off', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20', shadow: '', badge: 'bg-orange-500/10 text-orange-400 border-orange-500/20', badgeText: 'Blocked' },
    velocity_blocked: { icon: 'speed', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', shadow: '', badge: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', badgeText: 'Throttled' },
  };

  // Map API type to visual config
  const getConfig = (activity) => {
    if (typeConfig[activity.type]) return typeConfig[activity.type];
    if (activity.type === 'reward_distributed' || activity.title?.toLowerCase().includes('reward')) {
      return { icon: 'redeem', color: 'bg-primary/10 text-primary border-primary/20', shadow: 'shadow-[0_0_10px_rgba(46,91,255,0.2)]', badge: 'bg-primary/10 text-primary border-primary/20', badgeText: 'Paid' };
    }
    return typeConfig.referral_success;
  };

  const displayActivities = activities;

  return (
    <section className="glass-card rounded-xl p-8 flex flex-col h-[450px] fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Icon name="bolt" className="text-primary" size={22} />
          <h2 className="text-xl font-headline font-bold">Live Activity Feed</h2>
        </div>
        <button className="text-[10px] font-label uppercase text-on-surface-variant hover:text-primary transition-colors tracking-widest">Clear Feed</button>
      </div>
      <div className="flex-1 overflow-y-auto pr-2">
        {displayActivities.slice(0, 6).map((activity, i, arr) => {
          const cfg = getConfig(activity);
          const isLast = i === arr.length - 1;
          return (
            <div key={i} className={`flex gap-4 relative group ${!isLast ? 'pb-6' : ''}`}>
              {!isLast && (
                <div className="absolute left-4 top-10 bottom-0 w-px bg-outline-variant/10"></div>
              )}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full ${cfg.color} flex items-center justify-center z-10 border ${cfg.shadow}`}>
                <Icon name={cfg.icon} size={16} />
              </div>
              <div className="flex-1 pb-2">
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold">{activity.title}</h4>
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${cfg.badge} uppercase border`}>{cfg.badgeText}</span>
                  </div>
                  <span className="text-[10px] font-label text-on-surface-variant">
                    {formatTimeAgo(activity.timestamp)}
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">{activity.description}</p>
              </div>
            </div>
          );
        })}
        {displayActivities.length === 0 && (
          <p className="text-center text-on-surface-variant/50 py-8 text-xs">No recent activity</p>
        )}
      </div>
    </section>
  );
}

function formatTimeAgo(timestamp) {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/* ─── Dashboard Page ─────────────────────────────────────── */
export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [activities, setActivities] = useState([]);
  const [fraudLogs, setFraudLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [simulating, setSimulating] = useState(false);

  const loadData = async (isInitial = true) => {
    try {
      if (isInitial) setLoading(true);
      const [m, a, f, u, r] = await Promise.all([
        fetchMetrics(), fetchActivityFeed(20), fetchFraudFlags(), fetchUsers(), fetchReferrals(),
      ]);
      setMetrics(m.data); setActivities(a.data); setFraudLogs(f.data); setUsers(u.data); setReferrals(r.data);
    } catch (err) {
      if (isInitial) setError(err.message || 'Failed to load dashboard data');
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);
    const interval = setInterval(() => loadData(false), 10000); // 10s polling
    return () => clearInterval(interval);
  }, []);

  const handleSimulate = async () => {
    try {
      setSimulating(true);
      await triggerSimulation(100);
      await loadData(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSimulating(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await exportDashboardReport();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'dashboard_report.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Export failed", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-on-surface-variant font-label uppercase tracking-widest">Loading Command Center...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="glass-card rounded-xl p-8 max-w-sm text-center">
          <Icon name="error_outline" className="text-error text-4xl mb-3" />
          <p className="text-error font-headline font-bold text-sm">Connection Error</p>
          <p className="text-xs text-on-surface-variant mt-2 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="px-5 py-2 bg-primary-container text-on-primary-container text-xs font-label uppercase tracking-widest rounded-lg hover:brightness-110 transition-all">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const m = metrics;

  return (
    <div className="space-y-8">
      {/* 1. Top Section (Metrics Panel) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        <MetricCard icon="group" iconColor="bg-primary/10 text-primary" label="Total Users" value={m?.total_users?.toLocaleString() || '0'} badge="+12%" badgeColor="text-primary" />
        <MetricCard icon="share" iconColor="bg-secondary/10 text-secondary" label="Total Referrals" value={m?.total_referrals?.toLocaleString() || '0'} badge="+5.4%" badgeColor="text-secondary" />
        <MetricCard icon="cycle" iconColor="bg-error/10 text-error" label="Cycles Prevented" value={m?.cycles_prevented?.toLocaleString() || '0'} badge="Crit" badgeColor="text-error" borderColor="border-l-2 border-l-error/30" />
        <MetricCard icon="account_tree" iconColor="bg-tertiary/10 text-tertiary" label="Avg Depth" value={m?.avg_referral_depth?.toFixed(1) || '0'} badge={`L${m?.avg_referral_depth?.toFixed(1) || '0'}`} badgeColor="text-tertiary" />
        <MetricCard icon="rule" iconColor="bg-surface-variant text-outline" label="V/R Ratio"
          value={<>{m?.valid_referrals?.toLocaleString() || '0'} <span className="text-[10px] font-normal text-on-surface-variant">/ {m?.rejected_referrals || '0'}</span></>}
          extra={<div className="flex gap-1 h-1 w-10 rounded-full overflow-hidden mt-3"><div className="bg-secondary w-3/4"></div><div className="bg-error w-1/4"></div></div>}
        />
        <MetricCard icon="gpp_maybe" iconColor="bg-tertiary/10 text-tertiary" label="Fraud Watch" value={m?.fraud_attempts?.toLocaleString() || '0'}
          extra={<div className="animate-pulse flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-tertiary"></div></div>}
        />
        <MetricCard icon="payments" iconColor="bg-gradient-to-br from-primary-container to-secondary-container text-white" label="Rewards" value={`₹${((m?.total_rewards_distributed || 0) / 1).toLocaleString()}`} />
      </section>

      {/* 2. Center Section (Referral Network Graph) */}
      <IntelligenceNetwork users={users} referrals={referrals} onSimulate={handleSimulate} isSimulating={simulating} onExportReport={handleExport} />

      {/* 3 & 4. Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <FraudMonitoring fraudLogs={fraudLogs} />
        <LiveActivityFeed activities={activities} />
      </div>
    </div>
  );
}
