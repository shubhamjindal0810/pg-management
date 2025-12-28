import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { PageHeader } from '@/components/dashboard/page-header';
import { TenantForm } from '@/components/forms/tenant-form';

async function getAvailableBeds() {
  return db.bed.findMany({
    where: { status: 'AVAILABLE' },
    include: {
      room: {
        include: {
          property: {
            select: { name: true },
          },
        },
      },
    },
    orderBy: [
      { room: { property: { name: 'asc' } } },
      { room: { roomNumber: 'asc' } },
      { bedNumber: 'asc' },
    ],
  });
}

export default async function NewTenantPage() {
  const availableBeds = await getAvailableBeds();

  if (availableBeds.length === 0) {
    redirect('/dashboard/tenants');
  }

  // Transform Decimal to number for client component
  const beds = availableBeds.map((bed) => ({
    ...bed,
    monthlyRent: Number(bed.monthlyRent),
    securityDeposit: Number(bed.securityDeposit),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Tenant"
        description="Add a new tenant to your PG"
      />
      <TenantForm availableBeds={beds} />
    </div>
  );
}
