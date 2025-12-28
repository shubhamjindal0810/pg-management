'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { bedSchema, type BedInput } from '@/lib/validations';
import { BedStatus } from '@prisma/client';

export async function createBed(data: BedInput & { images?: string[] }) {
  const validated = bedSchema.parse(data);

  const bed = await db.bed.create({
    data: {
      roomId: validated.roomId,
      bedNumber: validated.bedNumber,
      status: validated.status as BedStatus,
      description: validated.description || null,
      images: data.images && data.images.length > 0 ? data.images : undefined,
    },
  });

  revalidatePath('/dashboard/beds');
  revalidatePath('/dashboard/rooms');
  revalidatePath('/dashboard');
  redirect(`/dashboard/beds/${bed.id}`);
}

export async function updateBed(id: string, data: BedInput & { images?: string[] }) {
  const validated = bedSchema.parse(data);

  await db.bed.update({
    where: { id },
    data: {
      roomId: validated.roomId,
      bedNumber: validated.bedNumber,
      status: validated.status as BedStatus,
      description: validated.description || null,
      images: data.images !== undefined ? data.images : undefined,
    },
  });

  revalidatePath('/dashboard/beds');
  revalidatePath(`/dashboard/beds/${id}`);
  revalidatePath('/dashboard/rooms');
  revalidatePath('/dashboard');
}

export async function updateBedStatus(id: string, status: BedStatus) {
  // Don't allow changing status to AVAILABLE if tenant is assigned
  if (status === 'AVAILABLE') {
    const bed = await db.bed.findUnique({
      where: { id },
      include: {
        tenants: {
          where: { status: 'ACTIVE' },
        },
      },
    });

    if (bed?.tenants.length && bed.tenants.length > 0) {
      throw new Error('Cannot mark bed as available while tenant is assigned');
    }
  }

  await db.bed.update({
    where: { id },
    data: { status },
  });

  revalidatePath('/dashboard/beds');
  revalidatePath(`/dashboard/beds/${id}`);
  revalidatePath('/dashboard');
}

export async function deleteBed(id: string) {
  // Check if bed has active tenant
  const bed = await db.bed.findUnique({
    where: { id },
    include: {
      tenants: {
        where: { status: 'ACTIVE' },
      },
    },
  });

  if (bed?.tenants.length && bed.tenants.length > 0) {
    throw new Error('Cannot delete bed with active tenant');
  }

  await db.bed.delete({
    where: { id },
  });

  revalidatePath('/dashboard/beds');
  revalidatePath('/dashboard/rooms');
  revalidatePath('/dashboard');
  redirect('/dashboard/beds');
}
