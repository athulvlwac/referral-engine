import { NavLink } from "react-router-dom";
import { NAV_ITEMS } from "@/constants/navigation";
import { MaterialIcon } from "@/components/ui/material-icon";
import { cn } from "@/utils/cn";

export const SideNav = () => {
  return (
    <aside className="fixed left-0 top-0 h-full w-72 rounded-r-[3rem] bg-neutral-900/40 backdrop-blur-md flex-col py-10 gap-8 z-40 hidden md:flex pt-24">
      <div className="px-8">
        <h2 className="text-lg font-bold text-slate-200 font-headline">Command Center</h2>
        <p className="text-xs text-blue-500 font-label tracking-widest uppercase">Sentinel Active</p>
      </div>

      <nav className="flex flex-col gap-2 flex-grow px-4 font-label">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.key}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-4 rounded-full px-6 py-3 transition-all",
                isActive
                  ? "bg-blue-600/20 text-blue-400 border-r-4 border-blue-500 scale-[0.98]"
                  : "text-slate-500 hover:text-slate-200 hover:bg-slate-800/50"
              )
            }
          >
            <MaterialIcon name={item.iconName} />
            <span className={cn("font-label", item.key === "dashboard" ? "font-bold" : "")}>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-8 mt-auto flex flex-col gap-4">
        <button
          type="button"
          className="bg-primary-container text-on-primary-container font-label py-3 px-6 rounded-full font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all"
        >
          <MaterialIcon name="rocket_launch" className="text-sm" />
          Export Intelligence
        </button>

        <div className="flex flex-col gap-2 pt-4 border-t border-outline-variant/10 font-label text-sm">
          <a className="flex items-center gap-3 text-slate-500 hover:text-slate-200 transition-colors" href="#">
            <MaterialIcon name="help_outline" className="text-lg" />
            Support
          </a>
          <a className="flex items-center gap-3 text-slate-500 hover:text-slate-200 transition-colors" href="#">
            <MaterialIcon name="description" className="text-lg" />
            Documentation
          </a>
        </div>
      </div>
    </aside>
  );
};
