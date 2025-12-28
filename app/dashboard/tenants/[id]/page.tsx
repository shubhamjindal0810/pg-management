import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Users, Edit, Phone, Mail, Calendar, AlertCircle, LogOut, FileText } from 'lucide-react';
import { db } from '@/lib/db';
import { PageHeader } from '@/components/dashboard/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate, formatPhone, formatCurrency } from '@/lib/utils';
import { TenantActions } from './tenant-actions';
import { SecurityDepositSection } from './security-deposit-section';
import { VerifyDocuments } from './verify-documents';

async function getTenant(id: string) {
  const tenant = await db.tenant.findUnique({
    where: { id },
    include: {
      user: {
        select: { name: true, phone: true, email: true },
      },
      bed: {
        include: {
          room: {
            include: {
              property: {
                select: { id: true, name: true },
              },
            },
          },
        },
      },
      documents: {
        orderBy: { createdAt: 'desc' },
      },
      bills: {
        orderBy: { billingMonth: 'desc' },
        take: 5,
      },
      securityDeposits: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          amountPaid: true,
          paidDate: true,
          paymentMethod: true,
          amountRefunded: true,
          refundDate: true,
          refundMethod: true,
          deductions: true,
          status: true,
          notes: true,
          createdAt: true,
        },
      },
    },
  });

  return tenant;
}

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tenant = await getTenant(id);

  if (!tenant) {
    notFound();
  }

  const statusConfig = {
    ACTIVE: { label: 'Active', variant: 'active' as const },
    NOTICE_PERIOD: { label: 'Notice Period', variant: 'notice' as const },
    CHECKED_OUT: { label: 'Checked Out', variant: 'checkedOut' as const },
  };

  const status = statusConfig[tenant.status];

  return (
    <div className="space-y-6">
      <PageHeader
        title={tenant.user.name}
        description={tenant.bed ? `Room ${tenant.bed.room.roomNumber}, Bed ${tenant.bed.bedNumber}` : 'No bed assigned'}
        action={
          <div className="flex gap-2">
            <Link href={`/dashboard/tenants/${tenant.id}/edit`}>
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            </Link>
              <TenantActions
                tenant={{
                  id: tenant.id,
                  status: tenant.status,
                  noticePeriodDays: tenant.noticePeriodDays,
                  bed: tenant.bed
                    ? {
                        securityDeposit: Number(tenant.bed.room.securityDeposit || 0),
                      }
                    : null,
                  securityDeposits: tenant.securityDeposits.map((d) => ({
                    amountPaid: Number(d.amountPaid),
                    amountRefunded: d.amountRefunded ? Number(d.amountRefunded) : null,
                    deductions: d.deductions,
                  })),
                }}
              />
          </div>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{tenant.bills.length}</div>
            <p className="text-sm text-muted-foreground">Total Bills</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {tenant.bills.filter((b) => b.status === 'PAID').length}
            </div>
            <p className="text-sm text-muted-foreground">Paid Bills</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">
              {tenant.bills.filter((b) => b.status === 'OVERDUE').length}
            </div>
            <p className="text-sm text-muted-foreground">Overdue</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <Badge variant={status.variant}>{status.label}</Badge>
            <p className="mt-2 text-sm text-muted-foreground">Current Status</p>
          </CardContent>
        </Card>
      </div>

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

            {tenant.occupation && (
              <div>
                <p className="font-medium">Occupation</p>
                <p className="text-sm text-muted-foreground capitalize">{tenant.occupation}</p>
              </div>
            )}

            {tenant.workplaceCollege && (
              <div>
                <p className="font-medium">Workplace / College</p>
                <p className="text-sm text-muted-foreground">{tenant.workplaceCollege}</p>
              </div>
            )}
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
                  <div className="mt-1 space-y-1">
                    <Link
                      href={`/dashboard/properties/${tenant.bed.room.property.id}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {tenant.bed.room.property.name}
                    </Link>
                    <br />
                    <Link
                      href={`/dashboard/rooms/${tenant.bed.room.id}`}
                      className="text-sm text-primary hover:underline"
                    >
                      Room {tenant.bed.room.roomNumber}
                    </Link>
                    <br />
                    <Link
                      href={`/dashboard/beds/${tenant.bed.id}`}
                      className="text-sm text-primary hover:underline"
                    >
                      Bed {tenant.bed.bedNumber}
                    </Link>
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
              <div>
                <p className="text-muted-foreground">No bed assigned</p>
              </div>
            )}

            {tenant.checkInDate && (
              <div>
                <p className="font-medium">Check-in Date</p>
                <p className="text-sm text-muted-foreground">{formatDate(tenant.checkInDate)}</p>
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

            {tenant.actualCheckout && (
              <div>
                <p className="font-medium">Actual Checkout</p>
                <p className="text-sm text-muted-foreground">{formatDate(tenant.actualCheckout)}</p>
              </div>
            )}

            {tenant.noticeGivenDate && (
              <div>
                <p className="font-medium">Notice Given</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(tenant.noticeGivenDate)}
                </p>
              </div>
            )}

            <div>
              <p className="font-medium">Notice Period</p>
              <p className="text-sm text-muted-foreground">{tenant.noticePeriodDays} days</p>
            </div>
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

        {/* Notes */}
        {tenant.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{tenant.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Documents */}
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
          <CardDescription>{tenant.documents.length} documents on file</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Admin Verification Section */}
          <VerifyDocuments tenantId={tenant.id} documents={tenant.documents} />

          {/* Documents List */}
          {tenant.documents.length > 0 ? (
            <div>
              <h3 className="mb-4 font-semibold">All Documents</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Document Number</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenant.documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>{doc.documentType}</TableCell>
                      <TableCell>{doc.documentNumber || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={doc.isVerified ? 'available' : 'secondary'}>
                          {doc.isVerified ? 'Verified' : 'Pending'}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(doc.createdAt)}</TableCell>
                      <TableCell>
                        {doc.fileUrl && (
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                          >
                            View
                          </a>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">No documents uploaded</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Bills */}
      {tenant.bills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Bills</CardTitle>
            <CardDescription>Last 5 bills</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Billing Period</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenant.bills.map((bill) => {
                  const statusConfig: Record<string, { label: string; variant: any }> = {
                    DRAFT: { label: 'Draft', variant: 'draft' },
                    SENT: { label: 'Sent', variant: 'sent' },
                    PARTIAL: { label: 'Partial', variant: 'partial' },
                    PAID: { label: 'Paid', variant: 'paid' },
                    OVERDUE: { label: 'Overdue', variant: 'overdue' },
                    CANCELLED: { label: 'Cancelled', variant: 'cancelled' },
                  };
                  const billStatus = statusConfig[bill.status];

                  return (
                    <TableRow key={bill.id}>
                      <TableCell>
                        {new Date(bill.billingMonth).toLocaleDateString('en-IN', {
                          month: 'long',
                          year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell className="font-medium">
                        ₹{Number(bill.totalAmount).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {Number(bill.paidAmount) > 0 ? (
                          <span className="text-green-600">
                            ₹{Number(bill.paidAmount).toLocaleString()}
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={billStatus.variant}>{billStatus.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <Link href={`/dashboard/billing/${bill.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Security Deposits */}
      <SecurityDepositSection
        tenant={{
          id: tenant.id,
          securityDeposits: tenant.securityDeposits.map((d) => ({
            id: d.id,
            amountPaid: Number(d.amountPaid),
            paidDate: d.paidDate,
            paymentMethod: d.paymentMethod,
            amountRefunded: d.amountRefunded ? Number(d.amountRefunded) : null,
            refundDate: d.refundDate,
            refundMethod: d.refundMethod,
            deductions: d.deductions,
            status: d.status,
            notes: d.notes,
            createdAt: d.createdAt,
          })),
          bed: tenant.bed
            ? {
                securityDeposit: Number(tenant.bed.room.securityDeposit || 0),
                room: {
                  securityDeposit: Number(tenant.bed.room.securityDeposit || 0),
                },
              }
            : null,
        }}
      />
    </div>
  );
}

