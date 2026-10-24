import test from "node:test";
import assert from "node:assert/strict";
import { validateTrajectory } from "../supabase/functions/mecasim-trajectories/trajectory-validation.mjs";
import { createTrajectoryHandler } from "../supabase/functions/mecasim-trajectories/handler.mjs";

const ORIGIN = "https://pabloinaciosilvestreinacio-collab.github.io";
const confirmed = id => ({id, email:"test@example.invalid",
  email_confirmed_at:"2026-10-24T12:00:00Z", is_anonymous:false});
const rows=[
  {id:1,owner_id:"user-A",name:"Route A",points:[{x:1,y:1}],created_at:"2026-10-24T12:00:00Z"},
  {id:2,owner_id:"user-B",name:"Route B",points:[{x:2,y:2}],created_at:"2026-10-24T12:10:00Z"}
];

let lastInserted;
function makeClient() {
  return function _createClient(_url,_key,options) {
    const token=options.global.headers.Authorization.slice(7);
    const identity=token==="valid-A" ? confirmed("user-A")
      : token==="valid-B" ? confirmed("user-B")
      : token==="anon" ? {...confirmed("user-A"),is_anonymous:true}
      : token==="unconfirmed" ? {...confirmed("user-A"),email_confirmed_at:null}
      : null;
    return {
      auth:{getUser:async()=> identity ? {data:{user:identity},error:null}
                                         : {data:{user:null},error:{message:"not authenticated"}}},
      from(table) {
        assert.equal(table,"mecasim_trajectories");
        const q={action:"list",conditions:[],data:null,columns:null};
        const project = row => row && q.columns ? Object.fromEntries(q.columns.map(key => [key,row[key]])) : row;
        const builder={
          select(columns){ q.columns=columns.split(",").map(x=>x.trim()); return builder; },
          eq(column,value){q.conditions.push([column,value]);return builder;},
          order(){return builder;},
          limit(){return Promise.resolve({data:rows.filter(x=>x.owner_id===identity.id).map(project),error:null});},
          insert(record) {q.action="insert";q.data=record;lastInserted=record;return builder;},
          single() { if(q.action==="insert")return Promise.resolve({data:project({id:3,...q.data}),error:null}); return Promise.resolve({data:null,error:null});},
          delete(){q.action="delete";return builder;},
          maybeSingle(){
            const owner=q.conditions.find(x=>x[0]==="owner_id")?.[1];
            const id=q.conditions.find(x=>x[0]==="id")?.[1];
            const record=rows.find(x=>x.owner_id===owner && x.owner_id===identity.id && x.id===id);
            if(q.action==="delete")return Promise.resolve({data:project(record)||null,error:null});
            return Promise.resolve({data:project(record)||null,error:null});
          }
        };
        return builder;
      }
    };
  };
}
const handler=createTrajectoryHandler({
  createClient:makeClient(),
  env:name=>name==="SUPABASE_URL"?"https://example.supabase.co":
    name==="SUPABASE_PUBLISHABLE_KEYS"?JSON.stringify({default:"public-key"}):undefined,
  allowedOrigins:[ORIGIN]
});
const call=(token,body,origin=ORIGIN,method="POST")=>handler(new Request(
  "https://example.invalid/functions/v1/mecasim-trajectories",
  {method,headers:{"Authorization":token?"Bearer "+token:"", "Origin":origin,
    "Content-Type":"application/json"},
   ...(method==="POST"?{body:JSON.stringify(body)}:{})}
));

test("route validation accepts legal 1 to 16 waypoints",()=>{
  assert.deepEqual(validateTrajectory(" Start ",[{x:1.123456,y:3.21}]),
    {name:"Start",points:[{x:1.123,y:3.21}]});
});
test("malformed routes are rejected",()=>{
  const invalid=[
    ["ok",[{x:1,y:1}]],
    ["Route",[]],
    ["Route",Array(17).fill({x:1,y:1})],
    ["Route",[{x:NaN,y:1}]],
    ["Route",[{x:0,y:1}]],
    ["Route",[{x:1,y:999}]],
    ["Route",[{x:1,y:1,owner_id:"user-B"}]],
    ["Route",[{x:"1",y:1}]],
    ["Route\nInjected",[{x:1,y:1}]]
  ];
  for(const [name,points] of invalid) assert.throws(()=>validateTrajectory(name,points));
});
test("missing and forged sessions cannot read saved data",async()=>{
  assert.equal((await call(null,{action:"list"})).status,401);
  assert.equal((await call("forged",{action:"list"})).status,401);
});
test("unconfirmed and anonymous Auth identities are denied",async()=>{
  assert.equal((await call("anon",{action:"list"})).status,403);
  assert.equal((await call("unconfirmed",{action:"save",name:"Test",points:[{x:1,y:1}]})).status,403);
});
test("foreign origin rejected even with valid JWT",async()=>{
  const r=await call("valid-A",{action:"list"},"https://hostile.example");
  assert.equal(r.status,403);
  assert.equal(r.headers.get("access-control-allow-origin"),null);
});
test("CORS preflight supports only allowed origin",async()=>{
  const r=await handler(new Request("https://example.invalid",{method:"OPTIONS",headers:{"Origin":ORIGIN}}));
  assert.equal(r.status,204);
  assert.equal(r.headers.get("access-control-allow-origin"),ORIGIN);
});
test("users see only their own saved route metadata",async()=>{
  const a=await call("valid-A",{action:"list"});
  assert.equal(a.status,200);
  const payload=await a.json();
  assert.equal(payload.trajectories.length,1);
  assert.equal(payload.trajectories[0].owner_id,undefined);
  const b=await call("valid-B",{action:"list"});
  assert.equal((await b.json()).trajectories[0].name,"Route B");
});
test("user A cannot load/delete route B by guessing its id",async()=>{
  const load=await call("valid-A",{action:"load",id:2});
  assert.equal(load.status,404);
  const remove=await call("valid-A",{action:"remove",id:2});
  assert.equal(remove.status,404);
  const own=await call("valid-A",{action:"load",id:1});
  assert.equal(own.status,200);
  assert.deepEqual((await own.json()).trajectory.points,[{x:1,y:1}]);
});
test("invalid ids and oversized routes rejected before database access",async()=>{
  const invalid=await call("valid-A",{action:"load",id:-1});
  assert.equal(invalid.status,422);
  const route=await call("valid-A",{action:"save",name:"Good name",points:[{x:9,y:1}]});
  assert.equal(route.status,422);
});
test("valid save uses authenticated owner id regardless of supplied owner_id",async()=>{
  const r=await call("valid-A",{action:"save",name:"New route",owner_id:"user-B",points:[{x:1.83,y:0.65}]});
  assert.equal(r.status,201);
  const payload=await r.json();
  assert.equal(payload.trajectory.owner_id,undefined);
  assert.equal(lastInserted.owner_id,"user-A");
});
test("unsupported methods and unknown operations fail closed",async()=>{
  assert.equal((await call("valid-A",{action:"unknown"})).status,400);
  const get=await handler(new Request("https://example.invalid",{method:"GET",headers:{"Origin":ORIGIN}}));
  assert.equal(get.status,405);
});
