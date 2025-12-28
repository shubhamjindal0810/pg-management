import { redirect } from 'next/navigation';
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
import Link from 'next/link';
import { Button } from '@/components/ui/button';

async function getBills(userId: string) {
  const tenant = await db.tenant.findUnique({
    where: { userId },
    include: {
      bills: {
        include: {
          lineItems: true,
          payments: {
            orderBy: { transactionDate: 'desc' },
          },
        },
        orderBy: { billingMonth: 'desc' },
      },
    },
  });

  return tenant?.bills || [];
}

export default async function TenantBillsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login');
  }

  const bills = await getBills(session.user.id);

  const statusConfig: Record<string, { label: string; variant: any }> = {
    DRAFT: { label: 'Draft', variant: 'draft' },
    SENT: { label: 'Sent', variant: 'sent' },
    PARTIAL: { label: 'Partially Paid', variant: 'partial' },
    PAID: { label: 'Paid', variant: 'paid' },
    OVERDUE: { label: 'Overdue', variant: 'overdue' },
    CANCELLED: { label: 'Cancelled', variant: 'cancelled' },
  };

  const totalDue = bills.reduce(
    (sum, bill) => sum + (Number(bill.totalAmount) - Number(bill.paidAmount)),
    0
  );
  const overdueCount = bills.filter((bill) => bill.status === 'OVERDUE').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Bills"
        description="View and pay your bills online"
      />

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(totalDue)}
            </div>
            <p className="text-sm text-muted-foreground">Total Outstanding</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{overdueCount}</div>
            <p className="text-sm text-muted-foreground">Overdue Bills</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{bills.length}</div>
            <p className="text-sm text-muted-foreground">Total Bills</p>
          </CardContent>
        </Card>
      </div>

      {/* Bills Table */}
      {bills.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>All Bills</CardTitle>
            <CardDescription>{bills.length} bills total</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Billing Period</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bills.map((bill) => {
                  const status = statusConfig[bill.status];
                  const balance = Number(bill.totalAmount) - Number(bill.paidAmount);

                  return (
                    <TableRow key={bill.id}>
                      <TableCell>
                        {new Date(bill.billingMonth).toLocaleDateString('en-IN', {
                          month: 'long',
                          year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell>{formatDate(bill.dueDate)}</TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(Number(bill.totalAmount))}
                      </TableCell>
                      <TableCell>
                        {Number(bill.paidAmount) > 0 ? (
                          <span className="text-green-600">
                            {formatCurrency(Number(bill.paidAmount))}
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {balance > 0 ? (
                          <span className="text-orange-600">{formatCurrency(balance)}</span>
                        ) : (
                          <span className="text-green-600">₹0</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <Link href={`/tenant/bills/${bill.id}`}>
                          <Button variant="ghost" size="sm">
                            {balance > 0 ? 'View & Pay' : 'View'}
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
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">No bills found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

