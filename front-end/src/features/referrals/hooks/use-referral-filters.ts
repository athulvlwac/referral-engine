import { useMemo, useState } from "react";
import type { ReferralRecord, ReferralStatus } from "@/features/referrals/types/referral";

export type ReferralStatusFilter = "All" | ReferralStatus;

export type UseReferralFiltersResult = {
  query: string;
  setQuery: (next: string) => void;
  status: ReferralStatusFilter;
  setStatus: (next: ReferralStatusFilter) => void;
  filtered: readonly ReferralRecord[];
};

export const useReferralFilters = (records: readonly ReferralRecord[]): UseReferralFiltersResult => {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ReferralStatusFilter>("Active");

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return records.filter((record) => {
      const matchesStatus = status === "All" ? true : record.status === status;
      if (!matchesStatus) return false;

      if (normalizedQuery.length === 0) return true;
      return (
        record.id.toLowerCase().includes(normalizedQuery) ||
        record.name.toLowerCase().includes(normalizedQuery) ||
        record.email.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [query, records, status]);

  return { query, setQuery, status, setStatus, filtered };
};
