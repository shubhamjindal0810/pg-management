import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { PageHeader } from '@/components/dashboard/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatPhone } from '@/lib/utils';
import { Phone, Mail, MapPin, Calendar } from 'lucide-react';

async function getTenantProfile(userId: string) {
  const tenant = await db.tenant.findUnique({
    where: { userId },
    include: {
      user: {
        select: { name: true, phone: true, email: true },
      },
      bed: {
        include: {
          room: {
            include: {
              property: {
                select: { name: true, address: true, city: true },
              },
            },
          },
        },
      },
    },
  });

  return tenant;
}

export default async function TenantProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login');
  }

  const tenant = await getTenantProfile(session.user.id);

  if (!tenant) {
    redirect('/tenant/onboarding');
  }

  const statusConfig = {
    ACTIVE: { label: 'Active', variant: 'active' as const },
    NOTICE_PERIOD: { label: 'Notice Period', variant: 'notice' as const },
    CHECKED_OUT: { label: 'Checked Out', variant: 'checkedOut' as const },
  };

  const status = statusConfig[tenant.status];

  return (
    <div className="space-y-6">
      <PageHeader title="My Profile" description="View your profile information" />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium">Name</p>
              <p className="text-sm text-muted-foreground">{tenant.user.name}</p>
            </div>

            <div>
              <p className="font-medium">Contact</p>
              <div className="mt-1 space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {formatPhone(tenant.user.phone)}
                </div>
                {tenant.user.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {tenant.user.email}
                  </div>
                )}
              </div>
            </div>

            {tenant.dateOfBirth && (
              <div>
                <p className="font-medium">Date of Birth</p>
                <p className="text-sm text-muted-foreground">{formatDate(tenant.dateOfBirth)}</p>
              </div>
            )}

            {tenant.gender && (
              <div>
                <p className="font-medium">Gender</p>
                <p className="text-sm text-muted-foreground capitalize">{tenant.gender}</p>
              </div>
            )}

            {tenant.bloodGroup && (
              <div>
                <p className="font-medium">Blood Group</p>
                <p className="text-sm text-muted-foreground">{tenant.bloodGroup}</p>
              </div>
            )}

            <div>
              <p className="font-medium">Status</p>
              <Badge variant={status.variant} className="mt-1">
                {status.label}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Stay Information */}
        <Card>
          <CardHeader>
            <CardTitle>Stay Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {tenant.bed ? (
              <>
                <div>
                  <p className="font-medium">Location</p>
                  <div className="mt-1 space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {tenant.bed.room.property.name}
                    </div>
                    <p className="text-muted-foreground">
                      {tenant.bed.room.property.address}, {tenant.bed.room.property.city}
                    </p>
                    <p className="text-muted-foreground">
                      Room {tenant.bed.room.roomNumber}, Bed {tenant.bed.bedNumber}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="font-medium">Monthly Rent</p>
                  <p className="text-lg font-semibold">
                    ₹{Number(tenant.bed.room.monthlyRent || 0).toLocaleString()}
                  </p>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">No bed assigned</p>
            )}

            {tenant.checkInDate && (
              <div>
                <p className="font-medium">Check-in Date</p>
                <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {formatDate(tenant.checkInDate)}
                </div>
              </div>
            )}

            {tenant.expectedCheckout && (
              <div>
                <p className="font-medium">Expected Checkout</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(tenant.expectedCheckout)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        {(tenant.emergencyName || tenant.emergencyPhone) && (
          <Card>
            <CardHeader>
              <CardTitle>Emergency Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {tenant.emergencyName && (
                <div>
                  <p className="font-medium">Name</p>
                  <p className="text-sm text-muted-foreground">{tenant.emergencyName}</p>
                </div>
              )}

              {tenant.emergencyPhone && (
                <div>
                  <p className="font-medium">Phone</p>
                  <p className="text-sm text-muted-foreground">{tenant.emergencyPhone}</p>
                </div>
              )}

              {tenant.emergencyRelation && (
                <div>
                  <p className="font-medium">Relationship</p>
                  <p className="text-sm text-muted-foreground">{tenant.emergencyRelation}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

