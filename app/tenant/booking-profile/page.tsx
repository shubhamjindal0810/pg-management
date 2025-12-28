import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { PageHeader } from '@/components/dashboard/page-header';
import { BookingProfileForm } from './booking-profile-form';

async function getBookingData(userId: string) {
  const booking = await db.booking.findFirst({
    where: {
      userId,
      status: 'approved',
    },
    include: {
      bed: {
        include: {
          room: {
            include: {
              property: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  return booking;
}

async function getOrCreateTenantProfile(userId: string, bookingId: string) {
  // Check if user already has a tenant record (temporary profile)
  let tenant = await db.tenant.findUnique({
    where: { userId },
    include: {
      documents: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  // If no tenant profile exists, create a temporary one for profile completion
  if (!tenant) {
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return null;
    }

    tenant = await db.tenant.create({
      data: {
        userId,
        bedId: booking.bedId,
        checkInDate: booking.requestedCheckin,
        expectedCheckout: new Date(
          new Date(booking.requestedCheckin).setMonth(
            new Date(booking.requestedCheckin).getMonth() + booking.durationMonths
          )
        ),
        noticePeriodDays: 30,
        status: 'ACTIVE', // Temporary status until converted
      },
      include: {
        documents: true,
      },
    });
  }

  return tenant;
}

export default async function BookingProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login');
  }

  const booking = await getBookingData(session.user.id);

  if (!booking) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Complete Your Profile"
          description="Please wait for your booking to be approved"
        />
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6">
          <p className="text-yellow-900">
            Your booking is pending approval. Once approved, you'll be able to complete your profile here.
          </p>
        </div>
      </div>
    );
  }

  // Check if already converted to tenant
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: {
      tenant: true,
    },
  });

  if (user?.tenant && user.tenant.bedId === booking.bedId) {
    redirect('/tenant');
  }

  const tenant = await getOrCreateTenantProfile(session.user.id, booking.id);

  if (!tenant) {
    return (
      <div className="space-y-6">
        <PageHeader title="Error" description="Unable to load booking data" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Complete Your Profile"
        description="Please complete your profile and upload required documents. Admin will review and convert your booking to a tenant account."
      />

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm text-blue-900">
          <strong>Booking Details:</strong> {booking.bed.room.property.name} - Room{' '}
          {booking.bed.room.roomNumber}, Bed {booking.bed.bedNumber}
        </p>
        <p className="mt-2 text-sm text-blue-800">
          Once you complete your profile and upload documents, the admin will review and convert your
          booking to a tenant account.
        </p>
      </div>

      <BookingProfileForm tenantId={tenant.id} bookingId={booking.id} existingData={tenant} />
    </div>
  );
}

