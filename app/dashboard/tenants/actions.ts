'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { tenantSchema, type TenantInput } from '@/lib/validations';

export async function createTenant(data: TenantInput) {
  const validated = tenantSchema.parse(data);

  // Check if phone already exists
  const existingUser = await db.user.findUnique({
    where: { phone: validated.phone },
  });

  if (existingUser) {
    throw new Error('A user with this phone number already exists');
  }

  // Check if bed is available
  const bed = await db.bed.findUnique({
    where: { id: validated.bedId },
  });

  if (!bed || bed.status !== 'AVAILABLE') {
    throw new Error('Selected bed is not available');
  }

  // Create user and tenant in transaction
  const result = await db.$transaction(async (tx) => {
    // Create user with default password (phone number)
    const passwordHash = await hashPassword(validated.phone);
    
    const user = await tx.user.create({
      data: {
        name: validated.name,
        phone: validated.phone,
        email: validated.email || null,
        passwordHash,
        role: 'TENANT',
      },
    });

    // Create tenant
    const tenant = await tx.tenant.create({
      data: {
        userId: user.id,
        bedId: validated.bedId,
        dateOfBirth: validated.dateOfBirth ? new Date(validated.dateOfBirth) : null,
        gender: validated.gender || null,
        bloodGroup: validated.bloodGroup || null,
        emergencyName: validated.emergencyName || null,
        emergencyPhone: validated.emergencyPhone || null,
        emergencyRelation: validated.emergencyRelation || null,
        occupation: validated.occupation || null,
        workplaceCollege: validated.workplaceCollege || null,
        workAddress: validated.workAddress || null,
        checkInDate: validated.checkInDate ? new Date(validated.checkInDate) : null,
        expectedCheckout: validated.expectedCheckout ? new Date(validated.expectedCheckout) : null,
        noticePeriodDays: validated.noticePeriodDays,
        notes: validated.notes || null,
        status: 'ACTIVE',
      },
    });

    // Update bed status to occupied
    await tx.bed.update({
      where: { id: validated.bedId },
      data: { status: 'OCCUPIED' },
    });

    return tenant;
  });

  revalidatePath('/dashboard/tenants');
  revalidatePath('/dashboard/beds');
  revalidatePath('/dashboard');
  redirect(`/dashboard/tenants/${result.id}`);
}

export async function updateTenant(id: string, data: Partial<TenantInput>) {
  const tenant = await db.tenant.findUnique({
    where: { id },
    include: { user: true },
  });

  if (!tenant) {
    throw new Error('Tenant not found');
  }

  await db.$transaction(async (tx) => {
    // Update user info if provided
    if (data.name || data.email) {
      await tx.user.update({
        where: { id: tenant.userId },
        data: {
          name: data.name,
          email: data.email || null,
        },
      });
    }

    // Update tenant info
    await tx.tenant.update({
      where: { id },
      data: {
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        gender: data.gender,
        bloodGroup: data.bloodGroup,
        emergencyName: data.emergencyName,
        emergencyPhone: data.emergencyPhone,
        emergencyRelation: data.emergencyRelation,
        occupation: data.occupation,
        workplaceCollege: data.workplaceCollege,
        workAddress: data.workAddress,
        expectedCheckout: data.expectedCheckout ? new Date(data.expectedCheckout) : undefined,
        noticePeriodDays: data.noticePeriodDays,
        notes: data.notes,
      },
    });
  });

  revalidatePath('/dashboard/tenants');
  revalidatePath(`/dashboard/tenants/${id}`);
}

export async function giveNotice(id: string) {
  const tenant = await db.tenant.findUnique({
    where: { id },
  });

  if (!tenant) {
    throw new Error('Tenant not found');
  }

  const noticeDate = new Date();
  const expectedCheckout = new Date();
  expectedCheckout.setDate(expectedCheckout.getDate() + tenant.noticePeriodDays);

  await db.tenant.update({
    where: { id },
    data: {
      status: 'NOTICE_PERIOD',
      noticeGivenDate: noticeDate,
      expectedCheckout,
    },
  });

  revalidatePath('/dashboard/tenants');
  revalidatePath(`/dashboard/tenants/${id}`);
  revalidatePath('/dashboard');
}

export async function checkoutTenant(id: string, checkoutDate: string) {
  const tenant = await db.tenant.findUnique({
    where: { id },
    include: { bed: true },
  });

  if (!tenant) {
    throw new Error('Tenant not found');
  }

  await db.$transaction(async (tx) => {
    // Update tenant status
    await tx.tenant.update({
      where: { id },
      data: {
        status: 'CHECKED_OUT',
        actualCheckout: new Date(checkoutDate),
        bedId: null, // Unassign bed
      },
    });

    // Make bed available again
    if (tenant.bedId) {
      await tx.bed.update({
        where: { id: tenant.bedId },
        data: { status: 'AVAILABLE' },
      });
    }
  });

  revalidatePath('/dashboard/tenants');
  revalidatePath(`/dashboard/tenants/${id}`);
  revalidatePath('/dashboard/beds');
  revalidatePath('/dashboard');
}

export async function changeBed(tenantId: string, newBedId: string) {
  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
  });

  if (!tenant) {
    throw new Error('Tenant not found');
  }

  const newBed = await db.bed.findUnique({
    where: { id: newBedId },
  });

  if (!newBed || newBed.status !== 'AVAILABLE') {
    throw new Error('Selected bed is not available');
  }

  await db.$transaction(async (tx) => {
    // Free up old bed
    if (tenant.bedId) {
      await tx.bed.update({
        where: { id: tenant.bedId },
        data: { status: 'AVAILABLE' },
      });
    }

    // Assign new bed
    await tx.tenant.update({
      where: { id: tenantId },
      data: { bedId: newBedId },
    });

    await tx.bed.update({
      where: { id: newBedId },
      data: { status: 'OCCUPIED' },
    });
  });

  revalidatePath('/dashboard/tenants');
  revalidatePath(`/dashboard/tenants/${tenantId}`);
  revalidatePath('/dashboard/beds');
  revalidatePath('/dashboard');
}
