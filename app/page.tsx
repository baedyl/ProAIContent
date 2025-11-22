import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export default async function RootPage() {
  const session = await getServerSession(authOptions)

  // Redirect based on authentication status
  if (session?.user) {
    // User is logged in, redirect to workspace
    redirect('/workspace')
  } else {
    // User is not logged in, redirect to landing page
    redirect('/landing')
  }
}

