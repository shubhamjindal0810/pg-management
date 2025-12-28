import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { RoomDetailView } from './room-detail-view';
import { RoomBookingCard } from './room-booking-card';

async function getRoomDetails(roomId: string) {
  const room = await db.room.findUnique({
    where: { id: roomId },
    include: {
      property: {
        select: {
          id: true,
          name: true,
          address: true,
          city: true,
          state: true,
          amenities: true,
          rules: true,
          images: true,
          description: true,
        },
      },
      beds: {
        where: { status: 'AVAILABLE' },
        orderBy: { bedNumber: 'asc' },
      },
    },
  });

  return room;
}

export default async function RoomDetailPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  const room = await getRoomDetails(roomId);

  if (!room) {
    notFound();
  }

  if (room.beds.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <h1 className="text-2xl font-bold mb-2">No Beds Available</h1>
            <p className="text-muted-foreground mb-4">
              All beds in this room are currently occupied.
            </p>
            <a href="/public/browse" className="text-primary hover:underline">
              Browse other rooms
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
          {/* Main Content */}
          <div>
            <RoomDetailView
              room={{
                ...room,
                acCharge: room.acCharge ? Number(room.acCharge) : null,
                multiBedPricing: (room.multiBedPricing as Record<string, number>) || null,
                images: (room.images as string[]) || null,
                property: {
                  ...room.property,
                  amenities: (room.property.amenities as string[]) || null,
                  rules: (room.property.rules as string[]) || null,
                  images: (room.property.images as string[]) || null,
                },
                beds: room.beds.map((bed) => ({
                  id: bed.id,
                  bedNumber: bed.bedNumber,
                  monthlyRent: Number(bed.monthlyRent),
                  securityDeposit: Number(bed.securityDeposit),
                  images: (bed.images as string[]) || null,
                  description: bed.description,
                })),
              }}
            />
          </div>

          {/* Booking Card - Sticky */}
          <div className="lg:sticky lg:top-8 lg:h-fit">
            <RoomBookingCard
              room={{
                id: room.id,
                roomNumber: room.roomNumber,
                roomType: room.roomType,
                hasAc: room.hasAc,
                acCharge: room.acCharge ? Number(room.acCharge) : null,
                multiBedPricing: (room.multiBedPricing as Record<string, number>) || null,
                beds: room.beds.map((bed) => ({
                  id: bed.id,
                  bedNumber: bed.bedNumber,
                  monthlyRent: Number(bed.monthlyRent),
                  securityDeposit: Number(bed.securityDeposit),
                })),
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

