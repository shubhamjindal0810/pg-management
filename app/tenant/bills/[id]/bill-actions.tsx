'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
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
import { recordTenantPayment } from './actions';
import { PaymentMethod } from '@prisma/client';
import { formatCurrency } from '@/lib/utils';

interface TenantBillActionsProps {
  bill: {
    id: string;
    totalAmount: number;
    paidAmount: number;
  };
}

export function TenantBillActions({ bill }: TenantBillActionsProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  const totalAmount = Number(bill.totalAmount);
  const paidAmount = Number(bill.paidAmount);
  const balance = totalAmount - paidAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (parseFloat(amount) > balance) {
      toast.error(`Amount cannot exceed balance of ${formatCurrency(balance)}`);
      return;
    }

    setIsLoading(true);
    try {
      await recordTenantPayment({
        billId: bill.id,
        amount: parseFloat(amount),
        paymentMethod,
        reference: reference || undefined,
        notes: notes || undefined,
      });
      toast.success('Payment recorded successfully');
      setIsOpen(false);
      setAmount('');
      setReference('');
      setNotes('');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to record payment');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <DollarSign className="mr-2 h-4 w-4" />
          Pay Online
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Record your payment. Balance: {formatCurrency(balance)}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                max={balance}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Maximum: {formatCurrency(balance)}
              </p>
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
                  <SelectItem value="ONLINE">Online Payment</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Note: For online payments, you'll need to provide proof of payment. The admin will
                verify and update the status.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference">Transaction Reference</Label>
              <Input
                id="reference"
                placeholder="UPI ref, transaction ID, cheque number, etc."
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any additional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={isLoading}>
              Record Payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

