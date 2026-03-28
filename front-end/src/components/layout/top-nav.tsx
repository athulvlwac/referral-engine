import { Link } from "react-router-dom";
import { MaterialIcon } from "@/components/ui/material-icon";

export type TopNavProps = {
  searchPlaceholder?: string;
};

export const TopNav = ({ searchPlaceholder = "Search Intelligence..." }: TopNavProps) => {
  return (
    <header className="fixed top-0 w-full z-50 bg-neutral-950/80 backdrop-blur-xl shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
      <div className="flex justify-between items-center w-full px-8 py-4">
        <div className="flex items-center gap-8">
          <Link to="/dashboard" className="flex items-center gap-3">
            <span className="text-xl font-black tracking-tighter text-slate-100 font-headline">Obsidian Pulse</span>
            <span className="flex items-center gap-1.5 px-2 py-0.5 bg-error/10 rounded-full border border-error/20">
              <span className="w-1.5 h-1.5 rounded-full bg-error animate-pulse-dot" />
              <span className="text-[9px] font-label font-bold text-error uppercase tracking-widest">Live</span>
            </span>
          </Link>
          <nav className="hidden md:flex gap-6 items-center font-label">
            <a className="text-slate-400 font-medium hover:text-slate-100 transition-colors" href="#">
              System Status
            </a>
            <a className="text-slate-400 font-medium hover:text-slate-100 transition-colors" href="#">
              Quick Payout
            </a>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden sm:block">
            <MaterialIcon
              name="search"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm"
            />
            <input
              className="bg-surface-container-lowest border-none rounded-full pl-10 pr-4 py-2 text-sm w-64 focus:ring-2 focus:ring-primary transition-all font-body"
              placeholder={searchPlaceholder}
              type="text"
            />
          </div>

          <button
            type="button"
            className="p-2 text-on-surface-variant hover:bg-blue-500/10 hover:text-blue-400 transition-all rounded-full scale-95 active:scale-90"
            aria-label="Notifications"
          >
            <MaterialIcon name="notifications_active" />
          </button>
          <button
            type="button"
            className="p-2 text-on-surface-variant hover:bg-blue-500/10 hover:text-blue-400 transition-all rounded-full scale-95 active:scale-90"
            aria-label="Settings"
          >
            <MaterialIcon name="settings" />
          </button>
          <img
            alt="Admin Avatar"
            className="w-8 h-8 rounded-full border border-outline-variant/30"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuClKLwtx_SZF2v0kOynIh-o0kqGvTMm96jUuhrLTe6XMNh_mVpIlqXlTrdW0IGFFSSDqiB2MS0dguElTDi-wbThkx_fDxpKLBIKDBgAWuje0DeBuCZRCfJmvXxe63x7fYA0gfXaRFZ9KVArfVYJywg53hHN-jtivJ1dJ0v85MT1JlpPWD6mDmI12GPFxA3b1s2b5sZs5iMAVkODVZ5mcPUqnAFHaamdYe-p-QNDbtgpdkcB5Zl_o_pZqDsGydY84-tTMPOLaecgwg"
          />
        </div>
      </div>
    </header>
  );
};
