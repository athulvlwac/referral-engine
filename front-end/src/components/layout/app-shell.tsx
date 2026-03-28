import { Outlet } from "react-router-dom";
import { SideNav } from "@/components/layout/side-nav";
import { TopNav } from "@/components/layout/top-nav";

export const AppShell = () => {
  return (
    <div className="min-h-screen bg-background text-on-background">
      <TopNav />
      <SideNav />
      <main className="md:ml-72 pt-24 px-8 pb-12 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
};
