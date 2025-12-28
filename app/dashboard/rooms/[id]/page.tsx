import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DoorOpen, Edit, BedDouble, Building2, Plus } from 'lucide-react';
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
import { formatCurrency } from '@/lib/utils';
import { DeleteRoomDialog } from './delete-dialog';
import { OccupancyCalendar } from './occupancy-calendar';
async function getRoom(id: string) {
  const room = await db.room.findUnique({
    where: { id },
    include: {
      property: {
        select: { id: true, name: true },
      },
      beds: {
        include: {
          tenants: {
            where: { status: 'ACTIVE' },
            include: {
              user: { select: { name: true } },
            },
          },
          bookings: {
            where: {
              status: { in: ['approved', 'pending'] },
            },
            select: {
              id: true,
              requestedCheckin: true,
              durationMonths: true,
              status: true,
            },
          },
        },
        orderBy: { bedNumber: 'asc' },
      },
    },
  });

  return room;
}

export default async function RoomDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const roomData = await getRoom(id);

  if (!roomData) {
    notFound();
  }

  // Type assertion to help TypeScript understand the included relations
  const room = roomData as typeof roomData & {
    beds: Array<{
      id: string;
      bedNumber: string;
      status: string;
      tenants: Array<{
        id: string;
        checkInDate: Date | null;
        expectedCheckout: Date | null;
        user: { name: string };
      }>;
      bookings: Array<{
        id: string;
        requestedCheckin: Date;
        expectedCheckout: Date | null;
        durationMonths: number;
        status: string;
      }>;
    }>;
    property: { id: string; name: string };
    monthlyRent: number | null;
    securityDeposit: number | null;
  };

  const totalBeds = room.beds.length;
  const occupiedBeds = room.beds.filter((bed) => bed.status === 'OCCUPIED').length;
  const availableBeds = totalBeds - occupiedBeds;

  const roomTypeLabels: Record<string, string> = {
    single: 'Single',
    double: 'Double',
    triple: 'Triple',
    dormitory: 'Dormitory',
  };

  const statusConfig: Record<string, { label: string; variant: 'available' | 'occupied' | 'maintenance' | 'reserved'; color: string }> = {
    AVAILABLE: { label: 'Available', variant: 'available', color: 'bg-green-500' },
    OCCUPIED: { label: 'Occupied', variant: 'occupied', color: 'bg-blue-500' },
    MAINTENANCE: { label: 'Maintenance', variant: 'maintenance', color: 'bg-yellow-500' },
    RESERVED: { label: 'Reserved', variant: 'reserved', color: 'bg-purple-500' },
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Room ${room.roomNumber}`}
        description={`${room.property.name} - ${roomTypeLabels[room.roomType] || room.roomType}`}
        action={
          <div className="flex gap-2">
            <Link href={`/dashboard/rooms/${room.id}/edit`}>
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Edit Room
              </Button>
            </Link>
            <Link href={`/dashboard/beds/new?roomId=${room.id}`}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Bed
              </Button>
            </Link>
            <DeleteRoomDialog roomId={room.id} roomNumber={room.roomNumber} />
          </div>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <BedDouble className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">{totalBeds}</div>
                <p className="text-sm text-muted-foreground">Total Beds</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <BedDouble className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold text-green-600">{availableBeds}</div>
                <p className="text-sm text-muted-foreground">Available</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <BedDouble className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold text-blue-600">{occupiedBeds}</div>
                <p className="text-sm text-muted-foreground">Occupied</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <DoorOpen className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">
                  {totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0}%
                </div>
                <p className="text-sm text-muted-foreground">Occupancy</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Date-wise Occupancy */}
      <OccupancyCalendar
        beds={room.beds.map((bed) => ({
          id: bed.id,
          bedNumber: bed.bedNumber,
          status: bed.status,
          tenants: bed.tenants.map((t) => ({
            checkInDate: t.checkInDate,
            expectedCheckout: t.expectedCheckout,
            user: { name: t.user.name },
          })),
          bookings: bed.bookings.map((b) => {
            // Calculate expected checkout from duration if not provided
            const checkIn = new Date(b.requestedCheckin);
            const calculatedCheckout = new Date(checkIn);
            calculatedCheckout.setMonth(calculatedCheckout.getMonth() + b.durationMonths);
            return {
              id: b.id,
              requestedCheckin: b.requestedCheckin,
              expectedCheckout: calculatedCheckout.toISOString().split('T')[0],
              durationMonths: b.durationMonths,
              status: b.status,
            };
          }),
        }))}
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Room Details */}
        <Card>
          <CardHeader>
            <CardTitle>Room Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium">Property</p>
              <Link
                href={`/dashboard/properties/${room.property.id}`}
                className="text-sm text-primary hover:underline"
              >
                {room.property.name}
              </Link>
            </div>

            <div>
              <p className="font-medium">Room Type</p>
              <p className="text-sm text-muted-foreground">
                {roomTypeLabels[room.roomType] || room.roomType}
              </p>
            </div>

            <div>
              <p className="font-medium">Floor</p>
              <p className="text-sm text-muted-foreground">
                {room.floor === 0 ? 'Ground Floor' : `Floor ${room.floor}`}
              </p>
            </div>

            <div>
              <p className="font-medium">Features</p>
              <div className="mt-1 flex gap-2">
                {room.hasAc && (
                  <Badge variant="secondary" className="text-xs">
                    AC
                  </Badge>
                )}
                {room.hasAttachedBath && (
                  <Badge variant="secondary" className="text-xs">
                    Attached Bath
                  </Badge>
                )}
              </div>
            </div>

            {room.description && (
              <div>
                <p className="font-medium">Description</p>
                <p className="text-sm text-muted-foreground">{room.description}</p>
              </div>
            )}

            <div>
              <p className="font-medium">Status</p>
              <Badge variant={room.isActive ? 'available' : 'secondary'} className="mt-1">
                {room.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href={`/dashboard/beds/new?roomId=${room.id}`} className="block">
              <Button variant="outline" className="w-full justify-start">
                <BedDouble className="mr-2 h-4 w-4" />
                Add Bed
              </Button>
            </Link>
            <Link href={`/dashboard/tenants/new?roomId=${room.id}`} className="block">
              <Button variant="outline" className="w-full justify-start">
                <Plus className="mr-2 h-4 w-4" />
                Add Tenant
              </Button>
            </Link>
            <Link href={`/dashboard/properties/${room.property.id}`} className="block">
              <Button variant="outline" className="w-full justify-start">
                <Building2 className="mr-2 h-4 w-4" />
                View Property
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Beds Table */}
      {room.beds.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Beds</CardTitle>
            <CardDescription>{room.beds.length} beds in this room</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bed Number</TableHead>
                  <TableHead>Monthly Rent</TableHead>
                  <TableHead>Security Deposit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {room.beds.map((bed) => {
                  const status = statusConfig[bed.status] || statusConfig.AVAILABLE;
                  const tenant = bed.tenants[0];

                  return (
                    <TableRow key={bed.id}>
                      <TableCell className="font-medium">Bed {bed.bedNumber}</TableCell>
                      <TableCell>{formatCurrency(Number(room.monthlyRent || 0))}</TableCell>
                      <TableCell>{formatCurrency(Number(room.securityDeposit || 0))}</TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell>
                        {tenant ? (
                          <Link
                            href={`/dashboard/tenants/${tenant.id}`}
                            className="text-primary hover:underline"
                          >
                            {tenant.user.name}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Link href={`/dashboard/beds/${bed.id}`}>
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
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BedDouble className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="mb-4 text-muted-foreground">No beds added yet</p>
            <Link href={`/dashboard/beds/new?roomId=${room.id}`}>
              <Button>
                <BedDouble className="mr-2 h-4 w-4" />
                Add Your First Bed
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

