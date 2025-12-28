'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { roomSchema, type RoomInput } from '@/lib/validations';

export async function createRoom(data: RoomInput & { images?: string[]; multiBedPricing?: Record<string, number> }) {
  const validated = roomSchema.parse(data);

  // Determine number of beds based on room type
  const bedCountMap: Record<string, number> = {
    single: 1,
    double: 2,
    triple: 3,
    dormitory: 4,
  };
  const bedCount = bedCountMap[validated.roomType] || 1;

  // Generate bed letters (A, B, C, D, etc.)
  const bedLetters = Array.from({ length: bedCount }, (_, i) => String.fromCharCode(65 + i)); // A, B, C, D

  const room = await db.room.create({
    data: {
      propertyId: validated.propertyId,
      roomNumber: validated.roomNumber,
      floor: validated.floor,
      roomType: validated.roomType,
      hasAc: validated.hasAc,
      hasAttachedBath: validated.hasAttachedBath,
      hasBalcony: validated.hasBalcony,
      monthlyRent: validated.monthlyRent !== undefined ? validated.monthlyRent : null,
      securityDeposit: validated.securityDeposit !== undefined ? validated.securityDeposit : 0,
      dailyPrice: validated.dailyPrice || null,
      multiBedPricing: data.multiBedPricing || undefined,
      description: validated.description || null,
      amenities: validated.amenities || [],
      images: data.images && data.images.length > 0 ? data.images : undefined,
      // Auto-create beds
      beds: {
        create: bedLetters.map((letter) => ({
          bedNumber: letter,
          status: 'AVAILABLE',
        })),
      },
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
      hasBalcony: validated.hasBalcony,
      monthlyRent: validated.monthlyRent !== undefined ? validated.monthlyRent : null,
      securityDeposit: validated.securityDeposit !== undefined ? validated.securityDeposit : 0,
      dailyPrice: validated.dailyPrice || null,
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
