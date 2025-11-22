import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    // Allow the request to proceed
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // Public routes that don't require authentication
        const publicRoutes = [
          '/',
          '/login',
          '/register',
          '/forgot-password',
          '/reset-password',
          '/auth/callback',
          '/landing',
        ]

        // Check if the current path is public
        if (publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
          return true
        }

        // Protected routes require a valid token
        return !!token
      },
    },
    pages: {
      signIn: '/login',
    },
  }
)

// Protect these routes
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - login, register, forgot-password, reset-password (auth pages)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|proai-writer.svg|screenshots|login|register|forgot-password|reset-password|auth/callback|landing).*)',
  ],
}
