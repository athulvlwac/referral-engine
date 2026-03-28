import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import Icon from '../components/Icon';
import { fetchUsers, fetchMetrics, processBatchRewards, payoutReward, rejectReward, fetchPendingRewards } from '../api/client';

const ChartTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (<div className="bg-surface-container border border-outline-variant/20 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-on-surface font-medium">{label}</p><p className="text-on-surface-variant">${payload[0].value.toLocaleString()}</p>
    </div>);
  }
  return null;
};

export default function Rewards() {
  const [users, setUsers] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [pendingTransactions, setPendingTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmingTx, setConfirmingTx] = useState(null);
  const [confirmingBatch, setConfirmingBatch] = useState(false);
  const [processingPay, setProcessingPay] = useState(false);
  const perPage = 4;

  const load = async () => {
    try {
      setLoading(true);
      const [u, m, p] = await Promise.all([fetchUsers(), fetchMetrics(), fetchPendingRewards()]);
      setUsers(u.data); setMetrics(m.data); setPendingTransactions(p.data);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  useEffect(() => {
    load();
  }, []);

  const executeProcessAll = async () => {
    try {
      setProcessingPay(true);
      await processBatchRewards();
      await load();
      setConfirmingBatch(false);
    } catch (err) { alert("Failed to process batch rewards"); } finally { setProcessingPay(false); }
  };

  const executePay = async () => {
    if (!confirmingTx) return;
    try {
      setProcessingPay(true);
      await payoutReward(confirmingTx.id);
      await load();
      setConfirmingTx(null);
    } catch (err) { alert("Failed to pay reward"); } finally { setProcessingPay(false); }
  };

  const handleReject = async (txId) => {
    try {
      await rejectReward(txId);
      await load();
    } catch (err) { alert("Failed to reject reward"); }
  };

  if (loading) return <div className="flex items-center justify-center h-[70vh]"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (error) return <div className="flex items-center justify-center h-[70vh]"><div className="glass-card rounded-xl p-8 text-center"><p className="text-error">{error}</p></div></div>;

  const totalPaid = metrics?.total_rewards_distributed || 0;
  const usersWithRewards = users.filter(u => u.reward_balance > 0);
  const avgReward = usersWithRewards.length > 0 ? totalPaid / usersWithRewards.length : 0;
  const pendingTotal = pendingTransactions.reduce((sum, tx) => sum + tx.amount, 0);

  const roles = ['Silver Tier Referrer', 'New Ambassador', 'Gold Merchant', 'Strategic Partner'];
  const payoutQueue = pendingTransactions.map((tx, i) => {
    const matchingUser = users.find(u => u.id === tx.user_id) || { id: tx.user_id, name: 'Unknown', role: 'Unknown' };
    return {
      id: tx.id,
      txId: `#TX-${String(9000 + tx.id).padStart(4, '0')}-${String.fromCharCode(65 + (i % 26))}${i + 1}`,
      user: matchingUser, amount: tx.amount, date: new Date(tx.created_at),
      status: tx.status, role: roles[i % 4],
    };
  });
  const totalPages = Math.max(1, Math.ceil(payoutQueue.length / perPage));
  const paginatedQueue = payoutQueue.slice((currentPage - 1) * perPage, currentPage * perPage);

  const chartData = [
    { day: 'MON', amount: Math.round(totalPaid * 0.12) }, { day: 'TUE', amount: Math.round(totalPaid * 0.18) },
    { day: 'WED', amount: Math.round(totalPaid * 0.15) }, { day: 'THU', amount: Math.round(totalPaid * 0.22) },
    { day: 'FRI', amount: Math.round(totalPaid * 0.20) }, { day: 'SAT', amount: Math.round(totalPaid * 0.08) },
    { day: 'SUN', amount: Math.round(totalPaid * 0.05) },
  ];

  const avatarColors = ['bg-primary-container', 'bg-secondary-container', 'bg-tertiary-container', 'bg-surface-container-highest', 'bg-error-container'];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-headline font-bold text-on-surface">Rewards Management</h1>
        <p className="text-sm text-on-surface-variant mt-1">Real-time financial tracking for referral distributions and automated payout queues.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: 'account_balance_wallet', iconBg: 'bg-secondary/10 text-secondary', label: 'Total Paid Out', value: `₹${totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, badge: '+52.4%', badgeCls: 'text-secondary bg-secondary/10' },
          { icon: 'schedule', iconBg: 'bg-error/10 text-error', label: 'Pending Payouts', value: `₹${pendingTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, badge: 'Urgent', badgeCls: 'text-error bg-error/10', sub: `${usersWithRewards.length} transactions requiring attention` },
          { icon: 'star', iconBg: 'bg-primary/10 text-primary', label: 'Average Reward', value: `₹${avgReward.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, badge: 'Global', badgeCls: 'text-primary bg-primary/10', sub: 'Based on last 30 days active cycle' },
        ].map((card, i) => (
          <div key={i} className="glass-card rounded-xl p-6 glow-primary hover:scale-[1.02] transition-all duration-500 fade-in">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2.5 rounded-xl ${card.iconBg}`}><Icon name={card.icon} size={22} /></div>
              <span className={`text-[10px] font-label font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${card.badgeCls}`}>{card.badge}</span>
            </div>
            <p className="text-[10px] font-label text-on-surface-variant uppercase tracking-widest">{card.label}</p>
            <p className="text-2xl font-headline font-bold text-on-surface mt-1">{card.value}</p>
            {card.sub && <p className="text-[10px] text-on-surface-variant/60 mt-1">{card.sub}</p>}
          </div>
        ))}
      </div>

      {/* Payout Queue */}
      <div className="glass-card rounded-xl p-8 fade-in">
        <div className="flex items-center justify-between mb-6">
          <div><h3 className="text-xl font-headline font-bold text-on-surface">Payout Queue</h3><p className="text-sm text-on-surface-variant mt-0.5">Validate and authorize pending reward distributions</p></div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-2 rounded-lg text-[11px] font-label uppercase tracking-wide text-on-surface-variant border border-outline-variant/20 hover:bg-surface-container-high transition-colors">Filter</button>
            <button onClick={() => setConfirmingBatch(true)} className="flex items-center gap-1.5 px-4 py-2 bg-primary-container text-on-primary-container text-[11px] font-label uppercase tracking-wide rounded-lg hover:brightness-110 transition-all">
              <Icon name="bolt" size={14} /> Process All
            </button>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead><tr className="border-b border-outline-variant/10">
            {['Transaction ID', 'Recipient', 'Amount', 'Date Initiated', 'Status', 'Actions'].map((h, i) => (
              <th key={h} className={`${i === 5 ? 'text-right' : 'text-left'} px-4 py-3 text-[10px] font-label text-on-surface-variant uppercase tracking-widest`}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {paginatedQueue.map((item, i) => (
              <tr key={i} className="border-b border-outline-variant/5 hover:bg-surface-container-low/50 transition-all">
                <td className="px-4 py-4 text-on-surface-variant font-label text-xs">{item.txId}</td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full ${avatarColors[item.user.id % avatarColors.length]} flex items-center justify-center text-white text-xs font-bold`}>{item.user.name?.charAt(0)}</div>
                    <div><p className="font-semibold text-on-surface text-sm">{item.user.name}</p><p className="text-[10px] text-on-surface-variant">{item.role}</p></div>
                  </div>
                </td>
                <td className="px-4 py-4 text-on-surface font-headline font-bold">${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td className="px-4 py-4 text-on-surface-variant text-xs">{item.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}<br />{item.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                <td className="px-4 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-label font-bold ${item.status === 'Pending' ? 'bg-secondary/10 text-secondary' : 'bg-error/10 text-error'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'Pending' ? 'bg-secondary' : 'bg-error'}`} />
                    {item.status}
                  </span>
                </td>
                <td className="px-4 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {item.status === 'Flagged' ? (
                      <button className="px-3 py-1.5 rounded-lg text-[11px] font-label text-on-surface-variant border border-outline-variant/20 hover:bg-surface-container-high">Review</button>
                    ) : (<>
                      <button onClick={() => handleReject(item.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-on-surface-variant border border-outline-variant/20 hover:bg-surface-container-high"><Icon name="close" size={14} /></button>
                      <button onClick={() => setConfirmingTx(item)} className="px-3 py-1.5 rounded-lg text-[11px] font-label text-on-primary-container bg-primary-container hover:brightness-110">Pay</button>
                    </>)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between px-4 py-3 mt-2 border-t border-outline-variant/10">
          <span className="text-[11px] font-label text-on-surface-variant">Showing {paginatedQueue.length} of {payoutQueue.length} pending requests</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="w-7 h-7 rounded-lg text-on-surface-variant hover:bg-surface-container-high text-xs disabled:opacity-30"><Icon name="chevron_left" size={16} /></button>
            <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="w-7 h-7 rounded-lg text-on-surface-variant hover:bg-surface-container-high text-xs disabled:opacity-30"><Icon name="chevron_right" size={16} /></button>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-xl p-8 fade-in">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-headline font-bold text-on-surface">Payout Velocity</h3>
            <button className="text-on-surface-variant hover:text-on-surface text-lg">⋯</button>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barCategoryGap="25%">
                <XAxis dataKey="day" tick={{ fill: '#8e90a2', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8e90a2', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={false} />
                <Bar dataKey="amount" fill="#282a2e" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="glass-card rounded-xl p-8 fade-in">
          <h3 className="text-lg font-headline font-bold text-on-surface mb-6">Security Intelligence</h3>
          <div className="space-y-5">
            {[
              { title: 'Automatic Review Triggered', desc: 'Payout ID #TX-7719 flagged for high-velocity referral origin.', time: '2 MINUTES AGO', color: 'bg-error' },
              { title: 'System Reconciliation Complete', desc: 'Daily payout balance matched with external ledger accounts.', time: '1 HOUR AGO', color: 'bg-secondary' },
              { title: 'New Tier Threshold Reached', desc: 'User moved to Strategic Partner tier.', time: '3 HOURS AGO', color: 'bg-primary' },
            ].map((e, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div className={`w-2.5 h-2.5 rounded-full ${e.color} mt-1.5 shrink-0`} />
                <div><p className="text-sm font-semibold text-on-surface">{e.title}</p><p className="text-xs text-on-surface-variant mt-0.5">{e.desc}</p><p className="text-[9px] font-label text-on-surface-variant/50 mt-1 uppercase tracking-widest">{e.time}</p></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm fade-in">
          <div className="bg-surface-container-high border border-outline-variant/20 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <div className="flex justify-center mb-5">
              <div className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                <Icon name="payments" size={24} />
              </div>
            </div>
            <h3 className="text-xl font-headline font-bold text-on-surface text-center mb-2">Authorize Payout</h3>
            <p className="text-sm text-on-surface-variant text-center mb-6">
              You are about to release <strong className="text-on-surface">₹{confirmingTx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong> to <strong className="text-on-surface">{confirmingTx.user?.name}</strong>. This action cannot be reversed.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setConfirmingTx(null)} 
                disabled={processingPay}
                className="flex-1 py-2.5 rounded-xl border border-outline-variant/30 text-xs font-label uppercase tracking-widest text-on-surface-variant hover:bg-surface-container-highest transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={executePay} 
                disabled={processingPay}
                className="flex-1 py-2.5 rounded-xl bg-primary-container text-on-primary-container text-xs font-label uppercase tracking-widest hover:brightness-110 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {processingPay ? <div className="w-4 h-4 border-2 border-on-primary-container/30 border-t-on-primary-container rounded-full animate-spin" /> : <Icon name="check" size={16} />}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Confirmation Modal */}
      {confirmingBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm fade-in">
          <div className="bg-surface-container-high border border-outline-variant/20 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <div className="flex justify-center mb-5">
              <div className="w-12 h-12 rounded-full bg-secondary/20 text-secondary flex items-center justify-center">
                <Icon name="bolt" size={24} />
              </div>
            </div>
            <h3 className="text-xl font-headline font-bold text-on-surface text-center mb-2">Process All Pending</h3>
            <p className="text-sm text-on-surface-variant text-center mb-6">
              You are about to scan the database and sweep all outstanding account balances into the pending payout queue. Proceed?
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setConfirmingBatch(false)} 
                disabled={processingPay}
                className="flex-1 py-2.5 rounded-xl border border-outline-variant/30 text-xs font-label uppercase tracking-widest text-on-surface-variant hover:bg-surface-container-highest transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={executeProcessAll} 
                disabled={processingPay}
                className="flex-1 py-2.5 rounded-xl bg-secondary text-on-primary-container text-xs font-label uppercase tracking-widest hover:brightness-110 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {processingPay ? <div className="w-4 h-4 border-2 border-on-primary-container/30 border-t-on-primary-container rounded-full animate-spin" /> : <Icon name="bolt" size={16} />}
                Process
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
