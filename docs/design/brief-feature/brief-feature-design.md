# Brief feature — design document

**Tell The World · v1 · July 2026**
Addendum to the Project Brief. Covers the Brief page structure, the expert contribution system (reviews, endorsements, takes, notes), the versioning and staleness model, and the interaction rules for the two new UI surfaces (review-pass screen and contested-point cards).

---

## 1. Design principles

These are the decisions everything below follows from. If an implementation choice contradicts one of these, the implementation is wrong.

1. **Single-author briefs, layered expert contributions.** Each brief has one author (the admin, or a future hire). Experts and orgs contribute *reactions* — reviews, endorsements, positioned takes, corrections — never direct edits. Their contributions remain legible and attributed.
2. **The endorsement layer is the credibility engine.** "Reviewed by N experts" answers the creator's real question: "can I say this on camera without embarrassing myself?" Everything about the contribution system is designed to maximise honest expert participation and protect the meaning of the counts.
3. **Two reading modes, served explicitly.** The top of the page is a complete experience for the skimmer (3 minutes, leaves with a quote and an angle). Everything below is progressive disclosure for the researcher. Inverted pyramid.
4. **The headline number never overstates.** Trust signals shown to readers count only claims that are current against the text as it stands today.
5. **Authored vs. query-driven sections.** Quotes and media are filtered views of `content_posts`, not hand-curated brief content. Two full sections of every brief cost zero marginal authoring effort.
6. **Silence is not a signal.** An expert who didn't review a section has claimed nothing about it — not approval, not disapproval. No UI or query may ever interpret absence as a judgement.

---

## 2. Brief page structure

Single scrollable page, sticky table of contents, sections in this order:

| # | Section | Source | Maintenance |
|---|---------|--------|-------------|
| 1 | Header: title, subtitle, endorsement bar, read time | Authored | On edit |
| 2 | TLDR (3–5 quotable sentences) | Authored | Rare |
| 3 | "Use this": story angles, misconceptions to avoid, pinned top quotes | Authored | Rare |
| 4 | Featured news (2–4 dated items + why-it-matters) | Authored | ~30 min/month |
| 5 | Explainer (subsections, each with annotation layer) | Authored | Rare, versioned |
| 6 | Where experts stand (agreement summary + contested points with takes) | Authored frame, expert takes | Grows organically |
| 7 | Quotes | Auto: `content_posts` where `post_type = 'quote'` and topic tag matches | Zero |
| 8 | Media (with one author-pinned "start here" item) | Auto: `content_posts` by tag | Zero + pin |
| 9 | Going deeper (3–5 annotated pointers) | Authored | Rare |
| 10 | FAQ (partially harvested from Q&A below) | Authored, expert-reviewable | Occasional |
| 11 | Community Q&A | Existing feature | Existing |

Notes:
- The endorsement bar reads e.g. **"Reviewed by 5 experts from 3 organisations · Last reviewed 14 July 2026 · 12 min read."**
- `last_reviewed_at` (author confirms currency without editing) is displayed separately from `updated_at`. A brief whose newest featured-news item is months old reads as abandoned; the cheap fix is the author refreshing the review date after checking it.
- Auto sections need a graceful near-empty state. Part of authoring a new brief is soliciting 5–8 quotes from friendly experts on that topic (manual loop in v1, by design).
- Tag hygiene: one controlled topic tag per brief, shown as a suggestion when users create posts. Free-form tags will not keep the auto sections populated.

---

## 3. Schema

### 3.1 Amendments to existing tables

```
briefs (add)
├── subtitle (string)
└── last_reviewed_at (timestamp, nullable)

brief_sections (amend)
├── content_version (integer, default 1)
└── section_type (enum, extended): 'tldr', 'use_this', 'featured_news',
    'explainer', 'where_experts_stand', 'going_deeper', 'faq'
    (replaces the previous four-value enum; 'sources_basic' and
    'sources_advanced' fold into 'going_deeper'; quotes and media
    are query-driven and have no section rows)
```

