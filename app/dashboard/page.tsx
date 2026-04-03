'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { useAuth } from '@/hooks/use-auth'
import { Notice, Transaction, Unit } from '@/lib/types'
import { Users, Home, Building2, Car, TrendingUp, TrendingDown } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [notices, setNotices] = useState<Notice[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'COMMITTEE'

  const [stats, setStats] = useState({
    totalResidents: 0,
    owners: 0,
    tenants: 0,
    shops: 0,
    totalVehicles: 0,
    totalIncome: 0,
    totalExpense: 0,
  })

  const emergencyContacts = [
    { label: 'Emergency', number: '102' },
    { label: 'Security', number: '+91-9876543210' },
    { label: 'Office', number: '+91-9876543211' },
  ]

  useEffect(() => {
    async function fetchData() {
      try {
        const [noticesRes, transactionsRes, unitsRes, usersRes, vehiclesRes] = await Promise.all([
          fetch('/api/notices?limit=5'),
          fetch('/api/transactions'),
          fetch('/api/units'),
          fetch('/api/users'),
          fetch('/api/vehicles'),
        ])

        const [noticesData, transactionsData, unitsData, usersData, vehiclesData] = await Promise.all([
          noticesRes.json(),
          transactionsRes.json(),
          unitsRes.json(),
          usersRes.json(),
          vehiclesRes.json(),
        ])

        if (noticesData.success) setNotices(noticesData.data || [])
        if (transactionsData.success) setTransactions(transactionsData.data || [])
        if (unitsData.success) setUnits(unitsData.data || [])
        
        const usersList = usersData.data?.users || []
        const vehiclesList = vehiclesData.data || []

        const owners = usersList.filter((u: any) => u.resident_type === 'OWNER').length
        const tenants = usersList.filter((u: any) => u.resident_type === 'TENANT').length
        const shops = (unitsData.data || []).filter((u: any) => u.type === 'SHOP').length
        
        const income = (transactionsData.data || [])
          .filter((t: any) => t.type === 'INCOME')
          .reduce((sum: number, t: any) => sum + t.amount, 0)
        
        const expense = (transactionsData.data || [])
          .filter((t: any) => t.type === 'EXPENSE')
          .reduce((sum: number, t: any) => sum + t.amount, 0)

        setStats({
          totalResidents: usersList.length,
          owners,
          tenants,
          shops,
          totalVehicles: vehiclesList.length,
          totalIncome: income,
          totalExpense: expense,
        })
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (!authLoading) {
      fetchData()
    }
  }, [authLoading])

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    )
  }

  const recentIncome = transactions.filter(t => t.type === 'INCOME').slice(0, 5)
  const recentExpense = transactions.filter(t => t.type === 'EXPENSE').slice(0, 5)

  return (
    <div className="flex-1 space-y-4 p-4 md:p-6 max-w-7xl mx-auto w-full pb-24 md:pb-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Welcome back, {user?.name}!</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          {isAdmin ? 'Manage your community' : 'Stay updated with your community'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Link href="/dashboard/people" className="block">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between h-full">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Residents</p>
                  <p className="text-2xl md:text-3xl font-bold">{stats.totalResidents}</p>
                </div>
                <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Users className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/people" className="block">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between h-full">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Owners</p>
                  <p className="text-2xl md:text-3xl font-bold">{stats.owners}</p>
                </div>
                <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Home className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/units" className="block">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between h-full">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Shops</p>
                  <p className="text-2xl md:text-3xl font-bold">{stats.shops}</p>
                </div>
                <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Building2 className="h-5 w-5 md:h-6 md:w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/vehicles" className="block">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between h-full">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Vehicles</p>
                  <p className="text-2xl md:text-3xl font-bold">{stats.totalVehicles}</p>
                </div>
                <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Car className="h-5 w-5 md:h-6 md:w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Emergency Contacts - Floating Badges */}
      <div className="flex flex-wrap gap-2">
        {emergencyContacts.map((contact, idx) => (
          <a
            key={contact.label}
            href={`tel:${contact.number}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border bg-background text-xs font-medium hover:bg-accent transition-colors cursor-pointer"
          >
            <span className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-red-500' : idx === 1 ? 'bg-amber-500' : 'bg-green-500'}`} />
            {contact.label}
            <span className="text-muted-foreground">|</span>
            <span>{contact.number}</span>
          </a>
        ))}
      </div>

      {/* Main Content Grid for Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Finance Summary - Only for Admin */}
        {isAdmin && (
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Recent Income
                </CardTitle>
                <CardDescription>Total: ₹{stats.totalIncome.toLocaleString()}</CardDescription>
              </CardHeader>
              <CardContent>
                {recentIncome.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No income records</p>
                ) : (
                  <div className="space-y-2">
                    {recentIncome.map((t) => (
                      <div key={t.id} className="flex justify-between items-center text-sm">
                        <span className="truncate flex-1">{t.title}</span>
                        <span className="text-green-600 font-medium ml-2">+₹{t.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                  Recent Expenses
                </CardTitle>
                <CardDescription>Total: ₹{stats.totalExpense.toLocaleString()}</CardDescription>
              </CardHeader>
              <CardContent>
                {recentExpense.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No expense records</p>
                ) : (
                  <div className="space-y-2">
                    {recentExpense.map((t) => (
                      <div key={t.id} className="flex justify-between items-center text-sm">
                        <span className="truncate flex-1">{t.title}</span>
                        <span className="text-red-600 font-medium ml-2">-₹{t.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Notices */}
        <Card className={isAdmin ? '' : 'lg:col-span-2'}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Recent Notices</CardTitle>
              {isAdmin && (
                <Link href="/dashboard/admin/notices" className="text-sm text-primary hover:underline">
                  View all
                </Link>
              )}
            </div>
            <CardDescription>Latest updates from your community</CardDescription>
          </CardHeader>
          <CardContent>
            {notices.length === 0 ? (
              <p className="text-sm text-muted-foreground">No notices yet</p>
            ) : (
              <div className="space-y-3">
                {notices.slice(0, 5).map((notice) => (
                  <div
                    key={notice.id}
                    className="border-l-2 border-primary pl-4 py-2"
                  >
                    <h3 className="font-medium text-sm">{notice.title}</h3>
                    {notice.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {notice.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(notice.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* User Info - Mobile only */}
      <Card className="md:hidden">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            You are a <span className="font-medium capitalize">{user?.resident_type?.toLowerCase()}</span> in unit <span className="font-medium">{user?.unit_id}</span>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
