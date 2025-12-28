import { PageHeader } from '@/components/dashboard/page-header';
import { PropertyForm } from '@/components/forms/property-form';

export default function NewPropertyPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Property"
        description="Add a new PG property to manage"
      />
      <PropertyForm />
    </div>
  );
}
