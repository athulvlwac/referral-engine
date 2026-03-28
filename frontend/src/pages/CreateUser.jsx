import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Icon from '../components/Icon';
import { createUser, fetchMetrics, fetchUsers, fetchUser, claimReferral } from '../api/client';

export default function CreateUser() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [stats, setStats] = useState({ totalUsers: 0, activeUsers: 0, flagged: 0 });
  const [searchParams] = useSearchParams();
  const refId = searchParams.get('ref');
  const [referrer, setReferrer] = useState(null);

  useEffect(() => {
    if (refId) {
      fetchUser(refId)
        .then(res => setReferrer(res.data))
        .catch(err => console.error('Failed to load referrer', err));
    }
  }, [refId]);

  useEffect(() => {
    async function loadStats() {
      try {
        const [m, u] = await Promise.all([fetchMetrics(), fetchUsers()]);
        const users = u.data;
        setStats({
          totalUsers: m.data.total_users || users.length,
          activeUsers: users.filter(u => u.status === 'active').length,
          flagged: users.filter(u => u.status === 'flagged').length,
        });
      } catch (_) {}
    }
    loadStats();
  }, [success]); // Re-fetch after creating a user

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      setError('Both name and email are required.');
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      const res = await createUser({ name: form.name.trim(), email: form.email.trim() });
      const newUser = res.data;
      
      let refSuccess = true;
      if (refId) {
        try {
          await claimReferral({ child_id: newUser.id, parent_id: parseInt(refId, 10) });
        } catch (refErr) {
          refSuccess = false;
          setError(`User created, but referral failed: ${refErr.response?.data?.detail || refErr.message}`);
        }
      }

      if (refSuccess) {
        setSuccess(newUser);
      } else {
        // Keep success state to show they have an ID at least
        setSuccess(newUser); 
      }
      setForm({ name: '', email: '' });
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-headline font-bold text-on-surface">Create User</h1>
          <p className="text-sm text-on-surface-variant mt-1">Register a new user into the Obsidian Pulse ecosystem.</p>
        </div>
        <button
          onClick={() => navigate('/referrals')}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-label uppercase tracking-widest text-on-surface-variant border border-outline-variant/20 rounded-lg hover:bg-surface-container-high transition-colors"
        >
          <Icon name="arrow_back" size={16} />
          Back to Referrals
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Form Card */}
        <div className="lg:col-span-3">
          <form onSubmit={handleSubmit} className="glass-card rounded-xl p-8 fade-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <Icon name="person_add" size={22} />
              </div>
              <div>
                <h2 className="text-lg font-headline font-bold text-on-surface">User Details</h2>
                <p className="text-xs text-on-surface-variant">Fill in the required information below</p>
              </div>
            </div>

            {referrer && (
              <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-lg bg-tertiary/10 border border-tertiary/20 fade-in">
                <Icon name="loyalty" className="text-tertiary shrink-0" size={18} />
                <p className="text-xs text-tertiary font-medium">Invited by: <span className="font-bold">{referrer.name}</span></p>
              </div>
            )}

            {/* Name Field */}
            <div className="mb-6">
              <label htmlFor="create-user-name" className="block text-[9px] font-label text-on-surface-variant uppercase tracking-widest mb-2 ml-1">
                Full Name
              </label>
              <div className="relative">
                <Icon name="badge" className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40" size={18} />
                <input
                  id="create-user-name"
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter full name..."
                  className="w-full bg-surface-container border border-outline-variant/20 rounded-lg pl-12 pr-4 py-3.5 text-sm text-on-surface placeholder-on-surface-variant/40 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="mb-8">
              <label htmlFor="create-user-email" className="block text-[9px] font-label text-on-surface-variant uppercase tracking-widest mb-2 ml-1">
                Email Address
              </label>
              <div className="relative">
                <Icon name="mail" className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40" size={18} />
                <input
                  id="create-user-email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter email address..."
                  className="w-full bg-surface-container border border-outline-variant/20 rounded-lg pl-12 pr-4 py-3.5 text-sm text-on-surface placeholder-on-surface-variant/40 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-lg bg-error/10 border border-error/20 fade-in">
                <Icon name="error_outline" className="text-error shrink-0" size={18} />
                <p className="text-xs text-error">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-lg bg-secondary/10 border border-secondary/20 fade-in">
                <Icon name="check_circle" className="text-secondary shrink-0" size={18} />
                <div>
                  <p className="text-xs text-secondary font-semibold">User created successfully!</p>
                  <p className="text-[10px] text-on-surface-variant mt-0.5">
                    <span className="text-on-surface font-medium">{success.name}</span> — ID: {success.id}
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-3 bg-primary-container text-on-primary-container text-xs font-label uppercase tracking-widest rounded-lg hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-on-primary-container/30 border-t-on-primary-container rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Icon name="person_add" size={16} />
                    Create User
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => { setForm({ name: '', email: '' }); setError(null); setSuccess(null); }}
                className="px-5 py-3 text-xs font-label uppercase tracking-widest text-on-surface-variant border border-outline-variant/20 rounded-lg hover:bg-surface-container-high transition-colors"
              >
                Reset
              </button>
            </div>
          </form>
        </div>

        {/* Side Info Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Guidelines */}
          <div className="glass-card rounded-xl p-6 fade-in border border-primary/10">
            <div className="flex items-center gap-2 mb-4">
              <Icon name="info" className="text-primary" size={18} />
              <h3 className="text-sm font-headline font-bold text-on-surface">Guidelines</h3>
            </div>
            <ul className="space-y-3">
              {[
                'Full name must be at least 2 characters',
                'Email must be a valid, unique address',
                'Users are created with "active" status',
                'Referral codes are generated automatically',
              ].map((rule, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/40 mt-1.5 shrink-0" />
                  <span className="text-xs text-on-surface-variant leading-relaxed">{rule}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Stats */}
          <div className="glass-card rounded-xl p-6 fade-in">
            <h3 className="text-sm font-headline font-bold text-on-surface mb-4">Ecosystem Status</h3>
            <div className="space-y-4">
              {[
                { icon: 'group', label: 'Total Users', value: String(stats.totalUsers), color: 'text-primary' },
                { icon: 'verified_user', label: 'Active Users', value: String(stats.activeUsers), color: 'text-secondary' },
                { icon: 'shield', label: 'Flagged', value: String(stats.flagged), color: 'text-error' },
              ].map((stat, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg bg-surface-container-high ${stat.color}`}>
                      <Icon name={stat.icon} size={16} />
                    </div>
                    <span className="text-[10px] font-label text-on-surface-variant uppercase tracking-widest">{stat.label}</span>
                  </div>
                  <span className="text-sm font-headline font-bold text-on-surface">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