**`content_version` is an author-controlled integer, not a timestamp.** The edit screen has a "substantive change" toggle. Only substantive edits increment the version. Typo and formatting fixes save without bumping it, so they never invalidate reviews. This is the single control point for the entire staleness system.

### 3.2 New table: `contested_points`

The disputed questions inside "Where experts stand". The agreement summary is an ordinary `brief_section` (type `where_experts_stand`); this table holds only the questions that takes attach to.

```
contested_points
├── id (uuid, primary key)
├── brief_id (uuid, foreign key → briefs.id)
├── question (string)
├── display_order (integer)
└── created_at (timestamp)
```

- Created by the author only. Experts write takes *on* points; they do not create points.
- Each point is a solicitation unit: "Would you write 100 words on question 2?"

### 3.3 New table: `brief_contributions`

One polymorphic table for all four contribution types.

```
brief_contributions
├── id (uuid, primary key)
├── brief_id (uuid, foreign key → briefs.id — always set)
├── section_id (uuid, foreign key → brief_sections.id, nullable)
├── contested_point_id (uuid, foreign key → contested_points.id, nullable)
├── user_id (uuid, foreign key → users.id)
├── type (enum: 'review', 'endorsement', 'take', 'comment')
├── body (text, nullable)
├── section_version (integer, nullable — pinned at contribution time)
├── status (enum: 'pending', 'published', 'archived')
├── created_at (timestamp)
└── updated_at (timestamp)
```

**Shape rules per type** (enforced in app code; the DB stays simple):

| type | attaches to | body | section_version |
|------|-------------|------|-----------------|
| `review` | one section, or brief-level (both FKs null) | null | pinned |
| `endorsement` | same as review | null | pinned |
| `take` | contested_point (required) | required | null |
| `comment` | section (required) | required | pinned |

**Integrity rules:**

1. **One review/endorsement row per (user, target).** Partial unique index on `(user_id, section_id)` where type in ('review','endorsement') and section_id is not null; a second partial unique index on `(user_id, brief_id)` for brief-level rows (section_id null). Endorsement is an *upgrade* of review: the same row's `type` changes; no second row is ever created.
2. **Pinning at write time.** Section-level rows pin the section's `content_version` at the moment of contribution. Brief-level rows pin the *maximum* `content_version` across all sections of the brief at that moment.
3. **Reconfirmation is an update, not an insert.** The one-click "still looks right" action sets `section_version` to the current version and bumps `updated_at`. Nothing is duplicated, nothing is deleted.
4. **Comments pin too**, so a correction can be archived once the text it criticised has been revised (the author archives it manually in v1 — no automation).

### 3.4 Deliberately excluded from v1

- **Full version history** (`brief_section_versions` storing old text). The counter says a review is stale; it cannot show *what* was endorsed. If experts ask "what did I actually endorse?", that table is a pure addition — no migration pain. Not before then.
- **Claim-level or paragraph-level granularity.** Section-level + brief-level covers the value at a fraction of the complexity.
- **A stored `is_stale` flag** — see §4.
- **An "outside my expertise" recorded state** — see §6.2.
- **Automated comment resolution/archiving.**

---

## 4. Versioning and staleness semantics

**Staleness is computed at render time, never stored.**

```
stale ⇔ contribution.section_version < section.content_version
```

For brief-level rows: `contribution.section_version < max(content_version) across the brief's sections`.

Why computed: a stored flag is derived data that must be kept in sync by code that runs on every edit — including edits made directly in the Supabase dashboard, which is an explicit part of the v1 admin workflow. Derived data drifts; a render-time comparison of two honestly-stored facts cannot. There are no sync jobs, no triggers, and nothing that can silently disagree with the database.

Consequences to be aware of:

- **Substantive edits temporarily deflate the endorsement bar.** This is correct behaviour, not a bug: the number breathes — it dips on edit and recovers as experts reconfirm. The right editorial response is to batch substantive edits and then run one reconfirmation round, rather than churning text continuously.
- **The "substantive change" toggle is the pressure valve.** Typo fixes must never cost endorsements. If reviewers ever complain their reviews were invalidated by trivial edits, the toggle was misused, not the model.

