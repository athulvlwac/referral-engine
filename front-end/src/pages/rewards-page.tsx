import { MaterialIcon } from "@/components/ui/material-icon";
import { cn } from "@/utils/cn";
import { PayoutQueueTable } from "@/features/rewards/components/payout-queue-table";
import type { PayoutRecord } from "@/features/rewards/types/payout";

const PAYOUTS: readonly PayoutRecord[] = [
  {
    id: "TX-91D2A1",
    beneficiary: "Alex Rivera",
    amountUsd: 1250,
    method: "ACH",
    priority: "Normal",
    status: "Queued",
    createdAt: "2026-03-28T08:12:00Z",
  },
  {
    id: "TX-83B7F0",
    beneficiary: "Jordan Blake",
    amountUsd: 4999.5,
    method: "Wire",
    priority: "Urgent",
    status: "Review",
    createdAt: "2026-03-28T08:04:00Z",
  },
  {
    id: "TX-19AC44",
    beneficiary: "Mina Chen",
    amountUsd: 450,
    method: "Crypto",
    priority: "Normal",
    status: "Paid",
    createdAt: "2026-03-28T07:55:00Z",
  },
] as const;

const SummaryCard = ({
  iconName,
  iconClassName,
  badge,
  label,
  value,
  footer,
  className,
}: {
  iconName: string;
  iconClassName: string;
  badge: string;
  label: string;
  value: string;
  footer?: string;
  className?: string;
}) => {
  return (
    <div className={cn("glass-card rounded-xl p-8 border border-outline-variant/10 group transition-all", className)}>
      <div className="flex justify-between items-start mb-4">
        <span className={cn("p-3 rounded-lg", iconClassName)}>
          <MaterialIcon name={iconName} />
        </span>
        <span className="text-xs font-label bg-green-500/10 text-green-400 px-2 py-1 rounded">{badge}</span>
      </div>
      <p className="text-on-surface-variant font-label text-sm mb-1">{label}</p>
      <h3 className="text-3xl font-black font-headline tracking-tighter">{value}</h3>
      {footer ? <p className="text-xs mt-2 text-on-surface-variant/60 font-body">{footer}</p> : null}
    </div>
  );
};

export const RewardsPage = () => {
  return (
    <div className="max-w-[1400px] mx-auto">
      <header className="mb-10">
        <h1 className="text-4xl font-extrabold font-headline tracking-tight mb-2">Rewards Management</h1>
        <p className="text-on-surface-variant max-w-2xl font-body">
          Real-time financial tracking for referral distributions and automated payout queues.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <SummaryCard
          iconName="account_balance_wallet"
          iconClassName="bg-secondary-container/20 text-secondary"
          badge="+12.4%"
          label="Total Paid Out"
          value="$1,284,592.00"
          className="hover:border-primary/30"
        />
        <SummaryCard
          iconName="pending_actions"
          iconClassName="bg-tertiary-container/20 text-tertiary"
          badge="Urgent"
          label="Pending Payouts"
          value="$42,105.50"
          footer="14 transactions requiring attention"
          className="hover:border-tertiary/30"
        />
        <SummaryCard
          iconName="query_stats"
          iconClassName="bg-blue-500/20 text-blue-400"
          badge="Global"
          label="Average Reward"
          value="$450.00"
          footer="Based on last 30 days active cycle"
          className="hover:border-blue-400/30"
        />
      </section>

      <section className="bg-surface-container-low rounded-xl overflow-hidden shadow-2xl border border-outline-variant/10">
        <div className="flex items-center justify-between px-6 py-5">
          <div>
            <h2 className="font-headline font-bold text-on-surface">Payout Queue</h2>
            <p className="text-xs text-on-surface-variant font-body mt-1">Prioritized by risk and SLA windows.</p>
          </div>
          <button
            type="button"
            className="px-6 py-3 rounded-full bg-primary-container text-on-primary-container font-headline font-bold hover:opacity-90 transition-opacity"
          >
            Export Queue
          </button>
        </div>
        <PayoutQueueTable rows={PAYOUTS} />
      </section>
    </div>
  );
};
