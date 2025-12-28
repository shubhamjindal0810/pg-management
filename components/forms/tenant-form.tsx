'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { tenantSchema, type TenantInput } from '@/lib/validations';
import { createTenant, updateTenant } from '@/app/dashboard/tenants/actions';
import { formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { z } from 'zod';

interface Bed {
  id: string;
  bedNumber: string;
  monthlyRent: number;
  securityDeposit: number;
  room: {
    roomNumber: string;
    hasAc: boolean;
    property: {
      name: string;
    };
  };
}

interface TenantFormProps {
  availableBeds: Bed[];
  tenantId?: string;
  initialData?: {
    name: string;
    phone: string;
    email?: string | null;
    bedId?: string | null;
    dateOfBirth?: Date | null;
    gender?: string | null;
    bloodGroup?: string | null;
    occupation?: string | null;
    workplaceCollege?: string | null;
    workAddress?: string | null;
    emergencyName?: string | null;
    emergencyPhone?: string | null;
    emergencyRelation?: string | null;
    checkInDate?: Date | null;
    expectedCheckout?: Date | null;
    noticePeriodDays?: number | null;
    notes?: string | null;
  };
}

export function TenantForm({ availableBeds, tenantId, initialData }: TenantFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
  const isEditMode = !!tenantId;

  // Format date for input field
  const formatDateForInput = (date: Date | null | undefined): string => {
    if (!date) return '';
    return new Date(date).toISOString().split('T')[0];
  };

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<TenantInput>({
    resolver: zodResolver(tenantSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          phone: initialData.phone,
          email: initialData.email || '',
          bedId: initialData.bedId || '',
          dateOfBirth: formatDateForInput(initialData.dateOfBirth),
          gender: (initialData.gender as 'male' | 'female' | 'other') || undefined,
          bloodGroup: initialData.bloodGroup || undefined,
          occupation: (initialData.occupation as 'working' | 'student') || undefined,
          workplaceCollege: initialData.workplaceCollege || '',
          workAddress: initialData.workAddress || '',
          emergencyName: initialData.emergencyName || '',
          emergencyPhone: initialData.emergencyPhone || '',
          emergencyRelation: initialData.emergencyRelation || '',
          checkInDate: formatDateForInput(initialData.checkInDate),
          expectedCheckout: formatDateForInput(initialData.expectedCheckout),
          noticePeriodDays: initialData.noticePeriodDays || 30,
          notes: initialData.notes || '',
        }
      : {
          checkInDate: new Date().toISOString().split('T')[0],
          noticePeriodDays: 30,
        },
  });

  // Set selected bed when in edit mode and ensure required fields are set
  useEffect(() => {
    if (initialData?.bedId) {
      const bed = availableBeds.find((b) => b.id === initialData.bedId);
      if (bed) {
        setSelectedBed(bed);
        setValue('bedId', bed.id);
      }
    }
    // Ensure checkInDate is set for validation
    if (isEditMode && initialData?.checkInDate) {
      setValue('checkInDate', formatDateForInput(initialData.checkInDate));
    }
  }, [initialData?.bedId, initialData?.checkInDate, availableBeds, setValue, isEditMode]);

  const onSubmit = async (data: TenantInput) => {
    setIsLoading(true);
    try {
      if (isEditMode && tenantId) {
        // For edit mode, we don't need bedId or checkInDate
        const { bedId, checkInDate, ...updateData } = data;
        await updateTenant(tenantId, updateData);
        toast.success('Tenant updated successfully');
        router.push(`/dashboard/tenants/${tenantId}`);
        router.refresh();
      } else {
        await createTenant(data);
        toast.success('Tenant added successfully');
      }
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBedSelect = (bedId: string) => {
    setValue('bedId', bedId);
    const bed = availableBeds.find((b) => b.id === bedId);
    setSelectedBed(bed || null);
  };

  // Group beds by property and room
  const bedsByProperty = availableBeds.reduce((acc, bed) => {
    const key = `${bed.room.property.name} - Room ${bed.room.roomNumber}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(bed);
    return acc;
  }, {} as Record<string, Bed[]>);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Bed Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Bed Assignment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bedId">Select Bed {!isEditMode && '*'}</Label>
              <Select onValueChange={handleBedSelect} defaultValue={initialData?.bedId || ''}>
                <SelectTrigger error={errors.bedId?.message}>
                  <SelectValue placeholder={isEditMode ? "Current bed (cannot be changed)" : "Select available bed"} />
                </SelectTrigger>
                <SelectContent>
                  {isEditMode && initialData?.bedId && (
                    <SelectItem value={initialData.bedId} disabled>
                      Current Bed (Cannot Change)
                    </SelectItem>
                  )}
                  {Object.entries(bedsByProperty).map(([location, beds]) => (
                    <div key={location}>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                        {location}
                      </div>
                      {beds.map((bed) => (
                        <SelectItem key={bed.id} value={bed.id} disabled={isEditMode}>
                          Bed {bed.bedNumber} - {formatCurrency(Number(bed.monthlyRent))}/month
                          {bed.room.hasAc && ' (AC)'}
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedBed && (
              <div className="rounded-lg border bg-muted/50 p-4">
                <h4 className="font-medium">Selected Bed Details</h4>
                <div className="mt-2 space-y-1 text-sm">
                  <p>
                    <span className="text-muted-foreground">Location:</span>{' '}
                    {selectedBed.room.property.name}, Room {selectedBed.room.roomNumber}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Monthly Rent:</span>{' '}
                    {formatCurrency(Number(selectedBed.monthlyRent))}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Security Deposit:</span>{' '}
                    {formatCurrency(Number(selectedBed.securityDeposit))}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Features:</span>{' '}
                    {selectedBed.room.hasAc ? 'AC' : 'Non-AC'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                placeholder="John Doe"
                {...register('name')}
                error={errors.name?.message}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="9876543210"
                {...register('phone')}
                error={errors.phone?.message}
                disabled={isEditMode}
              />
              {!isEditMode && (
                <p className="text-xs text-muted-foreground">
                  This will also be used as default login password
                </p>
              )}
              {isEditMode && (
                <p className="text-xs text-muted-foreground">
                  Phone number cannot be changed
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                {...register('email')}
                error={errors.email?.message}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select onValueChange={(value) => setValue('gender', value as 'male' | 'female' | 'other')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input id="dateOfBirth" type="date" {...register('dateOfBirth')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bloodGroup">Blood Group</Label>
              <Select onValueChange={(value) => setValue('bloodGroup', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select blood group" />
                </SelectTrigger>
                <SelectContent>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                    <SelectItem key={bg} value={bg}>
                      {bg}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Work / College */}
      <Card>
        <CardHeader>
          <CardTitle>Work / College Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="occupation">Occupation</Label>
              <Select onValueChange={(value) => setValue('occupation', value as 'working' | 'student')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select occupation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="working">Working Professional</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="workplaceCollege">Company / College Name</Label>
              <Input
                id="workplaceCollege"
                placeholder="ABC Corp / XYZ University"
                {...register('workplaceCollege')}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="workAddress">Work / College Address</Label>
              <Input
                id="workAddress"
                placeholder="Full address"
                {...register('workAddress')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card>
        <CardHeader>
          <CardTitle>Emergency Contact</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="emergencyName">Contact Name</Label>
              <Input
                id="emergencyName"
                placeholder="Parent / Guardian name"
                {...register('emergencyName')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergencyPhone">Contact Phone</Label>
              <Input
                id="emergencyPhone"
                type="tel"
                placeholder="9876543210"
                {...register('emergencyPhone')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergencyRelation">Relationship</Label>
              <Input
                id="emergencyRelation"
                placeholder="Father / Mother / etc."
                {...register('emergencyRelation')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stay Details */}
      <Card>
        <CardHeader>
          <CardTitle>Stay Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="checkInDate">Check-in Date {!isEditMode && '*'}</Label>
              <Input
                id="checkInDate"
                type="date"
                {...register('checkInDate')}
                error={errors.checkInDate?.message}
                disabled={isEditMode}
              />
              {isEditMode && (
                <p className="text-xs text-muted-foreground">
                  Check-in date cannot be changed
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="expectedCheckout">Expected Checkout</Label>
              <Input
                id="expectedCheckout"
                type="date"
                {...register('expectedCheckout')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="noticePeriodDays">Notice Period (Days)</Label>
              <Input
                id="noticePeriodDays"
                type="number"
                defaultValue={30}
                {...register('noticePeriodDays')}
              />
            </div>

            <div className="space-y-2 md:col-span-3">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any additional notes about this tenant..."
                rows={3}
                {...register('notes')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => window.history.back()}>
          Cancel
        </Button>
        <Button type="submit" loading={isLoading}>
          {isEditMode ? 'Update Tenant' : 'Add Tenant'}
        </Button>
      </div>
    </form>
  );
}
