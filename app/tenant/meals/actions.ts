'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function updateMealSubscriptions(data: {
  tenantId: string;
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    throw new Error('Unauthorized');
  }

  // Verify tenant owns this subscription
  if (session.user.tenantId !== data.tenantId) {
    throw new Error('Unauthorized');
  }

  await db.tenant.update({
    where: { id: data.tenantId },
    data: {
      breakfastSubscribed: data.breakfast,
      lunchSubscribed: data.lunch,
      dinnerSubscribed: data.dinner,
    },
  });

  revalidatePath('/tenant/meals');
  revalidatePath('/tenant');
}

