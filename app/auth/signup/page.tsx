'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/hooks/use-toast'
import { Unit } from '@/lib/types'

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [unitId, setUnitId] = useState('')
  const [residentType, setResidentType] = useState('')
  const [units, setUnits] = useState<Unit[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingUnits, setIsLoadingUnits] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Fetch units
    async function fetchUnits() {
      try {
        const response = await fetch('/api/units')
        const data = await response.json()
        if (data.success) {
          setUnits(data.data || [])
        }
      } catch (error) {
        console.error('Failed to fetch units:', error)
      } finally {
        setIsLoadingUnits(false)
      }
    }

    fetchUnits()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          password,
          unit_id: unitId,
          resident_type: residentType,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast({
          title: 'Signup failed',
          description: data.error || 'Please check your information',
          variant: 'destructive',
        })
        return
      }

      toast({
        title: 'Signup successful',
        description: 'Your account is pending approval. You will be notified once approved.',
      })

      router.push('/auth/waiting')
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred during signup',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <CardDescription>
            Join your residential community
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field>
              <FieldLabel htmlFor="name">Full Name</FieldLabel>
              <Input
                id="name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="phone">Phone (Optional)</FieldLabel>
              <Input
                id="phone"
                type="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isLoading}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="unit">Unit/Flat</FieldLabel>
              {isLoadingUnits ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Spinner className="w-4 h-4" />
                  Loading units...
                </div>
              ) : units.length === 0 ? (
                <div className="p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md text-sm text-amber-900 dark:text-amber-100">
                  <p className="font-medium">Database not initialized yet</p>
                  <p className="text-xs mt-1">Contact your administrator or see DATABASE_SETUP.md for setup instructions.</p>
                </div>
              ) : (
                <Select value={unitId} onValueChange={setUnitId} disabled={isLoading}>
                  <SelectTrigger id="unit">
                    <SelectValue placeholder="Select your unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.unit_number} {unit.type === 'FLAT' ? '(Flat)' : '(Shop)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="resident-type">Resident Type</FieldLabel>
              <Select value={residentType} onValueChange={setResidentType} disabled={isLoading}>
                <SelectTrigger id="resident-type">
                  <SelectValue placeholder="Select resident type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OWNER">Owner</SelectItem>
                  <SelectItem value="TENANT">Tenant</SelectItem>
                  <SelectItem value="FAMILY">Family Member</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="confirm-password">Confirm Password</FieldLabel>
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </Field>

            <Button type="submit" className="w-full" disabled={isLoading || isLoadingUnits}>
              {isLoading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-4">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
