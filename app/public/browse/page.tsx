import { db } from '@/lib/db';
import { BrowseFilters } from './browse-filters';
import { RoomCard } from './room-card';
import { PageHeader } from '@/components/dashboard/page-header';

async function getAvailableRooms(filters?: {
  hasAttachedBath?: boolean;
  roomType?: string;
  hasAc?: boolean;
  hasBalcony?: boolean;
  checkInDate?: string;
  maxRent?: number;
}) {
  const rooms = await db.room.findMany({
    where: {
      isActive: true,
      ...(filters?.hasAttachedBath !== undefined && {
        hasAttachedBath: filters.hasAttachedBath,
      }),
      ...(filters?.roomType && {
        roomType: filters.roomType,
      }),
      ...(filters?.hasAc !== undefined && {
        hasAc: filters.hasAc,
      }),
      ...(filters?.hasBalcony !== undefined && {
        hasBalcony: filters.hasBalcony,
      }),
      ...(filters?.maxRent && {
        monthlyRent: {
          lte: filters.maxRent,
        },
      }),
    },
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
      beds: {
        where: {
          status: 'AVAILABLE',
        },
        include: {
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
      },
    },
    orderBy: [
      { property: { name: 'asc' } },
      { roomNumber: 'asc' },
    ],
  });

  // Filter out rooms that have no available beds for the requested check-in date
  if (filters?.checkInDate) {
    const checkInDate = new Date(filters.checkInDate);
    return rooms.filter((room) => {
      // Check if room has at least one bed available for the requested date
      return room.beds.some((bed) => {
        // Check if bed is not booked for the requested check-in date
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
    });
  }

  // Filter out rooms with no available beds
  return rooms.filter((room) => room.beds.length > 0);
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
    hasBalcony?: string;
    checkInDate?: string;
    maxRent?: string;
  }>;
}) {
  const params = await searchParams;

  const filters = {
    hasAttachedBath: params.hasAttachedBath === 'true' ? true : undefined,
    roomType: params.roomType,
    hasAc: params.hasAc === 'true' ? true : undefined,
    hasBalcony: params.hasBalcony === 'true' ? true : undefined,
    checkInDate: params.checkInDate,
    maxRent: params.maxRent ? parseFloat(params.maxRent) : undefined,
  };

  const [rooms, properties] = await Promise.all([
    getAvailableRooms(filters),
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
          <h1 className="mb-2 text-4xl font-bold">Browse Available Rooms</h1>
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
                {rooms.length} room{rooms.length !== 1 ? 's' : ''} available
              </p>
            </div>

            {rooms.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2">
                {rooms.map((room) => (
                  <RoomCard
                    key={room.id}
                    room={{
                      id: room.id,
                      roomNumber: room.roomNumber,
                      roomType: room.roomType,
                      hasAc: room.hasAc,
                      hasAttachedBath: room.hasAttachedBath,
                      hasBalcony: room.hasBalcony,
                      floor: room.floor,
                      images: (room.images as string[]) || null,
                      description: room.description,
                      property: {
                        id: room.property.id,
                        name: room.property.name,
                        address: room.property.address,
                        city: room.property.city,
                        amenities: (room.property.amenities as string[]) || null,
                      },
                      monthlyRent: room.monthlyRent ? Number(room.monthlyRent) : 0,
                      securityDeposit: room.securityDeposit ? Number(room.securityDeposit) : 0,
                      beds: room.beds.map((bed) => ({
                        id: bed.id,
                        bedNumber: bed.bedNumber,
                        status: bed.status,
                      })),
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border bg-white p-12 text-center">
                <p className="text-lg font-medium text-muted-foreground">
                  No rooms match your filters
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

