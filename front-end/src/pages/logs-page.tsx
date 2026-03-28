import { MaterialIcon } from "@/components/ui/material-icon";
import { cn } from "@/utils/cn";
import { LogsTable } from "@/features/logs/components/logs-table";
import { useLogFilters } from "@/features/logs/hooks/use-log-filters";
import type { LogRecord } from "@/features/logs/types/log";

const LOGS: readonly LogRecord[] = [
  {
    id: "LOG-001",
    timestamp: "2026-03-28 13:22:10",
    source: "RewardsEngine",
    message: "Payout queued for TX-91D2A1",
    severity: "Info",
  },
  {
    id: "LOG-002",
    timestamp: "2026-03-28 13:22:05",
    source: "FraudGuard",
    message: "Device fingerprint mismatch detected on REF-0772",
    severity: "Warning",
  },
  {
    id: "LOG-003",
    timestamp: "2026-03-28 13:21:42",
    source: "FraudGuard",
    message: "Cycle attempt pattern escalated to manual review",
    severity: "Critical",
  },
] as const;

const FilterButton = ({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-5 py-2 rounded-full font-label text-xs uppercase tracking-widest transition-colors whitespace-nowrap",
        active ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
      )}
    >
      {label}
    </button>
  );
};

export const LogsPage = () => {
  const { query, setQuery, severity, setSeverity, filtered } = useLogFilters(LOGS);

  return (
    <div className="max-w-[1400px] mx-auto">
      <header className="mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight font-headline text-on-background mb-2">Logs Intelligence</h1>
        <p className="text-on-surface-variant font-body">Search, filter, and audit system events across modules.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-10">
        <div className="lg:col-span-8">
          <div className="relative w-full group">
            <MaterialIcon
              name="search"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-surface-container-lowest border-none rounded-full py-4 pl-12 pr-6 text-on-surface font-label focus:ring-2 focus:ring-primary transition-all"
              placeholder="Search logs by source, id, or message..."
              type="text"
            />
          </div>
        </div>
        <div className="lg:col-span-4 flex justify-end">
          <button
            type="button"
            className="w-full lg:w-auto px-8 py-4 bg-gradient-to-br from-primary-container to-secondary-container text-on-primary-container font-headline font-bold rounded-full flex items-center justify-center gap-3 shadow-lg shadow-primary-container/10 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <MaterialIcon name="file_download" />
            Export Logs
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-3 mb-6">
        <FilterButton label="All" active={severity === "All"} onClick={() => setSeverity("All")} />
        <FilterButton label="Info" active={severity === "Info"} onClick={() => setSeverity("Info")} />
        <FilterButton label="Warning" active={severity === "Warning"} onClick={() => setSeverity("Warning")} />
        <FilterButton label="Critical" active={severity === "Critical"} onClick={() => setSeverity("Critical")} />
      </div>

      <div className="bg-surface-container-low rounded-xl overflow-hidden shadow-2xl border border-outline-variant/10">
        <LogsTable rows={filtered} />
      </div>
    </div>
  );
};
