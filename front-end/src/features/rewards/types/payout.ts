export type PayoutPriority = "Normal" | "Urgent";

export type PayoutStatus = "Queued" | "Review" | "Paid";

export type PayoutRecord = {
  id: string;
  beneficiary: string;
  amountUsd: number;
  method: "ACH" | "Wire" | "Crypto";
  priority: PayoutPriority;
  status: PayoutStatus;
  createdAt: string;
};
