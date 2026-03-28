import type { NavItem } from "@/types/navigation";

export const NAV_ITEMS: readonly NavItem[] = [
  { key: "dashboard", label: "Dashboard", to: "/dashboard", iconName: "dashboard" },
  { key: "referrals", label: "Referrals", to: "/referrals", iconName: "account_tree" },
  { key: "fraud-watch", label: "Fraud Watch", to: "/fraud-watch", iconName: "report_problem" },
  { key: "rewards", label: "Rewards", to: "/rewards", iconName: "payments" },
  { key: "logs", label: "Logs", to: "/logs", iconName: "receipt_long" }
];
