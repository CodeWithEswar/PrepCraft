-- Canonical relationship correction. Workspace progress and content payloads are untouched.
delete from public.learning_concept_relations
where relation_type='related' and from_version=1 and to_version=1
 and (from_id,to_id) in (
 ('learn-sql-dbms-transactions-core','learn-operating-systems-cpu-scheduling-core'),
 ('learn-operating-systems-cpu-scheduling-core','learn-sql-dbms-transactions-core'));
insert into public.learning_concept_relations(from_id,from_version,to_id,to_version,relation_type) values
 ('learn-sql-dbms-transactions-core',1,'learn-operating-systems-synchronization-core',1,'related'),
 ('learn-operating-systems-synchronization-core',1,'learn-sql-dbms-transactions-core',1,'related');
