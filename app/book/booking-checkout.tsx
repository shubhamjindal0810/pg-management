'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Image from 'next/image';
import { toast } from 'sonner';
import {
  Building2,
  BedDouble,
  Calendar,
  Snowflake,
  Users,
  Shield,
  Check,
  ChevronRight,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { createBooking } from './actions';

interface BookingCheckoutProps {
  room: {
    id: string;
    roomNumber: string;
    hasAc: boolean;
    dailyPrice: number | null;
    multiBedPricing: Record<string, number> | null;
    property: {
      id: string;
      name: string;
      address: string;
      city: string;
      amenities: string[] | null;
      rules: string[] | null;
      images: string[] | null;
      breakfastEnabled: boolean;
      breakfastPrice: number | null;
      breakfastMenu: string | null;
      lunchEnabled: boolean;
      lunchPrice: number | null;
      lunchMenu: string | null;
      dinnerEnabled: boolean;
      dinnerPrice: number | null;
      dinnerMenu: string | null;
      acMonthlyRent: number | null;
      acSecurityDeposit: number | null;
    };
    beds: Array<{
      id: string;
      bedNumber: string;
      images: string[] | null;
    }>;
    monthlyRent: number;
    securityDeposit: number;
  };
  selectedBedId?: string;
}

export function BookingCheckout({ room, selectedBedId }: BookingCheckoutProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBedIds, setSelectedBedIds] = useState<string[]>(
    selectedBedId ? [selectedBedId] : []
  );
  const [acSelected, setAcSelected] = useState(false);
  const [breakfastSelected, setBreakfastSelected] = useState(false);
  const [lunchSelected, setLunchSelected] = useState(false);
  const [dinnerSelected, setDinnerSelected] = useState(false);
  const [bookingType, setBookingType] = useState<'monthly' | 'daily'>('monthly');
  const [durationMonths, setDurationMonths] = useState(1);
  const [durationDays, setDurationDays] = useState(1);
  const [expectedCheckout, setExpectedCheckout] = useState('');

  const propertyImages = (room.property.images as string[]) || [];
  const primaryImage = propertyImages[0] || '/placeholder-room.jpg';

  // Calculate total cost
  const calculateTotal = () => {
    if (selectedBedIds.length === 0) {
      return {
        monthly: 0,
        daily: 0,
        deposit: 0,
        ac: 0,
        meals: 0,
        breakfast: 0,
        lunch: 0,
        dinner: 0,
        total: 0,
        baseMonthly: 0,
        baseDaily: 0,
      };
    }

    const selectedBeds = room.beds.filter((b) => selectedBedIds.includes(b.id));
    let totalDeposit = Number(room.securityDeposit) * selectedBedIds.length;

    let baseMonthly = 0;
    let baseDaily = 0;

    if (bookingType === 'monthly') {
      baseMonthly = Number(room.monthlyRent) * selectedBedIds.length;
      
      // Apply multi-bed discount if applicable
      if (room.multiBedPricing && selectedBedIds.length >= 2) {
        const discountKey = String(selectedBedIds.length);
        const discountPerBed = room.multiBedPricing[discountKey];
        if (discountPerBed) {
          baseMonthly -= discountPerBed * selectedBedIds.length;
        }
      }
    } else {
      // Daily booking
      if (room.dailyPrice) {
        baseDaily = Number(room.dailyPrice) * selectedBedIds.length * durationDays;
      } else {
        // Fallback: calculate from monthly rent / 30
        baseDaily = (Number(room.monthlyRent) / 30) * selectedBedIds.length * durationDays;
      }
    }

    // Add AC charge if selected (only for monthly bookings) - from property level
    const acCharge = acSelected && room.hasAc && room.property.acMonthlyRent && bookingType === 'monthly'
      ? Number(room.property.acMonthlyRent) * selectedBedIds.length
      : 0;

    // Add AC security deposit if AC is selected
    const acDeposit = acSelected && room.hasAc && room.property.acSecurityDeposit
      ? Number(room.property.acSecurityDeposit) * selectedBedIds.length
      : 0;
    
    totalDeposit += acDeposit;

    // Add meal charges if selected
    const daysForMeals = bookingType === 'monthly' ? 30 * durationMonths : durationDays;
    const breakfastCharge = breakfastSelected && room.property.breakfastEnabled && room.property.breakfastPrice
      ? Number(room.property.breakfastPrice) * daysForMeals
      : 0;
    const lunchCharge = lunchSelected && room.property.lunchEnabled && room.property.lunchPrice
      ? Number(room.property.lunchPrice) * daysForMeals
      : 0;
    const dinnerCharge = dinnerSelected && room.property.dinnerEnabled && room.property.dinnerPrice
      ? Number(room.property.dinnerPrice) * daysForMeals
      : 0;
    const totalMealCharge = breakfastCharge + lunchCharge + dinnerCharge;

    const monthlyTotal = baseMonthly + acCharge;
    const dailyTotal = baseDaily;
    const totalForDuration = bookingType === 'monthly' 
      ? monthlyTotal * durationMonths 
      : dailyTotal;

    return {
      monthly: monthlyTotal,
      daily: dailyTotal,
      deposit: totalDeposit,
      ac: acCharge,
      meals: totalMealCharge,
      breakfast: breakfastCharge,
      lunch: lunchCharge,
      dinner: dinnerCharge,
      total: totalForDuration + totalDeposit + totalMealCharge,
      baseMonthly,
      baseDaily,
    };
  };

  const totals = calculateTotal();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      requestedCheckin: new Date().toISOString().split('T')[0],
      expectedCheckout: '',
      advanceAmount: '',
      notes: '',
    },
  });

  const requestedCheckin = watch('requestedCheckin');

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

    setIsLoading(true);
    try {
      await createBooking({
        bedIds: selectedBedIds,
        name: data.name,
        email: data.email || undefined,
        phone: data.phone,
        requestedCheckin: data.requestedCheckin,
        durationMonths: bookingType === 'monthly' ? durationMonths : undefined,
        durationDays: bookingType === 'daily' ? durationDays : undefined,
        expectedCheckout: expectedCheckout || undefined,
        acSelected: acSelected && room.hasAc && bookingType === 'monthly',
        breakfastSelected: breakfastSelected && room.property.breakfastEnabled,
        lunchSelected: lunchSelected && room.property.lunchEnabled,
        dinnerSelected: dinnerSelected && room.property.dinnerEnabled,
        advanceAmount: data.advanceAmount ? parseFloat(data.advanceAmount) : undefined,
        notes: data.notes || undefined,
      });
      toast.success('Booking request submitted successfully! We will contact you soon.');
      router.push('/book/success');
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit booking request');
    } finally {
      setIsLoading(false);
    }
  };

  const houseRules = (room.property.rules as string[]) || [];

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Complete your booking</h1>
        <p className="text-muted-foreground">
          {room.property.name} - Room {room.roomNumber}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        {/* Main Form */}
        <div className="space-y-8">
          {/* Room Summary */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg">
                  <Image
                    src={primaryImage}
                    alt={room.property.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{room.property.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Room {room.roomNumber} • {room.property.city}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Select Beds */}
          <Card>
            <CardHeader>
              <CardTitle>Select Bed(s)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {room.beds.map((bed) => {
                const isSelected = selectedBedIds.includes(bed.id);
                const bedImages = (bed.images as string[]) || [];
                const bedImage = bedImages[0] || primaryImage;
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
                    <div className="flex gap-4">
                      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md">
                        {bedImage && (
                          <Image src={bedImage} alt={`Bed ${bed.bedNumber}`} fill className="object-cover" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
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
                            <p className="mt-1 text-sm text-muted-foreground">
                              {formatCurrency(Number(room.monthlyRent))}/month
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {formatCurrency(Number(room.securityDeposit))}
                            </p>
                            <p className="text-xs text-muted-foreground">Deposit</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {room.multiBedPricing && Object.keys(room.multiBedPricing).length > 0 && (
                <div className="mt-4 rounded-lg bg-green-50 p-3">
                  <p className="text-sm font-medium text-green-800">Multi-bed Discounts</p>
                  <div className="mt-1 space-y-1">
                    {Object.entries(room.multiBedPricing).map(([bedCount, discount]) => (
                      <p key={bedCount} className="text-xs text-green-700">
                        Book {bedCount} beds: Save {formatCurrency(Number(discount))} per bed
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Meal Options */}
          {(room.property.breakfastEnabled || room.property.lunchEnabled || room.property.dinnerEnabled) && (
            <Card>
              <CardHeader>
                <CardTitle>Meal Services (Optional)</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Add meal services to your booking. Meal services are available only on a monthly subscription basis - not per meal.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedBedIds.length === 0 && (
                  <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3 mb-4">
                    <p className="text-sm text-yellow-800">
                      Please select a bed first to add meal services to your booking.
                    </p>
                  </div>
                )}
                {room.property.breakfastEnabled && (
                  <div className="flex items-start justify-between rounded-lg border p-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={breakfastSelected}
                          onCheckedChange={(checked) => setBreakfastSelected(checked === true)}
                          disabled={selectedBedIds.length === 0}
                        />
                        <div className="flex-1">
                          <Label className="cursor-pointer font-medium">Breakfast</Label>
                          {room.property.breakfastMenu && (
                            <p className="mt-1 text-sm text-muted-foreground">
                              {room.property.breakfastMenu}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(Number(room.property.breakfastPrice || 0))}/meal</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(Number(room.property.breakfastPrice || 0) * 30 * durationMonths)} for {durationMonths} month{durationMonths > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                )}

                {room.property.lunchEnabled && (
                  <div className="flex items-start justify-between rounded-lg border p-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={lunchSelected}
                          onCheckedChange={(checked) => setLunchSelected(checked === true)}
                          disabled={selectedBedIds.length === 0}
                        />
                        <div className="flex-1">
                          <Label className="cursor-pointer font-medium">Lunch</Label>
                          {room.property.lunchMenu && (
                            <p className="mt-1 text-sm text-muted-foreground">
                              {room.property.lunchMenu}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(Number(room.property.lunchPrice || 0))}/meal</p>
                      <p className="text-xs text-muted-foreground">
                        {bookingType === 'monthly' 
                          ? `${formatCurrency(Number(room.property.lunchPrice || 0) * 30 * durationMonths)} for ${durationMonths} month${durationMonths > 1 ? 's' : ''}`
                          : `${formatCurrency(Number(room.property.lunchPrice || 0) * durationDays)} for ${durationDays} day${durationDays > 1 ? 's' : ''}`
                        }
                      </p>
                    </div>
                  </div>
                )}

                {room.property.dinnerEnabled && (
                  <div className="flex items-start justify-between rounded-lg border p-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={dinnerSelected}
                          onCheckedChange={(checked) => setDinnerSelected(checked === true)}
                          disabled={selectedBedIds.length === 0}
                        />
                        <div className="flex-1">
                          <Label className="cursor-pointer font-medium">Dinner</Label>
                          {room.property.dinnerMenu && (
                            <p className="mt-1 text-sm text-muted-foreground">
                              {room.property.dinnerMenu}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(Number(room.property.dinnerPrice || 0))}/meal</p>
                      <p className="text-xs text-muted-foreground">
                        {bookingType === 'monthly' 
                          ? `${formatCurrency(Number(room.property.dinnerPrice || 0) * 30 * durationMonths)} for ${durationMonths} month${durationMonths > 1 ? 's' : ''}`
                          : `${formatCurrency(Number(room.property.dinnerPrice || 0) * durationDays)} for ${durationDays} day${durationDays > 1 ? 's' : ''}`
                        }
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* AC Option */}
          {room.hasAc && (
            <Card>
              <CardHeader>
                <CardTitle>Air Conditioning</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedBedIds.length === 0 && (
                  <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3 mb-4">
                    <p className="text-sm text-yellow-800">
                      Please select a bed first to add AC to your booking.
                    </p>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="acSelected"
                    checked={acSelected}
                    onCheckedChange={(checked) => setAcSelected(!!checked)}
                    disabled={selectedBedIds.length === 0}
                  />
                  <Label htmlFor="acSelected" className="cursor-pointer flex-1">
                    <div className="flex items-center gap-2">
                      <Snowflake className="h-4 w-4" />
                      <span>Use Air Conditioning</span>
                      {room.property.acMonthlyRent && bookingType === 'monthly' && (
                        <span className="text-sm text-muted-foreground">
                          (+{formatCurrency(Number(room.property.acMonthlyRent))} per bed/month)
                        </span>
                      )}
                    </div>
                    {room.hasAc && (
                      <p className="mt-2 text-xs text-amber-600 font-medium">
                        ⚠️ AC usage charges will be billed separately based on electricity consumption at the end of each month
                      </p>
                    )}
                    {room.hasAc && room.property.acSecurityDeposit && (
                      <p className="mt-1 text-xs text-blue-600 font-medium">
                        ℹ️ AC security deposit: {formatCurrency(Number(room.property.acSecurityDeposit))} per bed
                      </p>
                    )}
                  </Label>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Booking Details */}
          <Card>
            <CardHeader>
              <CardTitle>Your Trip</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="requestedCheckin">Check-in Date *</Label>
                  <Input
                    id="requestedCheckin"
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    {...register('requestedCheckin', {
                      required: 'Check-in date is required',
                      validate: (value) => {
                        const today = new Date().toISOString().split('T')[0];
                        if (value < today) {
                          return 'Check-in date cannot be in the past';
                        }
                        return true;
                      },
                    })}
                    error={errors.requestedCheckin?.message}
                    onChange={(e) => {
                      const selectedDate = e.target.value;
                      const today = new Date().toISOString().split('T')[0];
                      if (selectedDate >= today) {
                        register('requestedCheckin').onChange(e);
                        // Reset expected checkout if it's before the new check-in date
                        if (expectedCheckout && expectedCheckout < selectedDate) {
                          setExpectedCheckout('');
                        }
                      }
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bookingType">Booking Type *</Label>
                  <select
                    id="bookingType"
                    value={bookingType}
                    onChange={(e) => {
                      setBookingType(e.target.value as 'monthly' | 'daily');
                      if (e.target.value === 'daily' && !room.dailyPrice) {
                        toast.warning('Daily booking is not available for this room. Please contact us for short-term stays.');
                      }
                    }}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="monthly">Monthly Booking</option>
                    <option value="daily" disabled={!room.dailyPrice}>Per Day Booking</option>
                  </select>
                  {!room.dailyPrice && (
                    <p className="text-xs text-muted-foreground">
                      Daily booking not available. Please contact us for short-term stays.
                    </p>
                  )}
                </div>
              </div>
              
              {bookingType === 'monthly' ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="durationMonths">Duration (Months) *</Label>
                    <select
                      id="durationMonths"
                      value={durationMonths}
                      onChange={(e) => setDurationMonths(parseInt(e.target.value))}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="1">1 Month</option>
                      <option value="2">2 Months</option>
                      <option value="3">3 Months</option>
                      <option value="6">6 Months</option>
                      <option value="12">12 Months</option>
                    </select>
                    <p className="text-xs text-muted-foreground">
                      Note: Payment is for the first month only. Subsequent months will be billed monthly.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expectedCheckout">Expected Checkout Date (Optional)</Label>
                    <Input
                      id="expectedCheckout"
                      type="date"
                      min={requestedCheckin || new Date().toISOString().split('T')[0]}
                      value={expectedCheckout}
                      onChange={(e) => {
                        const selectedDate = e.target.value;
                        const minDate = requestedCheckin || new Date().toISOString().split('T')[0];
                        if (selectedDate >= minDate) {
                          setExpectedCheckout(selectedDate);
                        }
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      Your expected checkout date. This helps us plan better and show availability.
                    </p>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="durationDays">Duration (Days) *</Label>
                  <Input
                    id="durationDays"
                    type="number"
                    min="1"
                    value={durationDays}
                    onChange={(e) => setDurationDays(parseInt(e.target.value) || 1)}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Daily rate: {formatCurrency(Number(room.dailyPrice || 0))} per bed per day
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
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
              </div>

              <div className="space-y-2">
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

              <div className="space-y-2">
                <Label htmlFor="advanceAmount">Advance Amount (Optional)</Label>
                <Input
                  id="advanceAmount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register('advanceAmount')}
                />
                <p className="text-xs text-muted-foreground">
                  If you're paying an advance amount, enter it here
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any special requests or additional information..."
                  rows={3}
                  {...register('notes')}
                />
              </div>
            </CardContent>
          </Card>

          {/* House Rules */}
          {houseRules.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  House Rules
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {houseRules.map((rule, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Booking Summary - Sticky */}
        <div className="lg:sticky lg:top-4 lg:h-fit">
          <Card className="border-2 shadow-lg">
            <CardHeader className="border-b">
              <CardTitle>Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {selectedBedIds.length > 0 ? (
                <>
                  <div className="space-y-3">
                    {bookingType === 'monthly' ? (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            {selectedBedIds.length} bed{selectedBedIds.length !== 1 ? 's' : ''} ×{' '}
                            {durationMonths} month{durationMonths !== 1 ? 's' : ''}
                          </span>
                          <span className="font-medium">
                            {formatCurrency((totals.baseMonthly || 0) * durationMonths)}
                          </span>
                        </div>
                        {totals.ac > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">AC Charge ({durationMonths} month{durationMonths > 1 ? 's' : ''})</span>
                            <span className="font-medium">
                              {formatCurrency(totals.ac * durationMonths)}
                            </span>
                          </div>
                        )}
                        {room.multiBedPricing &&
                          selectedBedIds.length >= 2 &&
                          room.multiBedPricing[String(selectedBedIds.length)] && (
                            <div className="flex justify-between text-sm text-green-600">
                              <span>Multi-bed Discount</span>
                              <span>
                                -{formatCurrency(
                                  Number(room.multiBedPricing[String(selectedBedIds.length)]) *
                                    selectedBedIds.length *
                                    durationMonths
                                )}
                              </span>
                            </div>
                          )}
                      </>
                    ) : (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {selectedBedIds.length} bed{selectedBedIds.length !== 1 ? 's' : ''} ×{' '}
                          {durationDays} day{durationDays > 1 ? 's' : ''}
                        </span>
                        <span className="font-medium">
                          {formatCurrency(totals.daily || 0)}
                        </span>
                      </div>
                    )}
                    {(totals.meals || 0) > 0 && (
                      <>
                        {(totals.breakfast || 0) > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              Breakfast ({bookingType === 'monthly' ? `${durationMonths} month${durationMonths > 1 ? 's' : ''}` : `${durationDays} day${durationDays > 1 ? 's' : ''}`})
                            </span>
                            <span className="font-medium">
                              {formatCurrency(totals.breakfast || 0)}
                            </span>
                          </div>
                        )}
                        {(totals.lunch || 0) > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              Lunch ({bookingType === 'monthly' ? `${durationMonths} month${durationMonths > 1 ? 's' : ''}` : `${durationDays} day${durationDays > 1 ? 's' : ''}`})
                            </span>
                            <span className="font-medium">
                              {formatCurrency(totals.lunch || 0)}
                            </span>
                          </div>
                        )}
                        {(totals.dinner || 0) > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              Dinner ({bookingType === 'monthly' ? `${durationMonths} month${durationMonths > 1 ? 's' : ''}` : `${durationDays} day${durationDays > 1 ? 's' : ''}`})
                            </span>
                            <span className="font-medium">
                              {formatCurrency(totals.dinner || 0)}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                    <div className="flex justify-between border-t pt-2 font-semibold">
                      <span>Subtotal</span>
                      <span>{formatCurrency((bookingType === 'monthly' ? totals.monthly * durationMonths : totals.daily) + (totals.meals || 0))}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Security Deposit</span>
                      <span className="font-medium">{formatCurrency(totals.deposit)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 text-lg font-bold">
                      <span>Total</span>
                       <span>{formatCurrency(totals.total || 0)}</span>
                    </div>
                  </div>

                  <Button
                    size="lg"
                    className="w-full"
                    onClick={handleSubmit(onSubmit)}
                    loading={isLoading}
                    disabled={selectedBedIds.length === 0}
                  >
                    Reserve Now
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    You won't be charged until booking is confirmed
                  </p>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BedDouble className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Select at least one bed to continue</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

