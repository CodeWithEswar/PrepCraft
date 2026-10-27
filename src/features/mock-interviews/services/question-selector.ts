import type { MockItemStatus, MockSectionConfig, MockSessionItem } from "../types/mock.types"

interface QuestionTemplate {
  id: string
  sourceType: "question" | "concept" | "story" | "project" | "custom"
  sourceId: string
  title: string
  difficulty: "easy" | "medium" | "hard"
  topic: string
  body: string
  constraints?: string
  examples?: { input: string; output: string; explanation: string }[]
  code?: string
  language?: string
  hints?: { level: number; title: string; body: string }[]
}

const CODING_QUESTIONS_POOL: QuestionTemplate[] = [
  {
    id: "q-longest-substring",
    sourceType: "question",
    sourceId: "dsa-longest-substring",
    title: "Longest Substring Without Repeating Characters",
    difficulty: "medium",
    topic: "Sliding Window / Hash Map",
    body: "Given a string `s`, find the length of the longest substring without repeating characters.\n\nYou should optimize for linear time complexity using a sliding window and track visited character indices.",
    constraints: "0 <= s.length <= 5 * 10^4\ns consists of English letters, digits, symbols and spaces.",
    examples: [
      { input: 's = "abcabcbb"', output: "3", explanation: 'The answer is "abc", with the length of 3.' },
      { input: 's = "bbbbb"', output: "1", explanation: 'The answer is "b", with the length of 1.' },
      { input: 's = "pwwkew"', output: "3", explanation: 'The answer is "wke", with length 3.' },
    ],
    code: `class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        // Write your solution here\n        return 0;\n    }\n}`,
    language: "java",
    hints: [
      { level: 1, title: "Sliding Window", body: "Use two pointers [left, right] to represent the active window of unique characters." },
      { level: 2, title: "Index Tracking", body: "Store character -> last seen index in a map to jump the left pointer directly past duplicates." },
    ],
  },
  {
    id: "q-two-sum",
    sourceType: "question",
    sourceId: "dsa-two-sum",
    title: "Two Sum",
    difficulty: "easy",
    topic: "Arrays & Hash Map",
    body: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.",
    constraints: "2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\nOnly one valid answer exists.",
    examples: [
      { input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]." },
    ],
    code: `class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Your implementation here\n        return new int[0];\n    }\n}`,
    language: "java",
    hints: [
      { level: 1, title: "Hash Map lookup", body: "For each element, check if target - nums[i] is already in your map." },
    ],
  },
  {
    id: "q-course-schedule",
    sourceType: "question",
    sourceId: "dsa-course-schedule",
    title: "Course Schedule (Cycle Detection)",
    difficulty: "medium",
    topic: "Graph Traversal / BFS",
    body: "There are a total of `numCourses` courses you have to take, labeled from 0 to numCourses - 1. You are given an array `prerequisites` where prerequisites[i] = [ai, bi] indicates that you must take course bi first if you want to take course ai.\n\nReturn true if you can finish all courses. Otherwise, return false.",
    constraints: "1 <= numCourses <= 2000\n0 <= prerequisites.length <= 5000\nprerequisites[i].length == 2",
    examples: [
      { input: "numCourses = 2, prerequisites = [[1,0]]", output: "true", explanation: "Take course 0 then course 1." },
      { input: "numCourses = 2, prerequisites = [[1,0],[0,1]]", output: "false", explanation: "To take course 1 you should have finished course 0, and vice versa. Cycle exists." },
    ],
    code: `class Solution {\n    public boolean canFinish(int numCourses, int[][] prerequisites) {\n        // Implement topological sort (Kahn's BFS or DFS)\n        return false;\n    }\n}`,
    language: "java",
    hints: [
      { level: 1, title: "Topological Sort", body: "Calculate in-degrees for each vertex. Nodes with 0 in-degree can be taken first." },
    ],
  },
]

