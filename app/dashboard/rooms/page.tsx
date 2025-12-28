import Link from 'next/link';
import { Plus, DoorOpen } from 'lucide-react';
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

async function getRooms() {
  return db.room.findMany({
    include: {
      property: {
        select: { name: true },
      },
      beds: {
        select: { id: true, status: true },
      },
    },
    orderBy: [{ property: { name: 'asc' } }, { roomNumber: 'asc' }],
  });
}

async function getProperties() {
  return db.property.findMany({
    select: { id: true, name: true },
    where: { isActive: true },
  });
}

export default async function RoomsPage() {
  const [rooms, properties] = await Promise.all([getRooms(), getProperties()]);

  const roomTypeLabels: Record<string, string> = {
    single: 'Single',
    double: 'Double',
    triple: 'Triple',
    dormitory: 'Dormitory',
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rooms"
        description="Manage rooms across your properties"
        action={
          properties.length > 0 ? (
            <Link href="/dashboard/rooms/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Room
              </Button>
            </Link>
          ) : null
        }
      />

      {properties.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="mb-4 text-muted-foreground">
              Add a property first before creating rooms
            </p>
            <Link href="/dashboard/properties/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Property
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : rooms.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <DoorOpen className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="mb-4 text-muted-foreground">No rooms added yet</p>
            <Link href="/dashboard/rooms/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Room
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Rooms</CardTitle>
            <CardDescription>{rooms.length} rooms across all properties</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Room</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Floor</TableHead>
                  <TableHead>Features</TableHead>
                  <TableHead>Beds</TableHead>
                  <TableHead>Occupancy</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rooms.map((room) => {
                  const totalBeds = room.beds.length;
                  const occupiedBeds = room.beds.filter(
                    (bed) => bed.status === 'OCCUPIED'
                  ).length;

                  return (
                    <TableRow key={room.id}>
                      <TableCell>
                        <Link
                          href={`/dashboard/rooms/${room.id}`}
                          className="font-medium hover:underline"
                        >
                          Room {room.roomNumber}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {room.property.name}
                      </TableCell>
                      <TableCell>{roomTypeLabels[room.roomType] || room.roomType}</TableCell>
                      <TableCell>
                        {room.floor === 0 ? 'Ground' : `Floor ${room.floor}`}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
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
                      </TableCell>
                      <TableCell>{totalBeds}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-16 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{
                                width: `${totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {occupiedBeds}/{totalBeds}
                          </span>
                        </div>
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
