import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Receipt, Plus, Send, DollarSign, AlertCircle } from 'lucide-react';
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
import { formatCurrency, formatDate } from '@/lib/utils';
import { BillActions } from './bill-actions';
import { AddChargeDialog } from './add-charge-dialog';
import { RecordPaymentDialog } from './record-payment-dialog';

async function getBill(id: string) {
  const bill = await db.bill.findUnique({
    where: { id },
    include: {
      tenant: {
        include: {
          user: { select: { name: true, phone: true } },
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
      },
      lineItems: {
        orderBy: { createdAt: 'asc' },
      },
      payments: {
        orderBy: { transactionDate: 'desc' },
        include: {
          recordedBy: { select: { name: true } },
        },
      },
      createdBy: { select: { name: true } },
    },
  });

  return bill;
}

export default async function BillDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const bill = await getBill(params.id);

  if (!bill) {
    notFound();
  }

  const statusConfig: Record<string, { label: string; variant: any }> = {
    DRAFT: { label: 'Draft', variant: 'draft' },
    SENT: { label: 'Sent', variant: 'sent' },
    PARTIAL: { label: 'Partial', variant: 'partial' },
    PAID: { label: 'Paid', variant: 'paid' },
    OVERDUE: { label: 'Overdue', variant: 'overdue' },
    CANCELLED: { label: 'Cancelled', variant: 'cancelled' },
  };

  const status = statusConfig[bill.status];
  const totalAmount = Number(bill.totalAmount);
  const paidAmount = Number(bill.paidAmount);
  const balance = totalAmount - paidAmount;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Bill - ${new Date(bill.billingMonth).toLocaleDateString('en-IN', {
          month: 'long',
          year: 'numeric',
        })}`}
        description={`${bill.tenant.user.name} - Room ${bill.tenant.bed?.room.roomNumber || 'N/A'}, Bed ${bill.tenant.bed?.bedNumber || 'N/A'}`}
        action={<BillActions bill={bill} />}
      />

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
            <p className="text-sm text-muted-foreground">Total Amount</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(paidAmount)}
            </div>
            <p className="text-sm text-muted-foreground">Paid</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(balance)}</div>
            <p className="text-sm text-muted-foreground">Balance</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <Badge variant={status.variant}>{status.label}</Badge>
            <p className="mt-2 text-sm text-muted-foreground">Status</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Bill Information */}
        <Card>
          <CardHeader>
            <CardTitle>Bill Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium">Tenant</p>
              <Link
                href={`/dashboard/tenants/${bill.tenant.id}`}
                className="text-sm text-primary hover:underline"
              >
                {bill.tenant.user.name}
              </Link>
            </div>

            {bill.tenant.bed && (
              <div>
                <p className="font-medium">Location</p>
                <div className="mt-1 space-y-1 text-sm">
                  <p>{bill.tenant.bed.room.property.name}</p>
                  <p>
                    Room {bill.tenant.bed.room.roomNumber}, Bed {bill.tenant.bed.bedNumber}
                  </p>
                </div>
              </div>
            )}

            <div>
              <p className="font-medium">Billing Period</p>
              <p className="text-sm text-muted-foreground">
                {new Date(bill.billingMonth).toLocaleDateString('en-IN', {
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>

            <div>
              <p className="font-medium">Due Date</p>
              <p className="text-sm text-muted-foreground">{formatDate(bill.dueDate)}</p>
            </div>

            {bill.sentAt && (
              <div>
                <p className="font-medium">Sent At</p>
                <p className="text-sm text-muted-foreground">{formatDate(bill.sentAt)}</p>
              </div>
            )}

            {bill.createdBy && (
              <div>
                <p className="font-medium">Created By</p>
                <p className="text-sm text-muted-foreground">{bill.createdBy.name}</p>
              </div>
            )}

            {bill.notes && (
              <div>
                <p className="font-medium">Notes</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{bill.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Amount</span>
                <span className="font-medium">{formatCurrency(totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Paid</span>
                <span className="font-medium text-green-600">{formatCurrency(paidAmount)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-medium">Balance</span>
                <span className="font-bold text-lg text-orange-600">{formatCurrency(balance)}</span>
              </div>
            </div>

            {balance > 0 && (
              <RecordPaymentDialog billId={bill.id} maxAmount={balance} />
            )}

            {bill.status === 'DRAFT' && (
              <AddChargeDialog billId={bill.id} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
          <CardDescription>{bill.lineItems.length} items</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bill.lineItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Badge variant="secondary">{item.itemType}</Badge>
                  </TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell className="text-right">{Number(item.quantity)}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(Number(item.unitPrice))}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(Number(item.amount))}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="font-bold">
                <TableCell colSpan={4} className="text-right">
                  Total
                </TableCell>
                <TableCell className="text-right">{formatCurrency(totalAmount)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payment History */}
      {bill.payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>{bill.payments.length} payments recorded</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Recorded By</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bill.payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{formatDate(payment.transactionDate)}</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(Number(payment.amount))}
                    </TableCell>
                    <TableCell>{payment.paymentMethod}</TableCell>
                    <TableCell>{payment.reference || '-'}</TableCell>
                    <TableCell>{payment.recordedBy?.name || '-'}</TableCell>
                    <TableCell>
                      <Badge
                        variant={payment.status === 'SUCCESS' ? 'paid' : 'secondary'}
                      >
                        {payment.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

