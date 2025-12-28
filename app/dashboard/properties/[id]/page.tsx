import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Building2, MapPin, Edit, DoorOpen, BedDouble, Users } from 'lucide-react';
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
import { DeletePropertyDialog } from './delete-dialog';

async function getProperty(id: string) {
  const property = await db.property.findUnique({
    where: { id },
    include: {
      rooms: {
        include: {
          beds: {
            include: {
              tenants: {
                where: { status: 'ACTIVE' },
                include: {
                  user: { select: { name: true } },
                },
              },
            },
          },
        },
        orderBy: { roomNumber: 'asc' },
      },
    },
  });

  return property;
}

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = await getProperty(id);

  if (!property) {
    notFound();
  }

  const totalBeds = property.rooms.reduce((acc, room) => acc + room.beds.length, 0);
  const occupiedBeds = property.rooms.reduce(
    (acc, room) =>
      acc + room.beds.filter((bed) => bed.status === 'OCCUPIED').length,
    0
  );
  const availableBeds = totalBeds - occupiedBeds;

  const amenities = (property.amenities as string[]) || [];
  const rules = (property.rules as string[]) || [];

  const roomTypeLabels: Record<string, string> = {
    single: 'Single',
    double: 'Double',
    triple: 'Triple',
    dormitory: 'Dormitory',
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={property.name}
        description={`${property.address}, ${property.city}, ${property.state} ${property.pincode}`}
        action={
          <div className="flex gap-2">
            <Link href={`/dashboard/properties/${property.id}/edit`}>
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Edit Property
              </Button>
            </Link>
            <DeletePropertyDialog propertyId={property.id} propertyName={property.name} />
          </div>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <DoorOpen className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">{property.rooms.length}</div>
                <p className="text-sm text-muted-foreground">Rooms</p>
              </div>
            </div>
          </CardContent>
        </Card>
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
              <Users className="h-5 w-5 text-muted-foreground" />
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
              <BedDouble className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold text-green-600">{availableBeds}</div>
                <p className="text-sm text-muted-foreground">Available</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Property Details */}
        <Card>
          <CardHeader>
            <CardTitle>Property Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-2">
              <MapPin className="mt-1 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Address</p>
                <p className="text-sm text-muted-foreground">
                  {property.address}
                  <br />
                  {property.city}, {property.state} {property.pincode}
                </p>
              </div>
            </div>

            <div>
              <p className="font-medium">Status</p>
              <Badge variant={property.isActive ? 'available' : 'secondary'} className="mt-1">
                {property.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            {property.description && (
              <div>
                <p className="font-medium">Description</p>
                <p className="mt-1 text-sm text-muted-foreground">{property.description}</p>
              </div>
            )}

            {amenities.length > 0 && (
              <div>
                <p className="font-medium mb-2">Amenities</p>
                <div className="flex flex-wrap gap-2">
                  {amenities.map((amenity) => (
                    <Badge key={amenity} variant="secondary">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {rules.length > 0 && (
              <div>
                <p className="font-medium mb-2">House Rules</p>
                <ul className="space-y-1">
                  {rules.map((rule, index) => (
                    <li key={index} className="text-sm text-muted-foreground">
                      • {rule}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href={`/dashboard/rooms/new?propertyId=${property.id}`} className="block">
              <Button variant="outline" className="w-full justify-start">
                <DoorOpen className="mr-2 h-4 w-4" />
                Add Room
              </Button>
            </Link>
            <Link href={`/dashboard/beds/new?propertyId=${property.id}`} className="block">
              <Button variant="outline" className="w-full justify-start">
                <BedDouble className="mr-2 h-4 w-4" />
                Add Bed
              </Button>
            </Link>
            <Link href={`/dashboard/tenants/new?propertyId=${property.id}`} className="block">
              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                Add Tenant
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Rooms Table */}
      {property.rooms.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Rooms</CardTitle>
            <CardDescription>{property.rooms.length} rooms in this property</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Room Number</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Floor</TableHead>
                  <TableHead>Features</TableHead>
                  <TableHead>Beds</TableHead>
                  <TableHead>Occupancy</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {property.rooms.map((room) => {
                  const roomBeds = room.beds.length;
                  const roomOccupied = room.beds.filter((bed) => bed.status === 'OCCUPIED').length;

                  return (
                    <TableRow key={room.id}>
                      <TableCell className="font-medium">Room {room.roomNumber}</TableCell>
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
                      <TableCell>{roomBeds}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-16 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{
                                width: `${roomBeds > 0 ? (roomOccupied / roomBeds) * 100 : 0}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {roomOccupied}/{roomBeds}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link href={`/dashboard/rooms/${room.id}`}>
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
            <DoorOpen className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="mb-4 text-muted-foreground">No rooms added yet</p>
            <Link href={`/dashboard/rooms/new?propertyId=${property.id}`}>
              <Button>
                <DoorOpen className="mr-2 h-4 w-4" />
                Add Your First Room
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

