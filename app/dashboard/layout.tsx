import React, { ReactNode } from "react";
import SideNav from "./components/SideNav";
import ToggleSidebar from "./components/ToggleSidebar";
import MobileSideNav from "./components/MobileSideNav";
import { requirePageActor } from "@/lib/actor";
import { redirect } from "next/navigation";


export default async function Layout({ children }: { children: ReactNode }) {
  const actor = await requirePageActor();

  return (
    <div className="w-full flex ">
      <div className="h-screen flex flex-col">
        <SideNav userRole={actor.role} />
        <MobileSideNav userRole={actor.role} />
      </div>

      <div className="w-full sm:flex-1 p-5 sm:p-10 space-y-5 bg-gray-100 dark:bg-inherit">
        <ToggleSidebar />
        {children}
      </div>
    </div>
  );
}
