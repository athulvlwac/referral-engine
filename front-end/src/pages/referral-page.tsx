import { MaterialIcon } from "@/components/ui/material-icon";
import { cn } from "@/utils/cn";
import { ReferralsTable } from "@/features/referrals/components/referrals-table";
import { useReferralFilters } from "@/features/referrals/hooks/use-referral-filters";
import type { ReferralRecord } from "@/features/referrals/types/referral";

const REFERRALS: readonly ReferralRecord[] = [
  {
    id: "REF-1284",
    name: "Alex Rivera",
    email: "alex.rivera@sentinel.io",
    referrals: 1284,
    conversionRate: 64,
    depth: 4,
    risk: "Low",
    status: "Active",
  },
  {
    id: "REF-0941",
    name: "Mina Chen",
    email: "mina.chen@sentinel.io",
    referrals: 942,
    conversionRate: 51,
    depth: 3,
    risk: "Medium",
    status: "Active",
  },
  {
    id: "REF-0772",
    name: "Jordan Blake",
    email: "j.blake@sentinel.io",
    referrals: 772,
    conversionRate: 38,
    depth: 5,
    risk: "High",
    status: "Flagged",
  },
  {
    id: "REF-0416",
    name: "Sam Patel",
    email: "sam.patel@sentinel.io",
    referrals: 416,
    conversionRate: 44,
    depth: 2,
    risk: "Low",
    status: "Pending",
  },
] as const;

const StatusButton = ({
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
        "px-6 py-2 rounded-full font-label text-sm font-bold whitespace-nowrap transition-colors",
        active ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
      )}
    >
      {label}
    </button>
  );
};

export const ReferralPage = () => {
  const { query, setQuery, status, setStatus, filtered } = useReferralFilters(REFERRALS);

  return (
    <div className="max-w-[1400px] mx-auto">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-extrabold font-headline tracking-tight text-on-surface">Referral Intelligence</h1>
          <p className="text-on-surface-variant font-body mt-2">Manage and monitor your ecosystem's growth engine.</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-surface-container rounded-xl p-4 flex items-center gap-4 border-l-4 border-secondary">
            <div>
              <p className="text-[10px] font-label text-secondary uppercase tracking-tighter">Growth Rate</p>
              <p className="text-2xl font-headline font-bold text-on-surface">+24.8%</p>
            </div>
          </div>
          <div className="bg-surface-container rounded-xl p-4 flex items-center gap-4 border-l-4 border-tertiary">
            <div>
              <p className="text-[10px] font-label text-tertiary uppercase tracking-tighter">Anomalies</p>
              <p className="text-2xl font-headline font-bold text-on-surface">02</p>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-10">
        <div className="lg:col-span-8 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative w-full group">
            <MaterialIcon
              name="search"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-surface-container-lowest border-none rounded-full py-4 pl-12 pr-6 text-on-surface font-label focus:ring-2 focus:ring-primary transition-all"
              placeholder="Network Search..."
              type="text"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <StatusButton label="Active" active={status === "Active"} onClick={() => setStatus("Active")} />
            <StatusButton label="Pending" active={status === "Pending"} onClick={() => setStatus("Pending")} />
            <StatusButton label="Flagged" active={status === "Flagged"} onClick={() => setStatus("Flagged")} />
            <StatusButton label="All" active={status === "All"} onClick={() => setStatus("All")} />
          </div>
        </div>

        <div className="lg:col-span-4 flex justify-end">
          <button
            type="button"
            className="w-full lg:w-auto px-8 py-4 bg-gradient-to-br from-primary-container to-secondary-container text-on-primary-container font-headline font-bold rounded-full flex items-center justify-center gap-3 shadow-lg shadow-primary-container/10 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <MaterialIcon name="file_download" />
            Export Referral Data
          </button>
        </div>
      </div>

      <div className="bg-surface-container-low rounded-xl overflow-hidden shadow-2xl border border-outline-variant/10">
        <ReferralsTable rows={filtered} />
      </div>
    </div>
  );
};
