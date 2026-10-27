// Disposable, browser-only PostgreSQL. This worker has no application client or credentials.
import { PGlite } from './runtime/index.js'
let db
try {
 db=new PGlite()
 await db.waitReady
 await db.exec("set statement_timeout='1s';set work_mem='4MB';set temp_file_limit='16MB';")
 await db.exec(`create table customers(id integer primary key,name text);create table orders(id integer primary key,customer_id integer,total integer);
 insert into customers values(1,'Asha'),(2,'Milan'),(3,'Riya');insert into orders values(11,1,120),(12,1,80),(13,3,50);`)
 self.postMessage({kind:'ready'})
 self.onmessage=async event=>{
  const sql=event.data?.sql
  if(typeof sql!=='string'||sql.length>4000||!/^\s*(select|with)\b/i.test(sql)||/;|\b(copy|attach|load|create|alter|drop|insert|update|delete|truncate|call|do|pg_sleep|generate_series)\b/i.test(sql)){
   self.postMessage({kind:'error',message:'Use a single SELECT or read-only WITH query, up to 4,000 characters.'});return
  }
  try{
   await db.exec('begin read only')
   const result=await db.query(`select * from (${sql}) as exercise_result limit 101`)
   await db.exec('rollback')
   const payload={kind:'result',fields:result.fields.map(f=>f.name),rows:result.rows.slice(0,100),truncated:result.rows.length>100}
   if(JSON.stringify(payload).length>64000)throw new Error('Result exceeds the 64 KB output limit. Select fewer columns or rows.')
   self.postMessage(payload)
  }catch(error){try{await db.exec('rollback')}catch{};self.postMessage({kind:'error',message:String(error.message).slice(0,500)})}
 }
}catch{self.postMessage({kind:'error',message:'The local SQL runtime could not start. Lessons and assessed concept checks are still available.'})}
