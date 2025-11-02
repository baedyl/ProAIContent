import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    // Add custom middleware logic here if needed
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/login',
    },
  }
)

// Protect these routes - require authentication
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/settings/:path*',
    '/api/projects/:path*',
    '/api/contents/:path*',
    '/api/settings/:path*',
  ],
}

