import { db } from '@/lib/db';
import { BrowseFilters } from './browse-filters';
import { BedCard } from './bed-card';
import { PageHeader } from '@/components/dashboard/page-header';

async function getAvailableBeds(filters?: {
  hasAttachedBath?: boolean;
  roomType?: string;
  hasAc?: boolean;
  checkInDate?: string;
  maxRent?: number;
}) {
  const beds = await db.bed.findMany({
    where: {
      status: 'AVAILABLE',
      ...(filters?.hasAttachedBath !== undefined && {
        room: {
          hasAttachedBath: filters.hasAttachedBath,
        },
      }),
      ...(filters?.roomType && {
        room: {
          roomType: filters.roomType,
        },
      }),
      ...(filters?.hasAc !== undefined && {
        room: {
          hasAc: filters.hasAc,
        },
      }),
      ...(filters?.maxRent && {
        monthlyRent: {
          lte: filters.maxRent,
        },
      }),
    },
    include: {
      room: {
        include: {
          property: {
            select: {
              id: true,
              name: true,
              address: true,
              city: true,
              amenities: true,
            },
          },
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
    orderBy: [
      { room: { property: { name: 'asc' } } },
      { room: { roomNumber: 'asc' } },
      { bedNumber: 'asc' },
    ],
  });

  // Filter out beds that are booked for the requested check-in date
  if (filters?.checkInDate) {
    const checkInDate = new Date(filters.checkInDate);
    return beds.filter((bed) => {
      // Check if any booking overlaps with the requested check-in date
      return !bed.bookings.some((booking) => {
        const bookingCheckIn = new Date(booking.requestedCheckin);
        const bookingCheckOut = new Date(
          new Date(booking.requestedCheckin).setMonth(
            booking.requestedCheckin.getMonth() + booking.durationMonths
          )
        );
        return checkInDate >= bookingCheckIn && checkInDate < bookingCheckOut;
      });
    });
  }

  return beds;
}

async function getProperties() {
  return db.property.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      amenities: true,
    },
  });
}

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{
    hasAttachedBath?: string;
    roomType?: string;
    hasAc?: string;
    checkInDate?: string;
    maxRent?: string;
  }>;
}) {
  const params = await searchParams;

  const filters = {
    hasAttachedBath: params.hasAttachedBath === 'true' ? true : undefined,
    roomType: params.roomType,
    hasAc: params.hasAc === 'true' ? true : undefined,
    checkInDate: params.checkInDate,
    maxRent: params.maxRent ? parseFloat(params.maxRent) : undefined,
  };

  const [beds, properties] = await Promise.all([
    getAvailableBeds(filters),
    getProperties(),
  ]);

  const propertyAmenities = properties.reduce((acc, prop) => {
    const amenities = (prop.amenities as string[]) || [];
    amenities.forEach((amenity) => {
      if (!acc.includes(amenity)) {
        acc.push(amenity);
      }
    });
    return acc;
  }, [] as string[]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold">Browse Available Beds</h1>
          <p className="text-muted-foreground">
            Find your perfect accommodation with our advanced filters
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-4">
          {/* Filters Sidebar */}
          <aside className="lg:col-span-1">
            <BrowseFilters
              initialFilters={filters}
              propertyAmenities={propertyAmenities}
            />
          </aside>

          {/* Results */}
          <div className="lg:col-span-3">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {beds.length} bed{beds.length !== 1 ? 's' : ''} available
              </p>
            </div>

            {beds.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2">
                {beds.map((bed) => (
                  <BedCard
                    key={bed.id}
                    bed={{
                      id: bed.id,
                      bedNumber: bed.bedNumber,
                      monthlyRent: Number(bed.monthlyRent),
                      securityDeposit: Number(bed.securityDeposit),
                      images: (bed.images as string[]) || null,
                      description: bed.description,
                      room: {
                        id: bed.room.id,
                        roomNumber: bed.room.roomNumber,
                        roomType: bed.room.roomType,
                        hasAc: bed.room.hasAc,
                        hasAttachedBath: bed.room.hasAttachedBath,
                        floor: bed.room.floor,
                        images: (bed.room.images as string[]) || null,
                        property: {
                          id: bed.room.property.id,
                          name: bed.room.property.name,
                          address: bed.room.property.address,
                          city: bed.room.property.city,
                          amenities: (bed.room.property.amenities as string[]) || null,
                        },
                      },
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border bg-white p-12 text-center">
                <p className="text-lg font-medium text-muted-foreground">
                  No beds match your filters
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Try adjusting your search criteria
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

