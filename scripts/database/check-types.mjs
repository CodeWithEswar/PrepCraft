import {execFileSync} from 'node:child_process'
import fs from 'node:fs'
// Deliberately local only: CI must never introspect or mutate the production project.
const actual=execFileSync(process.execPath,['node_modules/supabase/dist/supabase.js','gen','types','--local','--schema','public','--lang','typescript'],{encoding:'utf8',stdio:['ignore','pipe','inherit']})
const normalize=s=>s.replace(/^\uFEFF/,'').replaceAll('\r\n','\n').trim()
if(normalize(actual)!==normalize(fs.readFileSync('src/lib/supabase/types.ts','utf8')))throw Error('Database type drift. Regenerate types from the reset local database and review the schema difference.')
console.log('Generated Supabase types match the local migration schema.')
