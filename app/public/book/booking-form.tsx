'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Building2, BedDouble, Calendar, Snowflake, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils';
import { createBooking } from './actions';

interface Bed {
  id: string;
  bedNumber: string;
  monthlyRent: number;
  securityDeposit: number;
  room: {
    id: string;
    roomNumber: string;
    hasAc: boolean;
    acCharge?: number | null;
    multiBedPricing?: Record<string, number> | null;
    roomType: string;
    property: {
      id: string;
      name: string;
    };
  };
}

interface BookingFormProps {
  beds: Bed[];
  selectedBedId?: string;
}

export function BookingForm({ beds, selectedBedId }: BookingFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedBedIds, setSelectedBedIds] = useState<string[]>(
    selectedBedId ? [selectedBedId] : []
  );
  const [acSelected, setAcSelected] = useState(false);

  // Get beds for selected room
  const selectedRoomBeds = selectedRoomId
    ? beds.filter((b) => b.room.id === selectedRoomId)
    : [];

  // Get room details for pricing calculations
  const selectedRoom = selectedRoomId
    ? beds.find((b) => b.room.id === selectedRoomId)?.room
    : null;

  // Calculate total cost
  const calculateTotal = () => {
    if (selectedBedIds.length === 0 || !selectedRoom) return { monthly: 0, deposit: 0, ac: 0, total: 0 };

    const selectedBeds = beds.filter((b) => selectedBedIds.includes(b.id));
    let baseMonthly = selectedBeds.reduce((sum, bed) => sum + Number(bed.monthlyRent), 0);
    let totalDeposit = selectedBeds.reduce((sum, bed) => sum + Number(bed.securityDeposit), 0);

    // Apply multi-bed discount if applicable
    if (selectedRoom.multiBedPricing && selectedBedIds.length >= 2) {
      const discountKey = String(selectedBedIds.length);
      const discountPerBed = selectedRoom.multiBedPricing[discountKey];
      if (discountPerBed) {
        baseMonthly -= discountPerBed * selectedBedIds.length;
      }
    }

    // Add AC charge if selected
    const acCharge = acSelected && selectedRoom.hasAc && selectedRoom.acCharge
      ? Number(selectedRoom.acCharge) * selectedBedIds.length
      : 0;

    return {
      monthly: baseMonthly,
      deposit: totalDeposit,
      ac: acCharge,
      total: baseMonthly + acCharge,
    };
  };

  const totals = calculateTotal();

  // Initialize with selected bed if provided
  useEffect(() => {
    if (selectedBedId) {
      const bed = beds.find((b) => b.id === selectedBedId);
      if (bed) {
        setSelectedRoomId(bed.room.id);
        setSelectedBedIds([selectedBedId]);
      }
    }
  }, [selectedBedId, beds]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      requestedCheckin: new Date().toISOString().split('T')[0],
      durationMonths: 1,
      advanceAmount: '',
      notes: '',
    },
  });

  const handleRoomSelect = (roomId: string) => {
    setSelectedRoomId(roomId);
    setSelectedBedIds([]);
    setAcSelected(false);
  };

  const toggleBed = (bedId: string) => {
    if (selectedBedIds.includes(bedId)) {
      setSelectedBedIds(selectedBedIds.filter((id) => id !== bedId));
    } else {
      setSelectedBedIds([...selectedBedIds, bedId]);
    }
  };

  const onSubmit = async (data: any) => {
    if (selectedBedIds.length === 0) {
      toast.error('Please select at least one bed');
      return;
    }

    if (!selectedRoomId) {
      toast.error('Please select a room');
      return;
    }

    setIsLoading(true);
    try {
      await createBooking({
        bedIds: selectedBedIds,
        name: data.name,
        email: data.email || undefined,
        phone: data.phone,
        requestedCheckin: data.requestedCheckin,
        durationMonths: parseInt(data.durationMonths),
        acSelected: acSelected && selectedRoom?.hasAc,
        advanceAmount: data.advanceAmount ? parseFloat(data.advanceAmount) : undefined,
        notes: data.notes || undefined,
      });
      toast.success('Booking request submitted successfully! We will contact you soon.');
      router.push('/public/book/success');
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit booking request');
    } finally {
      setIsLoading(false);
    }
  };

  // Group beds by property and room
  const bedsByLocation = beds.reduce((acc, bed) => {
    const key = `${bed.room.property.name} - Room ${bed.room.roomNumber}`;
    if (!acc[key]) {
      acc[key] = { roomId: bed.room.id, beds: [] };
    }
    acc[key].beds.push(bed);
    return acc;
  }, {} as Record<string, { roomId: string; beds: Bed[] }>);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="roomId">Select Room *</Label>
              <Select value={selectedRoomId || ''} onValueChange={handleRoomSelect}>
                <SelectTrigger error={!selectedRoomId && selectedBedIds.length === 0 ? 'Please select a room' : undefined}>
                  <SelectValue placeholder="Choose a room" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(bedsByLocation).map(([location, { roomId, beds: locationBeds }]) => (
                    <SelectItem key={roomId} value={roomId}>
                      {location} ({locationBeds.length} bed{locationBeds.length !== 1 ? 's' : ''} available)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedRoomId && selectedRoomBeds.length > 0 && (
              <div className="space-y-4">
                <Label>Select Bed(s) *</Label>
                <div className="grid gap-3 md:grid-cols-2">
                  {selectedRoomBeds.map((bed) => {
                    const isSelected = selectedBedIds.includes(bed.id);
                    return (
                      <div
                        key={bed.id}
                        className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-muted hover:border-primary/50'
                        }`}
                        onClick={() => toggleBed(bed.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleBed(bed.id)}
                                className="h-4 w-4 rounded border-gray-300"
                              />
                              <Label className="cursor-pointer font-medium">
                                Bed {bed.bedNumber}
                              </Label>
                            </div>
                            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                              <div>
                                Rent: {formatCurrency(Number(bed.monthlyRent))}/month
                              </div>
                              <div>
                                Deposit: {formatCurrency(Number(bed.securityDeposit))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  You can select multiple beds in the same room. Multi-bed discounts will be applied automatically.
                </p>
              </div>
            )}

            {selectedRoom?.hasAc && selectedBedIds.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="acSelected"
                    checked={acSelected}
                    onCheckedChange={(checked) => setAcSelected(!!checked)}
                  />
                  <Label htmlFor="acSelected" className="cursor-pointer flex items-center gap-2">
                    <Snowflake className="h-4 w-4" />
                    Use Air Conditioning
                    {selectedRoom.acCharge && (
                      <span className="text-sm text-muted-foreground">
                        (+{formatCurrency(Number(selectedRoom.acCharge))} per bed/month)
                      </span>
                    )}
                  </Label>
                </div>
              </div>
            )}

            {selectedBedIds.length > 0 && (
              <div className="rounded-lg border bg-muted/50 p-4">
                <h4 className="mb-3 font-medium">Booking Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedRoom?.property.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BedDouble className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Room {selectedRoom?.roomNumber}, {selectedBedIds.length} bed{selectedBedIds.length !== 1 ? 's' : ''} selected
                    </span>
                  </div>
                  <div className="mt-3 space-y-1 border-t pt-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Base Monthly Rent:</span>
                      <span className="font-medium">{formatCurrency(totals.monthly)}</span>
                    </div>
                    {totals.ac > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">AC Charge:</span>
                        <span className="font-medium">{formatCurrency(totals.ac)}</span>
                      </div>
                    )}
                    {selectedRoom?.multiBedPricing && selectedBedIds.length >= 2 && (
                      <div className="text-xs text-green-600">
                        Multi-bed discount applied: -{formatCurrency(
                          (selectedRoom.multiBedPricing[String(selectedBedIds.length)] || 0) * selectedBedIds.length
                        )}
                      </div>
                    )}
                    <div className="flex justify-between border-t pt-1 font-semibold">
                      <span>Total Monthly:</span>
                      <span>{formatCurrency(totals.total || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Security Deposit:</span>
                      <span className="font-medium">{formatCurrency(totals.deposit)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h3 className="mb-4 font-semibold">Personal Information</h3>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                placeholder="John Doe"
                {...register('name', { required: 'Name is required' })}
                error={errors.name?.message}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="9876543210"
                {...register('phone', {
                  required: 'Phone number is required',
                  pattern: {
                    value: /^[6-9]\d{9}$/,
                    message: 'Enter a valid 10-digit phone number',
                  },
                })}
                error={errors.phone?.message}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                {...register('email', {
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Enter a valid email address',
                  },
                })}
                error={errors.email?.message}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h3 className="mb-4 font-semibold">Booking Details</h3>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="requestedCheckin">Requested Check-in Date *</Label>
              <Input
                id="requestedCheckin"
                type="date"
                min={new Date().toISOString().split('T')[0]}
                {...register('requestedCheckin', { required: 'Check-in date is required' })}
                error={errors.requestedCheckin?.message}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="durationMonths">Duration (Months) *</Label>
              <Input
                id="durationMonths"
                type="number"
                min="1"
                {...register('durationMonths', {
                  required: 'Duration is required',
                  min: { value: 1, message: 'Duration must be at least 1 month' },
                })}
                error={errors.durationMonths?.message}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="advanceAmount">Advance Amount (Optional)</Label>
              <Input
                id="advanceAmount"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register('advanceAmount')}
                error={errors.advanceAmount?.message}
              />
              <p className="text-xs text-muted-foreground">
                If you're paying an advance amount, enter it here
              </p>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any special requests or additional information..."
                rows={3}
                {...register('notes')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" loading={isLoading} disabled={selectedBedIds.length === 0}>
          Submit Booking Request
        </Button>
      </div>
    </form>
  );
}
