import { useEffect, useState } from 'react'
import { User } from '@/lib/types'

export function useAuth() {
  const [user, setUser] = useState<Omit<User, 'password_hash'> | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Fetch current user from session
    async function getCurrentUser() {
      try {
        const response = await fetch('/api/auth/status')
        const data = await response.json()

        if (data.success && data.data?.user) {
          setUser(data.data.user)
        }
      } catch (error) {
        console.error('Failed to fetch user:', error)
      } finally {
        setIsLoading(false)
      }
    }

    getCurrentUser()
  }, [])

  return { user, isLoading }
}
