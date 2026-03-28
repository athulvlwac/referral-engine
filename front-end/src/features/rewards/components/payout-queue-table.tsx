import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { cn } from "@/utils/cn";
import type { PayoutRecord, PayoutStatus } from "@/features/rewards/types/payout";

const statusClassName = (status: PayoutStatus) => {
  if (status === "Paid") return "bg-secondary/10 text-secondary";
  if (status === "Review") return "bg-tertiary/10 text-tertiary";
  return "bg-primary/10 text-primary";
};

const Pill = ({ label, className }: { label: string; className: string }) => {
  return (
    <span className={cn("inline-flex px-2 py-1 rounded-full text-[10px] font-label uppercase tracking-widest", className)}>
      {label}
    </span>
  );
};

export type PayoutQueueTableProps = {
  rows: readonly PayoutRecord[];
};

const COLUMNS: readonly DataTableColumn<PayoutRecord>[] = [
  {
    key: "id",
    header: "Transaction",
    cell: (row) => <span className="font-label text-xs text-on-surface-variant">{row.id}</span>,
  },
  {
    key: "beneficiary",
    header: "Beneficiary",
    cell: (row) => <span className="font-headline font-semibold">{row.beneficiary}</span>,
  },
  {
    key: "amount",
    header: "Amount",
    className: "text-right",
    cell: (row) => (
      <span className="font-headline font-bold text-on-surface">${row.amountUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
    ),
  },
  {
    key: "method",
    header: "Method",
    className: "text-right",
    cell: (row) => <span className="font-label text-xs text-on-surface-variant uppercase tracking-widest">{row.method}</span>,
  },
  {
    key: "priority",
    header: "Priority",
    className: "text-right",
    cell: (row) => (
      <span className={cn("font-label text-xs uppercase tracking-widest", row.priority === "Urgent" ? "text-tertiary" : "text-outline")}>
        {row.priority}
      </span>
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

export const PayoutQueueTable = ({ rows }: PayoutQueueTableProps) => {
  return <DataTable columns={COLUMNS} rows={rows} getRowKey={(row) => row.id} />;
};
