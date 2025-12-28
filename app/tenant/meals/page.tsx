import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { PageHeader } from '@/components/dashboard/page-header';
import { MealManagement } from './meal-management';

async function getTenant() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    return null;
  }

  const tenant = await db.tenant.findUnique({
    where: { id: session.user.tenantId },
    include: {
      bed: {
        include: {
          room: {
            include: {
              property: {
                select: {
                  id: true,
                  name: true,
                  breakfastEnabled: true,
                  breakfastPrice: true,
                  breakfastMenu: true,
                  lunchEnabled: true,
                  lunchPrice: true,
                  lunchMenu: true,
                  dinnerEnabled: true,
                  dinnerPrice: true,
                  dinnerMenu: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return tenant;
}

export default async function TenantMealsPage() {
  const tenant = await getTenant();

  if (!tenant) {
    notFound();
  }

  const property = tenant.bed?.room?.property;

  if (!property) {
    return (
      <div className="space-y-6">
        <PageHeader title="Meal Services" description="Manage your meal subscriptions" />
        <div className="rounded-lg border p-6 text-center">
          <p className="text-muted-foreground">No property information available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Meal Services" description="Subscribe to breakfast, lunch, or dinner" />
      <MealManagement tenant={tenant} property={property} />
    </div>
  );
}

