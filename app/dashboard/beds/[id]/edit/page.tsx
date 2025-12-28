import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { PageHeader } from '@/components/dashboard/page-header';
import { BedForm } from '@/components/forms/bed-form';

async function getBed(id: string) {
  const bed = await db.bed.findUnique({
    where: { id },
    include: {
      room: {
        include: {
          property: {
            select: { name: true },
          },
        },
      },
    },
  });

  return bed;
}

async function getRooms() {
  return db.room.findMany({
    include: {
      property: {
        select: { name: true },
      },
    },
    where: { isActive: true },
    orderBy: [{ property: { name: 'asc' } }, { roomNumber: 'asc' }],
  });
}

export default async function EditBedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [bed, rooms] = await Promise.all([getBed(id), getRooms()]);

  if (!bed) {
    notFound();
  }

  const roomsData = rooms.map((room) => ({
    id: room.id,
    roomNumber: room.roomNumber,
    property: {
      name: room.property.name,
    },
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Bed"
        description={`Editing Bed ${bed.bedNumber}`}
      />
      <BedForm
        rooms={roomsData}
        bed={{
          id: bed.id,
          roomId: bed.roomId,
          bedNumber: bed.bedNumber,
          monthlyRent: Number(bed.monthlyRent),
          securityDeposit: Number(bed.securityDeposit),
          status: bed.status,
          description: bed.description,
          images: (bed.images as string[]) || null,
        }}
      />
    </div>
  );
}