const CS_FUNDAMENTALS_POOL: QuestionTemplate[] = [
  {
    id: "cs-os-synchronization",
    sourceType: "concept",
    sourceId: "os-thread-sync",
    title: "OS: Mutex vs Semaphore vs Condition Variable",
    difficulty: "medium",
    topic: "Operating Systems",
    body: "Explain the architectural difference between a binary semaphore and a mutex in modern POSIX/Linux kernels. Under what circumstances can priority inversion occur, and what mechanism does the kernel employ to resolve it?",
  },
  {
    id: "cs-sql-joins",
    sourceType: "concept",
    sourceId: "dbms-indexing-joins",
    title: "SQL & DBMS: Index Selection & Join Strategies",
    difficulty: "medium",
    topic: "SQL & DBMS",
    body: "Consider a table `orders (id, customer_id, created_at, status)` with 50M rows. How would you index this table to support queries filtering on status and sorting by created_at desc? Explain why a Nested Loop Join might be chosen over a Hash Join by the query planner.",
  },
  {
    id: "cs-java-memory",
    sourceType: "concept",
    sourceId: "java-jvm-memory",
    title: "Java: Garbage Collection & Memory Model",
    difficulty: "medium",
    topic: "Java Foundations",
    body: "How does the ZGC or G1GC garbage collector achieve low pause times? What is the semantic difference between `volatile` and `synchronized` in terms of instruction reordering and happens-before guarantees?",
  },
  {
    id: "cs-net-tcp-handshake",
    sourceType: "concept",
    sourceId: "net-tcp-handshake",
    title: "Computer Networks: TCP Handshake & TIME_WAIT",
    difficulty: "easy",
    topic: "Computer Networks",
    body: "Detail the 3-way handshake and 4-way termination sequence. Why is the TIME_WAIT state necessary, and what danger does setting SO_REUSEADDR create if misconfigured on high-throughput microservices?",
  },
]

const BEHAVIORAL_POOL: QuestionTemplate[] = [
  {
    id: "b-leadership-disagree",
    sourceType: "story",
    sourceId: "behavioral-disagree-commit",
    title: "Have Backbone; Disagree and Commit",
    difficulty: "medium",
    topic: "Leadership Principles",
    body: "Tell me about a time when you strongly disagreed with an architectural or product decision made by a team lead or colleague. How did you present your case with data, and what was the outcome once the final decision was reached?",
  },
  {
    id: "b-ownership-deadline",
    sourceType: "story",
    sourceId: "behavioral-ownership",
    title: "Ownership Under Ambiguity & Tight Deadlines",
    difficulty: "medium",
    topic: "Leadership Principles",
    body: "Describe a project where requirements changed significantly near the release date. How did you prioritize technical debt versus customer impact?",
  },
]

const PROJECT_POOL: QuestionTemplate[] = [
  {
    id: "p-architecture-tradeoff",
    sourceType: "project",
    sourceId: "project-tradeoffs",
    title: "Project Deep Dive: Architecture, Scaling & Failures",
    difficulty: "hard",
    topic: "Project Architecture",
    body: "Pick your primary production project:\n1. Why did you choose this architecture over simpler monolithic or serverless alternatives?\n2. What was the single hardest technical bug you encountered in production, and how did you diagnose the root cause?\n3. If traffic grew 50x overnight, where would the first bottleneck appear, and how would you redesign it?",
  },
]

export function selectQuestionsForSection(
  section: MockSectionConfig,
  sectionId: string,
  startSortOrder: number
): MockSessionItem[] {
  let pool: QuestionTemplate[] = []
  if (section.type === "coding" || section.type === "dsa") {
    pool = CODING_QUESTIONS_POOL
  } else if (section.type === "behavioral") {
    pool = BEHAVIORAL_POOL
  } else if (section.type === "project_deep_dive") {
    pool = PROJECT_POOL
  } else {
    pool = CS_FUNDAMENTALS_POOL
  }

  const items: MockSessionItem[] = []
  const count = Math.min(section.count, pool.length || 1)
  const targetPerQuestion = Math.round((section.durationMinutes * 60) / Math.max(1, count))

  for (let i = 0; i < count; i++) {
    const template = pool[i % pool.length]
    items.push({
      id: `item-${sectionId}-${i + 1}`,
      sectionId,
      executionItemId: `exec-item-${sectionId}-${i + 1}`,
      sourceType: template.sourceType,
      sourceId: template.sourceId,
      title: template.title,
      sortOrder: startSortOrder + i,
      difficultySnapshot: template.difficulty,
      targetDurationSeconds: targetPerQuestion,
      status: "unseen" as MockItemStatus,
      firstViewedAt: null,
      completedAt: null,
      flaggedAt: null,
      body: template.body,
      topic: template.topic,
      constraints: template.constraints,
      examples: template.examples,
      code: template.code,
      language: template.language,
      scratchpad: "",
      answer: "",
      hintsAvailable: template.hints ? template.hints.length : 0,
      hints: template.hints?.map((h) => ({ ...h })),
    })
  }

  return items
}
