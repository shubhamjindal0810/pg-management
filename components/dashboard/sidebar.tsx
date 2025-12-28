'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Building2,
  DoorOpen,
  BedDouble,
  Users,
  Receipt,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  CalendarCheck,
  Star,
} from 'lucide-react';
import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Properties',
    href: '/dashboard/properties',
    icon: Building2,
  },
  {
    name: 'Rooms',
    href: '/dashboard/rooms',
    icon: DoorOpen,
  },
  {
    name: 'Beds',
    href: '/dashboard/beds',
    icon: BedDouble,
  },
  {
    name: 'Tenants',
    href: '/dashboard/tenants',
    icon: Users,
  },
  {
    name: 'Billing',
    href: '/dashboard/billing',
    icon: Receipt,
  },
  {
    name: 'Bookings',
    href: '/dashboard/bookings',
    icon: CalendarCheck,
  },
  {
    name: 'Testimonials',
    href: '/dashboard/testimonials',
    icon: Star,
  },
];

const bottomNavigation = [
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const NavLinks = () => (
    <>
      <div className="flex-1 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </div>
      <div className="space-y-1 border-t pt-4">
        {bottomNavigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile menu button */}
      <div className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between border-b bg-background px-4 lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Building2 className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold">PG Manager</span>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Mobile sidebar */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-30 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="absolute left-0 top-16 bottom-0 w-64 bg-background p-4">
            <nav className="flex h-full flex-col">
              <NavLinks />
            </nav>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-1 flex-col border-r bg-background">
          {/* Logo */}
          <div className="flex h-16 items-center gap-2 border-b px-6">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold">PG Manager</span>
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col gap-1 p-4">
            <NavLinks />
          </nav>
        </div>
      </div>
    </>
  );
}
