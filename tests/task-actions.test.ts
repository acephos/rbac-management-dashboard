import { beforeEach, expect, it, vi } from "vitest";
const mocks=vi.hoisted(()=>({requireActor:vi.fn(),client:vi.fn(),revalidate:vi.fn()}));
vi.mock("@/lib/actor",()=>({requireActor:mocks.requireActor}));
vi.mock("@/lib/supabase",()=>({createSupabaseServerClient:mocks.client}));
vi.mock("next/cache",()=>({revalidatePath:mocks.revalidate,unstable_noStore:vi.fn()}));
import { createTask, updateTaskById, updateTaskByIdElevated, deleteTaskById } from "../app/dashboard/tasks/actions";
beforeEach(()=>vi.resetAllMocks());
it("every mutation rejects an unauthorized caller before touching the database",async()=>{
  mocks.requireActor.mockRejectedValue(new Error("denied"));
  const data={title:"Example task",completed:false,task_id:"00000000-0000-4000-8000-000000000001",assigned_to:"00000000-0000-4000-8000-000000000002"};
  for(const result of [await createTask(data),await updateTaskById(data),await updateTaskByIdElevated(data),await deleteTaskById(data.task_id)])expect(JSON.parse(result).error).toBeTruthy();
  expect(mocks.client).not.toHaveBeenCalled();
});
it("task creation derives creator identity from the authenticated actor",async()=>{
  const id="00000000-0000-4000-8000-000000000001", assigned="00000000-0000-4000-8000-000000000002";
  mocks.requireActor.mockResolvedValue({id,role:"manager",status:"active"});
  const insert=vi.fn().mockResolvedValue({error:null});
  const select=()=>({eq:()=>({single:async()=>({data:{role:"verified_user",status:"active"}})})});
  mocks.client.mockResolvedValue({from:(table:string)=>table==="permission"?{select}:{insert}});
  await createTask({title:"Example task",completed:false,created_by:assigned,assigned_to:assigned});
  expect(insert).toHaveBeenCalledWith({title:"Example task",completed:false,created_by:id,assigned_to:assigned});
});
it("an ordinary user cannot mutate a task they neither own nor are assigned",async()=>{
  mocks.requireActor.mockResolvedValue({id:"owner",role:"verified_user",status:"active"});const update=vi.fn();
  mocks.client.mockResolvedValue({from:()=>({select:()=>({eq:()=>({single:async()=>({data:{created_by:"other",assigned_to:"other"},error:null})})}),update})});
  expect(JSON.parse(await updateTaskById({title:"Example task",completed:false,task_id:"00000000-0000-4000-8000-000000000001"})).error).toBeTruthy();
  expect(update).not.toHaveBeenCalled();
});
