'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send, AlertCircle, X, DollarSign } from 'lucide-react';
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
import {
  sendBill,
  markAsOverdue,
  applyLateFee,
  cancelBill,
} from '@/app/dashboard/billing/actions';

interface BillActionsProps {
  bill: {
    id: string;
    status: string;
    payments: any[];
  };
}

export function BillActions({ bill }: BillActionsProps) {
  const router = useRouter();
  const [isSendOpen, setIsSendOpen] = useState(false);
  const [isOverdueOpen, setIsOverdueOpen] = useState(false);
  const [isLateFeeOpen, setIsLateFeeOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lateFeeAmount, setLateFeeAmount] = useState('');

  const handleSend = async () => {
    setIsLoading(true);
    try {
      await sendBill(bill.id);
      toast.success('Bill sent successfully');
      setIsSendOpen(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to send bill');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkOverdue = async () => {
    setIsLoading(true);
    try {
      await markAsOverdue(bill.id);
      toast.success('Bill marked as overdue');
      setIsOverdueOpen(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to mark as overdue');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyLateFee = async () => {
    if (!lateFeeAmount || parseFloat(lateFeeAmount) <= 0) {
      toast.error('Please enter a valid late fee amount');
      return;
    }

    setIsLoading(true);
    try {
      await applyLateFee(bill.id, parseFloat(lateFeeAmount));
      toast.success('Late fee applied successfully');
      setIsLateFeeOpen(false);
      setLateFeeAmount('');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to apply late fee');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    setIsLoading(true);
    try {
      await cancelBill(bill.id);
      toast.success('Bill cancelled successfully');
      setIsCancelOpen(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel bill');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      {bill.status === 'DRAFT' && (
        <Dialog open={isSendOpen} onOpenChange={setIsSendOpen}>
          <DialogTrigger asChild>
            <Button>
              <Send className="mr-2 h-4 w-4" />
              Send Bill
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Bill</DialogTitle>
              <DialogDescription>
                This will mark the bill as sent and notify the tenant. Are you sure you want to
                proceed?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsSendOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSend} loading={isLoading}>
                Send Bill
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {(bill.status === 'SENT' || bill.status === 'PARTIAL') && (
        <Dialog open={isOverdueOpen} onOpenChange={setIsOverdueOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <AlertCircle className="mr-2 h-4 w-4" />
              Mark Overdue
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mark Bill as Overdue</DialogTitle>
              <DialogDescription>
                This will mark the bill as overdue. Are you sure you want to proceed?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOverdueOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleMarkOverdue} loading={isLoading}>
                Mark Overdue
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {(bill.status === 'OVERDUE' || bill.status === 'SENT') && (
        <Dialog open={isLateFeeOpen} onOpenChange={setIsLateFeeOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <DollarSign className="mr-2 h-4 w-4" />
              Apply Late Fee
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Apply Late Fee</DialogTitle>
              <DialogDescription>
                Add a late payment fee to this bill.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="lateFeeAmount">Late Fee Amount (₹)</Label>
                <Input
                  id="lateFeeAmount"
                  type="number"
                  placeholder="500"
                  value={lateFeeAmount}
                  onChange={(e) => setLateFeeAmount(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsLateFeeOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleApplyLateFee} loading={isLoading}>
                Apply Late Fee
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {bill.status === 'DRAFT' && bill.payments.length === 0 && (
        <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <X className="mr-2 h-4 w-4" />
              Cancel Bill
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancel Bill</DialogTitle>
              <DialogDescription>
                This will cancel the bill. This action cannot be undone. Are you sure?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCancelOpen(false)}>
                No, Keep Bill
              </Button>
              <Button variant="destructive" onClick={handleCancel} loading={isLoading}>
                Yes, Cancel Bill
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