---

## 5. Contribution semantics

### 5.1 Review vs. endorsement — two intensities, one relationship

- **Review** = "I checked it; it's not wrong." Low-cost, high-volume. The default ask.
- **Endorsement** = "I stake my name on this framing." Opt-in upgrade, always the expert's initiative.

Never solicit endorsements directly; solicit reviews and let endorsement be volunteered. This distinction exists because good briefs have a point of view, and binary endorsement suppresses participation on exactly those briefs.

### 5.2 Blank = no claim (the "pass" rule)

In the review-pass (and everywhere else), an unticked section means **nothing was claimed**. No row is created. It is not approval, not disapproval, not "flagged". Passing is the default state of the universe: every expert has implicitly passed on every section they've never reviewed.

- Blank must never be rendered, counted, or interpreted as "it doesn't look right".
- Active disagreement is not a checklist state — it's a **comment** (leave the tick blank, write the correction in the note field).
- No third "outside my expertise" option: it has zero reader-facing value and adds per-row friction. Silence already encodes it.

### 5.3 The four channels and their jobs

| Channel | Job | Anti-job |
|---------|-----|----------|
| Review / endorsement | Trust signal | Not a comment thread |
| Comment (note) | Factual corrections, precision fixes | Not positioned disagreement |
| Take | Positioned disagreement, in the expert's own voice, on a contested point | Not margin nitpicking |
| Q&A | Reader questions; feeder for the FAQ | Not judged by engagement volume |

Routing disagreement to takes (not inline comments) is deliberate: scattered margin-bickering makes a section look contested even when it isn't, while a named 100-word take is higher-status for the expert and *is the story* for a journalist. **Takes are the flagship contribution channel to actively solicit; comments are the minor corrections channel.**

### 5.4 Moderation

- `review` / `endorsement`: publish immediately (binary signals, nothing to moderate).
- `comment` / `take`: default `pending`; admin publishes from the admin screen (prose carries risk; at v1 scale moderation is cheap).
- `archived`: for comments whose correction has been addressed, and for any contribution withdrawn by its author.

---

## 6. Interaction rules — annotation layer

### 6.1 Three states per explainer/FAQ section

**Collapsed (default, all readers).** A quiet chip strip under the section text: `✓ 4 reviewed · ★ 2 endorsed · 💬 1 note`. The counts are themselves the skimmer's trust signal — absorbed in half a second, no interaction needed. Not a margin, not a hover: margins get ignored and hovers don't exist on mobile.

**Expanded (reader clicks the chips).** Inline panel, two zones:
1. *People*: avatar, name, affiliation, badge (Reviewed / Endorsed), per-person version status ("reviewed v3 · current is v4") when stale.
2. *Notes*: published comments (corrections only).
Plus an "Add a note" button, visible to experts and orgs only.

**Stale (after a substantive edit).** The chip strip gains one amber chip: "3 reviews predate latest edit". Amber, never red — a stale review is a pending question, not an error. Current and stale counts are shown side by side.

Alternative takes never appear in this layer. They live only in "Where experts stand".

### 6.2 Staleness display rules

1. The **endorsement bar** (top of brief) counts only current, published contributions. Stale rows drop out of the headline number without any announcement — the rows themselves are untouched and return to the count when reconfirmed.
2. No banner, no warning at the top of the brief. A skimmer sees a smaller, accurate number; the who-is-current detail lives in the expanded panel.
3. Per-person staleness appears only in the expanded panel.

### 6.3 "Where experts stand" rendering

- Section header area: the authored agreement summary (an ordinary brief_section).
- Each contested point is a card: question as title, takes stacked below in **chronological order with equal visual weight** — no ordering by seniority, no "official" take. The moment one take looks privileged, minority-position experts stop contributing and the section's honesty degrades.
- "Write a take" button per card, visible to experts and orgs only.

