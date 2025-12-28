import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BedDouble, Edit, DoorOpen, Users, Building2 } from 'lucide-react';
import { db } from '@/lib/db';
import { PageHeader } from '@/components/dashboard/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { DeleteBedDialog } from './delete-dialog';

async function getBed(id: string) {
  const bed = await db.bed.findUnique({
    where: { id },
    include: {
      room: {
        include: {
          property: {
            select: { id: true, name: true },
          },
        },
      },
      tenants: {
        where: { status: 'ACTIVE' },
        include: {
          user: {
            select: { name: true, phone: true, email: true },
          },
        },
        orderBy: { checkInDate: 'desc' },
      },
    },
  });

  return bed;
}

export default async function BedDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const bed = await getBed(id);

  if (!bed) {
    notFound();
  }

  const activeTenant = bed.tenants[0];
  const statusConfig = {
    AVAILABLE: { label: 'Available', variant: 'available' as const, color: 'bg-green-500' },
    OCCUPIED: { label: 'Occupied', variant: 'occupied' as const, color: 'bg-blue-500' },
    MAINTENANCE: { label: 'Maintenance', variant: 'maintenance' as const, color: 'bg-yellow-500' },
    RESERVED: { label: 'Reserved', variant: 'reserved' as const, color: 'bg-purple-500' },
  };

  const status = statusConfig[bed.status];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Bed ${bed.bedNumber}`}
        description={`Room ${bed.room.roomNumber}, ${bed.room.property.name}`}
        action={
          <div className="flex gap-2">
            <Link href={`/dashboard/beds/${bed.id}/edit`}>
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Edit Bed
              </Button>
            </Link>
            <DeleteBedDialog bedId={bed.id} bedNumber={bed.bedNumber} />
          </div>
        }
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Bed Details */}
        <Card>
          <CardHeader>
            <CardTitle>Bed Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium">Location</p>
              <div className="mt-1 space-y-1">
                <Link
                  href={`/dashboard/properties/${bed.room.property.id}`}
                  className="text-sm text-primary hover:underline"
                >
                  {bed.room.property.name}
                </Link>
                <br />
                <Link
                  href={`/dashboard/rooms/${bed.room.id}`}
                  className="text-sm text-primary hover:underline"
                >
                  Room {bed.room.roomNumber}
                </Link>
              </div>
            </div>

            <div>
              <p className="font-medium">Monthly Rent</p>
              <p className="text-lg font-semibold">{formatCurrency(Number(bed.monthlyRent))}</p>
            </div>

            <div>
              <p className="font-medium">Security Deposit</p>
              <p className="text-lg font-semibold">
                {formatCurrency(Number(bed.securityDeposit))}
              </p>
            </div>

            <div>
              <p className="font-medium">Status</p>
              <Badge variant={status.variant} className="mt-1">
                {status.label}
              </Badge>
            </div>

            {bed.description && (
              <div>
                <p className="font-medium">Description</p>
                <p className="text-sm text-muted-foreground">{bed.description}</p>
              </div>
            )}

            <div>
              <p className="font-medium">Room Features</p>
              <div className="mt-1 flex gap-2">
                {bed.room.hasAc && (
                  <Badge variant="secondary" className="text-xs">
                    AC
                  </Badge>
                )}
                {bed.room.hasAttachedBath && (
                  <Badge variant="secondary" className="text-xs">
                    Attached Bath
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Tenant */}
        {activeTenant ? (
          <Card>
            <CardHeader>
              <CardTitle>Current Tenant</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium">Name</p>
                <Link
                  href={`/dashboard/tenants/${activeTenant.id}`}
                  className="text-lg font-semibold text-primary hover:underline"
                >
                  {activeTenant.user.name}
                </Link>
              </div>

              <div>
                <p className="font-medium">Contact</p>
                <div className="mt-1 space-y-1 text-sm">
                  <p>{activeTenant.user.phone}</p>
                  {activeTenant.user.email && <p>{activeTenant.user.email}</p>}
                </div>
              </div>

              {activeTenant.checkInDate && (
                <div>
                  <p className="font-medium">Check-in Date</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(activeTenant.checkInDate)}
                  </p>
                </div>
              )}

              {activeTenant.expectedCheckout && (
                <div>
                  <p className="font-medium">Expected Checkout</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(activeTenant.expectedCheckout)}
                  </p>
                </div>
              )}

              <div>
                <p className="font-medium">Status</p>
                <Badge
                  variant={
                    activeTenant.status === 'ACTIVE'
                      ? 'active'
                      : activeTenant.status === 'NOTICE_PERIOD'
                        ? 'notice'
                        : 'checkedOut'
                  }
                  className="mt-1"
                >
                  {activeTenant.status === 'ACTIVE'
                    ? 'Active'
                    : activeTenant.status === 'NOTICE_PERIOD'
                      ? 'Notice Period'
                      : 'Checked Out'}
                </Badge>
              </div>

              <Link href={`/dashboard/tenants/${activeTenant.id}`}>
                <Button variant="outline" className="w-full">
                  <Users className="mr-2 h-4 w-4" />
                  View Full Profile
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Current Tenant</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8">
                <Users className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="mb-4 text-muted-foreground">No tenant assigned</p>
                {bed.status === 'AVAILABLE' && (
                  <Link href={`/dashboard/tenants/new?bedId=${bed.id}`}>
                    <Button>
                      <Users className="mr-2 h-4 w-4" />
                      Assign Tenant
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-3">
              <Link href={`/dashboard/rooms/${bed.room.id}`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <DoorOpen className="mr-2 h-4 w-4" />
                  View Room
                </Button>
              </Link>
              <Link href={`/dashboard/properties/${bed.room.property.id}`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Building2 className="mr-2 h-4 w-4" />
                  View Property
                </Button>
              </Link>
              {activeTenant && (
                <Link href={`/dashboard/tenants/${activeTenant.id}`} className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="mr-2 h-4 w-4" />
                    View Tenant
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

