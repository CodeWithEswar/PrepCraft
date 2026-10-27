# Mastery Policy v1

mastery-policy-v1 interprets seven dimensions. There is no arbitrary weighted overall score; score remains null. Recent 0–14-day observations have weight 1, 15–45 days .65, 46–90 days .35, and 91–365 days .15. SQL supplies bounded aggregate buckets; TypeScript owns interpretation and action policy.

Independent Solving uses initial attempts only, at least three observations across two identities and two local days. Revision cannot inflate novel solving. Retention requires two actual reviews and excludes initial scheduling. Hint independence gives minor assistance half-dependence and major assistance full dependence. Missing dimensions remain null without automatic weight redistribution.

Timing requires two independently solved Interview attempts with explicit per-item targets. It uses median duration/target, excluding ratios outside .25–4 while reporting the excluded count. Practice is advisory and multi-item OA lacks a per-item baseline, so neither becomes pressure-timing evidence. Difficulty is coverage context, never an XP multiplier. Recency affects confidence without automatically becoming weakness.

Confidence calibration normalizes confidence 1–5 to 0–1 and compares it with outcome anchors (independent 1, minor .65, major .3, failed 0). At least three pairs are needed. Two high-confidence failures indicate overconfidence; two low-confidence independent results indicate underconfidence. High confidence cannot improve solve or retention results.

With sufficient varied initial evidence, an independent rate below .4 is Needs Work, below .7 Developing. At least .7 plus two retained reviews at rate .67 supports Stable; otherwise Developing. Strong additionally requires .85 independent, .8 retention, three reviews, eight initial attempts, three identities, four days, 14-day span, two Medium/Hard observations and two supported timing results with median at most 1.2× target. Historical Strong may coexist with Limited current evidence confidence. Every threshold is portable-testable and versioned.
