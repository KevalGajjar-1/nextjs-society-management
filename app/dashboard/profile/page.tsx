'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/hooks/use-toast'
import { useState } from 'react'

export default function ProfilePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  async function handleLogout() {
    setIsLoggingOut(true)
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' })
      if (response.ok) {
        toast({
          title: 'Logged out',
          description: 'You have been logged out successfully',
        })
        router.push('/auth/login')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to logout',
        variant: 'destructive',
      })
    } finally {
      setIsLoggingOut(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 max-w-2xl mx-auto w-full">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">Manage your account information</p>
      </div>

      {/* User Information */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Full Name</label>
            <p className="text-lg mt-1">{user?.name}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Email</label>
            <p className="text-lg mt-1">{user?.email}</p>
          </div>

          {user?.phone && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Phone</label>
              <p className="text-lg mt-1">{user.phone}</p>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-muted-foreground">Resident Type</label>
            <p className="text-lg mt-1 capitalize">{user?.resident_type.toLowerCase()}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Role</label>
            <p className="text-lg mt-1 capitalize">{user?.role.toLowerCase()}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Status</label>
            <p className="text-lg mt-1 capitalize">{user?.status.toLowerCase()}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Member Since</label>
            <p className="text-lg mt-1">
              {user?.created_at && new Date(user.created_at).toLocaleDateString()}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Account Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Account Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Logging out...
              </>
            ) : (
              'Logout'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
