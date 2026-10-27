export const PRODUCTION_BACKEND_HOST="tkfqomwymkgcnjakppon.supabase.co"
export function verifyBackendIsolation(url:string,environment:string,allowLiveLocal=false){
 if(new URL(url).hostname!==PRODUCTION_BACKEND_HOST)return
 if(environment==="preview")throw Error("Preview deployments require a separate Supabase project or branch.")
 if(environment==="local"&&!allowLiveLocal)throw Error("Local development requires a local backend. Set ALLOW_LIVE_BACKEND=true only for an intentional live-project session.")
}
