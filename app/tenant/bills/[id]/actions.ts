'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { BillStatus, PaymentMethod } from '@prisma/client';

export async function recordTenantPayment(data: {
  billId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  reference?: string;
  notes?: string;
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

  // Get bill and verify it belongs to this tenant
  const bill = await db.bill.findUnique({
    where: { id: data.billId },
  });

  if (!bill) {
    throw new Error('Bill not found');
  }

  if (bill.tenantId !== tenant.id) {
    throw new Error('Unauthorized: This bill does not belong to you');
  }

  const newPaidAmount = Number(bill.paidAmount) + data.amount;
  const totalAmount = Number(bill.totalAmount);

  let newStatus: BillStatus = bill.status;
  if (newPaidAmount >= totalAmount) {
    newStatus = 'PAID';
  } else if (newPaidAmount > 0) {
    newStatus = 'PARTIAL';
  }

  await db.$transaction(async (tx) => {
    // Create payment record (status will be PENDING until admin verifies)
    await tx.payment.create({
      data: {
        billId: data.billId,
        tenantId: tenant.id,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        status: 'PENDING', // Admin needs to verify
        transactionDate: new Date(),
        reference: data.reference || null,
        notes: data.notes || null,
      },
    });

    // Update bill
    await tx.bill.update({
      where: { id: data.billId },
      data: {
        paidAmount: newPaidAmount,
        status: newStatus,
      },
    });
  });

  revalidatePath(`/tenant/bills/${data.billId}`);
  revalidatePath('/tenant/bills');
  revalidatePath('/tenant');
}

