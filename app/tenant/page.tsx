import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Receipt, AlertCircle, Wrench, Bell, UserCheck } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

async function getTenantData(userId: string) {
  const tenant = await db.tenant.findUnique({
    where: { userId },
    include: {
      user: { select: { name: true } },
      bed: {
        include: {
          room: {
            include: {
              property: { select: { name: true } },
            },
          },
        },
      },
      bills: {
        where: {
          status: { in: ['SENT', 'PARTIAL', 'OVERDUE'] },
        },
        orderBy: { billingMonth: 'desc' },
        take: 5,
      },
      documents: {
        where: { isVerified: false },
        take: 5,
      },
      maintenanceRequests: {
        where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
  });

  return tenant;
}

async function getAnnouncements() {
  return db.announcement.findMany({
    where: {
      isActive: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gte: new Date() } },
      ],
      publishAt: { lte: new Date() },
    },
    orderBy: [{ priority: 'desc' }, { publishAt: 'desc' }],
    take: 5,
  });
}

export default async function TenantDashboard() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login');
  }

  const [tenant, announcements] = await Promise.all([
    getTenantData(session.user.id),
    getAnnouncements(),
  ]);

  // Check if user has approved booking but no tenant yet
  if (!tenant) {
    const booking = await db.booking.findFirst({
      where: {
        userId: session.user.id,
        status: 'approved',
      },
    });

    if (booking) {
      redirect('/tenant/booking-profile');
    } else {
      redirect('/tenant/onboarding');
    }
  }

  // Check if tenant needs to complete onboarding
  const hasRequiredDocs = tenant.documents.some(
    (doc) => doc.documentType === 'AADHAR' && doc.isVerified
  );

  const totalDue = tenant.bills.reduce(
    (sum, bill) => sum + (Number(bill.totalAmount) - Number(bill.paidAmount)),
    0
  );
  const overdueBills = tenant.bills.filter((bill) => bill.status === 'OVERDUE').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome, {tenant.user.name}!</h1>
        <p className="text-muted-foreground">
          {tenant.bed
            ? `${tenant.bed.room.property.name} - Room ${tenant.bed.room.roomNumber}, Bed ${tenant.bed.bedNumber}`
            : 'No bed assigned'}
        </p>
      </div>

      {/* Onboarding Alert */}
      {!hasRequiredDocs && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserCheck className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="font-medium text-orange-900">Complete Your Onboarding</p>
                  <p className="text-sm text-orange-700">
                    Please upload your ID documents to complete your profile verification.
                  </p>
                </div>
              </div>
              <Link href="/tenant/onboarding">
                <Button variant="outline">Complete Now</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(totalDue)}
                </div>
                <p className="text-sm text-muted-foreground">Total Due</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold text-red-600">{overdueBills}</div>
                <p className="text-sm text-muted-foreground">Overdue Bills</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">
                  {tenant.maintenanceRequests.length}
                </div>
                <p className="text-sm text-muted-foreground">Active Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">{announcements.length}</div>
                <p className="text-sm text-muted-foreground">New Announcements</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Bills */}
        <Card>
          <CardContent className="pt-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Recent Bills</h2>
              <Link href="/tenant/bills">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            </div>
            {tenant.bills.length > 0 ? (
              <div className="space-y-3">
                {tenant.bills.map((bill) => {
                  const balance = Number(bill.totalAmount) - Number(bill.paidAmount);
                  return (
                    <Link
                      key={bill.id}
                      href={`/tenant/bills/${bill.id}`}
                      className="block rounded-lg border p-3 transition-colors hover:bg-muted"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {new Date(bill.billingMonth).toLocaleDateString('en-IN', {
                              month: 'long',
                              year: 'numeric',
                            })}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Due: {formatDate(bill.dueDate)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(balance)}</p>
                          <Badge
                            variant={
                              bill.status === 'OVERDUE'
                                ? 'overdue'
                                : bill.status === 'PARTIAL'
                                  ? 'partial'
                                  : 'sent'
                            }
                            className="mt-1"
                          >
                            {bill.status}
                          </Badge>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No pending bills</p>
            )}
          </CardContent>
        </Card>

        {/* Announcements */}
        <Card>
          <CardContent className="pt-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Announcements</h2>
              <Link href="/tenant/announcements">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            </div>
            {announcements.length > 0 ? (
              <div className="space-y-3">
                {announcements.map((announcement) => (
                  <div
                    key={announcement.id}
                    className={`rounded-lg border p-3 ${
                      announcement.priority === 'urgent'
                        ? 'border-red-200 bg-red-50'
                        : announcement.priority === 'important'
                          ? 'border-orange-200 bg-orange-50'
                          : 'bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{announcement.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                          {announcement.message}
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {formatDate(announcement.publishAt)}
                        </p>
                      </div>
                      {announcement.priority !== 'normal' && (
                        <Badge
                          variant={announcement.priority === 'urgent' ? 'overdue' : 'partial'}
                        >
                          {announcement.priority}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No announcements</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

