'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { BillStatus, BillItemType, PaymentMethod, PaymentStatus } from '@prisma/client';

export async function createBill(data: {
  tenantId: string;
  billingMonth: string;
  dueDate: string;
  notes?: string;
}) {
  const session = await getServerSession(authOptions);
  
  // Get tenant's bed and room for rent amount
  const tenant = await db.tenant.findUnique({
    where: { id: data.tenantId },
    include: {
      bed: {
        include: {
          room: true,
        },
      },
    },
  });

  if (!tenant || !tenant.bed || !tenant.bed.room) {
    throw new Error('Tenant, bed, or room not found');
  }

  const billingMonth = new Date(data.billingMonth);
  
  // Check if bill already exists for this month
  const existingBill = await db.bill.findUnique({
    where: {
      tenantId_billingMonth: {
        tenantId: data.tenantId,
        billingMonth,
      },
    },
  });

  if (existingBill) {
    throw new Error('Bill already exists for this month');
  }

  const rent = Number(tenant.bed.room.monthlyRent || 0);

  const bill = await db.bill.create({
    data: {
      tenantId: data.tenantId,
      createdById: session?.user?.id,
      billingMonth,
      dueDate: new Date(data.dueDate),
      totalAmount: rent,
      notes: data.notes,
      status: 'DRAFT',
      lineItems: {
        create: {
          itemType: 'RENT',
          description: `Monthly Rent - ${billingMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}`,
          quantity: 1,
          unitPrice: rent,
          amount: rent,
        },
      },
    },
  });

  revalidatePath('/dashboard/billing');
  redirect(`/dashboard/billing/${bill.id}`);
}

export async function addLineItem(data: {
  billId: string;
  itemType: BillItemType;
  description: string;
  quantity: number;
  unitPrice: number;
}) {
  const amount = data.quantity * data.unitPrice;

  await db.$transaction(async (tx) => {
    // Add line item
    await tx.billLineItem.create({
      data: {
        billId: data.billId,
        itemType: data.itemType,
        description: data.description,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        amount,
      },
    });

    // Update bill total
    const bill = await tx.bill.findUnique({
      where: { id: data.billId },
      include: { lineItems: true },
    });

    const newTotal = bill!.lineItems.reduce((sum, item) => sum + Number(item.amount), 0) + amount;

    await tx.bill.update({
      where: { id: data.billId },
      data: { totalAmount: newTotal },
    });
  });

  revalidatePath(`/dashboard/billing/${data.billId}`);
}

export async function removeLineItem(lineItemId: string, billId: string) {
  await db.$transaction(async (tx) => {
    const lineItem = await tx.billLineItem.delete({
      where: { id: lineItemId },
    });

    // Update bill total
    const bill = await tx.bill.findUnique({
      where: { id: billId },
      include: { lineItems: true },
    });

    const newTotal = bill!.lineItems.reduce((sum, item) => sum + Number(item.amount), 0);

    await tx.bill.update({
      where: { id: billId },
      data: { totalAmount: newTotal },
    });
  });

  revalidatePath(`/dashboard/billing/${billId}`);
}

export async function sendBill(billId: string) {
  await db.bill.update({
    where: { id: billId },
    data: {
      status: 'SENT',
      sentAt: new Date(),
    },
  });

  // TODO: Send notification (SMS/WhatsApp/Email)

  revalidatePath(`/dashboard/billing/${billId}`);
  revalidatePath('/dashboard/billing');
}

export async function recordPayment(data: {
  billId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionDate: string;
  reference?: string;
  notes?: string;
}) {
  const session = await getServerSession(authOptions);

  const bill = await db.bill.findUnique({
    where: { id: data.billId },
  });

  if (!bill) {
    throw new Error('Bill not found');
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
    // Create payment record
    await tx.payment.create({
      data: {
        billId: data.billId,
        tenantId: bill.tenantId,
        recordedById: session?.user?.id,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        status: 'SUCCESS',
        transactionDate: new Date(data.transactionDate),
        reference: data.reference,
        notes: data.notes,
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

  revalidatePath(`/dashboard/billing/${data.billId}`);
  revalidatePath('/dashboard/billing');
  revalidatePath('/dashboard');
}

export async function addElectricityCharge(data: {
  billId: string;
  bedId: string;
  previousReading: number;
  currentReading: number;
  ratePerUnit: number;
}) {
  const unitsConsumed = data.currentReading - data.previousReading;
  const totalAmount = unitsConsumed * data.ratePerUnit;

  await db.$transaction(async (tx) => {
    // Create electricity reading record
    await tx.electricityReading.create({
      data: {
        bedId: data.bedId,
        readingDate: new Date(),
        previousReading: data.previousReading,
        currentReading: data.currentReading,
        unitsConsumed,
        ratePerUnit: data.ratePerUnit,
        totalAmount,
        addedToBillId: data.billId,
      },
    });

    // Add line item to bill
    await tx.billLineItem.create({
      data: {
        billId: data.billId,
        itemType: 'ELECTRICITY',
        description: `Electricity: ${unitsConsumed} units @ ₹${data.ratePerUnit}/unit`,
        quantity: unitsConsumed,
        unitPrice: data.ratePerUnit,
        amount: totalAmount,
      },
    });

    // Update bill total
    const bill = await tx.bill.findUnique({
      where: { id: data.billId },
    });

    await tx.bill.update({
      where: { id: data.billId },
      data: {
        totalAmount: Number(bill!.totalAmount) + totalAmount,
      },
    });
  });

  revalidatePath(`/dashboard/billing/${data.billId}`);
}

export async function markAsOverdue(billId: string) {
  await db.bill.update({
    where: { id: billId },
    data: { status: 'OVERDUE' },
  });

  revalidatePath(`/dashboard/billing/${billId}`);
  revalidatePath('/dashboard/billing');
}

export async function applyLateFee(billId: string, amount: number) {
  await db.$transaction(async (tx) => {
    // Add late fee line item
    await tx.billLineItem.create({
      data: {
        billId,
        itemType: 'LATE_FEE',
        description: 'Late Payment Fee',
        quantity: 1,
        unitPrice: amount,
        amount,
      },
    });

    // Update bill
    const bill = await tx.bill.findUnique({
      where: { id: billId },
    });

    await tx.bill.update({
      where: { id: billId },
      data: {
        totalAmount: Number(bill!.totalAmount) + amount,
        lateFeeApplied: Number(bill!.lateFeeApplied) + amount,
      },
    });
  });

  revalidatePath(`/dashboard/billing/${billId}`);
}

export async function cancelBill(billId: string) {
  const bill = await db.bill.findUnique({
    where: { id: billId },
    include: { payments: true },
  });

  if (bill?.payments.length && bill.payments.length > 0) {
    throw new Error('Cannot cancel bill with recorded payments');
  }

  await db.bill.update({
    where: { id: billId },
    data: { status: 'CANCELLED' },
  });

  revalidatePath(`/dashboard/billing/${billId}`);
  revalidatePath('/dashboard/billing');
}
