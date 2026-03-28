import { useState, useEffect } from 'react';
import Icon from '../components/Icon';
import { fetchUsers, fetchReferrals } from '../api/client';

const TreeNode = ({ node, level = 0 }) => {
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
          {/* Vertical line from parent */}
          <div className="absolute top-0 left-1/2 w-[2px] h-8 bg-outline-variant/30 -translate-x-1/2" />
          
          <div className="flex justify-center gap-8 relative shrink-0">
             {node.children.map((child, i) => {
               const isFirst = i === 0;
               const isLast = i === node.children.length - 1;
               const isOnly = node.children.length === 1;
               
               return (
                 <div key={child.id} className="relative pt-8 flex flex-col items-center shrink-0">
                   {/* Horizontal connecting line across siblings */}
                   {!isOnly && (
                     <div className={`absolute top-0 h-[2px] bg-outline-variant/30 ${
                         isFirst ? 'left-1/2 right-0' :
                         isLast ? 'left-0 right-1/2' :
                         'left-0 right-0'
                     }`} />
                   )}
                   
                   {/* Vertical line going down to child */}
                   <div className="absolute top-0 left-1/2 w-[2px] h-8 bg-outline-variant/30 -translate-x-1/2" />
                   
                   <TreeNode node={child} level={level + 1} />
                 </div>
               );
             })}
          </div>
        </div>
      )}
    </div>
  );
};


