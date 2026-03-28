import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import Icon from '../components/Icon';
import { fetchFraudFlags, fetchMetrics, fetchUsers, blockUser, dismissFraudLog, reviewFraudLog } from '../api/client';

const ChartTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-surface-container border border-outline-variant/20 rounded-lg px-3 py-2 text-xs shadow-xl">
        <p className="text-on-surface font-medium">{label}</p>
        <p className="text-on-surface-variant">{payload[0].value} attempts</p>
      </div>
    );
  }
  return null;
};

export default function FraudWatch() {
  const [fraudLogs, setFraudLogs] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const [f, m, u] = await Promise.all([fetchFraudFlags(), fetchMetrics(), fetchUsers()]);
      setFraudLogs(f.data); setMetrics(m.data); setUsers(u.data);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  useEffect(() => {
    load();
  }, []);

  const handleReview = async (id) => {
    try { await reviewFraudLog(id); await load(); } catch (err) { alert('Failed to review'); }
  };

  const handleBlock = async (userId) => {
    try { await blockUser(userId); await load(); } catch (err) { alert('Failed to block'); }
  };

  const handleDismiss = async (id) => {
    try { await dismissFraudLog(id); await load(); } catch (err) { alert('Failed to dismiss'); }
  };

  if (loading) return <div className="flex items-center justify-center h-[70vh]"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (error) return <div className="flex items-center justify-center h-[70vh]"><div className="glass-card rounded-xl p-8 text-center"><p className="text-error">{error}</p></div></div>;

  const hours = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'];
  // Build chart data from real fraud logs timestamps
  const hourCounts = [0, 0, 0, 0, 0, 0];
  fraudLogs.forEach(log => {
    const h = new Date(log.created_at).getHours();
    const bucket = Math.min(5, Math.floor(h / 4));
    hourCounts[bucket]++;
  });
  const chartData = hours.map((h, i) => ({ time: h, count: hourCounts[i] }));
  const barColors = chartData.map((d) => d.count > 2 ? '#7c3aed' : d.count > 0 ? '#5c1a35' : '#282a2e');

  const userMap = {};
  users.forEach(u => { userMap[u.id] = u; });

  const reasonConfig = {
    cycle: { label: 'Cycle Detection', badge: 'bg-error/10 text-error', score: 94, barColor: 'bg-error' },
    self: { label: 'Pattern Match', badge: 'bg-orange-500/10 text-orange-400', score: 78, barColor: 'bg-pink-500' },
    velocity: { label: 'Velocity Spike', badge: 'bg-yellow-500/10 text-yellow-400', score: 45, barColor: 'bg-primary' },
  };
  const avatarColors = ['bg-error-container', 'bg-tertiary-container', 'bg-secondary-container', 'bg-primary-container', 'bg-surface-container-highest'];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-headline font-bold text-on-surface">Fraud Analysis</h1>
          <p className="text-sm text-on-surface-variant mt-1">Real-time threat monitoring and risk distribution.</p>
        </div>
        <div className="glass-card rounded-xl px-6 py-3 text-center">
          <p className="text-[9px] font-label text-on-surface-variant uppercase tracking-widest">Active Alerts</p>
          <p className="text-3xl font-headline font-bold text-on-surface">{(fraudLogs.length * 160 + 4).toLocaleString()}</p>
        </div>
      </div>

      {/* Chart + Engine Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 glass-card rounded-xl p-8 fade-in">
          <h3 className="text-lg font-headline font-bold text-on-surface mb-6">Risk Density Map</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barCategoryGap="20%">
                <XAxis dataKey="time" tick={{ fill: '#8e90a2', fontSize: 11, fontFamily: 'Space Grotesk' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8e90a2', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={false} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {chartData.map((_, i) => <Cell key={i} fill={barColors[i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card rounded-xl p-6 border border-primary/10 glow-primary fade-in">
          <h3 className="text-lg font-headline font-bold text-on-surface mb-6">Engine Performance</h3>
          <div className="space-y-6">
            <div>
              <p className="text-[10px] font-label text-on-surface-variant uppercase tracking-widest">Velocity Check</p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-base font-headline font-bold text-on-surface">99.8% Accuracy</p>
                <div className="w-6 h-6 rounded-full border-2 border-outline-variant border-t-primary animate-spin" style={{ animationDuration: '3s' }} />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-label text-on-surface-variant uppercase tracking-widest">Pattern Match</p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-base font-headline font-bold text-on-surface">Active Discovery</p>
                <Icon name="auto_awesome" className="text-tertiary" size={18} />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-label text-on-surface-variant uppercase tracking-widest">Geo-Fencing</p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-base font-headline font-bold text-on-surface">4 Restricted Zones</p>
                <Icon name="my_location" className="text-error" size={18} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Priority Alerts */}
      <div className="glass-card rounded-xl p-8 fade-in">
        <div className="mb-6">
          <h3 className="text-xl font-headline font-bold text-on-surface">Priority Alerts</h3>
          <p className="text-sm text-on-surface-variant mt-0.5">Critical events requiring immediate administrative action.</p>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-outline-variant/10">
              {['User Identity', 'Risk Score', 'Detection Engine', 'Action'].map((h, i) => (
                <th key={h} className={`${i === 3 ? 'text-right' : 'text-left'} px-4 py-3 text-[10px] font-label text-on-surface-variant uppercase tracking-widest`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fraudLogs.slice(0, 6).map((log, idx) => {
              const user = userMap[log.user_id];
              const cfg = reasonConfig[log.reason] || reasonConfig.self;
              return (
                <tr key={log.id} className="border-b border-outline-variant/5 hover:bg-surface-container-low/50 transition-all">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full ${avatarColors[idx % avatarColors.length]} flex items-center justify-center text-white text-sm font-bold`}>
                        {user?.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="font-semibold text-on-surface">{user?.name || `User #${log.user_id}`}</p>
                        <p className="text-[10px] text-on-surface-variant">ID: Pulse_{String(log.user_id).padStart(5, '0')}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-2.5 bg-surface-variant rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${cfg.barColor}`} style={{ width: `${cfg.score}%` }} />
                      </div>
                      <span className="text-xs text-on-surface font-bold font-headline">{cfg.score}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-2.5 py-1 rounded text-[10px] font-label font-bold uppercase tracking-wide ${cfg.badge}`}>{cfg.label}</span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleReview(log.id)} className="px-3 py-1.5 rounded-lg text-[11px] font-label uppercase tracking-wide text-on-surface-variant border border-outline-variant/20 hover:bg-surface-container-high transition-colors">Review</button>
                      {cfg.score >= 70 ? (
                        <button onClick={() => handleBlock(log.user_id)} className="px-3 py-1.5 rounded-lg text-[11px] font-label uppercase tracking-wide text-on-error-container bg-error-container hover:brightness-110 transition-all">Block</button>
                      ) : (
                        <button onClick={() => handleDismiss(log.id)} className="px-3 py-1.5 rounded-lg text-[11px] font-label uppercase tracking-wide text-on-surface-variant border border-outline-variant/20 hover:bg-surface-container-high transition-colors">Dismiss</button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="flex items-center justify-center mt-6 pt-4 border-t border-outline-variant/10">
          <button className="text-sm text-on-surface-variant hover:text-primary transition-colors flex items-center gap-2 font-label">
            Load Full Audit Log <Icon name="arrow_forward" size={16} />
          </button>
        </div>
      </div>

      {/* Bottom Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: 'settings', label: 'Engine Status', value: fraudLogs.length > 0 ? 'ACTIVE' : 'IDLE' },
          { icon: 'bolt', label: 'Total Fraud Logs', value: String(fraudLogs.length) },
          { icon: 'timer', label: 'Cycles Prevented', value: String(metrics?.cycles_prevented || 0) },
          { icon: 'visibility', label: 'Fraud Attempts', value: String(metrics?.fraud_attempts || 0) },
        ].map((stat, i) => (
          <div key={i} className="glass-card rounded-xl p-6 text-center fade-in glow-primary hover:scale-[1.02] transition-all duration-500">
            <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center mx-auto mb-3">
              <Icon name={stat.icon} className="text-on-surface-variant" size={20} />
            </div>
            <p className="text-[9px] font-label text-on-surface-variant uppercase tracking-widest">{stat.label}</p>
            <p className="text-lg font-headline font-bold text-on-surface mt-1">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
