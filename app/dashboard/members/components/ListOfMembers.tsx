"use server";
import React from "react";
import EditMember from "./edit/EditMember";
import { cn } from "@/lib/utils";
import { requireActor } from "@/lib/actor";
import { readMembers } from "../actions";
import { IPermission } from "@/lib/types";
import DeleteMember from "./DeleteMember";

export default async function ListOfMembers() {
  const { data: permissions } = await readMembers();
  const user = await requireActor();
  const isAdmin = user.role === "admin";

  return (
    <div className="dark:bg-inherit bg-white mx-2 rounded-sm">
      {(permissions as IPermission[])?.map((permission, index) => {
        return (
          <div
            className=" grid grid-cols-5  rounded-sm  p-3 align-middle font-normal"
            key={index}
          >
            <h1>{permission.member.name}</h1>

            <div>
              <span
                className={cn(
                  " dark:bg-zinc-800 px-2 py-1 rounded-full shadow capitalize  border-[.5px] text-sm",
                  {
                    "border-green-500 text-green-600 bg-green-200":
                      permission.role === "admin",
                    "border-zinc-300 dark:text-yellow-300 dark:border-yellow-700 px-4 bg-yellow-50":
                      permission.role === "manager",
                    "border-violet-300 dark:text-green-300 dark:border-blue-700 px-4 bg-yellow-50":
                      permission.role === "verified_user",
                    "border-red-300 dark:text-pink-300 dark:border-gray-700 px-4 bg-yellow-50":
                      permission.role === "new_user",
                  }
                )}
              >
                {permission.role}
              </span>
            </div>
            <h1>{new Date(permission.member.created_at).toDateString()}</h1>
            <div>
              <span
                className={cn(
                  " dark:bg-zinc-800 px-2 py-1 rounded-full  capitalize text-sm border-zinc-300  border",
                  {
                    "text-green-600 px-4 dark:border-green-400 bg-green-200":
                      permission.status === "active",
                    "text-red-500 bg-red-100 dark:text-red-300 dark:border-red-400":
                      permission.status === "resigned",
                  }
                )}
              >
                {permission.status}
              </span>
            </div>

            <div className="flex gap-5 items-center justify-stretch">
              {isAdmin && <DeleteMember user_id={permission.member.id} />}
              <EditMember isAdmin={isAdmin} permission={permission} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
