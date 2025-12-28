'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Receipt,
  Wrench,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  Utensils,
} from 'lucide-react';
import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';

const navigation = [
  {
    name: 'Dashboard',
    href: '/tenant',
    icon: LayoutDashboard,
  },
  {
    name: 'Complete Profile',
    href: '/tenant/booking-profile',
    icon: User,
  },
  {
    name: 'My Bills',
    href: '/tenant/bills',
    icon: Receipt,
  },
  {
    name: 'Maintenance',
    href: '/tenant/maintenance',
    icon: Wrench,
  },
  {
    name: 'Announcements',
    href: '/tenant/announcements',
    icon: Bell,
  },
  {
    name: 'Meals',
    href: '/tenant/meals',
    icon: Utensils,
  },
  {
    name: 'Profile',
    href: '/tenant/profile',
    icon: User,
  },
];

export function TenantSidebar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <div className="fixed left-0 top-0 z-50 flex h-16 w-full items-center justify-between border-b bg-background px-4 lg:hidden">
        <Link href="/tenant" className="flex items-center gap-2">
          <span className="text-lg font-bold">Tenant Portal</span>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-full w-64 border-r bg-background transition-transform lg:translate-x-0',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center border-b px-6">
            <Link href="/tenant" className="flex items-center gap-2">
              <span className="text-lg font-bold">Tenant Portal</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
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
          </nav>

          {/* Logout */}
          <div className="border-t p-4">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => signOut({ callbackUrl: '/login' })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}

