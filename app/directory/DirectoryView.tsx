'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import UserCard from './UserCard'
import QuoteCard from './QuoteCard'
import Pagination from '@/components/ui/Pagination'
import Logo from '@/components/ui/Logo'
import SignOutButton from '@/components/ui/SignOutButton'
import { DIRECTORY_PAGE_SIZE } from '@/lib/directory/queries'
import type { UserResult, QuoteResult, SearchParams } from '@/lib/directory/queries'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface Props {
  users: UserResult[]
  usersCount: number
  quotes: QuoteResult[]
  quotesCount: number
  searchParams: SearchParams
  currentUserId: string
}

// ---------------------------------------------------------------------------
// URL builder — constructed from server props, no useSearchParams needed
// ---------------------------------------------------------------------------

function buildUrl(base: SearchParams, update: Partial<SearchParams>): string {
  const merged: SearchParams = { ...base, ...update }
  const p = new URLSearchParams()
  if (merged.q)            p.set('q', merged.q)
  if (merged.role)         p.set('role', merged.role)
  if (merged.language)     p.set('language', merged.language)
  if (merged.topic)        p.set('topic', merged.topic)
  if (merged.availability) p.set('availability', merged.availability)
  if (merged.upage)        p.set('upage', merged.upage)
  if (merged.qpage)        p.set('qpage', merged.qpage)
  const qs = p.toString()
  return qs ? `/directory?${qs}` : '/directory'
}

// Any filter change resets both lists back to page 1.
const RESET_PAGES = { upage: undefined, qpage: undefined }

