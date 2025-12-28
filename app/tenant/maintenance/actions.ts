'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { MaintenancePriority } from '@prisma/client';

export async function createMaintenanceRequest(data: {
  roomId: string;
  category: string;
  priority: string;
  description: string;
  images?: string[];
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  // Get tenant
  const tenant = await db.tenant.findUnique({
    where: { userId: session.user.id },
  });

  if (!tenant) {
    throw new Error('Tenant not found');
  }

  // Verify room belongs to tenant's bed
  if (tenant.bedId) {
    const bed = await db.bed.findUnique({
      where: { id: tenant.bedId },
      include: { room: true },
    });

    if (bed && bed.room.id !== data.roomId) {
      throw new Error('Unauthorized: Room does not belong to your bed');
    }
  }

  await db.maintenanceRequest.create({
    data: {
      tenantId: tenant.id,
      roomId: data.roomId,
      category: data.category,
      priority: data.priority as MaintenancePriority,
      description: data.description,
      images: data.images && data.images.length > 0 ? data.images : undefined,
      status: 'OPEN',
    },
  });

  revalidatePath('/tenant/maintenance');
  revalidatePath('/tenant');
}

