# Architecture documentation

Dated snapshots of Tell The World's codebase architecture, so progress and
structural changes are visible over time. Each file is a point-in-time
snapshot — it describes the codebase as it stood on that date, not a living
document that's silently kept in sync.

## Versions

| Date | Summary |
| --- | --- |
| [2026-08-10](2026-08-10.md) | First snapshot, written after the Option B refactor roadmap (pagination, generated Supabase types, `lib/data/` layer, shared `Avatar`/`RoleBadge`/`Pagination` UI, the 4 max-lines file splits) landed on `master`. |

## Adding a new snapshot

When the architecture changes meaningfully (new screens, a new data layer,
a schema change, a refactor that moves things around):

1. Copy the most recent file to a new one named `YYYY-MM-DD.md` (today's date).
2. Update it to match reality — don't assume the old diagrams still hold,
   re-derive them from the code.
3. Add a row to the table above summarizing what changed since the last
   snapshot.
4. Leave old snapshots alone — they're history, not drafts.

For the always-current basics (setup, env vars, conventions, PR process),
see [`CONTRIBUTING.md`](../../CONTRIBUTING.md) at the repo root — that file
*is* kept live and isn't duplicated here.
