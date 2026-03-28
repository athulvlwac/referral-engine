import { NavLink, useLocation } from 'react-router-dom';
import Icon from './Icon';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { path: '/', label: 'Dashboard', icon: 'dashboard' },
  { path: '/users', label: 'Users', icon: 'group' },
  { path: '/referrals', label: 'Referrals', icon: 'hub' },
  { path: '/fraud-watch', label: 'Fraud Watch', icon: 'shield' },
  { path: '/rewards', label: 'Rewards', icon: 'payments' },
  { path: '/logs', label: 'Logs', icon: 'history' },
];

export default function Sidebar() {
  const location = useLocation();
  const { role, logout, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) return null;

  const visibleNavItems = navItems.filter(item => {
    if (role === 'admin') return true;
    return item.path === '/'; // standard users only get dashboard
  });

  return (
    <aside className="fixed left-0 top-0 h-full w-64 z-40 bg-[#111317] flex flex-col pt-20 pb-8">
      {/* Command Center Header */}
      <div className="px-6 mb-8">
        <h2 className="font-manrope font-semibold text-on-surface">Command Center</h2>
        <p className="font-label uppercase tracking-widest text-[10px] text-primary">Sentinel Active</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {visibleNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center gap-4 px-6 py-4 transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-[#2e5bff]/20 to-transparent text-[#2e5bff] border-l-4 border-[#2e5bff] translate-x-1'
                  : 'text-[#e2e2e8]/40 hover:text-[#e2e2e8] hover:bg-white/5 border-l-4 border-transparent'
              }`}
            >
              <Icon name={item.icon} size={20} />
              <span className="font-label uppercase tracking-widest text-[10px]">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="px-6 pt-6 mt-auto border-t border-outline-variant/10">
        <button className="w-full py-3 px-4 rounded-lg bg-surface-container-high hover:bg-surface-bright text-xs font-label uppercase tracking-widest transition-colors mb-4">
          Export Intelligence
        </button>
        <div className="space-y-1">
          <a className="flex items-center gap-4 text-[#e2e2e8]/40 px-2 py-2 hover:text-[#e2e2e8] transition-colors" href="#">
            <Icon name="help_outline" size={16} />
            <span className="text-[10px] font-label uppercase tracking-widest">Support</span>
          </a>
          <button onClick={logout} className="w-full flex items-center gap-4 text-[#e2e2e8]/40 px-2 py-2 hover:text-error transition-colors text-left pl-2">
            <Icon name="logout" size={16} />
            <span className="text-[10px] font-label uppercase tracking-widest">Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
