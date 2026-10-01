import { expect,it,vi } from "vitest";
const client=vi.hoisted(()=>({create:vi.fn()}));vi.mock("../lib/supabase",()=>({createSupabaseServerClient:client.create}));vi.mock("next/navigation",()=>({redirect:vi.fn()}));
import {getActor} from "../lib/actor";
it("ignores a caller-controlled admin metadata claim",async()=>{
 client.create.mockResolvedValue({auth:{getUser:async()=>({data:{user:{id:"user",user_metadata:{role:"admin"}}},error:null})},from:()=>({select:()=>({eq:()=>({single:async()=>({data:{role:"new_user",status:"active"},error:null})})})})});
 expect(await getActor()).toEqual({id:"user",role:"new_user",status:"active"});
});
it("does not accept cached identity when Auth verification fails",async()=>{
 const from=vi.fn();client.create.mockResolvedValue({auth:{getUser:async()=>({data:{user:{id:"user"}},error:{message:"invalid"}})},from});
 expect(await getActor()).toBeNull();expect(from).not.toHaveBeenCalled();
});
