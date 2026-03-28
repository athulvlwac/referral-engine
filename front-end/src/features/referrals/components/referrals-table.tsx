import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { MaterialIcon } from "@/components/ui/material-icon";
import { cn } from "@/utils/cn";
import type { ReferralRecord, ReferralRisk, ReferralStatus } from "@/features/referrals/types/referral";

const Pill = ({ label, className }: { label: string; className: string }) => {
  return (
    <span className={cn("inline-flex px-2 py-1 rounded-full text-[10px] font-label uppercase tracking-widest", className)}>
      {label}
    </span>
  );
};

const riskClassName = (risk: ReferralRisk) => {
  if (risk === "High") return "bg-error/10 text-error";
  if (risk === "Medium") return "bg-tertiary/10 text-tertiary";
  return "bg-secondary/10 text-secondary";
};

const statusClassName = (status: ReferralStatus) => {
  if (status === "Flagged") return "bg-error/10 text-error";
  if (status === "Pending") return "bg-tertiary/10 text-tertiary";
  return "bg-primary/10 text-primary";
};

export type ReferralsTableProps = {
  rows: readonly ReferralRecord[];
};

const COLUMNS: readonly DataTableColumn<ReferralRecord>[] = [
  {
    key: "user",
    header: "User",
    cell: (row) => (
      <div>
        <p className="font-headline font-bold text-on-surface">{row.name}</p>
        <p className="text-xs text-outline font-label">{row.email}</p>
      </div>
    ),
  },
  {
    key: "referrals",
    header: "Referrals",
    className: "text-right",
    cell: (row) => (
      <div className="flex justify-end items-center gap-2">
        <span className="text-xl font-headline font-extrabold text-primary">{row.referrals.toLocaleString()}</span>
        <MaterialIcon name="trending_up" className="text-primary text-sm" />
      </div>
    ),
  },
  {
    key: "conversion",
    header: "Conversion",
    className: "text-right",
    cell: (row) => (
      <div className="w-full max-w-[140px] ml-auto">
        <div className="flex justify-end mb-1">
          <span className="text-sm font-headline font-bold text-secondary">{Math.round(row.conversionRate)}%</span>
        </div>
        <div className="h-1.5 w-full bg-surface-container-lowest rounded-full overflow-hidden">
          <div
            className="h-full bg-secondary rounded-full shadow-[0_0_8px_rgba(208,188,255,0.4)]"
            style={{ width: `${Math.max(0, Math.min(100, row.conversionRate))}%` }}
          />
        </div>
      </div>
    ),
  },
  {
    key: "depth",
    header: "Depth",
    className: "text-right",
    cell: (row) => <span className="font-label text-xs text-on-surface-variant">L{row.depth}</span>,
  },
  {
    key: "risk",
    header: "Risk",
    className: "text-right",
    cell: (row) => (
      <div className="flex justify-end">
        <Pill label={row.risk} className={riskClassName(row.risk)} />
      </div>
    ),
  },
  {
    key: "status",
    header: "Status",
    className: "text-right",
    cell: (row) => (
      <div className="flex justify-end">
        <Pill label={row.status} className={statusClassName(row.status)} />
      </div>
    ),
  },
] as const;

export const ReferralsTable = ({ rows }: ReferralsTableProps) => {
  return <DataTable columns={COLUMNS} rows={rows} getRowKey={(row) => row.id} />;
};
