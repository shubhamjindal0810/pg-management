import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { PageHeader } from '@/components/dashboard/page-header';
import { OnboardingForm } from './onboarding-form';

async function getTenantData(userId: string) {
  const tenant = await db.tenant.findUnique({
    where: { userId },
    include: {
      documents: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  return tenant;
}

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login');
  }

  const tenant = await getTenantData(session.user.id);

  if (!tenant) {
    redirect('/login');
  }

  // Check if already has verified Aadhaar
  const hasVerifiedAadhaar = tenant.documents.some(
    (doc) => doc.documentType === 'AADHAR' && doc.isVerified
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Complete Your Profile"
        description="Upload your ID documents to complete your onboarding"
      />

      {hasVerifiedAadhaar ? (
        <div className="rounded-lg border border-green-200 bg-green-50 p-6">
          <p className="text-green-900">
            ✓ Your profile verification is complete. You can access all features of the tenant
            portal.
          </p>
        </div>
      ) : (
        <OnboardingForm tenantId={tenant.id} existingDocuments={tenant.documents} />
      )}
    </div>
  );
}

