/**
 * Migration runner for supabase/NNN_*.sql, applied through the Supabase
 * Management API (POST /v1/projects/{ref}/database/query). `supabase db push`
 * does not work in this repo (no config.toml, no DB password).
 *
 * Applied files are recorded in public.schema_migrations so `up` is idempotent.
 *
 *   bun scripts/migrate.ts status                 applied / pending / changed
 *   bun scripts/migrate.ts up                     apply pending files in order
 *   bun scripts/migrate.ts baseline               mark all files applied WITHOUT running them
 *   bun scripts/migrate.ts check                  offline filename checks (used in CI)
 *
 * Flags: --project-ref <ref> targets another cloud project.
 *        Defaults to the ref in NEXT_PUBLIC_SUPABASE_URL.
 *        --db-url <postgres url> runs against a Postgres directly instead of
 *        the Management API (the local Supabase stack that CI starts, e.g.
 *        postgresql://postgres:postgres@127.0.0.1:54322/postgres).
 * Env:   SUPABASE_ACCESS_TOKEN (personal access token, from .env.local)
 */
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'supabase')
const FILENAME_PATTERN = /^(\d{3})_[a-z0-9_]+\.sql$/

// Legacy prefixes that were already applied to the live DB with two files
// each. See docs/design/architecture-cleanup/build-plan.md Step 1. A third
// file with one of these prefixes, or any new duplicate, fails `check`.
const LEGACY_DUPLICATES: Record<string, number> = { '038': 2, '043': 2 }

type Migration = { filename: string; sql: string; checksum: string }

function listFilenames(): string[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort()
}

function loadMigrations(): Migration[] {
  return listFilenames().map((filename) => {
    const sql = readFileSync(join(MIGRATIONS_DIR, filename), 'utf8')
    return {
      filename,
      sql,
      checksum: createHash('sha256').update(sql.replace(/\r\n/g, '\n')).digest('hex'),
    }
  })
}

function check(): boolean {
  const names = listFilenames()
  let ok = true

  const byPrefix = new Map<string, string[]>()
  for (const name of names) {
    const m = name.match(FILENAME_PATTERN)
    if (!m) {
      console.error(`✗ Bad filename (want NNN_snake_case.sql): ${name}`)
      ok = false
      continue
    }
    byPrefix.set(m[1], [...(byPrefix.get(m[1]) ?? []), name])
  }

  for (const [prefix, files] of byPrefix) {
    const allowed = LEGACY_DUPLICATES[prefix] ?? 1
    if (files.length > allowed) {
      console.error(`✗ Duplicate migration number ${prefix}: ${files.join(', ')}`)
      ok = false
    }
  }

  const numbers = [...byPrefix.keys()].map(Number).sort((a, b) => a - b)
  for (let i = 1; i < numbers.length; i++) {
    if (numbers[i] - numbers[i - 1] > 1) {
      console.warn(`! Gap in numbering between ${numbers[i - 1]} and ${numbers[i]}`)
    }
  }

  if (ok) console.log(`✓ ${names.length} migration files, numbering OK`)
  return ok
}

function projectRef(flagRef?: string): string {
  if (flagRef) return flagRef
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const m = url?.match(/^https:\/\/([a-z0-9]+)\.supabase\.co/)
  if (!m) throw new Error('Cannot derive project ref: set NEXT_PUBLIC_SUPABASE_URL or pass --project-ref')
  return m[1]
}

function makeQuery(ref: string) {
  const token = process.env.SUPABASE_ACCESS_TOKEN
  if (!token) throw new Error('SUPABASE_ACCESS_TOKEN is not set')
  return async function query<T = Record<string, unknown>>(sql: string): Promise<T[]> {
    const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: sql }),
    })
    const body = await res.text()
    if (!res.ok) throw new Error(`Management API ${res.status}: ${body}`)
    return JSON.parse(body) as T[]
  }
}

