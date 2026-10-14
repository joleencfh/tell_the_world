# Landing page design docs

The landing page (`/`) went through several design rounds. Files are grouped
by how much to trust them.

| Folder | What is in it | Trust |
| --- | --- | --- |
| [`current/`](current/) | Design decisions, design system (md + html), theme CSS, copy doc and its mapping file, AI-tells findings, `final-design.html` | Source of truth |
| [`plans/`](plans/) | Build plans and audits: `temp-landing-page-plan`, `conference-landing-page-plan`, `impeccable-redesign-plan`, `impeccable-audit` | Mostly executed; the audit describes the pre-redesign page |
| [`explorations/`](explorations/) | Direction mocks, direction mixes and circle options still under consideration | Live options |
| [`explorations/archive/`](explorations/archive/) | Early demo and layout concepts (Sept 2026), already ported into the page | History |
| [`evidence/`](evidence/) | `baseline/` detector output and before/after screenshots, `current-screenshots/`, `copy-archive/` (original copy) | Reference only |

`current/landing-theme.css` is a copy of `app/landing-theme.css`; the app file
is the one that ships.

## Adding files

- A decision, spec or rendered final design goes in `current/`.
- A plan or audit goes in `plans/`.
- A new mock or option goes in `explorations/`; move it to `explorations/archive/` once superseded.
- Screenshots, detector output and copy snapshots go in `evidence/`.
