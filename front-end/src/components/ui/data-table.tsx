import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

export type DataTableColumn<Row> = {
  key: string;
  header: ReactNode;
  className?: string;
  cell: (row: Row) => ReactNode;
};

export type DataTableProps<Row> = {
  columns: readonly DataTableColumn<Row>[];
  rows: readonly Row[];
  getRowKey: (row: Row) => string;
  className?: string;
  headerRowClassName?: string;
  rowClassName?: string;
};

export const DataTable = <Row,>({
  columns,
  rows,
  getRowKey,
  className,
  headerRowClassName,
  rowClassName,
}: DataTableProps<Row>) => {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className={cn("bg-surface-container-highest/30", headerRowClassName)}>
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "px-6 py-4 text-[10px] font-label uppercase tracking-widest text-on-surface-variant",
                  col.className
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={getRowKey(row)}
              className={cn(
                "border-b border-outline-variant/10 hover:bg-surface-container-high/20 transition-colors",
                rowClassName
              )}
            >
              {columns.map((col) => (
                <td key={col.key} className={cn("px-6 py-4 text-sm text-on-surface", col.className)}>
                  {col.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
