'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DollarSign, Plus, ArrowLeftRight } from 'lucide-react';
import { toast } from 'sonner';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  recordSecurityDeposit,
  refundSecurityDeposit,
} from '@/app/dashboard/tenants/security-deposit-actions';
import { PaymentMethod } from '@prisma/client';

interface SecurityDepositSectionProps {
  tenant: {
    id: string;
    securityDeposits: Array<{
      id: string;
      amountPaid: number;
      paidDate: Date;
      paymentMethod: PaymentMethod;
      amountRefunded: number | null;
      refundDate: Date | null;
      refundMethod: PaymentMethod | null;
      deductions: any;
      status: string;
      notes: string | null;
      createdAt: Date;
    }>;
    bed: {
      securityDeposit: number;
    } | null;
  };
}

export function SecurityDepositSection({ tenant }: SecurityDepositSectionProps) {
  const router = useRouter();
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [isRefundOpen, setIsRefundOpen] = useState(false);
  const [selectedDeposit, setSelectedDeposit] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form state for recording deposit
  const [amount, setAmount] = useState('');
  const [paidDate, setPaidDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [notes, setNotes] = useState('');

  // Form state for refund
  const [refundAmount, setRefundAmount] = useState('');
  const [refundDate, setRefundDate] = useState(new Date().toISOString().split('T')[0]);
  const [refundMethod, setRefundMethod] = useState<PaymentMethod>('CASH');
  const [refundNotes, setRefundNotes] = useState('');
  const [deductions, setDeductions] = useState<Array<{ reason: string; amount: string }>>([]);

  const handleRecordDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsLoading(true);
    try {
      await recordSecurityDeposit({
        tenantId: tenant.id,
        amount: parseFloat(amount),
        paidDate,
        paymentMethod,
        notes: notes || undefined,
      });
      toast.success('Security deposit recorded successfully');
      setIsRecordOpen(false);
      setAmount('');
      setNotes('');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to record deposit');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeposit || !refundAmount || parseFloat(refundAmount) <= 0) {
      toast.error('Please select a deposit and enter a valid refund amount');
      return;
    }

    const deposit = tenant.securityDeposits.find((d) => d.id === selectedDeposit);
    if (!deposit) return;

    const totalPaid = Number(deposit.amountPaid);
    const currentRefunded = Number(deposit.amountRefunded || 0);
    const deductionsTotal =
      deductions.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0) || 0;
    const newRefunded = currentRefunded + parseFloat(refundAmount);

    if (newRefunded > totalPaid - deductionsTotal) {
      toast.error('Refund amount cannot exceed deposit amount minus deductions');
      return;
    }

    setIsLoading(true);
    try {
      await refundSecurityDeposit({
        depositId: selectedDeposit,
        amount: parseFloat(refundAmount),
        refundDate,
        refundMethod,
        deductions:
          deductions.length > 0
            ? deductions.map((d) => ({
                reason: d.reason,
                amount: parseFloat(d.amount) || 0,
              }))
            : undefined,
        notes: refundNotes || undefined,
      });
      toast.success('Refund processed successfully');
      setIsRefundOpen(false);
      setSelectedDeposit(null);
      setRefundAmount('');
      setRefundNotes('');
      setDeductions([]);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to process refund');
    } finally {
      setIsLoading(false);
    }
  };

  const addDeduction = () => {
    setDeductions([...deductions, { reason: '', amount: '' }]);
  };

  const removeDeduction = (index: number) => {
    setDeductions(deductions.filter((_, i) => i !== index));
  };

  const updateDeduction = (index: number, field: 'reason' | 'amount', value: string) => {
    const updated = [...deductions];
    updated[index][field] = value;
    setDeductions(updated);
  };

  const totalDeposits = tenant.securityDeposits.reduce(
    (sum, d) => sum + Number(d.amountPaid),
    0
  );
  const totalRefunded = tenant.securityDeposits.reduce(
    (sum, d) => sum + Number(d.amountRefunded || 0),
    0
  );
  const totalDeductions = tenant.securityDeposits.reduce((sum, d) => {
    if (d.deductions && Array.isArray(d.deductions)) {
      return sum + d.deductions.reduce((s: number, ded: any) => s + (ded.amount || 0), 0);
    }
    return sum;
  }, 0);
  const balance = totalDeposits - totalRefunded - totalDeductions;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Security Deposits</CardTitle>
            <CardDescription>
              {tenant.securityDeposits.length} deposit(s) recorded
            </CardDescription>
          </div>
          <Dialog open={isRecordOpen} onOpenChange={setIsRecordOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Record Deposit
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Security Deposit</DialogTitle>
                <DialogDescription>
                  Record a security deposit payment from the tenant.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleRecordDeposit}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (₹) *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                    />
                    {tenant.bed && (
                      <p className="text-xs text-muted-foreground">
                        Expected: {formatCurrency(Number(tenant.bed.securityDeposit))}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paidDate">Paid Date *</Label>
                    <Input
                      id="paidDate"
                      type="date"
                      value={paidDate}
                      onChange={(e) => setPaidDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">Payment Method *</Label>
                    <Select
                      value={paymentMethod}
                      onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CASH">Cash</SelectItem>
                        <SelectItem value="UPI">UPI</SelectItem>
                        <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                        <SelectItem value="CARD">Card</SelectItem>
                        <SelectItem value="CHEQUE">Cheque</SelectItem>
                        <SelectItem value="ONLINE">Online</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Additional notes..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsRecordOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" loading={isLoading}>
                    Record Deposit
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary */}
        <div className="mb-6 grid gap-4 sm:grid-cols-4">
          <div>
            <p className="text-sm text-muted-foreground">Total Deposits</p>
            <p className="text-2xl font-bold">{formatCurrency(totalDeposits)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Refunded</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalRefunded)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Deductions</p>
            <p className="text-2xl font-bold text-orange-600">{formatCurrency(totalDeductions)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Balance</p>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(balance)}</p>
          </div>
        </div>

        {/* Deposits Table */}
        {tenant.securityDeposits.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paid Date</TableHead>
                <TableHead>Amount Paid</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Refunded</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenant.securityDeposits.map((deposit) => {
                const refunded = Number(deposit.amountRefunded || 0);
                const paid = Number(deposit.amountPaid);
                const canRefund = refunded < paid;

                return (
                  <TableRow key={deposit.id}>
                    <TableCell>{formatDate(deposit.paidDate)}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(paid)}</TableCell>
                    <TableCell>{deposit.paymentMethod}</TableCell>
                    <TableCell>
                      {refunded > 0 ? (
                        <span className="text-green-600">{formatCurrency(refunded)}</span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          deposit.status === 'refunded'
                            ? 'paid'
                            : deposit.status === 'partially_refunded'
                              ? 'partial'
                              : 'secondary'
                        }
                      >
                        {deposit.status === 'refunded'
                          ? 'Refunded'
                          : deposit.status === 'partially_refunded'
                            ? 'Partially Refunded'
                            : 'Held'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {canRefund && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedDeposit(deposit.id);
                            setIsRefundOpen(true);
                            setRefundAmount((paid - refunded).toString());
                          }}
                        >
                          <ArrowLeftRight className="mr-2 h-4 w-4" />
                          Refund
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center py-8">
            <DollarSign className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">No security deposits recorded</p>
          </div>
        )}
      </CardContent>

      {/* Refund Dialog */}
      <Dialog open={isRefundOpen} onOpenChange={setIsRefundOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
            <DialogDescription>
              Process a refund for the selected security deposit.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRefund}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="refundAmount">Refund Amount (₹) *</Label>
                <Input
                  id="refundAmount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="refundDate">Refund Date *</Label>
                <Input
                  id="refundDate"
                  type="date"
                  value={refundDate}
                  onChange={(e) => setRefundDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="refundMethod">Refund Method *</Label>
                <Select
                  value={refundMethod}
                  onValueChange={(value) => setRefundMethod(value as PaymentMethod)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                    <SelectItem value="CARD">Card</SelectItem>
                    <SelectItem value="CHEQUE">Cheque</SelectItem>
                    <SelectItem value="ONLINE">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Deductions (Optional)</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addDeduction}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Deduction
                  </Button>
                </div>
                {deductions.map((deduction, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Reason (e.g., Damage)"
                      value={deduction.reason}
                      onChange={(e) => updateDeduction(index, 'reason', e.target.value)}
                    />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Amount"
                      value={deduction.amount}
                      onChange={(e) => updateDeduction(index, 'amount', e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeDeduction(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="refundNotes">Notes</Label>
                <Textarea
                  id="refundNotes"
                  placeholder="Additional notes about the refund..."
                  value={refundNotes}
                  onChange={(e) => setRefundNotes(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsRefundOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={isLoading}>
                Process Refund
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

