import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { PageHeader } from '@/components/dashboard/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { MaintenanceRequestForm } from './maintenance-form';

async function getMaintenanceRequests(userId: string) {
  const tenant = await db.tenant.findUnique({
    where: { userId },
    include: {
      maintenanceRequests: {
        include: {
          room: {
            include: {
              property: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      bed: {
        include: {
          room: {
            select: { id: true, roomNumber: true },
          },
        },
      },
    },
  });

  return tenant;
}

export default async function MaintenancePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login');
  }

  const tenant = await getMaintenanceRequests(session.user.id);

  if (!tenant) {
    redirect('/tenant/onboarding');
  }

  const statusConfig: Record<string, { label: string; variant: any }> = {
    OPEN: { label: 'Open', variant: 'secondary' },
    IN_PROGRESS: { label: 'In Progress', variant: 'partial' },
    RESOLVED: { label: 'Resolved', variant: 'paid' },
    CLOSED: { label: 'Closed', variant: 'cancelled' },
  };

  const priorityConfig: Record<string, { label: string; color: string }> = {
    LOW: { label: 'Low', color: 'bg-blue-500' },
    MEDIUM: { label: 'Medium', color: 'bg-yellow-500' },
    HIGH: { label: 'High', color: 'bg-orange-500' },
    URGENT: { label: 'Urgent', color: 'bg-red-500' },
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Maintenance Requests"
        description="Submit and track maintenance issues"
        action={
          tenant.bed ? (
            <MaintenanceRequestForm roomId={tenant.bed.room.id} />
          ) : (
            <Button disabled>No room assigned</Button>
          )
        }
      />

      {tenant.maintenanceRequests.length > 0 ? (
        <div className="grid gap-4">
          {tenant.maintenanceRequests.map((request) => {
            const status = statusConfig[request.status];
            const priority = priorityConfig[request.priority];

            return (
              <Card key={request.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="capitalize">{request.category}</CardTitle>
                      <CardDescription>
                        {request.room.property.name} - Room {request.room.roomNumber}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={status.variant}>{status.label}</Badge>
                      <Badge
                        variant="outline"
                        className={`border-${priority.color.replace('bg-', '')}-200 bg-${priority.color.replace('bg-', '')}-50`}
                      >
                        {priority.label}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 whitespace-pre-wrap">{request.description}</p>
                  {request.resolutionNotes && (
                    <div className="rounded-lg border bg-muted/50 p-3">
                      <p className="text-sm font-medium mb-1">Resolution Notes:</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {request.resolutionNotes}
                      </p>
                    </div>
                  )}
                  <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Submitted: {formatDate(request.createdAt)}</span>
                    {request.resolvedAt && (
                      <span>Resolved: {formatDate(request.resolvedAt)}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="mb-4 text-muted-foreground">No maintenance requests yet</p>
            {tenant.bed && <MaintenanceRequestForm roomId={tenant.bed.room.id} />}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

