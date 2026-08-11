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

## Adding a new design doc

1. Create a folder per feature: `docs/design/<feature-name>/`.
2. Add the spec (and any wireframes/mockups) into it.
3. Add a row to the table above with a status: `Designed, not implemented` /
   `In progress` / `Implemented — see docs/architecture/<date>.md`.
4. Once a feature ships, update its status rather than deleting the folder —
   the design rationale stays useful after the build.
