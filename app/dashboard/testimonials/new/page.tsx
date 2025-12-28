import { db } from '@/lib/db';
import { PageHeader } from '@/components/dashboard/page-header';
import { TestimonialForm } from '@/components/forms/testimonial-form';

async function getProperties() {
  return db.property.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: { name: 'asc' },
  });
}

export default async function NewTestimonialPage() {
  const properties = await getProperties();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Testimonial"
        description="Add a new customer testimonial"
      />
      <TestimonialForm properties={properties} />
    </div>
  );
}

