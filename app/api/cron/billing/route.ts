import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { headers } from 'next/headers';

// This endpoint should be called by a cron job service (e.g., Vercel Cron, cron-job.org)
// It generates bills for all active tenants on the 1st of each month
export async function GET(request: Request) {
  // Verify the request is from a cron service (add your secret)
  const headersList = headers();
  const authHeader = headersList.get('authorization');

  // In production, use a secret token
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }

  try {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Only run on the 1st of the month
    if (today.getDate() !== 1) {
      return NextResponse.json({
        message: 'Not the first of the month. Skipping billing generation.',
      });
    }

    // Get all active tenants with beds
    const activeTenants = await db.tenant.findMany({
      where: {
        status: 'ACTIVE',
        bedId: { not: null },
      },
      include: {
        bed: true,
      },
    });

    const billsCreated = [];
    const errors = [];

    for (const tenant of activeTenants) {
      try {
        // Check if bill already exists for this month
        const existingBill = await db.bill.findUnique({
          where: {
            tenantId_billingMonth: {
              tenantId: tenant.id,
              billingMonth: firstDayOfMonth,
            },
          },
        });

        if (existingBill) {
          continue; // Skip if bill already exists
        }

        if (!tenant.bed) {
          errors.push(`Tenant ${tenant.id} has no bed assigned`);
          continue;
        }

        const rent = Number(tenant.bed.monthlyRent);
        const dueDate = new Date(firstDayOfMonth);
        dueDate.setDate(dueDate.getDate() + 5); // Due date is 5th of the month

        // Create bill
        const bill = await db.bill.create({
          data: {
            tenantId: tenant.id,
            billingMonth: firstDayOfMonth,
            dueDate,
            totalAmount: rent,
            status: 'DRAFT',
            lineItems: {
              create: {
                itemType: 'RENT',
                description: `Monthly Rent - ${firstDayOfMonth.toLocaleDateString('en-IN', {
                  month: 'long',
                  year: 'numeric',
                })}`,
                quantity: 1,
                unitPrice: rent,
                amount: rent,
              },
            },
          },
        });

        billsCreated.push(bill.id);
      } catch (error: any) {
        errors.push(`Error creating bill for tenant ${tenant.id}: ${error.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Billing generation completed. Created ${billsCreated.length} bills.`,
      billsCreated: billsCreated.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to generate bills', message: error.message },
      { status: 500 }
    );
  }
}

