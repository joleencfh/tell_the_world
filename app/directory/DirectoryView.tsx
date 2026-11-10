'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import UserCard from './UserCard'
import QuoteCard from './QuoteCard'
import Pagination from '@/components/ui/Pagination'
import Footer from '@/components/ui/Footer'
import AppHeader, { type AppHeaderUser } from '@/components/ui/AppHeader'
import Button from '@/components/ui/Button'
import ChoiceChips, { type ChoiceOption } from '@/components/ui/ChoiceChips'
import EmptyState from '@/components/ui/EmptyState'
import Field, { TextInput } from '@/components/ui/Field'
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
  currentUser: AppHeaderUser | null
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

// Filter options. An empty value means "no filter", as the old selects did.
const ROLE_OPTIONS: ChoiceOption<string>[] = [
  { value: '', label: 'All roles' },
  { value: 'creator', label: 'Creator', tone: 'rose' },
  { value: 'expert', label: 'Expert', tone: 'cobalt' },
  { value: 'organisation', label: 'Organisation', tone: 'cobalt' },
  { value: 'journalist', label: 'Journalist', tone: 'rose' },
  { value: 'comms_specialist', label: 'Communications Specialist' },
  { value: 'other', label: 'Other' },
]

const AVAILABILITY_OPTIONS: ChoiceOption<string>[] = [
  { value: '', label: 'Any availability' },
  { value: 'open', label: 'Open' },
  { value: 'limited', label: 'Limited' },
  { value: 'unavailable', label: 'Unavailable' },
]

// ---------------------------------------------------------------------------
// DirectoryView
// ---------------------------------------------------------------------------

export default function DirectoryView({ users, usersCount, quotes, quotesCount, searchParams, currentUser }: Props) {
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
    <div className="min-h-screen bg-parchment font-ui text-umber">

      <AppHeader user={currentUser} current="directory" />

      <main className="px-4 pb-4 md:px-gutter">

        {/* ── Header: search + filters ─────────────────────────────── */}
        <div className="mx-auto max-w-content pb-12 pt-10 md:pt-14">

          <p
            className="anim-rise mb-4 font-mono text-label uppercase text-umber-soft"
            style={{ animationDelay: '0ms' }}
          >
            Directory
          </p>

          <h1
            className="anim-rise mb-3 font-serif text-title text-umber"
            style={{ animationDelay: '80ms' }}
          >
            Find voices.
            <br />
            Find experts.
          </h1>

          <p
            className="anim-rise mb-8 max-w-reading font-serif text-lead text-umber-soft"
            style={{ animationDelay: '160ms' }}
          >
            Search quotes by topic, or find the right expert, journalist, creator, or organisation.
          </p>

          <div className="anim-rise flex flex-col gap-6" style={{ animationDelay: '240ms' }}>

            {/* Search bar */}
            <Field label="Search">
              {(p) => (
                <div className="relative">
                  <TextInput
                    {...p}
                    value={searchInput}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search quotes, topics, expertise…"
                    className={searchInput ? 'pr-12' : undefined}
                  />
                  {searchInput && (
                    <button
                      type="button"
                      onClick={() => handleSearch('')}
                      aria-label="Clear search"
                      className="absolute right-1 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-control text-ui text-umber-soft hover:bg-bone hover:text-umber focus-ring"
                    >
                      ×
                    </button>
                  )}
                </div>
              )}
            </Field>

            {/* Filters */}
            <ChoiceChips
              label="Role"
              options={ROLE_OPTIONS}
              value={searchParams.role ?? ''}
              onChange={(v) => handleSelect('role', v)}
              className="grid-cols-2 sm:grid-cols-4"
            />
            <ChoiceChips
              label="Availability"
              options={AVAILABILITY_OPTIONS}
              value={searchParams.availability ?? ''}
              onChange={(v) => handleSelect('availability', v)}
              className="grid-cols-2 sm:grid-cols-4"
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Topic area">
                {(p) => (
                  <TextInput
                    {...p}
                    value={topicInput}
                    onChange={(e) => setTopicInput(e.target.value)}
                    onBlur={(e) => commitTopic(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitTopic((e.target as HTMLInputElement).value)
                    }}
                    placeholder="Topic area"
                  />
                )}
              </Field>
              <Field label="Language">
                {(p) => (
                  <TextInput
                    {...p}
                    value={languageInput}
                    onChange={(e) => setLanguageInput(e.target.value)}
                    onBlur={(e) => commitLanguage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitLanguage((e.target as HTMLInputElement).value)
                    }}
                    placeholder="Language"
                  />
                )}
              </Field>
            </div>

            {/* Clear all */}
            {hasActiveFilters && (
              <div>
                <Button variant="ghost" small onClick={clearAll}>
                  × Clear all
                </Button>
              </div>
            )}

          </div>
        </div>

        {/* ── Quotes ───────────────────────────────────────────────── */}
        <section className="mx-auto max-w-content border-t border-rule py-12">

          <div className="anim-rise mb-8" style={{ animationDelay: '0ms' }}>
            <h2 className="font-serif text-section text-umber">
              {qLabel ? <>Quotes matching {qLabel}</> : 'What the community says'}
            </h2>
            <p className="mt-2 font-mono text-label uppercase tabular-nums text-umber-soft">
              {quotesCount} {quotesCount === 1 ? 'quote' : 'quotes'}
            </p>
          </div>

          {quotes.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
            <EmptyState
              title={hasActiveFilters ? 'No quotes match these filters.' : 'No quotes have been shared yet.'}
              action={
                hasActiveFilters ? (
                  <Button variant="secondary" small onClick={clearAll}>
                    Clear filters →
                  </Button>
                ) : undefined
              }
            />
          )}

          <Pagination
            page={parseInt(searchParams.qpage ?? '1', 10) || 1}
            pageSize={DIRECTORY_PAGE_SIZE}
            total={quotesCount}
            buildHref={(p) => buildUrl(searchParams, { qpage: String(p) })}
          />

        </section>

        {/* ── People ───────────────────────────────────────────────── */}
        <section className="mx-auto max-w-content border-t border-rule py-12">

          <div className="anim-rise mb-8" style={{ animationDelay: '0ms' }}>
            <h2 className="font-serif text-section text-umber">
              {qLabel ? <>People matching {qLabel}</> : "Who's here"}
            </h2>
            <p className="mt-2 font-mono text-label uppercase tabular-nums text-umber-soft">
              {usersCount} {usersCount === 1 ? 'member' : 'members'}
              {searchParams.role ? ` · ${searchParams.role}s` : ''}
            </p>
          </div>

          {users.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
            <EmptyState
              title={hasActiveFilters ? 'No members match these filters.' : 'No members found.'}
              action={
                hasActiveFilters ? (
                  <Button variant="secondary" small onClick={clearAll}>
                    Clear filters →
                  </Button>
                ) : undefined
              }
            />
          )}

          <Pagination
            page={parseInt(searchParams.upage ?? '1', 10) || 1}
            pageSize={DIRECTORY_PAGE_SIZE}
            total={usersCount}
            buildHref={(p) => buildUrl(searchParams, { upage: String(p) })}
          />

        </section>

      </main>

      <Footer />

    </div>
  )
}
