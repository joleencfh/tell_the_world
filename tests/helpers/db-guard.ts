// Safety net so test and seed tooling can never write to the production
// Supabase project. The production ref is not a secret (it is in the public
// project URL); override with PRODUCTION_SUPABASE_URL if the project moves.
const PRODUCTION_REF = 'kofimpjhjpgjotjanglq'

export function isProductionSupabase(url: string | undefined): boolean {
  if (!url) return false
  const prod = process.env.PRODUCTION_SUPABASE_URL
  return url.includes(PRODUCTION_REF) || (!!prod && url.replace(/\/$/, '') === prod.replace(/\/$/, ''))
}

/** Throws when pointed at production. */
export function assertNotProduction(url: string | undefined, what: string): void {
  if (isProductionSupabase(url)) {
    throw new Error(
      `${what} refused to run: NEXT_PUBLIC_SUPABASE_URL points at the production Supabase project. ` +
        'Tests and seeds must run against the throwaway local Supabase stack (see CI) or a dedicated non-production project.',
    )
  }
}
