import { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon';
import { loginUser } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const { login } = useAuth();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username.trim() || !form.password.trim()) {
      setError('Both email and password are required.');
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      
      // FastAPI OAuth2PasswordRequestForm requires form-data
      const formData = new URLSearchParams();
      formData.append('username', form.username.trim());
      formData.append('password', form.password.trim());
      
      const res = await loginUser(formData);
      const { access_token, role } = res.data;
      
      // Context will handle saving to localStorage and navigating
      login(access_token, role);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="glass-card rounded-xl p-10 fade-in w-full max-w-md relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-tertiary/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-container to-secondary-container flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(46,91,255,0.3)]">
              <Icon name="hub" className="text-white" size={32} />
            </div>
            <h1 className="text-2xl font-headline font-bold text-on-surface">Obsidian Pulse</h1>
            <p className="text-sm text-on-surface-variant mt-1">Sign in to your account</p>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-lg bg-error/10 border border-error/20 fade-in">
              <Icon name="error_outline" className="text-error shrink-0" size={18} />
              <p className="text-xs text-error">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[9px] font-label text-on-surface-variant uppercase tracking-widest mb-2 ml-1">
                Email Address
              </label>
              <div className="relative">
                <Icon name="mail" className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40" size={18} />
                <input
                  type="email"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="Enter your email..."
                  className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-lg pl-12 pr-4 py-3.5 text-sm text-on-surface placeholder-on-surface-variant/40 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
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
                  placeholder="Enter your password..."
                  className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-lg pl-12 pr-4 py-3.5 text-sm text-on-surface placeholder-on-surface-variant/40 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-primary-container text-on-primary-container text-xs font-label uppercase tracking-widest rounded-lg hover:brightness-110 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-on-primary-container/30 border-t-on-primary-container rounded-full animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Icon name="login" size={16} />
                  Access Dashboard
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-on-surface-variant mt-8">
            Brand new? <Link to="/register" className="text-primary hover:text-primary-container font-medium transition-colors">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
