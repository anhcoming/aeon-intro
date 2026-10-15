import http from "node:http";import fs from "node:fs";import path from "node:path";
const R=new URL(".",import.meta.url).pathname;const T={".html":"text/html; charset=utf-8",".jpg":"image/jpeg",".png":"image/png",".mp4":"video/mp4",".webm":"video/webm"};
http.createServer((q,s)=>{let u=decodeURIComponent(q.url.split("?")[0]);if(u==="/")u="/index.html";const fp=path.join(R,path.normalize(u));if(!fp.startsWith(R)||u.includes("serve.mjs"))return s.writeHead(403).end();
fs.stat(fp,(e,st)=>{if(e||!st.isFile())return s.writeHead(404).end();const t=T[path.extname(fp)]||"application/octet-stream";const r=q.headers.range;
if(r){const m=/bytes=(\d*)-(\d*)/.exec(r);const a=m[1]?+m[1]:0,z=Math.min(m[2]?+m[2]:st.size-1,st.size-1);if(a>z)return s.writeHead(416,{"Content-Range":`bytes */${st.size}`}).end();s.writeHead(206,{"Content-Type":t,"Accept-Ranges":"bytes","Content-Range":`bytes ${a}-${z}/${st.size}`,"Content-Length":z-a+1});fs.createReadStream(fp,{start:a,end:z}).on("error",()=>s.destroy()).pipe(s)}
else{s.writeHead(200,{"Content-Type":t,"Accept-Ranges":"bytes","Content-Length":st.size});fs.createReadStream(fp).on("error",()=>s.destroy()).pipe(s)}})}).listen(8091);
