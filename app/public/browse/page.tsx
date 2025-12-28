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
  expectedCheckout?: string;
  maxRent?: number;
}) {
  const rooms = await db.room.findMany({
    where: {
      isActive: true,
      ...(filters?.hasAttachedBath !== undefined && {
        hasAttachedBath: filters.hasAttachedBath,
      }),
      // Don't filter by roomType here - we'll filter by available bed count instead
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

  // Filter rooms based on available beds for the requested date range and room type
  const checkInDate = filters?.checkInDate ? new Date(filters.checkInDate) : null;
  const expectedCheckout = filters?.expectedCheckout ? new Date(filters.expectedCheckout) : null;

  return rooms.filter((room) => {
    const totalBeds = room.beds.length;
    
    // Get available beds for the requested date range
    const availableBeds = room.beds.filter((bed) => {
      // Bed must be AVAILABLE status
      if (bed.status !== 'AVAILABLE') {
        return false;
      }

      // Check if bed is not booked during the requested stay period
      if (checkInDate || expectedCheckout) {
        const isBooked = bed.bookings.some((booking) => {
          const bookingCheckIn = new Date(booking.requestedCheckin);
          let bookingCheckOut: Date;
          
          // Calculate checkout date from durationMonths (expectedCheckout not yet in DB)
          bookingCheckOut = new Date(bookingCheckIn);
          bookingCheckOut.setMonth(bookingCheckOut.getMonth() + booking.durationMonths);
          
          // If both check-in and checkout dates are provided, check for overlap
          if (checkInDate && expectedCheckout) {
            // Check if the requested stay overlaps with any existing booking
            return (checkInDate < bookingCheckOut && expectedCheckout > bookingCheckIn);
          }
          // If only check-in date is provided, check if it falls within any booking
          else if (checkInDate) {
            return checkInDate >= bookingCheckIn && checkInDate < bookingCheckOut;
          }
          // If only checkout date is provided, check if it falls within any booking
          else if (expectedCheckout) {
            return expectedCheckout > bookingCheckIn && expectedCheckout <= bookingCheckOut;
          }
          
          return false;
        });
        return !isBooked;
      }
      // If no date filter, bed is available if status is AVAILABLE
      return true;
    });

    // Apply room type filter logic
    if (filters?.roomType === 'single') {
      // Single: shows rooms where all beds are available (regardless of total bed count)
      return availableBeds.length === totalBeds && totalBeds > 0;
    } else if (filters?.roomType === 'double') {
      // Double: shows rooms with a total of 2 beds where at least 1 is available
      return totalBeds === 2 && availableBeds.length >= 1;
    } else if (filters?.roomType === 'triple') {
      // Triple: shows rooms with a total of 3 beds, where at least 1 is available
      return totalBeds === 3 && availableBeds.length >= 1;
    } else if (filters?.roomType === 'dormitory') {
      // Dormitory: shows rooms with at least 4 total beds where at least 1 is available
      return totalBeds >= 4 && availableBeds.length >= 1;
    }

    // If no room type filter, show rooms with at least one available bed
    return availableBeds.length > 0;
  });
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
    expectedCheckout?: string;
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
    expectedCheckout: params.expectedCheckout,
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

