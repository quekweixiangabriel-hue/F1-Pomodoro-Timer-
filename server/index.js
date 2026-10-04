const http=require('http'),fs=require('fs'),path=require('path');const {WebSocketServer}=require('ws');
const PORT=process.env.PORT||3000,ROOT=path.join(__dirname,'..','client');
const MIME={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json'};
const apiHost='https://api.openf1.org';
const rooms=new Map(),chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';const code=()=>Array.from({length:5},()=>chars[Math.random()*chars.length|0]).join('');const now=()=>Date.now();
function send(res,status,type,data){res.writeHead(status,{'Content-Type':type,'Cache-Control':'no-store','Access-Control-Allow-Origin':'*'});res.end(data)}
async function proxyF1(req,res){try{const u=new URL(req.url,'http://localhost');const target=new URL(apiHost+u.pathname.replace(/^\/api\/f1/,''));target.search=u.search;const r=await fetch(target);const text=await r.text();send(res,r.status,r.headers.get('content-type')||'application/json',text)}catch(e){send(res,502,'application/json',JSON.stringify({error:'OpenF1 unavailable'}))}}
const server=http.createServer((req,res)=>{if(req.url.startsWith('/api/f1/'))return proxyF1(req,res);let p=new URL(req.url,'http://x').pathname;if(p==='/')p='/index.html';p=path.normalize(p).replace(/^([.][.][/\\])+/, '');const f=path.join(ROOT,p);fs.readFile(f,(e,d)=>e?send(res,404,'text/plain','Not found'):send(res,200,MIME[path.extname(f)]||'application/octet-stream',d))});
const wss=new WebSocketServer({server});
function snapshot(r){return {t:'room',code:r.code,host:r.host,status:r.status,players:[...r.players.values()].map(p=>({id:p.id,name:p.name,driver:p.driver,progress:p.progress}))}}
function broadcast(r){const s=JSON.stringify(snapshot(r));for(const p of r.players.values())if(p.ws.readyState===1)p.ws.send(s)}
wss.on('connection',ws=>{const id=Math.random().toString(36).slice(2,9);let room=null;ws.on('message',raw=>{let m;try{m=JSON.parse(raw)}catch{return}
if(m.t==='create'){const c=code();room={code:c,host:id,status:'lobby',players:new Map};room.players.set(id,{id,ws,name:String(m.name||'DRIVER').slice(0,14),driver:String(m.driver||'mclaren'),progress:{lap:0,elapsed:0}});rooms.set(c,room);ws.send(JSON.stringify({t:'created',code:c,you:id}));broadcast(room);return}
if(m.t==='join'&&!room){const r=rooms.get(String(m.code||'').toUpperCase());if(!r)return ws.send(JSON.stringify({t:'error',msg:'ROOM NOT FOUND'}));room=r;room.players.set(id,{id,ws,name:String(m.name||'DRIVER').slice(0,14),driver:String(m.driver||'mclaren'),progress:{lap:0,elapsed:0}});ws.send(JSON.stringify({t:'joined',code:r.code,you:id}));broadcast(r);return}
if(!room)return;const me=room.players.get(id);if(m.t==='start'&&room.host===id&&room.status==='lobby'){room.status='racing';broadcast(room)}if(m.t==='progress'&&me){me.progress={lap:Number(m.lap)||0,elapsed:Number(m.elapsed)||0};broadcast(room)}});ws.on('close',()=>{if(!room)return;room.players.delete(id);if(!room.players.size)rooms.delete(room.code);else{if(room.host===id)room.host=room.players.keys().next().value;broadcast(room)}})});
server.listen(PORT,()=>console.log(`RaceFocus → ${PORT}`));
