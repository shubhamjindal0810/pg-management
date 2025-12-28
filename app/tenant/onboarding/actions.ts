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
  fileData: string; // Base64 encoded
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

  // In production, upload to cloud storage (S3, Cloudinary, etc.)
  // For now, we'll store the base64 data
  // You should replace this with actual file upload logic
  const fileUrl = data.fileData; // This should be the cloud storage URL

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

