import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell } from "@/components/layout/app-shell";
import { DashboardPage } from "@/pages/dashboard-page";
import { FraudWatchPage } from "@/pages/fraud-watch-page";
import { LogsPage } from "@/pages/logs-page";
import { ReferralPage } from "@/pages/referral-page";
import { RewardsPage } from "@/pages/rewards-page";
import { NotFoundPage } from "@/pages/not-found-page";

export const appRouter = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "/dashboard", element: <DashboardPage /> },
      { path: "/referrals", element: <ReferralPage /> },
      { path: "/fraud-watch", element: <FraudWatchPage /> },
      { path: "/rewards", element: <RewardsPage /> },
      { path: "/logs", element: <LogsPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);

