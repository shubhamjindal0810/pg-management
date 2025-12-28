'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { roomSchema, type RoomInput } from '@/lib/validations';

export async function createRoom(data: RoomInput & { images?: string[]; multiBedPricing?: Record<string, number> }) {
  const validated = roomSchema.parse(data);

  const room = await db.room.create({
    data: {
      propertyId: validated.propertyId,
      roomNumber: validated.roomNumber,
      floor: validated.floor,
      roomType: validated.roomType,
      hasAc: validated.hasAc,
      hasAttachedBath: validated.hasAttachedBath,
      acCharge: validated.acCharge || 0,
      multiBedPricing: data.multiBedPricing || undefined,
      description: validated.description || null,
      amenities: validated.amenities || [],
      images: data.images && data.images.length > 0 ? data.images : undefined,
    },
  });

  revalidatePath('/dashboard/rooms');
  revalidatePath('/dashboard');
  redirect(`/dashboard/rooms/${room.id}`);
}

export async function updateRoom(id: string, data: RoomInput & { images?: string[]; multiBedPricing?: Record<string, number> }) {
  const validated = roomSchema.parse(data);

  await db.room.update({
    where: { id },
    data: {
      propertyId: validated.propertyId,
      roomNumber: validated.roomNumber,
      floor: validated.floor,
      roomType: validated.roomType,
      hasAc: validated.hasAc,
      hasAttachedBath: validated.hasAttachedBath,
      acCharge: validated.acCharge || 0,
      multiBedPricing: data.multiBedPricing !== undefined ? data.multiBedPricing : undefined,
      description: validated.description || null,
      amenities: validated.amenities || [],
      images: data.images !== undefined ? data.images : undefined,
    },
  });

  revalidatePath('/dashboard/rooms');
  revalidatePath(`/dashboard/rooms/${id}`);
  revalidatePath('/dashboard');
}

export async function deleteRoom(id: string) {
  // Check if room has any occupied beds
  const room = await db.room.findUnique({
    where: { id },
    include: {
      beds: {
        where: { status: 'OCCUPIED' },
      },
    },
  });

  if (room?.beds.length && room.beds.length > 0) {
    throw new Error('Cannot delete room with occupied beds');
  }

  await db.room.delete({
    where: { id },
  });

  revalidatePath('/dashboard/rooms');
  revalidatePath('/dashboard');
  redirect('/dashboard/rooms');
}
