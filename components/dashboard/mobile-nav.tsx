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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'

const routes = [
  {
    label: 'Home',
    icon: Home,
    href: '/dashboard',
  },
  {
    label: 'Finance',
    icon: DollarSign,
    href: '/dashboard/finance',
  },
  {
    label: 'Units',
    icon: Building2,
    href: '/dashboard/units',
  },
  {
    label: 'People',
    icon: Users,
    href: '/dashboard/people',
  },
  {
    label: 'Vehicles',
    icon: Car,
    href: '/dashboard/vehicles',
  },
  {
    label: 'Profile',
    icon: User,
    href: '/dashboard/profile',
  },
]

export function MobileNav() {
  const pathname = usePathname()
  const { user } = useAuth()

  return (
    <div className="flex justify-around items-center h-16 px-2 bg-background border-t">
      {routes.map((route) => {
        const Icon = route.icon
        const isActive = route.href === '/dashboard' 
          ? pathname === '/dashboard'
          : pathname.startsWith(route.href)

        return (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              'flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-medium transition-all',
              isActive
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <div className={cn(
              'p-1.5 rounded-lg transition-colors',
              isActive ? 'bg-primary/10 text-primary' : ''
            )}>
              <Icon className="h-5 w-5" />
            </div>
            <span className="line-clamp-1">{route.label}</span>
          </Link>
        )
      })}
    </div>
  )
}
