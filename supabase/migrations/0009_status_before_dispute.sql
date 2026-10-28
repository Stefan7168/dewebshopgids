-- 0009: remember a shop's status when a dispute sets it to `disputed`, so code can restore
-- exactly that status once every dispute is answered (a prenotified shop must not become
-- published early). Set by the dispute form; read by the pipeline restore job.
-- Additive only. Not granted to anon or any agent role.

alter table public.shops
  add column status_before_dispute text
    check (status_before_dispute in ('published', 'prenotified'));
