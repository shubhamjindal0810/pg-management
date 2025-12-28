'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, LogOut } from 'lucide-react';
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
import { giveNotice, checkoutTenant } from '@/app/dashboard/tenants/actions';

interface TenantActionsProps {
  tenant: {
    id: string;
    status: string;
    noticePeriodDays: number;
    bed: {
      securityDeposit: number;
    } | null;
    securityDeposits: Array<{
      amountPaid: number;
      amountRefunded: number | null;
      deductions: any;
    }>;
  };
}

export function TenantActions({ tenant }: TenantActionsProps) {
  const router = useRouter();
  const [isNoticeOpen, setIsNoticeOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [checkoutDate, setCheckoutDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  const handleGiveNotice = async () => {
    setIsLoading(true);
    try {
      await giveNotice(tenant.id);
      toast.success('Notice given successfully');
      setIsNoticeOpen(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to give notice');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckout = async () => {
    setIsLoading(true);
    try {
      await checkoutTenant(tenant.id, checkoutDate);
      toast.success('Tenant checked out successfully');
      setIsCheckoutOpen(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to checkout tenant');
    } finally {
      setIsLoading(false);
    }
  };

  if (tenant.status === 'CHECKED_OUT') {
    return null;
  }

  return (
    <div className="flex gap-2">
      {tenant.status === 'ACTIVE' && (
        <Dialog open={isNoticeOpen} onOpenChange={setIsNoticeOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <AlertCircle className="mr-2 h-4 w-4" />
              Give Notice
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Give Notice to Tenant</DialogTitle>
              <DialogDescription>
                This will set the tenant status to "Notice Period" and calculate the expected
                checkout date based on the notice period ({tenant.noticePeriodDays} days).
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNoticeOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleGiveNotice} loading={isLoading}>
                Confirm Notice
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {(tenant.status === 'ACTIVE' || tenant.status === 'NOTICE_PERIOD') && (
        <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <LogOut className="mr-2 h-4 w-4" />
              Checkout
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Checkout Tenant</DialogTitle>
              <DialogDescription>
                This will mark the tenant as checked out and free up the bed for new tenants.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="checkoutDate">Checkout Date</Label>
                <Input
                  id="checkoutDate"
                  type="date"
                  value={checkoutDate}
                  onChange={(e) => setCheckoutDate(e.target.value)}
                />
              </div>
              {tenant.bed && tenant.securityDeposits.length > 0 && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <p className="text-sm font-medium text-blue-900">Security Deposit Information</p>
                  <div className="mt-2 space-y-1 text-sm text-blue-800">
                    <p>
                      Total Deposits: ₹
                      {tenant.securityDeposits
                        .reduce((sum, d) => sum + Number(d.amountPaid), 0)
                        .toLocaleString()}
                    </p>
                    <p>
                      Total Refunded: ₹
                      {tenant.securityDeposits
                        .reduce((sum, d) => sum + Number(d.amountRefunded || 0), 0)
                        .toLocaleString()}
                    </p>
                    <p className="text-xs text-blue-700">
                      Remember to process any remaining security deposit refunds after checkout.
                    </p>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCheckoutOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCheckout} loading={isLoading}>
                Confirm Checkout
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