---

## 7. Interaction rules — review-pass flow

The single most important flow for participation. An expert must never hunt through sections clicking things.

1. Expert opens the brief (typically from a solicitation email) → one button: **"Review this brief"**.
2. Single-screen checklist: every reviewable section (explainer subsections, FAQ, TLDR) as a row — section title + first line, a "Looks right" checkbox, an "Endorse" toggle (enabled only if "Looks right" is ticked), and an optional note field.
3. Top of the screen, verbatim or close: *"Only confirm sections within your expertise — skipped sections simply won't list you as a reviewer."* This sentence gives permission to skip (raising completion rates) and protects what "reviewed by N" means (every reviewer actively chose to vouch).
4. One submit writes all rows at once: ticked rows → review/endorsement rows with pinned versions; note fields → comment rows (status `pending`); blank rows → nothing.
5. Optional final row: "Confirm the brief as a whole" → one brief-level row pinning the max version.

Target cost to the expert: one read of the brief + five minutes of ticking.

### 7.1 Reconfirmation flow

- Trigger: weekly digest email (Resend), never instant per-edit emails. Subject shape: "3 sections you reviewed in *The AI Race* were updated."
- Body: one-line summary of what changed per section (author writes this line as part of the substantive edit — treat it as a commit message for the section).
- Primary action: single **"Still looks right"** button → magic link → all of that expert's stale rows on that brief re-pin to current versions. One click total.
- Secondary link (present, not prominent): review the changes section-by-section / withdraw a review (sets status `archived`).

---

## 8. Endorsement bar computation

One query at page render (cheap at v1 scale, no caching needed):

- Count distinct users with a `published` review or endorsement on this brief (any section, or brief-level) **whose pinned version is current** per §4.
- Split by type for display: "Endorsed by 2 · Reviewed by 4" (endorsers are not double-counted as reviewers).
- Org affiliation count derives from `user_affiliations` of the counted users.

---

## 9. Mobile

Nothing structural changes. Chips wrap to two lines; the expanded panel is the same inline accordion (never a bottom sheet or modal — inline expansion keeps the reader's place in a 12-minute read); the review-pass checklist becomes a full-screen scroll; contested-point cards stack.

---

## 10. Build order (suggested)

1. Schema migration: amendments + two new tables + partial unique indexes.
2. Brief page restructure to the §2 section order (auto sections wired to `content_posts`).
3. Annotation layer: collapsed chips → expanded panel → stale state.
4. Review-pass screen (new surface #1).
5. "Where experts stand" with contested-point cards (new surface #2).
6. Reconfirmation email + one-click re-pin.
7. Admin: moderation of pending comments/takes; "substantive change" toggle + change-summary line in the edit-brief screen.

Steps 1–3 make the page trustworthy; 4–5 make it participatory; 6–7 make it maintainable.

---

## 11. Decisions (closed 17 Jul 2026)

- **Review-pass labels: "Looks right" / "Endorse".** "Looks right" is deliberately informal — it invites the low-commitment claim ("I checked it; it's not wrong") without implying a formal accuracy audit, which maximises participation. "Endorse" stays formal because it *is* the formal claim. Do not "upgrade" the casual label to something like "Verified" or "Accurate" during implementation: the informality is the design.
- **Both experts and organisations can review/endorse**, contributing under their own role; the role badge is always shown alongside the name in panels and counts.
- **The "Use this" block is visible to logged-out visitors** on public briefs — it is the strongest conversion argument for applying.
- **Read time is calculated on authored section text only** (TLDR, use-this, featured news, explainer, going deeper, FAQ); annotations, takes, quotes, and Q&A are excluded.
- **Layout variants (from wireframes):** Brief page uses Variant A (single column + sticky TOC) with the persistent "Review this brief" button in the rail; review-pass is the full-page checklist; contested points render as stacked chronological takes. On mobile, the review CTA becomes a sticky bottom bar shown to experts and orgs only.
