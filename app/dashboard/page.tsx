import { Suspense } from 'react';
import { PageHeader } from '@/components/dashboard/page-header';
import { StatsCard } from '@/components/dashboard/stats-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BedDouble,
  Users,
  IndianRupee,
  AlertTriangle,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { db } from '@/lib/db';
import { formatCurrency, formatDate } from '@/lib/utils';

async function getStats() {
  const [
    totalBeds,
    occupiedBeds,
    availableBeds,
    maintenanceBeds,
    activeTenants,
    pendingBills,
    recentTenants,
    upcomingCheckouts,
  ] = await Promise.all([
    db.bed.count(),
    db.bed.count({ where: { status: 'OCCUPIED' } }),
    db.bed.count({ where: { status: 'AVAILABLE' } }),
    db.bed.count({ where: { status: 'MAINTENANCE' } }),
    db.tenant.count({ where: { status: 'ACTIVE' } }),
    db.bill.aggregate({
      where: { status: { in: ['SENT', 'PARTIAL', 'OVERDUE'] } },
      _sum: { totalAmount: true },
      _count: true,
    }),
    db.tenant.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { checkInDate: 'desc' },
      take: 5,
      include: {
        user: { select: { name: true, phone: true } },
        bed: {
          include: {
            room: { select: { roomNumber: true } },
          },
        },
      },
    }),
    db.tenant.findMany({
      where: {
        status: { in: ['ACTIVE', 'NOTICE_PERIOD'] },
        OR: [
          { noticeGivenDate: { not: null } },
          {
            expectedCheckout: {
              lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Next 30 days
            },
          },
        ],
      },
      orderBy: { expectedCheckout: 'asc' },
      take: 5,
      include: {
        user: { select: { name: true } },
        bed: {
          include: {
            room: { select: { roomNumber: true } },
          },
        },
      },
    }),
  ]);

  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  return {
    totalBeds,
    occupiedBeds,
    availableBeds,
    maintenanceBeds,
    activeTenants,
    occupancyRate,
    pendingAmount: pendingBills._sum.totalAmount || 0,
    pendingBillsCount: pendingBills._count,
    recentTenants,
    upcomingCheckouts,
  };
}

export default async function DashboardPage() {
  const stats = await getStats();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Overview of your PG property"
      />

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Occupancy Rate"
          value={`${stats.occupancyRate}%`}
          description={`${stats.occupiedBeds} of ${stats.totalBeds} beds occupied`}
          icon={TrendingUp}
        />
        <StatsCard
          title="Available Beds"
          value={stats.availableBeds}
          description={stats.maintenanceBeds > 0 ? `${stats.maintenanceBeds} under maintenance` : 'Ready to rent'}
          icon={BedDouble}
        />
        <StatsCard
          title="Active Tenants"
          value={stats.activeTenants}
          icon={Users}
        />
        <StatsCard
          title="Pending Dues"
          value={formatCurrency(Number(stats.pendingAmount))}
          description={`${stats.pendingBillsCount} unpaid bills`}
          icon={IndianRupee}
        />
      </div>

      {/* Quick Info Panels */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Tenants */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5" />
              Recent Check-ins
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentTenants.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent check-ins</p>
            ) : (
              <div className="space-y-4">
                {stats.recentTenants.map((tenant) => (
                  <div
                    key={tenant.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium">{tenant.user.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Room {tenant.bed?.room.roomNumber} - Bed {tenant.bed?.bedNumber}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {tenant.checkInDate ? formatDate(tenant.checkInDate) : '-'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Checkouts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5" />
              Upcoming Checkouts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.upcomingCheckouts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming checkouts</p>
            ) : (
              <div className="space-y-4">
                {stats.upcomingCheckouts.map((tenant) => (
                  <div
                    key={tenant.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium">{tenant.user.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Room {tenant.bed?.room.roomNumber} - Bed {tenant.bed?.bedNumber}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={tenant.status === 'NOTICE_PERIOD' ? 'notice' : 'active'}>
                        {tenant.status === 'NOTICE_PERIOD' ? 'Notice Given' : 'Active'}
                      </Badge>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {tenant.expectedCheckout ? formatDate(tenant.expectedCheckout) : '-'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bed Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Bed Status Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <span className="text-sm">Available ({stats.availableBeds})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-blue-500" />
              <span className="text-sm">Occupied ({stats.occupiedBeds})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-yellow-500" />
              <span className="text-sm">Maintenance ({stats.maintenanceBeds})</span>
            </div>
          </div>
          
          {/* Simple progress bar */}
          <div className="mt-4 h-4 w-full overflow-hidden rounded-full bg-muted">
            <div className="flex h-full">
              <div
                className="bg-blue-500 transition-all"
                style={{ width: `${(stats.occupiedBeds / stats.totalBeds) * 100}%` }}
              />
              <div
                className="bg-yellow-500 transition-all"
                style={{ width: `${(stats.maintenanceBeds / stats.totalBeds) * 100}%` }}
              />
              <div
                className="bg-green-500 transition-all"
                style={{ width: `${(stats.availableBeds / stats.totalBeds) * 100}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
