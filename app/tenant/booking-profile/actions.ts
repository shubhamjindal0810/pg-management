'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DocumentType } from '@prisma/client';

export async function updateBookingProfile(
  tenantId: string,
  data: {
    dateOfBirth?: string;
    gender?: string;
    bloodGroup?: string;
    occupation?: string;
    workplaceCollege?: string;
    workAddress?: string;
    emergencyName?: string;
    emergencyPhone?: string;
    emergencyRelation?: string;
    notes?: string;
  }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  // Verify tenant belongs to user
  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    include: {
      user: true,
    },
  });

  if (!tenant || tenant.userId !== session.user.id) {
    throw new Error('Unauthorized');
  }

  // Verify user has an approved booking
  const booking = await db.booking.findFirst({
    where: {
      userId: session.user.id,
      status: 'approved',
    },
  });

  if (!booking) {
    throw new Error('No approved booking found');
  }

  await db.tenant.update({
    where: { id: tenantId },
    data: {
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      gender: data.gender || null,
      bloodGroup: data.bloodGroup || null,
      occupation: (data.occupation as 'working' | 'student') || null,
      workplaceCollege: data.workplaceCollege || null,
      workAddress: data.workAddress || null,
      emergencyName: data.emergencyName || null,
      emergencyPhone: data.emergencyPhone || null,
      emergencyRelation: data.emergencyRelation || null,
      notes: data.notes || null,
    },
  });

  revalidatePath('/tenant/booking-profile');
  revalidatePath('/tenant');
}

export async function uploadBookingDocument(data: {
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

  // Verify user has an approved booking
  const booking = await db.booking.findFirst({
    where: {
      userId: session.user.id,
      status: 'approved',
    },
  });

  if (!booking) {
    throw new Error('No approved booking found');
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

  revalidatePath('/tenant/booking-profile');
  revalidatePath('/tenant');
}

