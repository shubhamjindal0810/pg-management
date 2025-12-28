'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { BedStatus } from '@prisma/client';

export async function approveBooking(bookingId: string, adminNotes?: string) {
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: { 
      bed: true,
      bookingBeds: {
        include: { bed: true },
      },
    },
  });

  if (!booking) {
    throw new Error('Booking not found');
  }

  if (booking.status !== 'pending') {
    throw new Error('Only pending bookings can be approved');
  }

  // Get all beds in this booking
  const bedsToReserve = booking.bookingBeds.length > 0
    ? booking.bookingBeds.map((bb) => bb.bed)
    : booking.bed ? [booking.bed] : [];

  // Check if all beds are still available
  const unavailableBeds = bedsToReserve.filter((b) => b.status !== 'AVAILABLE');
  if (unavailableBeds.length > 0) {
    throw new Error('One or more beds are no longer available');
  }

  await db.$transaction(async (tx) => {
    // Check if user already exists
    let user = await tx.user.findUnique({
      where: { phone: booking.phone },
    });

    // Create user account if it doesn't exist (so they can login to complete profile)
    if (!user) {
      const passwordHash = await hashPassword(booking.phone);
      user = await tx.user.create({
        data: {
          name: booking.name,
          phone: booking.phone,
          email: booking.email || null,
          passwordHash,
          role: 'TENANT', // They'll become a tenant after profile completion
        },
      });
    }

    // Update booking status and link to user
    await tx.booking.update({
      where: { id: bookingId },
      data: {
        status: 'approved',
        adminNotes: adminNotes || null,
        userId: user.id, // Link booking to user
      },
    });

    // Reserve all beds in the booking
    await tx.bed.updateMany({
      where: { id: { in: bedsToReserve.map((b) => b.id) } },
      data: { status: 'RESERVED' },
    });
  });

  revalidatePath('/dashboard/bookings');
  revalidatePath('/public');
}

export async function rejectBooking(bookingId: string, adminNotes?: string) {
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
  });

  if (!booking) {
    throw new Error('Booking not found');
  }

  if (booking.status !== 'pending') {
    throw new Error('Only pending bookings can be rejected');
  }

  await db.booking.update({
    where: { id: bookingId },
    data: {
      status: 'rejected',
      adminNotes: adminNotes || null,
    },
  });

  revalidatePath('/dashboard/bookings');
}

export async function convertBookingToTenant(bookingId: string) {
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: { 
      bed: true,
      bookingBeds: {
        include: { bed: true },
      },
      user: {
        include: {
          tenant: true,
        },
      },
    },
  });

  if (!booking) {
    throw new Error('Booking not found');
  }

  if (booking.status !== 'approved') {
    throw new Error('Only approved bookings can be converted to tenants');
  }

  if (!booking.userId || !booking.user) {
    throw new Error('Booking must have an associated user account. Please approve the booking first.');
  }

  // Get all beds in this booking
  const bedsToOccupy = booking.bookingBeds.length > 0
    ? booking.bookingBeds.map((bb) => bb.bed)
    : booking.bed ? [booking.bed] : [];

  // Check if all beds are still reserved
  const notReservedBeds = bedsToOccupy.filter((b) => b.status !== 'RESERVED');
  if (notReservedBeds.length > 0) {
    throw new Error('One or more beds are not reserved for this booking');
  }

  // Primary bed (first one) - this will be assigned to the tenant
  const primaryBed = bedsToOccupy[0];
  if (!primaryBed) {
    throw new Error('No beds found in booking');
  }

  await db.$transaction(async (tx) => {
    // Check if tenant profile already exists (created during profile completion)
    const existingTenant = await tx.tenant.findUnique({
      where: { userId: booking.userId! },
    });

    let tenant;
    
    if (existingTenant) {
      // Tenant profile already exists from profile completion
      // Just verify it's linked to the correct bed (primary bed) and update meal subscriptions
      await tx.tenant.update({
        where: { id: existingTenant.id },
        data: {
          bedId: primaryBed.id,
          // Update meal subscriptions from booking
          breakfastSubscribed: booking.breakfastSelected || existingTenant.breakfastSubscribed,
          lunchSubscribed: booking.lunchSelected || existingTenant.lunchSubscribed,
          dinnerSubscribed: booking.dinnerSelected || existingTenant.dinnerSubscribed,
        },
      });
      tenant = existingTenant;
    } else {
      // Create tenant using booking data (user hasn't completed profile yet)
      tenant = await tx.tenant.create({
        data: {
          userId: booking.userId!,
          bedId: primaryBed.id, // Assign primary bed to tenant
          checkInDate: booking.requestedCheckin,
          expectedCheckout: new Date(
            new Date(booking.requestedCheckin).setMonth(
              new Date(booking.requestedCheckin).getMonth() + booking.durationMonths
            )
          ),
          noticePeriodDays: 30,
          status: 'ACTIVE',
          // Copy meal selections from booking
          breakfastSubscribed: booking.breakfastSelected || false,
          lunchSubscribed: booking.lunchSelected || false,
          dinnerSubscribed: booking.dinnerSelected || false,
        },
      });
    }

    // Update all beds status to occupied
    await tx.bed.updateMany({
      where: { id: { in: bedsToOccupy.map((b) => b.id) } },
      data: { status: 'OCCUPIED' },
    });

    // Update booking status
    await tx.booking.update({
      where: { id: bookingId },
      data: { status: 'converted' },
    });
  });

  revalidatePath('/dashboard/bookings');
  revalidatePath('/dashboard/tenants');
  revalidatePath('/dashboard/beds');
  revalidatePath('/tenant');
}

