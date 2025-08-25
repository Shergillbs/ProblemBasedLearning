import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })

  // Refresh session if expired - required for Server Components
  const {
    data: { session },
  } = await supabase.auth.getSession()


  // Protected routes that require authentication
  const protectedRoutes = [
    '/',
    '/projects',
    '/teams',
    '/ai-tutor',
  ]

  // Public routes that should redirect authenticated users
  const authRoutes = ['/login', '/signup']

  const { pathname } = request.nextUrl

  // Check if current route is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  )

  // Check if current route is an auth route
  const isAuthRoute = authRoutes.includes(pathname)

  // If user is not authenticated and trying to access protected route
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirectedFrom', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Let client-side handle redirects for authenticated users on auth routes
  // This prevents race conditions between middleware and client-side redirects
  if (isAuthRoute && session) {
    // Don't redirect here - let the client-side auth context handle it
    return res
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
