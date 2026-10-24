import test from "node:test";
import assert from "node:assert/strict";
import {request} from "node:http";
import {createLocalWebServer} from "../scripts/local-web.mjs";

test("local preview serves only whitelisted site assets",async()=>{
  const server=createLocalWebServer();
  await new Promise((resolve,reject)=>server.once("error",reject).listen(0,"127.0.0.1",resolve));
  try {
    const port=server.address().port;
    async function call(path, method="GET",host="127.0.0.1:8080") {
      return await new Promise((resolve,reject)=>{
        const req=request({hostname:"127.0.0.1",port,path,method,
          headers:{Host:host}},res=>{
          const chunks=[];
          res.on("data",x=>chunks.push(x));
          res.on("end",()=>resolve({
            status:res.statusCode,headers:res.headers,
            text:Buffer.concat(chunks).toString("utf8")
          }));
        });
        req.on("error",reject);req.end();
      });
    }
    const page=await call("/rede.html");
    assert.equal(page.status,200);
    assert.match(page.headers["content-type"],/text\/html/);
    assert.equal(page.headers["cache-control"],"no-store");
    assert.equal((await call("/js/rede-client.js")).status,200);
    assert.equal((await call("/styles.css")).status,200);
    const hidden=[
      "/.git/config","/.env","/scripts/local-homologate.mjs",
      "/supabase/config.toml","/supabase/migrations/20261024170000_mecasim_private_trajectories.sql",
      "/package-lock.json","/tests/mecasim_rls.sql","/public/../../.git/config",
      "/public/%2e%2e/%2e%2e/.git/config"
    ];
    for(const uri of hidden) {
      const response=await call(uri);
      assert.ok([403,404].includes(response.status),"Sensitive source exposed: "+uri);
    }
    const wrongHost=await call("/rede.html","GET","hostile.example");
    assert.equal(wrongHost.status,403);
    assert.equal((await call("/rede.html","POST")).status,405);
    const head=await call("/rede.html","HEAD");
    assert.equal(head.status,200);
    assert.equal(head.text,"");
  } finally {
    await new Promise((resolve,reject)=>server.close(err=>err?reject(err):resolve()));
  }
});
