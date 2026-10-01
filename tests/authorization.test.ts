import { expect, it } from "vitest";
import { authorize, authorizeTask, type Actor } from "../lib/authorization";
const actor = (role: Actor["role"], status: Actor["status"]="active"): Actor => ({id:"owner",role,status});
it("denies anonymous, inactive, and newly registered task users",()=>{
  expect(()=>authorize(null)).toThrow();expect(()=>authorize(actor("admin","resigned"))).toThrow();
  expect(()=>authorizeTask(actor("new_user"),{created_by:"owner",assigned_to:"owner"})).toThrow();
});
it("ordinary verified users can change their tasks but cannot reassign or modify others",()=>{
  const user=actor("verified_user");expect(()=>authorizeTask(user,{created_by:"other",assigned_to:"owner"})).not.toThrow();
  expect(()=>authorizeTask(user,{created_by:"other",assigned_to:"other"})).toThrow();
  expect(()=>authorizeTask(user,{created_by:"owner",assigned_to:"owner"},true)).toThrow();
});
it("staff can administer tasks; managers cannot administer roles",()=>{
  for(const role of ["manager","admin"] as const)expect(()=>authorizeTask(actor(role),{created_by:"other",assigned_to:"other"},true)).not.toThrow();
  expect(()=>authorize(actor("manager"),["admin"])).toThrow();
});
