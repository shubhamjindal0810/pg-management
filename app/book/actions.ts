'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';

export async function createBooking(data: {
  bedIds: string[];
  name: string;
  email?: string;
  phone: string;
  requestedCheckin: string;
  durationMonths?: number;
  durationDays?: number;
  expectedCheckout?: string;
  acSelected?: boolean;
  breakfastSelected?: boolean;
  lunchSelected?: boolean;
  dinnerSelected?: boolean;
  advanceAmount?: number;
  notes?: string;
}) {
  if (data.bedIds.length === 0) {
    throw new Error('At least one bed must be selected');
  }

  // Check if all beds are still available
  const beds = await db.bed.findMany({
    where: { id: { in: data.bedIds } },
    include: { room: true },
  });

  if (beds.length !== data.bedIds.length) {
    throw new Error('One or more selected beds are no longer available');
  }

  // Verify all beds are in the same room
  const roomIds = Array.from(new Set(beds.map((b) => b.room.id)));
  if (roomIds.length > 1) {
    throw new Error('All beds must be in the same room');
  }

  // Check if beds are available
  const unavailableBeds = beds.filter((b) => b.status !== 'AVAILABLE');
  if (unavailableBeds.length > 0) {
    throw new Error('One or more selected beds are no longer available');
  }

  // Create booking with primary bed (first one)
  const booking = await db.booking.create({
    data: {
      bedId: data.bedIds[0], // Primary bed for backward compatibility
      name: data.name,
      email: data.email || null,
      phone: data.phone,
      requestedCheckin: new Date(data.requestedCheckin),
      durationMonths: data.durationMonths || (data.durationDays ? Math.ceil(data.durationDays / 30) : 1),
      expectedCheckout: data.expectedCheckout ? new Date(data.expectedCheckout) : null,
      acSelected: data.acSelected || false,
      breakfastSelected: data.breakfastSelected || false,
      lunchSelected: data.lunchSelected || false,
      dinnerSelected: data.dinnerSelected || false,
      advanceAmount: data.advanceAmount || null,
      advancePaid: !!data.advanceAmount,
      status: 'pending',
      adminNotes: data.notes || null,
      // Create BookingBed entries for all selected beds
      bookingBeds: {
        create: data.bedIds.map((bedId) => ({
          bedId,
        })),
      },
    },
  });

  revalidatePath('/');
  revalidatePath('/book');
}

