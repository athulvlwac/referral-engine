import { MaterialIcon } from "@/components/ui/material-icon";
import { SimulatedBarChart } from "@/components/ui/simulated-bar-chart";

const ENGINE_METRICS = [
  { label: "Detection Accuracy", value: "98.2%", width: 0.982, className: "bg-primary" },
  { label: "Review Latency", value: "1.4s", width: 0.72, className: "bg-secondary" },
  { label: "False Positive", value: "0.7%", width: 0.35, className: "bg-tertiary" },
] as const;

export const FraudWatchPage = () => {
  return (
    <div className="max-w-[1400px] mx-auto">
      <header className="mb-10">
        <div className="flex justify-between items-end gap-6">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight font-headline text-on-background mb-2">Fraud Analysis</h1>
            <p className="text-on-surface-variant font-body">Real-time threat monitoring and risk distribution.</p>
          </div>
          <div className="glass-panel px-6 py-3 rounded-xl border border-outline-variant/10 flex flex-col items-end">
            <span className="text-xs font-label text-tertiary uppercase tracking-widest">Active Alerts</span>
            <span className="text-2xl font-headline font-bold text-on-surface">1,284</span>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <div className="lg:col-span-2 bg-surface-container rounded-xl p-8 relative overflow-hidden group">
          <div className="relative z-10">
            <h2 className="font-headline text-xl font-bold mb-6">Risk Density Map</h2>
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

        <div className="bg-surface-container rounded-xl p-8 border border-tertiary/10">
          <h2 className="font-headline text-xl font-bold mb-6">Engine Performance</h2>
          <div className="space-y-6">
            {ENGINE_METRICS.map((metric) => (
              <div key={metric.label}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-label text-on-surface-variant uppercase tracking-widest">{metric.label}</span>
                  <span className="text-sm font-headline font-bold text-on-surface">{metric.value}</span>
                </div>
                <div className="h-2 w-full bg-surface-container-lowest rounded-full overflow-hidden">
                  <div className={`h-full ${metric.className}`} style={{ width: `${Math.round(metric.width * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-card rounded-xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-headline text-xl font-bold">Threat Feed</h2>
            <span className="text-xs font-label bg-error/10 text-error px-2 py-1 rounded">Critical</span>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-surface-container-lowest/40 border border-outline-variant/10 flex items-start gap-3">
              <MaterialIcon name="shield" className="text-error" />
              <div>
                <p className="text-sm font-headline font-semibold text-on-surface">Cycle attempt pattern</p>
                <p className="text-xs text-on-surface-variant font-body mt-1">Recursive node loop signature detected in payout graph.</p>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-surface-container-lowest/40 border border-outline-variant/10 flex items-start gap-3">
              <MaterialIcon name="visibility" className="text-tertiary" />
              <div>
                <p className="text-sm font-headline font-semibold text-on-surface">Device fingerprint mismatch</p>
                <p className="text-xs text-on-surface-variant font-body mt-1">High variance across session identifiers for a single account.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-8">
          <h2 className="font-headline text-xl font-bold mb-6">Actions</h2>
          <div className="space-y-3">
            <button
              type="button"
              className="w-full py-3 px-4 rounded-full bg-primary-container text-on-primary-container font-headline font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            >
              <MaterialIcon name="rocket_launch" className="text-sm" />
              Export Intelligence
            </button>
            <button
              type="button"
              className="w-full py-3 px-4 rounded-full bg-surface-container-high text-on-surface font-label uppercase tracking-widest text-xs hover:bg-surface-bright transition-colors"
            >
              Trigger Review Queue
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
