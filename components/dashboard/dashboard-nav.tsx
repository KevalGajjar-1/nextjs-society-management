'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  DollarSign,
  Building2,
  Users,
  Car,
  User,
  BarChart3,
  FileText,
  Users2,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'

const routes = [
  {
    label: 'Home',
    icon: Home,
    href: '/dashboard',
    adminOnly: false,
  },
  {
    label: 'Finance',
    icon: DollarSign,
    href: '/dashboard/finance',
    adminOnly: false,
  },
  {
    label: 'Units',
    icon: Building2,
    href: '/dashboard/units',
    adminOnly: false,
  },
  {
    label: 'People',
    icon: Users,
    href: '/dashboard/people',
    adminOnly: false,
  },
  {
    label: 'Vehicles',
    icon: Car,
    href: '/dashboard/vehicles',
    adminOnly: false,
  },
  {
    label: 'Profile',
    icon: User,
    href: '/dashboard/profile',
    adminOnly: false,
  },
  {
    label: 'Admin Dashboard',
    icon: BarChart3,
    href: '/dashboard/admin',
    adminOnly: true,
  },
  {
    label: 'Users',
    icon: Users2,
    href: '/dashboard/admin/users',
    adminOnly: true,
  },
  {
    label: 'Notices',
    icon: FileText,
    href: '/dashboard/admin/notices',
    adminOnly: true,
  },
  {
    label: 'Settings',
    icon: Settings,
    href: '/dashboard/admin/settings',
    adminOnly: true,
  },
]

export function DashboardNav() {
  const pathname = usePathname()
  const { user } = useAuth()

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'COMMITTEE'

  const visibleRoutes = routes.filter((route) => {
    if (route.adminOnly && !isAdmin) {
      return false
    }
    return true
  })

  return (
    <nav className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-bold">NoBrokerHood</h1>
        <p className="text-xs text-muted-foreground mt-1">Residential Management</p>
      </div>

      {/* Nav Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {visibleRoutes.map((route) => {
          const Icon = route.icon
          const isActive = pathname === route.href || pathname.startsWith(route.href + '/')

          return (
            <Link key={route.href} href={route.href}>
              <Button
                variant={isActive ? 'default' : 'ghost'}
                className="w-full justify-start gap-3"
              >
                <Icon className="h-4 w-4" />
                <span>{route.label}</span>
              </Button>
            </Link>
          )
        })}
      </div>

      {/* User Info */}
      <div className="border-t border-border p-4">
        <div className="text-sm">
          <p className="font-medium truncate">{user?.name}</p>
          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          <p className="text-xs text-muted-foreground capitalize mt-1">{user?.role.toLowerCase()}</p>
        </div>
      </div>
    </nav>
  )
}
