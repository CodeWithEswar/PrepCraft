import type { MasteryAggregate } from "../types/mastery.types"
/** Reject corrupted aggregates rather than silently treating them as weak or zero evidence. */
export function validateMasteryEvidence(a:MasteryAggregate){
 const counts=[a.attempts,a.initial_attempts,a.distinct_entities,a.active_days,a.reviews,a.retained,...Object.values(a.difficulty),a.timing.count,a.timing.outliers]
 if(counts.some(value=>!Number.isSafeInteger(value)||value<0)||a.initial_attempts+a.reviews!==a.attempts||a.retained>a.reviews||a.distinct_entities>a.attempts||a.active_days>a.attempts||!Number.isFinite(Date.parse(a.first_at))||!Number.isFinite(Date.parse(a.last_at))||Date.parse(a.first_at)>Date.parse(a.last_at))throw new Error("Invalid mastery evidence aggregate")
 if(a.timing.medianRatio!==null&&(!Number.isFinite(a.timing.medianRatio)||a.timing.medianRatio<.25||a.timing.medianRatio>4))throw new Error("Invalid timing evidence")
 for(const bucket of a.buckets){if(!["recent","relevant","historical","archive"].includes(bucket.band)||[bucket.initial_count,bucket.initial_independent,bucket.review_count,bucket.review_independent,bucket.total,bucket.minor,bucket.major,bucket.failed].some(value=>!Number.isSafeInteger(value)||value<0)||bucket.initial_independent>bucket.initial_count||bucket.review_independent>bucket.review_count||bucket.initial_count+bucket.review_count!==bucket.total)throw new Error("Invalid mastery evidence bucket")}
 if(a.buckets.reduce((n,b)=>n+b.total,0)!==a.attempts)throw new Error("Incomplete mastery evidence buckets")
}
