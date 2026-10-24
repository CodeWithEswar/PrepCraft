# RLS policy and test contract

Supabase RLS is the final database enforcement layer. Server authorization improves intent/errors but cannot replace it. Migrations define policies and grants; `supabase/policies` only explains their rationale.

Every workspace-owned table must prove:

| Actor / operation | Expected evidence |
| --- | --- |
| Anonymous | No private reads/writes |
| Active owner | Allowed intended operations within their workspace |
| Active member | Only role-permitted operations |
| Non-member | Reads and writes denied |
| Member of workspace A | Cannot read/write workspace B by changing IDs or slugs |
| Disabled/removed member | Access denied, including existing sessions |
| Update/insert | Cannot reassign records to another workspace or forge ownership |

Feature migrations add real fixtures and tests using actual caller roles/JWT claims; never test everything as the service role. Cover foreign keys, parent-child workspace consistency, joins/views, security-definer functions and indirect storage access. Test SELECT, INSERT, UPDATE and DELETE separately.

The present `table-coverage.sql` only detects exposed public application tables with RLS disabled. With no application tables, it is an infrastructure baseline—not proof that membership rules work. Authentication/workspace phases must create the full matrix before releasing protected features. No policy is disabled to make a test pass.