// ---------------------------------------------------------------------------
// Inline SVGs
// ---------------------------------------------------------------------------

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5 text-ink-soft/50" aria-hidden>
      <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" />
      <path d="m14 14 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function ChevronDown() {
  return (
    <svg viewBox="0 0 12 8" fill="none" className="w-2.5 h-2 pointer-events-none" aria-hidden>
      <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Section header — numbered rule (matches BriefView's SectionHeader shape).
// tone="blue" for the Quotes band (expert/verification-flavored content per
// two-ink-bold-plan.md §1.1); default neutral ink for the People band, which
// mixes every role and has no single accent that fits it.
// ---------------------------------------------------------------------------

function SectionRule({ num, tone = 'ink' }: { num: string; tone?: 'ink' | 'blue' }) {
  const numClass = tone === 'blue' ? 'text-blue' : 'text-ink-soft'
  const ruleClass = tone === 'blue' ? 'bg-blue/20' : 'bg-line'
  return (
    <div className="flex items-center gap-4 mb-4">
      <span className={`font-mono text-sm tracking-[0.2em] font-bold tabular-nums ${numClass}`}>
        {num}
      </span>
      <div className={`h-px flex-1 ${ruleClass}`} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// DirectoryView
// ---------------------------------------------------------------------------

export default function DirectoryView({ users, usersCount, quotes, quotesCount, searchParams, currentUserId }: Props) {
  const router     = useRouter()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Local controlled state for all text inputs — initialised from server props
  const [searchInput,   setSearchInput]   = useState(searchParams.q            ?? '')
  const [topicInput,    setTopicInput]     = useState(searchParams.topic        ?? '')
  const [languageInput, setLanguageInput]  = useState(searchParams.language     ?? '')

  const hasActiveFilters = !!(
    searchParams.q ||
    searchParams.role ||
    searchParams.language ||
    searchParams.topic ||
    searchParams.availability
  )

  // ── handlers ──────────────────────────────────────────────────────────────

  function handleSearch(value: string) {
    setSearchInput(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      router.push(buildUrl(searchParams, { q: value || undefined, ...RESET_PAGES }))
    }, 300)
  }

  function handleSelect(key: 'role' | 'availability', value: string) {
    // Cancel any pending search debounce and fold current input value into URL
    if (debounceRef.current) clearTimeout(debounceRef.current)
    router.push(
      buildUrl(
        { ...searchParams, q: searchInput || undefined },
        { [key]: value || undefined, ...RESET_PAGES },
      ),
    )
  }

  function commitTopic(value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    router.push(
      buildUrl(
        { ...searchParams, q: searchInput || undefined },
        { topic: value || undefined, ...RESET_PAGES },
      ),
    )
  }

  function commitLanguage(value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    router.push(
      buildUrl(
        { ...searchParams, q: searchInput || undefined },
        { language: value || undefined, ...RESET_PAGES },
      ),
    )
  }

  function clearAll() {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setSearchInput('')
    setTopicInput('')
    setLanguageInput('')
    router.push('/directory')
  }

  // ── derived labels ─────────────────────────────────────────────────────────

  const qLabel = searchParams.q ? `"${searchParams.q}"` : null

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-paper text-ink">

      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 bg-paper/95 backdrop-blur-sm border-b-2 border-ink px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between py-4">
          <Logo href="/home" />
          <nav className="flex items-center gap-6">
            <Link
              href="/directory"
              className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink border-b border-ink/30 pb-0.5 hidden sm:block"
            >
              Directory
            </Link>
            <Link
              href="/briefs"
              className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-soft hover:text-ink transition-colors hidden sm:block"
            >
              Briefs
            </Link>
            <Link
              href={`/profile/${currentUserId}`}
              className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-soft hover:text-ink transition-colors"
            >
              Profile
            </Link>
            <SignOutButton className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-soft hover:text-ink transition-colors" />
          </nav>
        </div>
      </header>

      <main>

        {/* ── Hero: search + filters ───────────────────────────────── */}
        <div className="grid-texture relative overflow-hidden px-6 pt-14 pb-16">
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-b from-transparent to-paper pointer-events-none" />

          <div className="mx-auto max-w-4xl relative">

            {/* Label */}
            <p
              className="font-mono text-[10px] tracking-[0.3em] uppercase text-ink-soft mb-5 anim-rise"
              style={{ animationDelay: '0ms' }}
            >
              Directory
            </p>

            {/* Heading */}
            <h1
              className="font-display uppercase text-ink mb-3 anim-rise"
              style={{
                fontSize: 'clamp(2.5rem, 7vw, 5rem)',
                lineHeight: '0.93',
                animationDelay: '80ms',
              }}
            >
              Find voices.
              <br />
              Find experts.
            </h1>

            {/* Standfirst */}
            <p
              className="font-body text-ink-soft text-sm leading-relaxed mb-10 max-w-xl anim-rise"
              style={{ animationDelay: '160ms' }}
            >
              Search quotes by topic, or find the right expert, journalist, creator, or organisation.
            </p>

            {/* Search bar */}
            <div
              className="relative anim-rise"
              style={{ animationDelay: '240ms' }}
            >
              <div className="absolute left-5 top-1/2 -translate-y-1/2">
                <SearchIcon />
              </div>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search quotes, topics, expertise…"
                className="w-full bg-paper-raised border-2 border-line rounded-2xl pl-14 pr-12 py-4 font-body text-base text-ink placeholder:text-ink-soft/35 focus:outline-none focus:ring-2 focus:ring-blue/30 focus:border-blue/40 transition shadow-sm"
              />
              {searchInput && (
                <button
                  onClick={() => handleSearch('')}
                  aria-label="Clear search"
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full bg-line/70 hover:bg-line text-ink-soft hover:text-ink transition-all text-base leading-none"
                >
                  ×
                </button>
              )}
            </div>

            {/* Filter row */}
            <div
              className="flex flex-wrap items-center gap-2 mt-4 anim-rise"
              style={{ animationDelay: '300ms' }}
            >
              {/* Role */}
              <div className="relative">
                <select
                  value={searchParams.role ?? ''}
                  onChange={(e) => handleSelect('role', e.target.value)}
                  className={`appearance-none bg-paper-raised border rounded-full pl-3 pr-7 py-1.5 font-mono text-[10px] tracking-[0.1em] uppercase focus:outline-none focus:ring-1 focus:ring-blue/40 transition cursor-pointer ${
                    searchParams.role
                      ? 'border-blue/50 text-blue-ink'
                      : 'border-line text-ink-soft hover:text-ink hover:border-ink/25'
                  }`}
                >
                  <option value="">All roles</option>
                  <option value="creator">Creator</option>
                  <option value="expert">Expert</option>
                  <option value="organisation">Organisation</option>
                  <option value="journalist">Journalist</option>
                </select>
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-soft/50">
                  <ChevronDown />
                </span>
              </div>

              {/* Availability */}
              <div className="relative">
                <select
                  value={searchParams.availability ?? ''}
                  onChange={(e) => handleSelect('availability', e.target.value)}
                  className={`appearance-none bg-paper-raised border rounded-full pl-3 pr-7 py-1.5 font-mono text-[10px] tracking-[0.1em] uppercase focus:outline-none focus:ring-1 focus:ring-blue/40 transition cursor-pointer ${
                    searchParams.availability
                      ? 'border-blue/50 text-blue-ink'
                      : 'border-line text-ink-soft hover:text-ink hover:border-ink/25'
                  }`}
                >
                  <option value="">Any availability</option>
                  <option value="open">Open</option>
                  <option value="limited">Limited</option>
                  <option value="unavailable">Unavailable</option>
                </select>
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-soft/50">
                  <ChevronDown />
                </span>
              </div>

              {/* Topic area */}
              <input
                type="text"
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                onBlur={(e) => commitTopic(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitTopic((e.target as HTMLInputElement).value)
                }}
                placeholder="Topic area"
                className={`bg-paper-raised border rounded-full px-3 py-1.5 font-mono text-[10px] tracking-[0.1em] uppercase placeholder:text-ink-soft/40 focus:outline-none focus:ring-1 focus:ring-blue/40 transition w-28 ${
                  searchParams.topic
                    ? 'border-blue/50 text-blue-ink'
                    : 'border-line text-ink-soft hover:border-ink/25'
                }`}
              />

              {/* Language */}
              <input
                type="text"
                value={languageInput}
                onChange={(e) => setLanguageInput(e.target.value)}
                onBlur={(e) => commitLanguage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitLanguage((e.target as HTMLInputElement).value)
                }}
                placeholder="Language"
                className={`bg-paper-raised border rounded-full px-3 py-1.5 font-mono text-[10px] tracking-[0.1em] uppercase placeholder:text-ink-soft/40 focus:outline-none focus:ring-1 focus:ring-blue/40 transition w-24 ${
                  searchParams.language
                    ? 'border-blue/50 text-blue-ink'
                    : 'border-line text-ink-soft hover:border-ink/25'
                }`}
              />

              {/* Clear all */}
              {hasActiveFilters && (
                <button
                  onClick={clearAll}
                  className="font-mono text-[10px] tracking-[0.15em] uppercase text-ink-soft/60 hover:text-ink transition-colors ml-1"
                >
                  × Clear all
                </button>
              )}
            </div>

          </div>
        </div>

        {/* ── Quotes band — fixed dark band regardless of theme, same */}
        {/* Part 0 pattern as the Brief page's Covered By section ────── */}
        <div className="bg-coverage-bg px-6 py-16">
          <div className="mx-auto max-w-5xl">

            {/* Section header */}
            <div className="mb-10 anim-rise" style={{ animationDelay: '0ms' }}>
              <SectionRule num="01" tone="blue" />
              <h2 className="font-body text-xl sm:text-2xl text-coverage-fg/90 leading-snug font-normal">
                {qLabel ? <>Quotes matching {qLabel}</> : 'What the community says'}
              </h2>
              <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-coverage-fg/30 mt-3">
                {quotesCount} {quotesCount === 1 ? 'quote' : 'quotes'}
              </p>
            </div>

            {/* Results */}
            {quotes.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {quotes.map((q, i) => (
                  <div
                    key={q.id}
                    className="anim-rise"
                    style={{ animationDelay: `${Math.min(i * 60, 480)}ms` }}
                  >
                    <QuoteCard quote={q} />
                  </div>
                ))}
              </div>
            ) : (
              /* Empty state */
              <div className="py-16 text-center">
                <p
                  className="font-display uppercase text-coverage-fg/10 leading-none mb-5 select-none"
                  style={{ fontSize: '6rem' }}
                  aria-hidden
                >
                  &ldquo;
                </p>
                <p className="font-body text-coverage-fg/40 text-base italic">
                  {hasActiveFilters
                    ? 'No quotes match these filters.'
                    : 'No quotes have been shared yet.'}
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearAll}
                    className="mt-4 font-mono text-[9px] tracking-[0.15em] uppercase text-blue/70 hover:text-blue transition-colors"
                  >
                    Clear filters →
                  </button>
                )}
              </div>
            )}

            <Pagination
              dark
              page={parseInt(searchParams.qpage ?? '1', 10) || 1}
              pageSize={DIRECTORY_PAGE_SIZE}
              total={quotesCount}
              buildHref={(p) => buildUrl(searchParams, { qpage: String(p) })}
            />

          </div>
        </div>

        {/* ── People band — bg-paper-raised ────────────────────────── */}
        <div className="bg-paper-raised px-6 py-16">
          <div className="mx-auto max-w-5xl">

            {/* Section header */}
            <div className="mb-10 anim-rise" style={{ animationDelay: '0ms' }}>
              <SectionRule num="02" />
              <h2 className="font-body text-xl sm:text-2xl text-ink leading-snug font-normal">
                {qLabel ? <>People matching {qLabel}</> : "Who's here"}
              </h2>
              <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-ink-soft/60 mt-3">
                {usersCount} {usersCount === 1 ? 'member' : 'members'}
                {searchParams.role ? ` · ${searchParams.role}s` : ''}
              </p>
            </div>

            {/* Results */}
            {users.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {users.map((u, i) => (
                  <div
                    key={u.id}
                    className="anim-rise"
                    style={{ animationDelay: `${Math.min(i * 40, 480)}ms` }}
                  >
                    <UserCard user={u} />
                  </div>
                ))}
              </div>
            ) : (
              /* Empty state */
              <div className="py-16 text-center">
                <p
                  className="font-display uppercase text-ink/10 leading-none mb-5 select-none"
                  style={{ fontSize: '5rem' }}
                  aria-hidden
                >
                  —
                </p>
                <p className="font-body text-ink-soft/60 text-base italic">
                  {hasActiveFilters
                    ? 'No members match these filters.'
                    : 'No members found.'}
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearAll}
                    className="mt-4 font-mono text-[9px] tracking-[0.15em] uppercase text-ink-soft hover:text-ink transition-colors"
                  >
                    Clear filters →
                  </button>
                )}
              </div>
            )}

            <Pagination
              page={parseInt(searchParams.upage ?? '1', 10) || 1}
              pageSize={DIRECTORY_PAGE_SIZE}
              total={usersCount}
              buildHref={(p) => buildUrl(searchParams, { upage: String(p) })}
            />

          </div>
        </div>

      </main>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="border-t border-line px-6 py-6">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <span className="font-body text-sm font-bold text-ink-soft/60 tracking-tight">
            Tell <em className="italic">The</em> World
          </span>
          <Link
            href="/home"
            className="font-mono text-[9px] tracking-[0.15em] uppercase text-ink-soft/60 hover:text-ink-soft transition-colors"
          >
            ← Back to home
          </Link>
        </div>
      </footer>

    </div>
  )
}
