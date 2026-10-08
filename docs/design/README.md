# Design documentation

Forward-looking feature specs and wireframes — the opposite of
[`docs/architecture/`](../architecture/README.md), which is dated snapshots
of what's *already built*. Files here describe intended design; they carry
no guarantee that any of it has been implemented yet. Check the status line
in each feature's folder before assuming a spec is live.

## Features

| Feature | Status | Docs |
| --- | --- | --- |
| Brief page — expert contributions (reviews, endorsements, takes, comments) | In progress — see [`brief-feature/build-plan.md`](brief-feature/build-plan.md) | [`brief-feature/`](brief-feature/) |
| Profile page — rework | Draft, not started | [`profile/`](profile/) |
| Architecture cleanup — migration renumbering, dead `/briefs` route, `/home` composition consistency, lint decomposition debt | Not started — see [`architecture-cleanup/build-plan.md`](architecture-cleanup/build-plan.md) | [`architecture-cleanup/`](architecture-cleanup/) |
| Landing page — silent launch, redesign and AI-tells cleanup | Shipped; cleanup in progress. Start at [`landing-page/README.md`](landing-page/README.md) | [`landing-page/`](landing-page/) || Design system — sitewide rules, tokens and migration steps | Docs written; migration status tracked in the files themselves | [`design-system/`](design-system/) || Home dashboard — Two-Ink Bold rebuild | Partly built; see the plan for per-part status | [`home-dashboard/`](home-dashboard/) |
| Design system — sitewide rules, tokens and migration steps | Docs written; migration status tracked in the files themselves | [`design-system/`](design-system/) |
| Home dashboard — Two-Ink Bold rebuild | Partly built; see the plan for per-part status | [`home-dashboard/`](home-dashboard/) |

## Adding a new design doc

1. Create a folder per feature: `docs/design/<feature-name>/`.
2. Add the spec (and any wireframes/mockups) into it.
3. Add a row to the table above with a status: `Designed, not implemented` /
   `In progress` / `Implemented — see docs/architecture/<date>.md`.
4. Once a feature ships, update its status rather than deleting the folder —
   the design rationale stays useful after the build.
