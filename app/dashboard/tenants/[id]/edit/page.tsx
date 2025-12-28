import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { PageHeader } from '@/components/dashboard/page-header';
import { TenantForm } from '@/components/forms/tenant-form';

async function getTenant(id: string) {
  const tenant = await db.tenant.findUnique({
    where: { id },
    include: {
      user: {
        select: { name: true, phone: true, email: true },
      },
      bed: {
        select: {
          id: true,
          bedNumber: true,
          monthlyRent: true,
          securityDeposit: true,
          room: {
            include: {
              property: {
                select: { name: true },
              },
            },
          },
        },
      },
    },
  });

  return tenant;
}

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
    orderBy: [{ room: { property: { name: 'asc' } } }, { room: { roomNumber: 'asc' } }, { bedNumber: 'asc' }],
  });
}

export default async function EditTenantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tenant = await getTenant(id);

  if (!tenant) {
    notFound();
  }

  // For edit, we need to show available beds + current bed if occupied
  const availableBeds = await getAvailableBeds();
  const currentBed = tenant.bed;

  const allBeds = currentBed && !availableBeds.find((b) => b.id === currentBed.id)
    ? [currentBed, ...availableBeds]
    : availableBeds;

  const bedsData = allBeds.map((bed) => ({
    id: bed.id,
    bedNumber: bed.bedNumber,
    monthlyRent: Number(bed.monthlyRent),
    securityDeposit: Number(bed.securityDeposit),
    room: {
      roomNumber: bed.room.roomNumber,
      hasAc: bed.room.hasAc,
      property: {
        name: bed.room.property.name,
      },
    },
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Tenant"
        description={`Editing ${tenant.user.name}`}
      />
      <TenantForm
        availableBeds={bedsData}
        tenantId={tenant.id}
        initialData={{
          name: tenant.user.name,
          phone: tenant.user.phone,
          email: tenant.user.email,
          bedId: tenant.bedId,
          dateOfBirth: tenant.dateOfBirth,
          gender: tenant.gender,
          bloodGroup: tenant.bloodGroup,
          occupation: tenant.occupation,
          workplaceCollege: tenant.workplaceCollege,
          workAddress: tenant.workAddress,
          emergencyName: tenant.emergencyName,
          emergencyPhone: tenant.emergencyPhone,
          emergencyRelation: tenant.emergencyRelation,
          checkInDate: tenant.checkInDate,
          expectedCheckout: tenant.expectedCheckout,
          noticePeriodDays: tenant.noticePeriodDays,
          notes: tenant.notes,
        }}
      />
    </div>
  );
}

