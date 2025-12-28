import Link from 'next/link';
import { Plus, BedDouble } from 'lucide-react';
import { db } from '@/lib/db';
import { PageHeader } from '@/components/dashboard/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

async function getBeds() {
  return db.bed.findMany({
    include: {
      room: {
        include: {
          property: {
            select: { name: true },
          },
        },
      },
      tenants: {
        where: { status: 'ACTIVE' },
        include: {
          user: { select: { name: true } },
        },
      },
    },
    orderBy: [
      { room: { property: { name: 'asc' } } },
      { room: { roomNumber: 'asc' } },
      { bedNumber: 'asc' },
    ],
  });
}

async function getRooms() {
  return db.room.findMany({
    select: { id: true },
    where: { isActive: true },
  });
}

const statusConfig = {
  AVAILABLE: { label: 'Available', variant: 'available' as const, color: 'bg-green-500' },
  OCCUPIED: { label: 'Occupied', variant: 'occupied' as const, color: 'bg-blue-500' },
  MAINTENANCE: { label: 'Maintenance', variant: 'maintenance' as const, color: 'bg-yellow-500' },
  RESERVED: { label: 'Reserved', variant: 'reserved' as const, color: 'bg-purple-500' },
};

export default async function BedsPage() {
  const [beds, rooms] = await Promise.all([getBeds(), getRooms()]);

  // Group beds by room
  const bedsByRoom = beds.reduce((acc, bed) => {
    const key = bed.room.id;
    if (!acc[key]) {
      acc[key] = {
        room: bed.room,
        beds: [],
      };
    }
    acc[key].beds.push(bed);
    return acc;
  }, {} as Record<string, { room: typeof beds[0]['room']; beds: typeof beds }>);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Beds"
        description="Manage beds and their availability"
        action={
          rooms.length > 0 ? (
            <Link href="/dashboard/beds/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Bed
              </Button>
            </Link>
          ) : null
        }
      />

      {/* Legend */}
      <div className="flex flex-wrap gap-4">
        {Object.entries(statusConfig).map(([status, config]) => (
          <div key={status} className="flex items-center gap-2">
            <div className={cn('h-3 w-3 rounded-full', config.color)} />
            <span className="text-sm text-muted-foreground">{config.label}</span>
          </div>
        ))}
      </div>

      {rooms.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="mb-4 text-muted-foreground">Add rooms first before creating beds</p>
            <Link href="/dashboard/rooms/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Room
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : beds.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BedDouble className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="mb-4 text-muted-foreground">No beds added yet</p>
            <Link href="/dashboard/beds/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Bed
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Object.values(bedsByRoom).map(({ room, beds: roomBeds }) => (
            <Card key={room.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Room {room.roomNumber}</CardTitle>
                    <CardDescription>{room.property.name}</CardDescription>
                  </div>
                  <div className="flex gap-1">
                    {room.hasAc && (
                      <Badge variant="secondary" className="text-xs">AC</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {roomBeds.map((bed) => {
                    const status = statusConfig[bed.status];
                    const tenant = bed.tenants[0];

                    return (
                      <Link
                        key={bed.id}
                        href={`/dashboard/beds/${bed.id}`}
                        className={cn(
                          'rounded-lg border p-3 transition-all hover:shadow-md',
                          bed.status === 'AVAILABLE' && 'border-green-200 bg-green-50 hover:border-green-300',
                          bed.status === 'OCCUPIED' && 'border-blue-200 bg-blue-50 hover:border-blue-300',
                          bed.status === 'MAINTENANCE' && 'border-yellow-200 bg-yellow-50 hover:border-yellow-300',
                          bed.status === 'RESERVED' && 'border-purple-200 bg-purple-50 hover:border-purple-300'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Bed {bed.bedNumber}</span>
                          <div className={cn('h-2 w-2 rounded-full', status.color)} />
                        </div>
                        <p className="mt-1 text-sm font-medium">
                          {formatCurrency(Number(bed.monthlyRent))}
                        </p>
                        {tenant && (
                          <p className="mt-1 truncate text-xs text-muted-foreground">
                            {tenant.user.name}
                          </p>
                        )}
                        {bed.status === 'AVAILABLE' && (
                          <p className="mt-1 text-xs text-green-600">Available</p>
                        )}
                        {bed.status === 'MAINTENANCE' && (
                          <p className="mt-1 text-xs text-yellow-600">Under Maintenance</p>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
