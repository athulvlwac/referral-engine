import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import Icon from '../components/Icon';
import { registerUser, verifyReferral } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get('ref') || '';
  
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    password: '',
    referral_code: refCode 
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [referrerName, setReferrerName] = useState(null);

  useEffect(() => {
    if (form.referral_code.length >= 5) {
      verifyReferral(form.referral_code)
        .then(res => setReferrerName(res.data.referrer_name))
        .catch(() => setReferrerName(null));
    } else {
      setReferrerName(null);
    }
  }, [form.referral_code]);
  
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.password.trim() || !form.referral_code.trim()) {
      setError('All fields including referral code are required.');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      await registerUser({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password.trim(),
        referral_code: form.referral_code.trim()
      });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[85vh]">
      <div className="glass-card rounded-xl p-10 fade-in w-full max-w-lg relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-tertiary/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-container to-secondary-container flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(46,91,255,0.3)]">
              <Icon name="person_add" className="text-white" size={32} />
            </div>
            <h1 className="text-2xl font-headline font-bold text-on-surface">Join the Network</h1>
            <p className="text-sm text-on-surface-variant mt-1">Register for an Obsidian Pulse account</p>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-lg bg-error/10 border border-error/20 fade-in">
              <Icon name="error_outline" className="text-error shrink-0" size={18} />
              <p className="text-xs text-error leading-relaxed">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[9px] font-label text-on-surface-variant uppercase tracking-widest mb-2 ml-1">
                Full Name
              </label>
              <div className="relative">
                <Icon name="badge" className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40" size={18} />
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-lg pl-12 pr-4 py-3 text-sm text-on-surface placeholder-on-surface-variant/40 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-label text-on-surface-variant uppercase tracking-widest mb-2 ml-1">
                Email Address
              </label>
              <div className="relative">
                <Icon name="mail" className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40" size={18} />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-lg pl-12 pr-4 py-3 text-sm text-on-surface placeholder-on-surface-variant/40 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-label text-on-surface-variant uppercase tracking-widest mb-2 ml-1">
                Password
              </label>
              <div className="relative">
                <Icon name="lock" className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40" size={18} />
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Choose a strong password"
                  className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-lg pl-12 pr-4 py-3 text-sm text-on-surface placeholder-on-surface-variant/40 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-label text-on-surface-variant uppercase tracking-widest mb-2 ml-1">
                Referral Code (Required)
              </label>
              <div className="relative">
                <Icon name="loyalty" className="absolute left-4 top-1/2 -translate-y-1/2 text-tertiary/60" size={18} />
                <input
                  type="text"
                  name="referral_code"
                  value={form.referral_code}
                  readOnly={!!refCode}
                  onChange={!refCode ? handleChange : undefined}
                  placeholder="Enter your invite code"
                  className={`w-full border rounded-lg pl-12 pr-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-1 transition-all ${
                    refCode 
                      ? 'bg-surface-container border-tertiary/20 text-tertiary opacity-90 cursor-not-allowed select-none' 
                      : 'bg-surface-container-highest border-outline-variant/20 focus:border-primary/40 focus:ring-primary/20'
                  }`}
                />
              </div>
            </div>

            {referrerName && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-tertiary/10 border border-tertiary/20 fade-in">
                <Icon name="verified" className="text-tertiary shrink-0" size={18} />
                <p className="text-xs text-tertiary font-medium">Invited by: <span className="font-bold">{referrerName}</span></p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-primary-container text-on-primary-container text-xs font-label uppercase tracking-widest rounded-lg hover:brightness-110 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-on-primary-container/30 border-t-on-primary-container rounded-full animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <Icon name="person_add" size={16} />
                  Join Now
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-on-surface-variant mt-8">
            Already have an account? <Link to="/login" className="text-primary hover:text-primary-container font-medium transition-colors">Sign in here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
