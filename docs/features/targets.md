# Feature: Target Configuration & Impact Analysis

## 1. Overview
The **Target** defines *what* a candidate is preparing toward. It is strictly decoupled from *how* they schedule study time.

## 2. Core Entities & Catalogs
- **Canonical Company Catalog (`companies`)**: Curated enterprise entities (Amazon, Google, Microsoft, TCS, Infosys, etc.) with verified hiring benchmarks.
- **Custom Company Name (`custom_company_name`)**: Supported for emerging startups or unlisted firms without polluting the global canonical catalog.
- **Canonical Role Catalog (`roles`)**: Curated job titles categorized by role family (Software Engineer, Backend Engineer, Full-Stack Engineer, etc.).
- **Custom Role Title (`custom_role_name`)**: Flexible workspace-scoped role labeling.

## 3. Preparation Dimensions
1. **Target Date**:
   - Stored as a pure PostgreSQL `date` (calendar date, not arbitrary midnight timestamp).
   - Optional: candidates may prepare on an open-ended horizon.
2. **Preparation Level**:
   - Product-oriented states describing current preparation stage, not personal capability:
     - `foundation`: Building core concepts and patterns.
     - `developing`: Practicing consistently and strengthening weak areas.
     - `interview_preparation`: Timed practice, mock interviews, and high-stakes revision.
3. **Interview Language**:
   - Constrained domain values: `java`, `python`, `cpp`, `javascript_typescript`, `other`.
4. **Template Relationship**:
   - Templates recommend structure (topics, tracks, benchmarks). Workspaces own progress.
   - References `template_id` and `template_version`. Template mutations never erase user historical attempts.

## 4. Target Change Impact Preview
Modifying a target date or schedule triggers live impact calculation:
- Time-to-target computed dynamically in weeks and days.
- Moving target dates forward warns candidates of increased planning pressure while guaranteeing existing completed work remains untouched.
- Extending target dates indicates a more sustainable milestone distribution.
- Planning rebalance advisory is surfaced before committing mutations.
