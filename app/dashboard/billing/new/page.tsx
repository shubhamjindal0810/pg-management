import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { PageHeader } from '@/components/dashboard/page-header';
import { BillForm } from '@/components/forms/bill-form';

async function getActiveTenants() {
  return db.tenant.findMany({
    where: { status: 'ACTIVE' },
    include: {
      user: { select: { name: true } },
      bed: {
        include: {
          room: {
            select: { 
              roomNumber: true,
              monthlyRent: true,
            },
          },
        },
      },
    },
    orderBy: { user: { name: 'asc' } },
  });
}

export default async function NewBillPage() {
  const tenants = await getActiveTenants();

  if (tenants.length === 0) {
    redirect('/dashboard/billing');
  }

  // Transform for client
  const tenantsData = tenants.map((t) => ({
    id: t.id,
    name: t.user.name,
    room: t.bed?.room.roomNumber || '',
    bed: t.bed?.bedNumber || '',
    rent: t.bed?.room ? Number(t.bed.room.monthlyRent || 0) : 0,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Bill"
        description="Generate a new bill for a tenant"
      />
      <BillForm tenants={tenantsData} />
    </div>
  );
}
