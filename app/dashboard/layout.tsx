import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Sidebar } from '@/components/dashboard/sidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // Only allow ADMIN and STAFF to access dashboard
  if (session.user.role === 'TENANT') {
    redirect('/tenant');
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Sidebar />
      <div className="lg:pl-64">
        {/* Add padding top for mobile header */}
        <main className="min-h-screen p-4 pt-20 lg:p-8 lg:pt-8">
          {children}
        </main>
      </div>
    </div>
  );
}
