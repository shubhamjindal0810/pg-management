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
import { deleteProperty } from '@/app/dashboard/properties/actions';

interface DeletePropertyDialogProps {
  propertyId: string;
  propertyName: string;
}

export function DeletePropertyDialog({ propertyId, propertyName }: DeletePropertyDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await deleteProperty(propertyId);
      toast.success('Property deleted successfully');
      setIsOpen(false);
      router.push('/dashboard/properties');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete property');
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
          <DialogTitle>Delete Property</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{propertyName}</strong>? This action cannot be
            undone. All rooms and beds in this property will also be deleted.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} loading={isLoading}>
            Delete Property
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

