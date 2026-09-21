const fs = require('fs');
const path = require('path');
const os = require('os');
const root = path.resolve(__dirname, '..');
const sessions = path.join(os.homedir(), '.codex', 'sessions');
const out = path.join(root, '.agent-logs');
const pidFile=path.join(os.tmpdir(),'fathom-codex-capture.pid');
function walk(dir) { return fs.readdirSync(dir, {withFileTypes:true}).flatMap(e => e.isDirectory() ? walk(path.join(dir,e.name)) : [path.join(dir,e.name)]); }
function sync(file) {
 const rows = fs.readFileSync(file,'utf8').split('\n').filter(Boolean).flatMap(l=>{try{return [JSON.parse(l)]}catch{return []}});
 const meta = rows.find(r=>r.type==='session_meta')?.payload;
 if (!meta || path.resolve(meta.cwd).toLowerCase() !== root.toLowerCase()) return;
 const id = meta.id || meta.session_id;
 let model = rows.find(r=>r.type==='turn_context')?.payload.model || 'unknown';
 if(model==='codex-auto-review')return;
 let num=0; const entries=[];
 for (const r of rows) {
  const p=r.payload;
  if(r.type==='turn_context') model=p.model;
  if(r.type==='event_msg'&&p.type==='item_completed'&&p.item?.type==='FunctionCallOutput'&&['create_thread','send_message_to_thread'].includes(p.item.name)) {
   const match=p.item.output?.match(/<input>([\s\S]*)<\/input>/);
   if(match){num++;entries.push({type:'PROMPT',num,time:r.timestamp,model,body:match[1]});}
  }
  if(r.type!=='response_item'||p.type!=='message') continue;
  const body=(p.content||[]).map(c=>c.text||'').join('');
  if(p.role==='user') {
   if(body.startsWith('<recommended_plugins>')||body.startsWith('# AGENTS.md instructions')||body.startsWith('<environment_context>')) continue;
   num++; entries.push({type:'PROMPT',num,time:r.timestamp,model,body});
  } else if(p.role==='assistant'&&['final','final_answer'].includes(p.phase)&&num) entries.push({type:'RESPONSE',num,time:r.timestamp,model,body});
 }
 if(!entries.length)return;
 const first=entries[0].time; const last=entries.filter(e=>e.type==='PROMPT').at(-1).time;
 const name=`${first.slice(0,19).replace('T','_').replaceAll(':','-')}_${id}.md`;
 const dest=path.join(out,name);
 const header=`---\nsession_id: ${id}\ndate: ${first.slice(0,10)}\nauthor: Soorej S\nmodel: ${entries[0].model}\ntool: codex-desktop\nproject: fathom-ai-clone\ntotal_exchanges: ${num}\nfirst_prompt_time: ${first}\nlast_prompt_time: ${last}\n---\n\n# Session Log - ${first.slice(0,10)}\n\nSession: \`${id.slice(0,8)}\` | Project: \`fathom-ai-clone\` | Author: \`Soorej S\`\n\n---\n\n`;
 const blocks=entries.map(e=>`[LOG_ENTRY type=${e.type} num=${e.num} session=${id.slice(0,8)}]\ntimestamp: ${e.time}\nmodel: ${e.model}\n\n${e.body}\n\n\n`).join('');
 fs.mkdirSync(out,{recursive:true});
 if(fs.existsSync(dest)) {
  const prior=fs.readFileSync(dest,'utf8'); const start=prior.indexOf('[LOG_ENTRY'); const old=prior.slice(start);
  if(!blocks.startsWith(old)) throw Error('Existing entries differ; refusing to rewrite '+dest);
  if(prior===header+blocks)return;
 }
 // Only metadata is refreshed; existing entry bytes must remain identical.
 fs.writeFileSync(dest,header+blocks);
}
function scan(){for(const f of walk(sessions).filter(f=>f.endsWith('.jsonl'))) sync(f);}
scan();
if(process.argv.includes('--ensure')) {
 let alive=false;
 try{process.kill(Number(fs.readFileSync(pidFile,'utf8')),0);alive=true}catch{}
 if(!alive){const child=require('child_process').spawn(process.execPath,[__filename,'--watch'],{detached:true,stdio:'ignore',windowsHide:true});fs.writeFileSync(pidFile,String(child.pid));child.unref();}
}
if(!process.argv.includes('--watch'))console.log('{}');
if(process.argv.includes('--watch'))setInterval(()=>{try{scan()}catch(e){console.error(e)}},1000);
