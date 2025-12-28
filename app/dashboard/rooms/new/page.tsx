import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { PageHeader } from '@/components/dashboard/page-header';
import { RoomForm } from '@/components/forms/room-form';

async function getProperties() {
  return db.property.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
}

export default async function NewRoomPage() {
  const properties = await getProperties();

  if (properties.length === 0) {
    redirect('/dashboard/properties/new');
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Room"
        description="Add a new room to your property"
      />
      <RoomForm properties={properties} />
    </div>
  );
}
