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
          acMonthlyRent: true,
          acSecurityDeposit: true,
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
          <BookingCheckout
            room={{
              ...room,
              dailyPrice: room.dailyPrice ? Number(room.dailyPrice) : null,
              multiBedPricing: room.multiBedPricing as Record<string, number> | null,
              beds: room.beds.map((bed) => ({
                id: bed.id,
                bedNumber: bed.bedNumber,
                images: (bed.images as string[]) || null,
              })),
              monthlyRent: room.monthlyRent ? Number(room.monthlyRent) : 0,
              securityDeposit: room.securityDeposit ? Number(room.securityDeposit) : 0,
              property: {
                id: room.property.id,
                name: room.property.name,
                address: room.property.address,
                city: room.property.city,
                amenities: (room.property.amenities as string[]) || null,
                rules: (room.property.rules as string[]) || null,
                images: (room.property.images as string[]) || null,
                breakfastEnabled: room.property.breakfastEnabled,
                breakfastPrice: room.property.breakfastPrice ? Number(room.property.breakfastPrice) : null,
                breakfastMenu: room.property.breakfastMenu,
                lunchEnabled: room.property.lunchEnabled,
                lunchPrice: room.property.lunchPrice ? Number(room.property.lunchPrice) : null,
                lunchMenu: room.property.lunchMenu,
                dinnerEnabled: room.property.dinnerEnabled,
                dinnerPrice: room.property.dinnerPrice ? Number(room.property.dinnerPrice) : null,
                dinnerMenu: room.property.dinnerMenu,
                acMonthlyRent: room.property.acMonthlyRent ? Number(room.property.acMonthlyRent) : null,
                acSecurityDeposit: room.property.acSecurityDeposit ? Number(room.property.acSecurityDeposit) : null,
              },
            }}
            selectedBedId={params.bedId}
          />
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
      redirect(`/book?roomId=${bed.roomId}&bedId=${params.bedId}`);
    }
  }

  // No room or bed specified - redirect to browse
  redirect('/browse');
}

