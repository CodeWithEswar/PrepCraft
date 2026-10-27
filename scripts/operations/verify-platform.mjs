import fs from 'node:fs'
import {execFileSync} from 'node:child_process'
import {randomUUID,createHash} from 'node:crypto'
import assert from 'node:assert/strict'
if(!process.argv.includes('--live'))throw Error('Explicit --live required. This creates and removes only its own verification fixture.')
const userId=randomUUID(),workspaceId=randomUUID(),slug='platform-verification-'+randomUUID(),origin='https://prepcraft.vercel.app',worker='https://prepcraft-platform.nxtqr.workers.dev',path='.wrangler/platform-verification-query.sql'
const run=sql=>{fs.writeFileSync(path,sql);try{return JSON.parse(execFileSync(process.execPath,['node_modules/supabase/dist/supabase.js','db','query','--project-ref','tkfqomwymkgcnjakppon','--linked','--file',path,'--output','json'],{encoding:'utf8',stdio:['ignore','pipe','pipe']})).rows}catch{throw Error('Verification query failed; no database output or credentials logged.')}}
const asUser=sql=>run(`begin;select set_config('request.jwt.claim.sub','${userId}',true);set local role authenticated;${sql};commit;`)[0]?.result
let created=false,removed=false
try{
 run(`begin;insert into auth.users(id,email,role,aud) values('${userId}','${userId}@example.invalid','authenticated','authenticated');insert into public.workspaces(id,created_by,created_by_user_id,name,slug) values('${workspaceId}','${userId}','${userId}','Platform verification','${slug}');insert into public.workspace_members(workspace_id,user_id,role,status) values('${workspaceId}','${userId}','owner','active');select true result;commit;`);created=true
 fs.writeFileSync('.wrangler/platform-live-fixture.json',JSON.stringify({userId,workspaceId,slug}))
 const text='PrepCraft private R2 verification. No user content.',checksum=createHash('sha256').update(text).digest('hex')
 const grant=asUser(`select public.platform_file_command('${slug}','${randomUUID()}','${JSON.stringify({kind:'upload',environment:'production',name:'verification.txt',category:'attachment',mime:'text/plain',bytes:Buffer.byteLength(text),checksum})}'::jsonb) result`)
 let r=await fetch(worker+'/files/upload',{method:'PUT',headers:{Origin:origin,Authorization:'Bearer '+grant.token,'Content-Type':'text/plain'},body:text,signal:AbortSignal.timeout(30000)})
 assert.equal(r.status,200,'verified upload');let file=asUser(`select public.platform_files('${slug}') result`).items[0];assert.equal(file.status,'READY')
 const download=asUser(`select public.platform_file_command('${slug}','${randomUUID()}','${JSON.stringify({kind:'download',id:file.id})}'::jsonb) result`)
 const options={headers:{Origin:origin,Authorization:'Bearer '+download.token},signal:AbortSignal.timeout(30000)}
 r=await fetch(worker+'/files/download',options);assert.equal(r.status,200,'private download');assert.equal(await r.text(),text);assert.match(r.headers.get('Content-Disposition'),/^attachment/)
 r=await fetch(worker+'/files/download',options);assert.equal(r.status,403,'download replay rejected')
 asUser(`select public.platform_file_command('${slug}','${randomUUID()}','${JSON.stringify({kind:'delete',id:file.id,version:file.version})}'::jsonb) result`)
 console.log(JSON.stringify({upload:'verified',download:'matched',replay:'denied',deletion:'waiting_for_queue'}))
 const deadline=Date.now()+360000
 while(Date.now()<deadline){const state=run(`select status result from public.files where id='${file.id}' and owner_user_id='${userId}' and workspace_id='${workspaceId}'`)[0]?.result;if(state==='DELETED'){removed=true;break}await new Promise(resolve=>setTimeout(resolve,15000))}
 assert(removed,'Background deletion was not confirmed within six minutes; fixture retained for investigation')
 run(`begin;delete from public.workspaces where id='${workspaceId}' and slug='${slug}' and created_by='${userId}';delete from auth.users where id='${userId}' and email='${userId}@example.invalid';select true result;commit;`)
 fs.unlinkSync('.wrangler/platform-live-fixture.json');console.log(JSON.stringify({status:'passed',privateR2RoundTrip:true,queuedDelete:true,fixtureRemoved:true}))
}catch(error){console.error(JSON.stringify({status:'failed',message:error instanceof assert.AssertionError?error.message:'Verification failed; inspect the task-owned fixture',fixtureCreated:created,storageDeletionConfirmed:removed}));process.exitCode=1}
finally{if(fs.existsSync(path))fs.unlinkSync(path)}
