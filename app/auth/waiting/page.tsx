'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

export default function WaitingPage() {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // Check if user is approved every 10 seconds
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/auth/status')
        const data = await response.json()

        if (data.success && data.data?.status === 'APPROVED') {
          router.push('/dashboard')
        }
      } catch (error) {
        console.error('Failed to check status:', error)
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [router])

  useEffect(() => {
    setIsChecking(false)
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <Spinner className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Pending Approval</CardTitle>
          <CardDescription>
            Your account is being reviewed by the community administrator
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You will receive a notification once your account is approved. This usually takes 24-48 hours.
          </p>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push('/auth/login')}
          >
            Back to Login
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
