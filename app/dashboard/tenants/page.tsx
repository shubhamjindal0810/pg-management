import Link from 'next/link';
import { Plus, Users, Phone, Mail } from 'lucide-react';
import { db } from '@/lib/db';
import { PageHeader } from '@/components/dashboard/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate, formatPhone } from '@/lib/utils';

async function getTenants() {
  return db.tenant.findMany({
    include: {
      user: {
        select: { name: true, phone: true, email: true },
      },
      bed: {
        include: {
          room: {
            include: {
              property: { select: { name: true } },
            },
          },
        },
      },
    },
    orderBy: [{ status: 'asc' }, { checkInDate: 'desc' }],
  });
}

async function getAvailableBeds() {
  return db.bed.count({
    where: { status: 'AVAILABLE' },
  });
}

const statusConfig = {
  ACTIVE: { label: 'Active', variant: 'active' as const },
  NOTICE_PERIOD: { label: 'Notice Period', variant: 'notice' as const },
  CHECKED_OUT: { label: 'Checked Out', variant: 'checkedOut' as const },
};

export default async function TenantsPage() {
  const [tenants, availableBeds] = await Promise.all([getTenants(), getAvailableBeds()]);

  const activeTenants = tenants.filter((t) => t.status === 'ACTIVE');
  const noticeTenants = tenants.filter((t) => t.status === 'NOTICE_PERIOD');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tenants"
        description="Manage your PG tenants"
        action={
          availableBeds > 0 ? (
            <Link href="/dashboard/tenants/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Tenant
              </Button>
            </Link>
          ) : (
            <Button disabled title="No beds available">
              <Plus className="mr-2 h-4 w-4" />
              No Beds Available
            </Button>
          )
        }
      />

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{activeTenants.length}</div>
            <p className="text-sm text-muted-foreground">Active Tenants</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">{noticeTenants.length}</div>
            <p className="text-sm text-muted-foreground">In Notice Period</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{availableBeds}</div>
            <p className="text-sm text-muted-foreground">Beds Available</p>
          </CardContent>
        </Card>
      </div>

      {tenants.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="mb-4 text-muted-foreground">No tenants added yet</p>
            {availableBeds > 0 && (
              <Link href="/dashboard/tenants/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Tenant
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Tenants</CardTitle>
            <CardDescription>{tenants.length} total tenants</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Room / Bed</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((tenant) => {
                  const status = statusConfig[tenant.status];
                  return (
                    <TableRow key={tenant.id}>
                      <TableCell>
                        <Link
                          href={`/dashboard/tenants/${tenant.id}`}
                          className="font-medium hover:underline"
                        >
                          {tenant.user.name}
                        </Link>
                        {tenant.occupation && (
                          <p className="text-xs text-muted-foreground capitalize">
                            {tenant.occupation}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3" />
                            {formatPhone(tenant.user.phone)}
                          </div>
                          {tenant.user.email && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {tenant.user.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {tenant.bed ? (
                          <div>
                            <p>
                              Room {tenant.bed.room.roomNumber}, Bed {tenant.bed.bedNumber}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {tenant.bed.room.property.name}
                            </p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Not assigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {tenant.checkInDate ? formatDate(tenant.checkInDate) : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <Link href={`/dashboard/tenants/${tenant.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
