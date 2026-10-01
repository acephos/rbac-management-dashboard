import React from "react";
import NavLinks from "./NavLinks";

import { cn } from "@/lib/utils";
import ModeToggle from "../tasks/components/ToggleDarkMode";
import SignOut from "./SignOut";
import type { Role } from "@/lib/authorization";

export default function SideNav({ userRole }: { userRole: Role }) {
  return <SideBar userRole={userRole} className=" hidden lg:block dark:bg-graident-dark flex-1" />;
}

export const SideBar = ({ className, userRole }: { className?: string; userRole: Role }) => {
  return (
    <div className={className}>
      <div
        className={cn(
          "h-full w-full lg:w-96 lg:p-10 space-y-5 lg:border-r flex flex-col "
        )}
      >
        <div className="flex-1 space-y-5">
          <div className="flex items-center gap-2 flex-1">
            <h1 className="text-3xl font-bold">Dashboard</h1>

            <ModeToggle />
          </div>
          <NavLinks userRole={userRole}/>
        </div>
        <div className="">
          <SignOut />
        </div>
      </div>
    </div>
  );
};
