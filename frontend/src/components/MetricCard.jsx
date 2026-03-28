export default function MetricCard({ icon, label, value, change, changeType = 'up' }) {
  const changeColor = changeType === 'up' ? 'text-emerald-400' : changeType === 'down' ? 'text-red-400' : 'text-slate-400';

  return (
    <div className="bg-[#111119] border border-slate-800/40 rounded-xl p-4 hover:border-purple-500/15 transition-all duration-300 group">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-[#1a1a2e] flex items-center justify-center text-lg group-hover:scale-105 transition-transform">
          {icon}
        </div>
        {change && (
          <span className={`text-[10px] font-semibold ${changeColor} bg-[#1a1a2e] px-1.5 py-0.5 rounded-md`}>
            {changeType === 'up' ? '+' : ''}{change}
          </span>
        )}
      </div>
      <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-xl font-bold text-white tracking-tight">{value}</p>
    </div>
  );
}
