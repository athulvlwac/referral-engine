import { useMemo, useState } from "react";
import type { LogRecord, LogSeverity } from "@/features/logs/types/log";

export type LogSeverityFilter = "All" | LogSeverity;

export type UseLogFiltersResult = {
  query: string;
  setQuery: (next: string) => void;
  severity: LogSeverityFilter;
  setSeverity: (next: LogSeverityFilter) => void;
  filtered: readonly LogRecord[];
};

export const useLogFilters = (records: readonly LogRecord[]): UseLogFiltersResult => {
  const [query, setQuery] = useState("");
  const [severity, setSeverity] = useState<LogSeverityFilter>("All");

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return records.filter((record) => {
      const matchesSeverity = severity === "All" ? true : record.severity === severity;
      if (!matchesSeverity) return false;

      if (normalizedQuery.length === 0) return true;
      return (
        record.id.toLowerCase().includes(normalizedQuery) ||
        record.source.toLowerCase().includes(normalizedQuery) ||
        record.message.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [query, records, severity]);

  return { query, setQuery, severity, setSeverity, filtered };
};
