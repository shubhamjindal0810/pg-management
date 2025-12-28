import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { PageHeader } from '@/components/dashboard/page-header';
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
import { TenantBillActions } from './bill-actions';

async function getBill(billId: string, userId: string) {
  const tenant = await db.tenant.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!tenant) {
    return null;
  }

  const bill = await db.bill.findUnique({
    where: { id: billId },
    include: {
      lineItems: {
        orderBy: { createdAt: 'asc' },
      },
      payments: {
        orderBy: { transactionDate: 'desc' },
        include: {
          recordedBy: { select: { name: true } },
        },
      },
    },
  });

  // Verify this bill belongs to the tenant
  if (bill && bill.tenantId === tenant.id) {
    return bill;
  }

  return null;
}

export default async function TenantBillDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login');
  }

  const { id } = await params;
  const bill = await getBill(id, session.user.id);

  if (!bill) {
    notFound();
  }

  const statusConfig: Record<string, { label: string; variant: any }> = {
    DRAFT: { label: 'Draft', variant: 'draft' },
    SENT: { label: 'Sent', variant: 'sent' },
    PARTIAL: { label: 'Partially Paid', variant: 'partial' },
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
        description={`Due Date: ${formatDate(bill.dueDate)}`}
        action={balance > 0 && <TenantBillActions bill={bill} />}
      />

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
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
      </div>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle>Bill Details</CardTitle>
          <CardDescription>{bill.lineItems.length} items</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bill.lineItems.map((item) => (
                <TableRow key={item.id}>
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
                <TableCell colSpan={3} className="text-right">
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
            <CardDescription>{bill.payments.length} payments</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reference</TableHead>
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
                    <TableCell>
                      <Badge variant={payment.status === 'SUCCESS' ? 'paid' : 'secondary'}>
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

