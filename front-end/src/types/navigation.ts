export type NavKey = "dashboard" | "referrals" | "fraud-watch" | "rewards" | "logs";

export type NavItem = {
  key: NavKey;
  label: string;
  to: string;
  iconName: string;
};
