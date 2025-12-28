import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { PageHeader } from '@/components/dashboard/page-header';
import { RoomForm } from '@/components/forms/room-form';

async function getRoom(id: string) {
  const room = await db.room.findUnique({
    where: { id },
    include: {
      property: {
        select: { id: true, name: true },
      },
    },
  });

  return room;
}

async function getProperties() {
  return db.property.findMany({
    select: { id: true, name: true },
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });
}

export default async function EditRoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [room, properties] = await Promise.all([getRoom(id), getProperties()]);

  if (!room) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Room"
        description={`Editing Room ${room.roomNumber}`}
      />
      <RoomForm
        properties={properties}
        room={{
          id: room.id,
          propertyId: room.propertyId,
          roomNumber: room.roomNumber,
          floor: room.floor,
          roomType: room.roomType,
          hasAc: room.hasAc,
          hasAttachedBath: room.hasAttachedBath,
          hasBalcony: room.hasBalcony,
          monthlyRent: room.monthlyRent ? Number(room.monthlyRent) : null,
          securityDeposit: room.securityDeposit ? Number(room.securityDeposit) : null,
          dailyPrice: room.dailyPrice ? Number(room.dailyPrice) : null,
          multiBedPricing: (room.multiBedPricing as Record<string, number>) || null,
          description: room.description,
          images: (room.images as string[]) || null,
        }}
      />
    </div>
  );
}

