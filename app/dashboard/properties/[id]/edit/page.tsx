import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { PageHeader } from '@/components/dashboard/page-header';
import { PropertyForm } from '@/components/forms/property-form';

async function getProperty(id: string) {
  const property = await db.property.findUnique({
    where: { id },
  });

  return property;
}

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = await getProperty(id);

  if (!property) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Property"
        description={`Editing ${property.name}`}
      />
      <PropertyForm
        property={{
          id: property.id,
          name: property.name,
          address: property.address,
          city: property.city,
          state: property.state,
          pincode: property.pincode,
          description: property.description,
          amenities: property.amenities as string[] | null,
          rules: property.rules as string[] | null,
          phone: property.phone,
          email: property.email,
          googleMapsLink: property.googleMapsLink,
          latitude: property.latitude ? Number(property.latitude) : null,
          longitude: property.longitude ? Number(property.longitude) : null,
          website: property.website,
          facebook: property.facebook,
          instagram: property.instagram,
          whatsapp: property.whatsapp,
          breakfastEnabled: property.breakfastEnabled,
          breakfastPrice: property.breakfastPrice ? Number(property.breakfastPrice) : null,
          breakfastMenu: property.breakfastMenu,
          lunchEnabled: property.lunchEnabled,
          lunchPrice: property.lunchPrice ? Number(property.lunchPrice) : null,
          lunchMenu: property.lunchMenu,
          dinnerEnabled: property.dinnerEnabled,
          dinnerPrice: property.dinnerPrice ? Number(property.dinnerPrice) : null,
          dinnerMenu: property.dinnerMenu,
          acMonthlyRent: property.acMonthlyRent ? Number(property.acMonthlyRent) : null,
          acSecurityDeposit: property.acSecurityDeposit ? Number(property.acSecurityDeposit) : null,
          images: property.images as string[] | null,
        }}
      />
    </div>
  );
}

