import { MetricCard } from "@/features/dashboard/components/metric-card";
import { SimulatedBarChart } from "@/components/ui/simulated-bar-chart";
import { MaterialIcon } from "@/components/ui/material-icon";

const METRICS = [
  { iconName: "group", label: "Total Users", value: "12,450", badge: "+12%", accentClassName: "bg-primary/10 text-primary" },
  { iconName: "share", label: "Total Referrals", value: "8,210", badge: "+5.4%", accentClassName: "bg-secondary/10 text-secondary" },
  { iconName: "cycle", label: "Cycles Prevented", value: "1,042", badge: "Crit", accentClassName: "bg-error/10 text-error", className: "border-l-2 border-l-error/30" },
  { iconName: "account_tree", label: "Avg Depth", value: "4.8", badge: "L3.2", accentClassName: "bg-tertiary/10 text-tertiary" },
  { iconName: "rule", label: "V/R Ratio", value: "7.5k / 710", accentClassName: "bg-surface-variant text-outline" },
  { iconName: "gpp_maybe", label: "Fraud Watch", value: "142", accentClassName: "bg-tertiary/10 text-tertiary" },
  { iconName: "payments", label: "Rewards Distributed", value: "$1.28M", accentClassName: "bg-gradient-to-br from-primary-container to-secondary-container text-white" },
] as const;

export const DashboardPage = () => {
  return (
    <div className="max-w-[1600px] mx-auto space-y-8">
      <header className="flex items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight font-headline text-on-background mb-2">
            Referral &amp; Fraud Command Center
          </h1>
          <p className="text-on-surface-variant font-body">
            Real-time signal aggregation across network growth, rewards, and risk.
          </p>
        </div>
        <div className="hidden lg:flex items-center gap-2 text-[10px] font-label uppercase tracking-widest text-on-surface-variant/60">
          <MaterialIcon name="history" className="text-sm" />
          Last updated: 2s ago
        </div>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {METRICS.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-card rounded-xl p-8 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-headline text-xl font-bold">Network Pulse</h2>
              <span className="text-[10px] font-label text-outline uppercase tracking-widest">Last 24h</span>
            </div>
            <SimulatedBarChart bars={[0.25, 0.4, 0.6, 0.7, 0.85, 1, 0.8, 0.5, 0.35]} />
            <div className="flex justify-between mt-4 text-xs font-label text-outline uppercase tracking-tighter">
              <span>00:00</span>
              <span>04:00</span>
              <span>08:00</span>
              <span>12:00</span>
              <span>16:00</span>
              <span>20:00</span>
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent opacity-50" />
        </div>

        <div className="glass-card rounded-xl p-8 border border-tertiary/10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-headline text-xl font-bold">Live Alerts</h2>
            <span className="text-xs font-label bg-tertiary/10 text-tertiary px-2 py-1 rounded">Active</span>
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-surface-container-lowest/40 border border-outline-variant/10">
              <MaterialIcon name="report_problem" className="text-tertiary" />
              <div>
                <p className="text-sm font-headline font-semibold text-on-surface">Referral loop anomaly</p>
                <p className="text-xs text-on-surface-variant font-body mt-1">Cycle signature detected in region cluster B.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl bg-surface-container-lowest/40 border border-outline-variant/10">
              <MaterialIcon name="gpp_maybe" className="text-error" />
              <div>
                <p className="text-sm font-headline font-semibold text-on-surface">High-risk payout queued</p>
                <p className="text-xs text-on-surface-variant font-body mt-1">Manual review required for 14 pending transactions.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl bg-surface-container-lowest/40 border border-outline-variant/10">
              <MaterialIcon name="hub" className="text-secondary" />
              <div>
                <p className="text-sm font-headline font-semibold text-on-surface">Network growth spike</p>
                <p className="text-xs text-on-surface-variant font-body mt-1">Referral depth average increased to 4.8.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
