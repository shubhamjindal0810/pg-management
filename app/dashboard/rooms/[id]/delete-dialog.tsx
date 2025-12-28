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
import { deleteRoom } from '@/app/dashboard/rooms/actions';

interface DeleteRoomDialogProps {
  roomId: string;
  roomNumber: string;
}

export function DeleteRoomDialog({ roomId, roomNumber }: DeleteRoomDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await deleteRoom(roomId);
      toast.success('Room deleted successfully');
      setIsOpen(false);
      router.push('/dashboard/rooms');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete room');
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
          <DialogTitle>Delete Room</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>Room {roomNumber}</strong>? This action cannot
            be undone. All beds in this room will also be deleted. You cannot delete a room with
            occupied beds.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} loading={isLoading}>
            Delete Room
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

