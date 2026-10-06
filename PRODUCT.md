# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two co-primary audiences:

- **Creators and journalists**: people with audiences who want to explain AI's catastrophic and existential risks accurately, and need credible material to draw on.
- **AI safety experts and organisations**: researchers and groups who want their work and findings communicated credibly and at scale.

Secondary roles supported in scaffolding: comms specialists and "other".

## Product Purpose

Tell The World informs the general public worldwide about AI's catastrophic and existential risks, by helping the AI safety community reach creators and journalists who tell their audiences what is really at stake. Success is credible AI-risk communication reaching audiences through the people they already trust.

## Positioning

A vetted, invite-only network (only approved members can sign in) combined with briefs designed for creators to repackage into their own content. A neighboring product could not truthfully copy both the verified-source membership and the brief format built for reuse.

## Operating Context

Members apply, are approved by an admin, and sign in by Google, LinkedIn, or magic link (no passwords). Experts and organisations publish briefs, quotes, and media; creators and journalists browse briefs (with sourced Q&A and contributions), search a member directory, and contact experts. Admins moderate applications, questions, contributions, and brief proposals. Briefs can be public or members-only.

## Capabilities and Constraints

- Briefs with TL;DR, sections, sources, Q&A, and contributions with author badges.
- Member directory and search, profiles, quotes and media posts, contact requests, brief proposals.
- Deterministic clarity check gates expert/organisation submissions on jargon.
- Email only (Supabase + Resend); no notifications table. Multilingual is deferred (v2).
- Stack: Next.js 16, React 19, Tailwind CSS 4, Supabase, Bun.

## Brand Commitments

- Voice: no em dashes in user-facing copy.
- Existing visual identity is the "Two-Ink Bold" redesign; record it as incumbent, not to be redefined here.

## Evidence on Hand

Real content is limited. Existing members, quotes, media, and briefs from `scripts/seed-mock-data.ts` are mock data, not proof. Future work must not fabricate testimonials, member counts, endorsements, or press.

## Product Principles

1. Credibility over reach: every claim traces to a verified member or a cited source.
2. Make expert work reusable: briefs are built to be repackaged by creators.
3. Both sides get value: serve the source and the storyteller equally.
4. Plain language for the public: jargon is a defect, not a badge.
5. Gate access deliberately: membership is approved, not open.

## Accessibility & Inclusion

No product-specific standard established. Public-facing pages should be readable by a general audience.
