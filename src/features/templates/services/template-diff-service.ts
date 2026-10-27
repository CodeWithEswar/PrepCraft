/**
 * PrepCraft Template Diff Engine
 * 
 * Rules:
 * - Compares structural changes between two versions of a preparation template.
 * - Categorizes additions, removals, priority shifts, and weight alterations.
 * - Always includes the immutable progress preservation guarantee.
 */

import type {
  TemplateVersionTrack,
  TemplateVersionTopic,
  TemplateVersionPattern,
  CurriculumDiff,
  TopicPriorityDiff,
  TrackWeightDiff,
} from "../types/template.types"

export interface VersionCurriculumSnapshot {
  versionNumber: number
  tracks: TemplateVersionTrack[]
  topics: TemplateVersionTopic[]
  patterns: TemplateVersionPattern[]
}

export function computeCurriculumDiff(
  current: VersionCurriculumSnapshot,
  candidate: VersionCurriculumSnapshot
): CurriculumDiff {
  const currentTrackMap = new Map(current.tracks.map((t) => [t.trackId, t]))
  const candidateTrackMap = new Map(candidate.tracks.map((t) => [t.trackId, t]))

  const currentTopicMap = new Map(current.topics.map((t) => [t.topicId, t]))
  const candidateTopicMap = new Map(candidate.topics.map((t) => [t.topicId, t]))

  const currentPatternMap = new Map(current.patterns.map((p) => [p.patternId, p]))
  const candidatePatternMap = new Map(candidate.patterns.map((p) => [p.patternId, p]))

  // 1. Tracks added and removed
  const tracksAdded: { trackId: string; name: string; priority: TemplateVersionTrack['priority'] }[] = []
  for (const [id, track] of candidateTrackMap) {
    if (!currentTrackMap.has(id)) {
      tracksAdded.push({
        trackId: id,
        name: track.trackName,
        priority: track.priority,
      })
    }
  }

  const tracksRemoved: { trackId: string; name: string }[] = []
  for (const [id, track] of currentTrackMap) {
    if (!candidateTrackMap.has(id)) {
      tracksRemoved.push({
        trackId: id,
        name: track.trackName,
      })
    }
  }

  // 2. Track weight diffs
  const weightChanged: TrackWeightDiff[] = []
  for (const [id, candidateTrack] of candidateTrackMap) {
    const currentTrack = currentTrackMap.get(id)
    if (currentTrack && currentTrack.weight !== candidateTrack.weight) {
      weightChanged.push({
        trackId: id,
        name: candidateTrack.trackName,
        oldWeight: currentTrack.weight,
        newWeight: candidateTrack.weight,
      })
    }
  }

  // 3. Topics added and removed
  const topicsAdded: { topicId: string; name: string; trackId: string; priority: TemplateVersionTopic['priority'] }[] = []
  for (const [id, topic] of candidateTopicMap) {
    if (!currentTopicMap.has(id)) {
      topicsAdded.push({
        topicId: id,
        name: topic.topicName,
        trackId: topic.trackId,
        priority: topic.priority,
      })
    }
  }

  const topicsRemoved: { topicId: string; name: string; trackId: string }[] = []
  for (const [id, topic] of currentTopicMap) {
    if (!candidateTopicMap.has(id)) {
      topicsRemoved.push({
        topicId: id,
        name: topic.topicName,
        trackId: topic.trackId,
      })
    }
  }

  // 4. Topic priority changes
  const priorityChanged: TopicPriorityDiff[] = []
  for (const [id, candidateTopic] of candidateTopicMap) {
    const currentTopic = currentTopicMap.get(id)
    if (currentTopic && currentTopic.priority !== candidateTopic.priority) {
      priorityChanged.push({
        topicId: id,
        name: candidateTopic.topicName,
        trackId: candidateTopic.trackId,
        oldPriority: currentTopic.priority,
        newPriority: candidateTopic.priority,
      })
    }
  }

  // 5. Patterns added
  const patternsAdded: { patternId: string; name: string; priority: TemplateVersionPattern['priority'] }[] = []
  for (const [id, pat] of candidatePatternMap) {
    if (!currentPatternMap.has(id)) {
      patternsAdded.push({
        patternId: id,
        name: pat.patternName,
        priority: pat.priority,
      })
    }
  }

  return {
    currentVersionNumber: current.versionNumber,
    candidateVersionNumber: candidate.versionNumber,
    tracksAdded,
    tracksRemoved,
    topicsAdded,
    topicsRemoved,
    priorityChanged,
    weightChanged,
    patternsAdded,
    preservedProgressGuarantee:
      "All historical question attempts, session logs, revision intervals, and mastery evidence remain permanently intact. Removed topics simply become historical preparation records.",
  }
}
