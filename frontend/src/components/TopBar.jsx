import Icon from './Icon';

export default function TopBar() {
  return (
    <header className="fixed top-0 w-full flex justify-between items-center px-8 h-16 bg-[#111317]/80 backdrop-blur-xl z-50 shadow-2xl shadow-black/40">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3">
          <span className="text-xl font-black tracking-tighter text-[#e2e2e8] font-manrope">Obsidian Pulse</span>
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-error/10 rounded-full border border-error/20">
            <span className="w-1.5 h-1.5 rounded-full bg-error animate-pulse-dot"></span>
            <span className="text-[9px] font-label font-bold text-error uppercase tracking-widest">Live</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-[10px] font-label text-on-surface-variant/50 uppercase tracking-widest hidden lg:block">Last updated: 2s ago</span>
        <button className="p-2 rounded-full hover:bg-[#2E5BFF]/10 hover:text-[#2E5BFF] transition-all duration-300 scale-95 active:scale-90">
          <Icon name="notifications" className="text-on-surface-variant" size={20} />
        </button>
        <button className="p-2 rounded-full hover:bg-[#2E5BFF]/10 hover:text-[#2E5BFF] transition-all duration-300 scale-95 active:scale-90">
          <Icon name="settings" className="text-on-surface-variant" size={20} />
        </button>
        <div className="h-8 w-8 rounded-full overflow-hidden border border-outline-variant/30">
          <img
            alt="Administrator Profile"
            className="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBJBoS5N7HAuqcMoFYu30VxZLT7PkYA7Sjoy6pH2G2l9E-haX_ETA68R2NBJuoKfF-q1ikqs11w_w1ftbnIpME7wY7TAgvUXZvlgF5buubCAtnVvLuxAZW3ZFDYrxtlR5wFgvFiF98bi53ineYh5VJ-1naJz-yqmdlmKROoxrM6oSRZFNZCFudAIYR2t7Qr5bnTrcBFsWxy7sMb6Xb0xY57MxxYG7SI5AUxPeHEU8hrSZcLfhwU44nqOQrcnBYuUz8W3pzsDYAaEg"
          />
        </div>
      </div>
    </header>
  );
}
