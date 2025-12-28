import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { PageHeader } from '@/components/dashboard/page-header';
import { TestimonialForm } from '@/components/forms/testimonial-form';

async function getTestimonial(id: string) {
  return db.testimonial.findUnique({
    where: { id },
  });
}

async function getProperties() {
  return db.property.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: { name: 'asc' },
  });
}

export default async function EditTestimonialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [testimonial, properties] = await Promise.all([
    getTestimonial(id),
    getProperties(),
  ]);

  if (!testimonial) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Testimonial"
        description={`Editing testimonial from ${testimonial.name}`}
      />
      <TestimonialForm
        properties={properties}
        testimonial={{
          id: testimonial.id,
          propertyId: testimonial.propertyId,
          name: testimonial.name,
          photo: testimonial.photo,
          testimonial: testimonial.testimonial,
          rating: testimonial.rating,
          isActive: testimonial.isActive,
        }}
      />
    </div>
  );
}

