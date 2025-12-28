'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { deleteTestimonial, toggleTestimonialStatus } from './actions';

interface TestimonialActionsProps {
  testimonial: {
    id: string;
    isActive: boolean;
  };
}

export function TestimonialActions({ testimonial }: TestimonialActionsProps) {
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await deleteTestimonial(testimonial.id);
      toast.success('Testimonial deleted successfully');
      setIsDeleteDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete testimonial');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    setIsLoading(true);
    try {
      await toggleTestimonialStatus(testimonial.id);
      toast.success(
        `Testimonial ${testimonial.isActive ? 'deactivated' : 'activated'} successfully`
      );
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update testimonial status');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <Link href={`/dashboard/testimonials/${testimonial.id}/edit`} className="flex-1">
          <Button variant="outline" size="sm" className="w-full">
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </Link>
        <Button
          variant="outline"
          size="sm"
          onClick={handleToggleStatus}
          disabled={isLoading}
        >
          {testimonial.isActive ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsDeleteDialogOpen(true)}
          disabled={isLoading}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Testimonial</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this testimonial? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} loading={isLoading}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

