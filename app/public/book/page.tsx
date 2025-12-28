import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { BookingCheckout } from './booking-checkout';

async function getRoomWithBeds(roomId: string) {
  const room = await db.room.findUnique({
    where: { id: roomId },
    include: {
      property: {
        select: {
          id: true,
          name: true,
          address: true,
          city: true,
          amenities: true,
          rules: true,
          images: true,
          breakfastEnabled: true,
          breakfastPrice: true,
          breakfastMenu: true,
          lunchEnabled: true,
          lunchPrice: true,
          lunchMenu: true,
          dinnerEnabled: true,
          dinnerPrice: true,
          dinnerMenu: true,
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

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ roomId?: string; bedId?: string }>;
}) {
  const params = await searchParams;

  // If roomId is provided, get that room's beds
  if (params.roomId) {
    const room = await getRoomWithBeds(params.roomId);
    if (!room) {
      notFound();
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <BookingCheckout room={room} selectedBedId={params.bedId} />
        </div>
      </div>
    );
  }

  // Legacy support: if bedId is provided, redirect to room page
  if (params.bedId) {
    const bed = await db.bed.findUnique({
      where: { id: params.bedId },
      select: { roomId: true },
    });

    if (bed) {
      redirect(`/public/book?roomId=${bed.roomId}&bedId=${params.bedId}`);
    }
  }

  // No room or bed specified - redirect to browse
  redirect('/public/browse');
}

