import { useState, useEffect } from 'react';
import Icon from '../components/Icon';
import { fetchMe, fetchMeGraph } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

const TreeNode = ({ node, level = 0 }) => {
  if (!node) return null;
  const isRoot = level === 0;
  return (
    <div className="flex flex-col items-center relative shrink-0">
      <div className={`inline-flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all z-10 shrink-0 ${isRoot ? 'bg-primary-container border-primary/30 text-on-primary-container shadow-md' : 'bg-surface-container border-outline-variant/20 text-on-surface hover:border-primary/30 hover:bg-surface-container-high'}`}>
        <div className={`w-9 h-9 min-w-9 min-h-9 rounded-full ${isRoot ? 'bg-primary text-white shadow-lg' : 'bg-surface-variant text-on-surface-variant'} flex items-center justify-center text-sm font-bold shrink-0`}>
          {node.name?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <div className="whitespace-nowrap">
          <p className="font-semibold text-sm leading-tight">{node.name || 'Unknown'}</p>
          <p className="text-[10px] opacity-70 mt-0.5 font-mono">#{String(node.id || '0').padStart(4, '0')}</p>
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

export default function UserDashboard() {
  const [profile, setProfile] = useState(null);
  const [graph, setGraph] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const { logout } = useAuth();

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [p, g] = await Promise.all([fetchMe(), fetchMeGraph()]);
        setProfile(p.data);
        setGraph(g.data);
      } catch (err) {
        setError(err.response?.data?.detail || err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleCopy = () => {
    const code = profile?.user?.referral_code || profile?.referral_code;
    if (!code) return;
    const url = `${window.location.origin}/register?ref=${code}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="flex items-center justify-center h-[70vh]"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (error) return (
    <div className="flex items-center justify-center h-[70vh]">
      <div className="glass-card rounded-xl p-8 text-center max-w-sm">
        <Icon name="error_outline" className="text-error text-4xl mb-3" />
        <p className="text-error font-headline font-bold">Failed to load profile</p>
        <p className="text-xs text-on-surface-variant mt-2 mb-4">{error}</p>
        <button onClick={logout} className="text-primary text-xs hover:underline">Return to Login</button>
      </div>
    </div>
  );

  const directCount = graph?.root?.children?.length || 0;
  const balance = profile?.reward_balance || 0;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold text-on-surface">Welcome back, {profile.name?.split(' ')[0]}</h1>
          <p className="text-sm text-on-surface-variant mt-1">Manage your personal referral network and rewards.</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-label text-on-surface-variant uppercase tracking-widest mb-1">Available Balance</p>
          <p className="text-2xl font-headline font-bold text-primary">₹{balance.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card rounded-xl p-8 fade-in flex border border-primary/20">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary-container text-on-primary-container">
                <Icon name="loyalty" size={20} />
              </div>
              <h3 className="text-lg font-headline font-bold text-on-surface">Your Invite Link</h3>
            </div>
            <p className="text-xs text-on-surface-variant mb-6 leading-relaxed">
              Share this unique link with friends. When they register using your code, you'll earn rewards added directly to your balance.
            </p>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-background border border-outline-variant/30 rounded-lg px-4 py-3 font-mono text-sm text-on-surface truncate">
                {window.location.origin}/register?ref={profile?.user?.referral_code || profile?.referral_code}
              </div>
              <button 
                onClick={handleCopy}
                className="flex items-center gap-2 px-5 py-3 bg-primary text-on-primary text-xs font-label uppercase tracking-widest rounded-lg hover:brightness-110 transition-all shrink-0"
              >
                <Icon name={copied ? "check" : "content_copy"} size={16} />
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-8 fade-in flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-tertiary-container text-on-tertiary-container">
                <Icon name="account_tree" size={20} />
              </div>
              <p className="text-[10px] font-label text-on-surface-variant uppercase tracking-widest">Network Growth</p>
            </div>
            <h3 className="text-4xl font-headline font-bold text-on-surface mb-1">{graph?.total_nodes || 1}</h3>
            <p className="text-xs text-on-surface-variant">Total downline members</p>
          </div>
          <div className="text-right pl-6 border-l border-outline-variant/20">
            <p className="text-[10px] font-label text-on-surface-variant uppercase tracking-widest mb-1">Direct Invites</p>
            <p className="text-2xl font-headline font-bold text-on-surface mb-4">{directCount}</p>
            <p className="text-[10px] font-label text-on-surface-variant uppercase tracking-widest mb-1">Status</p>
            <p className="text-sm font-bold text-secondary uppercase bg-secondary/10 px-3 py-1 rounded inline-block">{profile.status}</p>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-xl p-8 overflow-hidden min-h-[400px] flex flex-col fade-in">
        <h3 className="text-lg font-headline font-bold text-on-surface mb-6 flex items-center gap-2">
          <Icon name="hub" size={20} className="text-primary" /> My Hierarchy Tree
        </h3>
        {graph?.total_nodes > 1 ? (
          <div className="flex-1 overflow-auto custom-scrollbar bg-surface-container-low/50 border border-outline-variant/20 rounded-xl p-8 flex justify-center">
            {graph.root ? <TreeNode node={graph.root} /> : <p className="text-on-surface-variant my-auto">Tree generation failed</p>}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-surface-container-low/50 border border-outline-variant/20 rounded-xl">
            <div className="w-16 h-16 rounded-full bg-surface-variant flex items-center justify-center text-on-surface-variant mb-4">
              <Icon name="sentiment_dissatisfied" size={32} />
            </div>
            <p className="text-on-surface font-semibold mb-2">No downline yet</p>
            <p className="text-xs text-on-surface-variant max-w-sm">Share your invite link above and your referrals will appear as an interactive tree right here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
