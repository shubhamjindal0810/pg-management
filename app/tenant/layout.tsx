import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { TenantSidebar } from '@/components/tenant/sidebar';
import { NavigationLoading } from '@/components/navigation-loading';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tenant Dashboard',
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
    noimageindex: true,
  },
};

export default async function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // Allow TENANT role or users with approved bookings
  if (session.user.role !== 'TENANT') {
    // Check if user has an approved booking
    const booking = await db.booking.findFirst({
      where: {
        userId: session.user.id,
        status: 'approved',
      },
    });

    if (!booking) {
      redirect('/dashboard');
    }
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <TenantSidebar />
      <div className="lg:pl-64">
        <main className="min-h-screen p-4 pt-20 lg:p-8 lg:pt-8">
          {children}
        </main>
      </div>
      <NavigationLoading />
    </div>
  );
}

