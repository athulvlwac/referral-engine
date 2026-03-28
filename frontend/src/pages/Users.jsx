import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon';
import { fetchUsers, exportUsers } from '../api/client';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedId, setCopiedId] = useState(null);
  const perPage = 10;

  const handleCopyLink = (id, code) => {
    const url = `${window.location.origin}/register?ref=${code || id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExport = async () => {
    try {
      const res = await exportUsers();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'users_export.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Export failed", err);
    }
  };

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetchUsers();
        setUsers(res.data);
      } catch (err) {
        setError(err.message || 'Failed to fetch users');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredUsers = users.filter((u) => 
    !search || 
    u.name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / perPage));
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * perPage, currentPage * perPage);

  const avatarColors = [
    'bg-primary-container', 
    'bg-secondary-container', 
    'bg-tertiary-container', 
    'bg-surface-container-highest', 
    'bg-error-container', 
    'bg-primary/30'
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-[70vh]">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
  
  if (error) return (
    <div className="flex items-center justify-center h-[70vh]">
      <div className="glass-card rounded-xl p-8 text-center">
        <p className="text-error text-sm font-bold">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-primary-container text-on-primary-container text-xs rounded-lg">Retry</button>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-headline font-bold text-on-surface">User Directory</h1>
          <p className="text-sm text-on-surface-variant mt-1">Manage and view all registered users in the network.</p>
        </div>
        <div className="glass-card rounded-xl px-5 py-3 text-center">
          <p className="text-[9px] font-label text-on-surface-variant uppercase tracking-widest">Total Users</p>
          <p className="text-lg font-headline font-bold text-primary">{users.length}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="relative">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50" size={18} />
          <input 
            type="text" 
            placeholder="Search Users..." 
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="bg-surface-container border border-outline-variant/20 rounded-lg pl-10 pr-4 py-2.5 text-sm text-on-surface placeholder-on-surface-variant/40 focus:outline-none focus:border-primary/30 w-64" 
          />
        </div>
        <div className="flex gap-3">
          <Link to="/create-user" className="flex items-center gap-2 px-4 py-2.5 bg-primary-container text-on-primary-container text-xs font-label uppercase tracking-widest rounded-lg hover:brightness-110 transition-all">
            <Icon name="person_add" size={16} /> Create User
          </Link>
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2.5 text-xs font-label uppercase tracking-widest text-on-surface-variant border border-outline-variant/20 rounded-lg hover:bg-surface-container-high transition-colors">
            <Icon name="download" size={16} /> Export List
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl overflow-hidden fade-in">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-outline-variant/10 bg-surface-container-low/50">
              <th className="px-6 py-4 text-[10px] font-label text-on-surface-variant uppercase tracking-widest">User</th>
              <th className="px-6 py-4 text-[10px] font-label text-on-surface-variant uppercase tracking-widest">ID</th>
              <th className="px-6 py-4 text-[10px] font-label text-on-surface-variant uppercase tracking-widest">Status</th>
              <th className="px-6 py-4 text-[10px] font-label text-on-surface-variant uppercase tracking-widest">Joined Date</th>
              <th className="px-6 py-4 text-[10px] font-label text-on-surface-variant uppercase tracking-widest text-right">Invite Link</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.map((user) => (
              <tr key={user.id} className="border-b border-outline-variant/5 hover:bg-surface-container-low/50 transition-all group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${avatarColors[(user.id || 0) % avatarColors.length]} flex items-center justify-center text-white text-sm font-bold shadow-sm`}>
                      {user.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-on-surface text-sm group-hover:text-primary transition-colors">{user.name}</p>
                      <p className="text-[11px] text-on-surface-variant">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-on-surface-variant font-mono text-xs">#{String(user.id).padStart(4, '0')}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 text-[10px] font-label uppercase tracking-widest rounded-full ${user.status === 'active' || !user.status ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-error/10 text-error border border-error/20'}`}>
                    {user.status || 'Active'}
                  </span>
                </td>
                <td className="px-6 py-4 text-on-surface-variant text-xs">
                  {user.created_at ? new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric'}) : 'N/A'}
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => handleCopyLink(user.id, user.referral_code)}
                    className="p-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-primary transition-all border border-outline-variant/10"
                    title="Copy Invite Link"
                  >
                    <Icon name={copiedId === user.id ? 'check' : 'link'} size={16} className={copiedId === user.id ? 'text-secondary' : ''} />
                  </button>
                </td>
              </tr>
            ))}
            {paginatedUsers.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-on-surface-variant">No users match your criteria</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {filteredUsers.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-outline-variant/10 text-sm">
            <span className="text-[11px] font-label text-on-surface-variant tracking-wide">
              Displaying {Math.min((currentPage - 1) * perPage + 1, filteredUsers.length || 0)}-{Math.min(currentPage * perPage, filteredUsers.length)} of {filteredUsers.length} Users
            </span>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                 let startPage = Math.max(1, currentPage - 2);
                 let endPage = Math.min(totalPages, startPage + 4);
                 if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);
                 const p = startPage + i;
                 if (p > totalPages) return null;
                 return (
                  <button key={p} onClick={() => setCurrentPage(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-label transition-all ${currentPage === p ? 'bg-primary-container text-on-primary-container shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-high'}`}>
                    {p}
                  </button>
                 );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
