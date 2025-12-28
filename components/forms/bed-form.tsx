'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { bedSchema, type BedInput } from '@/lib/validations';
import { createBed, updateBed } from '@/app/dashboard/beds/actions';
import { PhotoUpload } from '@/components/admin/photo-upload';

interface Room {
  id: string;
  roomNumber: string;
  property: {
    name: string;
  };
}

interface BedFormProps {
  rooms: Room[];
  bed?: {
    id: string;
    roomId: string;
    bedNumber: string;
    monthlyRent: number;
    securityDeposit: number;
    status: string;
    description: string | null;
    images?: string[] | null;
  };
}

export function BedForm({ rooms, bed }: BedFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState<string[]>(
    (bed?.images as string[]) || []
  );

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<BedInput>({
    resolver: zodResolver(bedSchema),
    defaultValues: {
      roomId: bed?.roomId || rooms[0]?.id || '',
      bedNumber: bed?.bedNumber || '',
      monthlyRent: bed?.monthlyRent || 0,
      securityDeposit: bed?.securityDeposit || 0,
      status: (bed?.status as 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'RESERVED') || 'AVAILABLE',
      description: bed?.description || '',
    },
  });

  const onSubmit = async (data: BedInput) => {
    setIsLoading(true);
    try {
      const bedData = {
        ...data,
        images: images.length > 0 ? images : undefined,
      };
      if (bed) {
        await updateBed(bed.id, bedData);
        toast.success('Bed updated successfully');
      } else {
        await createBed(bedData);
        toast.success('Bed created successfully');
      }
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  // Group rooms by property for better UX
  const roomsByProperty = rooms.reduce((acc, room) => {
    const propertyName = room.property.name;
    if (!acc[propertyName]) {
      acc[propertyName] = [];
    }
    acc[propertyName].push(room);
    return acc;
  }, {} as Record<string, Room[]>);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="roomId">Room *</Label>
              <Select
                defaultValue={bed?.roomId || rooms[0]?.id}
                onValueChange={(value) => setValue('roomId', value)}
              >
                <SelectTrigger error={errors.roomId?.message}>
                  <SelectValue placeholder="Select room" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(roomsByProperty).map(([propertyName, propertyRooms]) => (
                    <div key={propertyName}>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                        {propertyName}
                      </div>
                      {propertyRooms.map((room) => (
                        <SelectItem key={room.id} value={room.id}>
                          Room {room.roomNumber}
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bedNumber">Bed Number/Name *</Label>
              <Input
                id="bedNumber"
                placeholder="A or 1"
                {...register('bedNumber')}
                error={errors.bedNumber?.message}
              />
              <p className="text-xs text-muted-foreground">
                Use letters (A, B, C) or numbers (1, 2, 3) to identify beds
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthlyRent">Monthly Rent (₹) *</Label>
              <Input
                id="monthlyRent"
                type="number"
                placeholder="8000"
                {...register('monthlyRent')}
                error={errors.monthlyRent?.message}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="securityDeposit">Security Deposit (₹)</Label>
              <Input
                id="securityDeposit"
                type="number"
                placeholder="16000"
                {...register('securityDeposit')}
                error={errors.securityDeposit?.message}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                defaultValue={bed?.status || 'AVAILABLE'}
                onValueChange={(value) =>
                  setValue('status', value as 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'RESERVED')
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AVAILABLE">Available</SelectItem>
                  <SelectItem value="MAINTENANCE">Under Maintenance</SelectItem>
                  <SelectItem value="RESERVED">Reserved</SelectItem>
                  {bed && <SelectItem value="OCCUPIED">Occupied</SelectItem>}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Status will automatically change to Occupied when a tenant is assigned
              </p>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Additional details about the bed (near window, upper bunk, etc.)"
                rows={2}
                {...register('description')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <PhotoUpload images={images} onImagesChange={setImages} maxImages={5} />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => window.history.back()}>
          Cancel
        </Button>
        <Button type="submit" loading={isLoading}>
          {bed ? 'Update Bed' : 'Create Bed'}
        </Button>
      </div>
    </form>
  );
}
