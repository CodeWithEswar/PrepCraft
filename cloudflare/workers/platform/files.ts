export const MAX_FILE_BYTES=10*1024*1024
export class FileError extends Error {constructor(readonly code:"size_mismatch"|"checksum_mismatch"|"mime_invalid"){super(code)}}
export async function readFileBody(request:Request,expected:number){
 const length=request.headers.get("Content-Length");if(length&&Number(length)!==expected)throw new FileError("size_mismatch")
 const reader=request.body?.getReader();if(!reader)throw new FileError("size_mismatch")
 const parts:Uint8Array[]=[];let size=0
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>expected||size>MAX_FILE_BYTES){await reader.cancel();throw new FileError("size_mismatch")}parts.push(value)}}finally{reader.releaseLock()}
 if(size!==expected)throw new FileError("size_mismatch")
 const bytes=new Uint8Array(size);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.length}return bytes
}
export function validMime(bytes:Uint8Array,mime:string){
 const starts=(values:number[])=>values.every((v,i)=>bytes[i]===v)
 if(mime==="application/pdf")return starts([37,80,68,70,45])
 if(mime==="image/png")return starts([137,80,78,71,13,10,26,10])
 if(mime==="image/jpeg")return starts([255,216,255])
 if(mime==="text/plain"){try{const text=new TextDecoder("utf-8",{fatal:true}).decode(bytes);return !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(text)}catch{return false}}
 return false
}
export async function checksum(bytes:Uint8Array){return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",bytes as Uint8Array<ArrayBuffer>)),n=>n.toString(16).padStart(2,"0")).join("")}
