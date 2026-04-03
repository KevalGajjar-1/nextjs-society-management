import { redirect } from 'next/navigation'

export default function RootPage() {
  // Server-side redirect to avoid hydration issues
  redirect('/dashboard')
}
