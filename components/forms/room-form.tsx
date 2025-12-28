'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, X } from 'lucide-react';
import { roomSchema, type RoomInput } from '@/lib/validations';
import { createRoom, updateRoom } from '@/app/dashboard/rooms/actions';
import { PhotoUpload } from '@/components/admin/photo-upload';

interface Property {
  id: string;
  name: string;
}

interface RoomFormProps {
  properties: Property[];
  room?: {
    id: string;
    propertyId: string;
    roomNumber: string;
    floor: number;
    roomType: string;
    hasAc: boolean;
    hasAttachedBath: boolean;
    acCharge?: number | null;
    multiBedPricing?: Record<string, number> | null;
    description: string | null;
    images?: string[] | null;
  };
}

export function RoomForm({ properties, room }: RoomFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState<string[]>(
    (room?.images as string[]) || []
  );

  const [multiBedPricing, setMultiBedPricing] = useState<Record<string, string>>(
    room?.multiBedPricing
      ? Object.fromEntries(
          Object.entries(room.multiBedPricing).map(([k, v]) => [k, v.toString()])
        )
      : {}
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RoomInput>({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      propertyId: room?.propertyId || properties[0]?.id || '',
      roomNumber: room?.roomNumber || '',
      floor: room?.floor || 0,
      roomType: (room?.roomType as 'single' | 'double' | 'triple' | 'dormitory') || 'double',
      hasAc: room?.hasAc || false,
      hasAttachedBath: room?.hasAttachedBath || false,
      acCharge: room?.acCharge ? Number(room.acCharge) : 0,
      description: room?.description || '',
    },
  });

  const watchHasAc = watch('hasAc');
  const watchHasAttachedBath = watch('hasAttachedBath');

  const addMultiBedPricing = () => {
    const bedCount = Object.keys(multiBedPricing).length + 2;
    setMultiBedPricing({ ...multiBedPricing, [bedCount]: '' });
  };

  const removeMultiBedPricing = (bedCount: string) => {
    const updated = { ...multiBedPricing };
    delete updated[bedCount];
    setMultiBedPricing(updated);
  };

  const updateMultiBedPricing = (bedCount: string, value: string) => {
    setMultiBedPricing({ ...multiBedPricing, [bedCount]: value });
  };

  const onSubmit = async (data: RoomInput) => {
    setIsLoading(true);
    try {
      // Convert multi-bed pricing to numbers
      const pricing: Record<string, number> = {};
      Object.entries(multiBedPricing).forEach(([bedCount, discount]) => {
        if (discount && !isNaN(parseFloat(discount))) {
          pricing[bedCount] = parseFloat(discount);
        }
      });

      const roomData = {
        ...data,
        images: images.length > 0 ? images : undefined,
        multiBedPricing: Object.keys(pricing).length > 0 ? pricing : undefined,
      };
      if (room) {
        await updateRoom(room.id, roomData);
        toast.success('Room updated successfully');
      } else {
        await createRoom(roomData);
        toast.success('Room created successfully');
      }
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="propertyId">Property *</Label>
              <Select
                defaultValue={room?.propertyId || properties[0]?.id}
                onValueChange={(value) => setValue('propertyId', value)}
              >
                <SelectTrigger error={errors.propertyId?.message}>
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="roomNumber">Room Number *</Label>
              <Input
                id="roomNumber"
                placeholder="101"
                {...register('roomNumber')}
                error={errors.roomNumber?.message}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="roomType">Room Type *</Label>
              <Select
                defaultValue={room?.roomType || 'double'}
                onValueChange={(value) =>
                  setValue('roomType', value as 'single' | 'double' | 'triple' | 'dormitory')
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single (1 bed)</SelectItem>
                  <SelectItem value="double">Double (2 beds)</SelectItem>
                  <SelectItem value="triple">Triple (3 beds)</SelectItem>
                  <SelectItem value="dormitory">Dormitory (4+ beds)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="floor">Floor</Label>
              <Select
                defaultValue={String(room?.floor || 0)}
                onValueChange={(value) => setValue('floor', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select floor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Ground Floor</SelectItem>
                  <SelectItem value="1">1st Floor</SelectItem>
                  <SelectItem value="2">2nd Floor</SelectItem>
                  <SelectItem value="3">3rd Floor</SelectItem>
                  <SelectItem value="4">4th Floor</SelectItem>
                  <SelectItem value="5">5th Floor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4 md:col-span-2">
              <Label>Room Features</Label>
              <div className="flex flex-wrap gap-4">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    {...register('hasAc')}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span>Air Conditioned (AC)</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    {...register('hasAttachedBath')}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span>Attached Bathroom</span>
                </label>
              </div>
            </div>

            {watchHasAc && (
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="acCharge">AC Charge per Bed (₹) *</Label>
                <Input
                  id="acCharge"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register('acCharge')}
                  error={errors.acCharge?.message}
                />
                <p className="text-xs text-muted-foreground">
                  Extra charge per bed when user selects AC option
                </p>
              </div>
            )}

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Additional details about the room..."
                rows={3}
                {...register('description')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Multi-Bed Pricing */}
      <Card>
        <CardHeader>
          <CardTitle>Multi-Bed Pricing (Optional)</CardTitle>
          <CardDescription>
            Configure discounts when users book multiple beds in this room. For example, if booking 2 beds,
            apply a ₹500 discount per bed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(multiBedPricing).map(([bedCount, discount]) => (
              <div key={bedCount} className="flex items-center gap-2">
                <Label className="w-32">Booking {bedCount} beds:</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Discount per bed (₹)"
                  value={discount}
                  onChange={(e) => updateMultiBedPricing(bedCount, e.target.value)}
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground">₹ discount per bed</span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removeMultiBedPricing(bedCount)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addMultiBedPricing}>
              <Plus className="mr-2 h-4 w-4" />
              Add Multi-Bed Pricing
            </Button>
            <p className="text-xs text-muted-foreground">
              Example: If a user books 2 beds, each bed gets ₹500 discount. Leave empty to use regular pricing.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <PhotoUpload images={images} onImagesChange={setImages} maxImages={10} />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => window.history.back()}>
          Cancel
        </Button>
        <Button type="submit" loading={isLoading}>
          {room ? 'Update Room' : 'Create Room'}
        </Button>
      </div>
    </form>
  );
}
