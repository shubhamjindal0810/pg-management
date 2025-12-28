'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PaymentMethod } from '@prisma/client';

export async function recordSecurityDeposit(data: {
  tenantId: string;
  amount: number;
  paidDate: string;
  paymentMethod: PaymentMethod;
  notes?: string;
}) {
  const session = await getServerSession(authOptions);

  await db.securityDeposit.create({
    data: {
      tenantId: data.tenantId,
      amountPaid: data.amount,
      paidDate: new Date(data.paidDate),
      paymentMethod: data.paymentMethod,
      notes: data.notes || null,
      status: 'held',
    },
  });

  revalidatePath(`/dashboard/tenants/${data.tenantId}`);
  revalidatePath('/dashboard/tenants');
}

export async function refundSecurityDeposit(data: {
  depositId: string;
  amount: number;
  refundDate: string;
  refundMethod: PaymentMethod;
  deductions?: Array<{ reason: string; amount: number }>;
  notes?: string;
}) {
  const deposit = await db.securityDeposit.findUnique({
    where: { id: data.depositId },
  });

  if (!deposit) {
    throw new Error('Security deposit not found');
  }

  const totalPaid = Number(deposit.amountPaid);
  const currentRefunded = Number(deposit.amountRefunded || 0);
  const deductionsTotal = data.deductions?.reduce((sum, d) => sum + d.amount, 0) || 0;
  const newRefunded = currentRefunded + data.amount;
  const totalDeductible = deductionsTotal;

  // Calculate status
  let status = 'held';
  if (newRefunded >= totalPaid - totalDeductible) {
    status = 'refunded';
  } else if (newRefunded > 0) {
    status = 'partially_refunded';
  }

  await db.securityDeposit.update({
    where: { id: data.depositId },
    data: {
      amountRefunded: newRefunded,
      refundDate: new Date(data.refundDate),
      refundMethod: data.refundMethod,
      deductions: data.deductions || null,
      status,
      notes: data.notes || deposit.notes,
    },
  });

  revalidatePath(`/dashboard/tenants/${deposit.tenantId}`);
  revalidatePath('/dashboard/tenants');
}

