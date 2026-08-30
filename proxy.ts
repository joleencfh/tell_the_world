import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes that do not require authentication
const PUBLIC_ROUTES = new Set([
  '/',
  '/login',
  '/apply',
  '/apply/pending',
  '/apply/rejected',
  '/privacy',
  '/contact',
])

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.has(pathname)) return true
  // Auth callback
  if (pathname.startsWith('/auth/')) return true
  // Public brief pages — logged-out visitors may view public briefs; page handles visibility
  if (pathname.startsWith('/briefs/')) return true
  return false
}

export async function proxy(request: NextRequest) {
  // Start with a pass-through response so Supabase can set/refresh cookies
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // First mirror onto the request (for downstream middleware/handlers)
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          // Then rebuild supabaseResponse with the updated request and set cookies on it
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: getUser() refreshes the session token if it has expired.
  // This call must happen on every request — do not remove it.
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Unauthenticated user hitting a protected route → /login
  if (!user && !isPublicRoute(pathname)) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    const response = NextResponse.redirect(loginUrl)
    // Copy auth cookies so the session state is preserved across the redirect
    supabaseResponse.cookies.getAll().forEach(c =>
      response.cookies.set(c.name, c.value)
    )
    return response
  }

  // Authenticated user hitting /login → /home
  if (user && pathname === '/login') {
    const homeUrl = request.nextUrl.clone()
    homeUrl.pathname = '/home'
    const response = NextResponse.redirect(homeUrl)
    supabaseResponse.cookies.getAll().forEach(c =>
      response.cookies.set(c.name, c.value)
    )
    return response
  }

  // Pass through — supabaseResponse carries the refreshed session cookies
  return supabaseResponse
}

export const config = {
  matcher: [
    // Run on all routes except Next.js internals and static assets
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
