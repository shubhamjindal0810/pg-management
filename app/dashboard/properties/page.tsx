import Link from 'next/link';
import { Plus } from 'lucide-react';
import { db } from '@/lib/db';
import { PageHeader } from '@/components/dashboard/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

async function getProperties() {
  return db.property.findMany({
    include: {
      rooms: {
        include: {
          beds: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export default async function PropertiesPage() {
  const properties = await getProperties();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Properties"
        description="Manage your PG properties"
        action={
          <Link href="/dashboard/properties/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Property
            </Button>
          </Link>
        }
      />

      {properties.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="mb-4 text-muted-foreground">No properties added yet</p>
            <Link href="/dashboard/properties/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Property
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => {
            const totalBeds = property.rooms.reduce(
              (acc, room) => acc + room.beds.length,
              0
            );
            const occupiedBeds = property.rooms.reduce(
              (acc, room) =>
                acc + room.beds.filter((bed) => bed.status === 'OCCUPIED').length,
              0
            );

            return (
              <Link key={property.id} href={`/dashboard/properties/${property.id}`}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{property.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {property.address}, {property.city}
                        </CardDescription>
                      </div>
                      <Badge variant={property.isActive ? 'available' : 'secondary'}>
                        {property.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold">{property.rooms.length}</p>
                        <p className="text-xs text-muted-foreground">Rooms</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{totalBeds}</p>
                        <p className="text-xs text-muted-foreground">Beds</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">
                          {totalBeds > 0
                            ? Math.round((occupiedBeds / totalBeds) * 100)
                            : 0}
                          %
                        </p>
                        <p className="text-xs text-muted-foreground">Occupied</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
