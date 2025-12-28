'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
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
import { deleteBed } from '@/app/dashboard/beds/actions';

interface DeleteBedDialogProps {
  bedId: string;
  bedNumber: string;
}

export function DeleteBedDialog({ bedId, bedNumber }: DeleteBedDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await deleteBed(bedId);
      toast.success('Bed deleted successfully');
      setIsOpen(false);
      router.push('/dashboard/beds');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete bed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Bed</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>Bed {bedNumber}</strong>? This action cannot be
            undone. You cannot delete a bed with an active tenant.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} loading={isLoading}>
            Delete Bed
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