export default function Referrals() {
  const [users, setUsers] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('active');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedUser, setExpandedUser] = useState(null);
  const perPage = 4;

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [u, r] = await Promise.all([fetchUsers(), fetchReferrals()]);
        setUsers(u.data); setReferrals(r.data);
      } catch (err) { setError(err.message); } finally { setLoading(false); }
    }
    load();
  }, []);

  const referralCountMap = {};
  referrals.forEach((r) => { referralCountMap[r.parent_id] = (referralCountMap[r.parent_id] || 0) + 1; });

  const buildTree = (rootId) => {
    const rootUser = users.find(u => u.id === rootId);
    if (!rootUser) return null;
    const childrenNodes = referrals
      .filter(r => r.parent_id === rootId)
      .map(r => buildTree(r.child_id))
      .filter(Boolean);
    return { ...rootUser, children: childrenNodes };
  };

  const filteredUsers = users.filter((u) => {
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    return matchSearch && (filter === 'active' ? u.status === 'active' : u.status === 'flagged');
  });

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / perPage));
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * perPage, currentPage * perPage);
  const totalActiveReferrers = Object.keys(referralCountMap).length;
  const growthRate = referrals.length > 0 ? ((referrals.length / Math.max(users.length, 1)) * 100).toFixed(1) : 0;

  const avatarColors = ['bg-primary-container', 'bg-secondary-container', 'bg-tertiary-container', 'bg-surface-container-highest', 'bg-error-container', 'bg-primary/30'];

  if (loading) return <div className="flex items-center justify-center h-[70vh]"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (error) return <div className="flex items-center justify-center h-[70vh]"><div className="glass-card rounded-xl p-8 text-center"><p className="text-error text-sm font-bold">{error}</p><button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-primary-container text-on-primary-container text-xs rounded-lg">Retry</button></div></div>;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-headline font-bold text-on-surface">Referral Intelligence</h1>
          <p className="text-sm text-on-surface-variant mt-1">Manage and monitor your ecosystem's growth engine.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="glass-card rounded-xl px-5 py-3 text-center">
            <p className="text-[9px] font-label text-on-surface-variant uppercase tracking-widest">Growth</p>
            <p className="text-lg font-headline font-bold text-secondary">+{growthRate}%</p>
          </div>
          <div className="glass-card rounded-xl px-5 py-3 text-center">
            <p className="text-[9px] font-label text-on-surface-variant uppercase tracking-widest">Referrers</p>
            <p className="text-lg font-headline font-bold text-on-surface">{String(totalActiveReferrers).padStart(2, '0')}</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50" size={18} />
            <input type="text" placeholder="Network Search..." value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="bg-surface-container border border-outline-variant/20 rounded-lg pl-10 pr-4 py-2.5 text-sm text-on-surface placeholder-on-surface-variant/40 focus:outline-none focus:border-primary/30 w-56" />
          </div>
          <div className="flex p-1 bg-surface-container-high rounded-lg border border-outline-variant/20">
            {['active', 'pending'].map((f) => (
              <button key={f} onClick={() => { setFilter(f); setCurrentPage(1); }}
                className={`px-4 py-1.5 rounded text-[10px] font-label uppercase tracking-widest transition-all ${filter === f ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:text-on-surface'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-primary-container text-on-primary-container text-xs font-label uppercase tracking-widest rounded-lg hover:brightness-110 transition-all">
          <Icon name="download" size={16} /> Export Referral Data
        </button>
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl overflow-hidden fade-in">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-outline-variant/10">
              <th className="text-left px-6 py-4 text-[10px] font-label text-on-surface-variant uppercase tracking-widest">User</th>
              <th className="text-center px-6 py-4 text-[10px] font-label text-on-surface-variant uppercase tracking-widest">Invitations</th>
              <th className="text-left px-6 py-4 text-[10px] font-label text-on-surface-variant uppercase tracking-widest">Conversion Rate</th>
              <th className="text-center px-6 py-4 text-[10px] font-label text-on-surface-variant uppercase tracking-widest">Tree</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.map((user) => {
              const invites = referralCountMap[user.id] || 0;
              const convRate = invites > 0 ? Math.min(100, Math.round((invites / Math.max(users.length * 0.08, 1)) * 100)) : 0;
              const isExpanded = expandedUser === user.id;

              return (
                <tr key={user.id} className="border-b border-outline-variant/5 hover:bg-surface-container-low/50 transition-all">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full ${avatarColors[(user.id || 0) % avatarColors.length]} flex items-center justify-center text-white text-sm font-bold shadow-sm`}>
                        {user.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-on-surface text-sm">{user.name}</p>
                        <p className="text-[11px] text-on-surface-variant">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center"><span className="text-on-surface font-bold font-headline text-lg">{invites.toLocaleString()}</span></td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-28 h-2 bg-surface-variant rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary-container to-secondary-container rounded-full" style={{ width: `${convRate}%` }} />
                      </div>
                      <span className="text-xs text-on-surface-variant font-label">{convRate}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => setExpandedUser(user.id)}
                      className="p-2 rounded-lg transition-all border border-transparent hover:bg-surface-container-high text-on-surface-variant hover:text-primary hover:border-outline-variant/10"
                      title="View Referral Tree"
                    >
                      <Icon name="account_tree" size={18} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-outline-variant/10">
          <span className="text-[11px] font-label text-on-surface-variant tracking-wide">
            Displaying {Math.min((currentPage - 1) * perPage + 1, filteredUsers.length)}-{Math.min(currentPage * perPage, filteredUsers.length)} of {filteredUsers.length} Referrers
          </span>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((page) => (
              <button key={page} onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-lg text-xs font-label transition-all ${currentPage === page ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:bg-surface-container-high'}`}>
                {page}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 glass-card rounded-xl p-8 fade-in">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-headline font-bold text-on-surface">Network Growth Projection</h3>
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[9px] font-label uppercase tracking-widest">Projected</span>
          </div>
          <p className="text-sm text-on-surface-variant mb-6">Based on current referral patterns, your network is expected to expand by {(users.length * 1750).toLocaleString()} nodes in the next quarter.</p>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-4xl font-headline font-bold text-on-surface">{(growthRate * 1.25).toFixed(1)}%</p>
              <p className="text-[11px] font-label text-on-surface-variant uppercase tracking-wider mt-1">Projected Growth</p>
            </div>
            <div>
              <p className="text-4xl font-headline font-bold text-on-surface">1.4</p>
              <p className="text-[11px] font-label text-on-surface-variant uppercase tracking-wider mt-1">Avg Depth Factor</p>
            </div>
          </div>
        </div>
        <div className="lg:col-span-2 glass-card rounded-xl p-8 fade-in border border-tertiary-container/20 bg-gradient-to-br from-tertiary-container/10 to-transparent">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-headline font-bold text-on-surface">Automated Rewards</h3>
            <span className="px-3 py-1 rounded-full bg-tertiary/10 text-tertiary text-[9px] font-label uppercase tracking-widest">Automated</span>
          </div>
          <p className="text-sm text-on-surface-variant mb-5">Reward distribution for Q3 top-tier referrers is now active.</p>
          <button className="px-5 py-2.5 bg-tertiary-container text-on-tertiary-container text-xs font-label uppercase tracking-widest rounded-lg hover:brightness-110 transition-all">
            Review Distribution
          </button>
        </div>
      </div>

      {/* Tree Modal */}
      {expandedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md p-4 sm:p-8 animate-fade-in">
          <div className="glass-card w-full max-w-5xl max-h-[85vh] flex flex-col rounded-2xl shadow-2xl relative border border-outline-variant/30">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-outline-variant/10">
              <div>
                <h2 className="text-xl font-headline font-bold text-on-surface flex items-center gap-2">
                  <Icon name="account_tree" className="text-primary" size={24} /> Referral Hierarchy
                </h2>
                <p className="text-sm text-on-surface-variant mt-1">
                  Viewing downstream network for <span className="font-bold text-on-surface">{users.find(u => u.id === expandedUser)?.name}</span>
                </p>
              </div>
              <button 
                onClick={() => setExpandedUser(null)} 
                className="p-2 rounded-lg bg-surface-container hover:bg-surface-variant text-on-surface-variant hover:text-white transition-colors"
                title="Close"
              >
                <Icon name="close" size={24} />
              </button>
            </div>
            
            {/* Modal Body (Tree) */}
            <div className="p-8 overflow-auto flex-1 custom-scrollbar">
              <div className="min-w-fit">
                <TreeNode node={buildTree(expandedUser)} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
