import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { cn } from "@/utils/cn";
import type { LogRecord, LogSeverity } from "@/features/logs/types/log";

const severityClassName = (severity: LogSeverity) => {
  if (severity === "Critical") return "bg-error/10 text-error";
  if (severity === "Warning") return "bg-tertiary/10 text-tertiary";
  return "bg-secondary/10 text-secondary";
};

const Pill = ({ label, className }: { label: string; className: string }) => {
  return (
    <span className={cn("inline-flex px-2 py-1 rounded-full text-[10px] font-label uppercase tracking-widest", className)}>
      {label}
    </span>
  );
};

export type LogsTableProps = {
  rows: readonly LogRecord[];
};

const COLUMNS: readonly DataTableColumn<LogRecord>[] = [
  {
    key: "timestamp",
    header: "Time",
    cell: (row) => <span className="font-label text-xs text-on-surface-variant">{row.timestamp}</span>,
  },
  {
    key: "source",
    header: "Source",
    cell: (row) => <span className="font-headline font-semibold">{row.source}</span>,
  },
  {
    key: "message",
    header: "Message",
    cell: (row) => <span className="text-on-surface-variant font-body">{row.message}</span>,
  },
  {
    key: "severity",
    header: "Severity",
    className: "text-right",
    cell: (row) => (
      <div className="flex justify-end">
        <Pill label={row.severity} className={severityClassName(row.severity)} />
      </div>
    ),
  },
] as const;

export const LogsTable = ({ rows }: LogsTableProps) => {
  return <DataTable columns={COLUMNS} rows={rows} getRowKey={(row) => row.id} />;
};
