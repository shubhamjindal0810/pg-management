import Link from 'next/link';
import { Plus, Receipt, AlertCircle } from 'lucide-react';
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

async function getBills() {
  return db.bill.findMany({
    include: {
      tenant: {
        include: {
          user: { select: { name: true } },
          bed: {
            include: {
              room: { select: { roomNumber: true } },
            },
          },
        },
      },
      lineItems: true,
      payments: true,
    },
    orderBy: [{ status: 'asc' }, { billingMonth: 'desc' }],
  });
}

async function getBillStats() {
  const [totalDue, overdueCount, paidThisMonth] = await Promise.all([
    db.bill.aggregate({
      where: { status: { in: ['SENT', 'PARTIAL', 'OVERDUE'] } },
      _sum: { totalAmount: true },
    }),
    db.bill.count({ where: { status: 'OVERDUE' } }),
    db.payment.aggregate({
      where: {
        status: 'SUCCESS',
        transactionDate: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
      _sum: { amount: true },
    }),
  ]);

  return {
    totalDue: totalDue._sum.totalAmount || 0,
    overdueCount,
    paidThisMonth: paidThisMonth._sum.amount || 0,
  };
}

const statusConfig: Record<string, { label: string; variant: 'draft' | 'sent' | 'partial' | 'paid' | 'overdue' | 'cancelled' }> = {
  DRAFT: { label: 'Draft', variant: 'draft' },
  SENT: { label: 'Sent', variant: 'sent' },
  PARTIAL: { label: 'Partial', variant: 'partial' },
  PAID: { label: 'Paid', variant: 'paid' },
  OVERDUE: { label: 'Overdue', variant: 'overdue' },
  CANCELLED: { label: 'Cancelled', variant: 'cancelled' },
};

export default async function BillingPage() {
  const [bills, stats] = await Promise.all([getBills(), getBillStats()]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing"
        description="Manage tenant bills and payments"
        action={
          <Link href="/dashboard/billing/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Bill
            </Button>
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(Number(stats.totalDue))}
            </div>
            <p className="text-sm text-muted-foreground">Total Outstanding</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-red-600">{stats.overdueCount}</span>
              {stats.overdueCount > 0 && <AlertCircle className="h-5 w-5 text-red-600" />}
            </div>
            <p className="text-sm text-muted-foreground">Overdue Bills</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(Number(stats.paidThisMonth))}
            </div>
            <p className="text-sm text-muted-foreground">Collected This Month</p>
          </CardContent>
        </Card>
      </div>

      {bills.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Receipt className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="mb-4 text-muted-foreground">No bills created yet</p>
            <Link href="/dashboard/billing/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create First Bill
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Bills</CardTitle>
            <CardDescription>{bills.length} bills total</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Billing Period</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Paid</TableHead>
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
                        <div>
                          <p className="font-medium">{bill.tenant.user.name}</p>
                          {bill.tenant.bed && (
                            <p className="text-xs text-muted-foreground">
                              Room {bill.tenant.bed.room.roomNumber}, Bed{' '}
                              {bill.tenant.bed.bedNumber}
                            </p>
                          )}
                        </div>
                      </TableCell>
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
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
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
    </div>
  );
}
