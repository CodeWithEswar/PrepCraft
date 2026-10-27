# SQL and DBMS

Published concepts: SELECT/NULL, LEFT JOIN, grouping/HAVING, functional dependency/3NF and lost updates. Separate SQL and DBMS topics share one subject and the canonical databases-sql track. Further coverage includes windows, CTEs, indexes, isolation, locks and optimization.

Transaction Lab steps through an explicit stale read/write interleaving. Isolation claims distinguish the SQL standard from engine-specific behavior.

The joins lesson includes real PostgreSQL running in a disposable browser worker with three sample customers and orders. A read-only query is bounded to 4,000 characters, 100 returned rows and 64 KB output. Initialization has a 20-second watchdog; query execution has a 1-second statement timeout and 3-second parent watchdog. Workers are terminated after every run. No production connection is made. Local results do not establish trusted correctness; assessed conceptual questions use server evaluation.

Reference: https://www.postgresql.org/docs/current/tutorial.html and https://www.postgresql.org/docs/current/transaction-iso.html
