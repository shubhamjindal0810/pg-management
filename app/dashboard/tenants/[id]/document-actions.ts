'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';

export async function verifyDocument(documentId: string) {
  await db.tenantDocument.update({
    where: { id: documentId },
    data: {
      isVerified: true,
      verifiedAt: new Date(),
    },
  });

  // Get tenant ID for revalidation
  const document = await db.tenantDocument.findUnique({
    where: { id: documentId },
    select: { tenantId: true },
  });

  if (document) {
    revalidatePath(`/dashboard/tenants/${document.tenantId}`);
    revalidatePath('/dashboard/tenants');
  }
}

export async function rejectDocument(documentId: string) {
  // Get tenant ID before deleting
  const document = await db.tenantDocument.findUnique({
    where: { id: documentId },
    select: { tenantId: true },
  });

  await db.tenantDocument.delete({
    where: { id: documentId },
  });

  if (document) {
    revalidatePath(`/dashboard/tenants/${document.tenantId}`);
    revalidatePath('/dashboard/tenants');
  }
}

