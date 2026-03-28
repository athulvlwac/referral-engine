export type ReferralStatus = "Active" | "Pending" | "Flagged";

export type ReferralRisk = "Low" | "Medium" | "High";

export type ReferralRecord = {
  id: string;
  name: string;
  email: string;
  depth: number;
  referrals: number;
  conversionRate: number;
  risk: ReferralRisk;
  status: ReferralStatus;
};
