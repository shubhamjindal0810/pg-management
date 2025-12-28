import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { PageHeader } from '@/components/dashboard/page-header';
import { BedForm } from '@/components/forms/bed-form';

async function getRooms() {
  return db.room.findMany({
    where: { isActive: true },
    select: {
      id: true,
      roomNumber: true,
      property: {
        select: { name: true },
      },
    },
    orderBy: [{ property: { name: 'asc' } }, { roomNumber: 'asc' }],
  });
}

export default async function NewBedPage() {
  const rooms = await getRooms();

  if (rooms.length === 0) {
    redirect('/dashboard/rooms/new');
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Bed"
        description="Add a new bed to a room"
      />
      <BedForm rooms={rooms} />
    </div>
  );
}