function makeDirectQuery(url: string) {
  // Bun's built-in Postgres client. unsafe() without parameters uses the
  // simple query protocol, so multi-statement migration files work.
  const db = new Bun.SQL(url)
  return async function query<T = Record<string, unknown>>(sql: string): Promise<T[]> {
    const rows = await db.unsafe(sql)
    return (Array.isArray(rows) ? rows : []) as T[]
  }
}

const quote = (s: string) => `'${s.replace(/'/g, "''")}'`

const ENSURE_TABLE = `
create table if not exists public.schema_migrations (
  filename   text primary key,
  applied_at timestamptz not null default now(),
  checksum   text not null
);
alter table public.schema_migrations enable row level security;
`

async function main() {
  const args = process.argv.slice(2)
  const command = args[0]
  const refIdx = args.indexOf('--project-ref')
  const flagRef = refIdx >= 0 ? args[refIdx + 1] : undefined

  if (command === 'check') process.exit(check() ? 0 : 1)
  if (!['status', 'up', 'baseline'].includes(command ?? '')) {
    console.error('Usage: bun scripts/migrate.ts <status|up|baseline|check> [--project-ref <ref>]')
    process.exit(1)
  }

  const dbIdx = args.indexOf('--db-url')
  const dbUrl = dbIdx >= 0 ? args[dbIdx + 1] : undefined
  let query: ReturnType<typeof makeQuery>
  if (dbUrl) {
    query = makeDirectQuery(dbUrl)
    console.log(`Target database: ${new URL(dbUrl).host}`)
  } else {
    const ref = projectRef(flagRef)
    query = makeQuery(ref)
    console.log(`Target project: ${ref}`)
  }

  const migrations = loadMigrations()

  // status must not mutate the target, so only read when the table exists
  let applied = new Map<string, string>()
  if (command === 'status') {
    const [exists] = await query<{ t: string | null }>(
      `select to_regclass('public.schema_migrations')::text as t`,
    )
    if (exists?.t) {
      const rows = await query<{ filename: string; checksum: string }>(
        'select filename, checksum from public.schema_migrations',
      )
      applied = new Map(rows.map((r) => [r.filename, r.checksum]))
    } else {
      console.log('schema_migrations does not exist yet (nothing recorded; run baseline or up)')
    }
  } else {
    await query(ENSURE_TABLE)
    const rows = await query<{ filename: string; checksum: string }>(
      'select filename, checksum from public.schema_migrations',
    )
    applied = new Map(rows.map((r) => [r.filename, r.checksum]))
  }

  const pending = migrations.filter((m) => !applied.has(m.filename))
  const changed = migrations.filter(
    (m) => applied.has(m.filename) && applied.get(m.filename) !== m.checksum,
  )

  if (command === 'status') {
    console.log(`Applied: ${migrations.length - pending.length}, pending: ${pending.length}, changed since applied: ${changed.length}`)
    for (const m of pending) console.log(`  pending  ${m.filename}`)
    for (const m of changed) console.log(`  changed  ${m.filename}`)
    return
  }

  if (command === 'baseline') {
    if (pending.length === 0) return console.log('Nothing to baseline.')
    const values = pending.map((m) => `(${quote(m.filename)}, ${quote(m.checksum)})`).join(',\n')
    await query(`insert into public.schema_migrations (filename, checksum) values ${values}`)
    console.log(`✓ Marked ${pending.length} files as applied (not executed)`)
    return
  }

  // up
  for (const m of changed) console.warn(`! ${m.filename} changed since it was applied (not re-run)`)
  if (pending.length === 0) return console.log('Nothing to apply.')
  for (const m of pending) {
    process.stdout.write(`Applying ${m.filename} ... `)
    try {
      await query(m.sql)
      await query(
        `insert into public.schema_migrations (filename, checksum) values (${quote(m.filename)}, ${quote(m.checksum)})`,
      )
      console.log('ok')
    } catch (err) {
      console.log('FAILED')
      console.error(err instanceof Error ? err.message : err)
      console.error('Stopped. Later files were not applied.')
      process.exit(1)
    }
  }
  console.log(`✓ Applied ${pending.length} migrations`)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
