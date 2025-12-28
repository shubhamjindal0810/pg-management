'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, Eye } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { approveBooking, rejectBooking, convertBookingToTenant } from './actions';

interface BookingActionsProps {
  booking: {
    id: string;
    status: string;
    name: string;
    bedId: string;
  };
}

export function BookingActions({ booking }: BookingActionsProps) {
  const router = useRouter();
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [isConvertOpen, setIsConvertOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  const handleApprove = async () => {
    setIsLoading(true);
    try {
      await approveBooking(booking.id, adminNotes || undefined);
      toast.success('Booking approved successfully');
      setIsApproveOpen(false);
      setAdminNotes('');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve booking');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    setIsLoading(true);
    try {
      await rejectBooking(booking.id, adminNotes || undefined);
      toast.success('Booking rejected');
      setIsRejectOpen(false);
      setAdminNotes('');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject booking');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConvert = async () => {
    setIsLoading(true);
    try {
      await convertBookingToTenant(booking.id);
      toast.success('Booking converted to tenant successfully');
      setIsConvertOpen(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to convert booking');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      {booking.status === 'pending' && (
        <>
          <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Check className="mr-2 h-4 w-4" />
                Approve
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Approve Booking</DialogTitle>
                <DialogDescription>
                  Approve this booking request. The bed will be reserved for this applicant.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="adminNotes">Admin Notes (Optional)</Label>
                  <Textarea
                    id="adminNotes"
                    placeholder="Add any notes about this approval..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsApproveOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleApprove} loading={isLoading}>
                  Approve Booking
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <X className="mr-2 h-4 w-4" />
                Reject
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reject Booking</DialogTitle>
                <DialogDescription>
                  Reject this booking request. The bed will remain available.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="rejectNotes">Rejection Reason (Optional)</Label>
                  <Textarea
                    id="rejectNotes"
                    placeholder="Reason for rejection..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsRejectOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleReject} loading={isLoading}>
                  Reject Booking
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}

      {booking.status === 'approved' && (
        <Dialog open={isConvertOpen} onOpenChange={setIsConvertOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Check className="mr-2 h-4 w-4" />
              Convert to Tenant
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Convert Booking to Tenant</DialogTitle>
              <DialogDescription>
                This will create a user account and tenant profile. The tenant will need to complete
                onboarding by uploading their ID documents (Aadhaar and Proof of ID) before they
                can access all features.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsConvertOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleConvert} loading={isLoading}>
                Convert to Tenant
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

