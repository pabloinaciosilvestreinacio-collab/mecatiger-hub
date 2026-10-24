// Local-only static preview server. It never exposes .git, SQL, scripts or secrets.
// Run from the repository root: node scripts/local-web.mjs
import {createServer} from "node:http";
import {readFile, stat} from "node:fs/promises";
import {resolve,extname,sep} from "node:path";

const root=resolve(import.meta.dirname,"..");
const exact=new Set([
  "/","/index.html","/rede.html","/entrar.html",
  "/mecasim.html","/mecasim-demo.html","/contato.html","/evidencias.html",
  "/styles.css","/rede.css","/favicon.ico"
]);
const types={
  ".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",
  ".mjs":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",
  ".png":"image/png",".jpg":"image/jpeg",".jpeg":"image/jpeg",
  ".svg":"image/svg+xml",".webp":"image/webp",".ico":"image/x-icon",
  ".woff2":"font/woff2"
};
const allowed=path=>{
  if(exact.has(path))return true;
  if(path.startsWith("/js/"))return /^\/js\/[a-zA-Z0-9_-]+\.m?js$/u.test(path);
  if(path.startsWith("/public/"))return /^\/public\/[a-zA-Z0-9_./-]+\.(png|jpg|jpeg|svg|webp|ico|woff2)$/iu.test(path)
    && !path.split("/").some(p=>p===".."||p.startsWith("."));
  return false;
};

export function createLocalWebServer() {
  return createServer(async(req,res)=>{
    if(req.headers.host!=="127.0.0.1:8080"){
      res.writeHead(403,{"Cache-Control":"no-store"});res.end("Forbidden host");return;
    }
    if(req.method!=="GET" && req.method!=="HEAD"){
      res.writeHead(405,{"Allow":"GET, HEAD"});res.end();return;
    }
    let rawPath;
    try {rawPath=decodeURIComponent(new URL(req.url,"http://127.0.0.1:8080").pathname);}
    catch {res.writeHead(400);res.end();return;}
    const pathname=rawPath==="/"?"/index.html":rawPath;
    if(!allowed(pathname)){
      res.writeHead(404,{"Cache-Control":"no-store"});res.end("Not found");return;
    }
    const path=resolve(root,"."+pathname);
    if(!path.startsWith(root+sep)){
      res.writeHead(403);res.end();return;
    }
    try {
      const s=await stat(path);
      if(!s.isFile() || s.size>15*1024*1024){res.writeHead(404);res.end();return;}
      const data=await readFile(path);
      res.writeHead(200,{
        "Content-Type":types[extname(path).toLowerCase()]||"application/octet-stream",
        "Content-Length":data.length,
        "Cache-Control":"no-store",
        "X-Content-Type-Options":"nosniff",
        "Referrer-Policy":"same-origin"
      });
      res.end(req.method==="HEAD"?undefined:data);
    } catch {res.writeHead(404,{"Cache-Control":"no-store"});res.end("Not found");}
  });
}
if(import.meta.url==="file://"+process.argv[1]?.replaceAll("\\","/")){
  createLocalWebServer().listen(8080,"127.0.0.1",()=>{
    console.log("Preview local: http://127.0.0.1:8080");
    console.log("Sem exposição de .git, SQL, arquivos de configuração ou credenciais administrativas.");
  });
}
