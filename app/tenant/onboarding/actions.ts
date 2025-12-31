'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DocumentType } from '@prisma/client';

export async function uploadDocument(data: {
  tenantId: string;
  documentType: DocumentType;
  documentNumber: string;
  fileData: string; // Vercel Blob URL
  fileName: string;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  // Verify tenant belongs to user
  const tenant = await db.tenant.findUnique({
    where: { id: data.tenantId },
  });

  if (!tenant || tenant.userId !== session.user.id) {
    throw new Error('Unauthorized');
  }

  // fileData is now a Vercel Blob URL (not base64)
  const fileUrl = data.fileData;

  await db.tenantDocument.create({
    data: {
      tenantId: data.tenantId,
      documentType: data.documentType,
      documentNumber: data.documentNumber,
      fileUrl,
      fileName: data.fileName,
      isVerified: false, // Admin needs to verify
    },
  });

  revalidatePath('/tenant/onboarding');
  revalidatePath('/tenant');
}

