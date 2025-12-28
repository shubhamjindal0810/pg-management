'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
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
import { formatCurrency } from '@/lib/utils';
import { createBill } from '@/app/dashboard/billing/actions';

interface Tenant {
  id: string;
  name: string;
  room: string;
  bed: string;
  rent: number;
}

interface BillFormProps {
  tenants: Tenant[];
}

export function BillForm({ tenants }: BillFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

  // Default to current month
  const today = new Date();
  const defaultBillingMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const defaultDueDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-05`;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      tenantId: '',
      billingMonth: defaultBillingMonth,
      dueDate: defaultDueDate,
      notes: '',
    },
  });

  const handleTenantSelect = (tenantId: string) => {
    setValue('tenantId', tenantId);
    const tenant = tenants.find((t) => t.id === tenantId);
    setSelectedTenant(tenant || null);
  };

  const onSubmit = async (data: any) => {
    if (!data.tenantId) {
      toast.error('Please select a tenant');
      return;
    }

    setIsLoading(true);
    try {
      await createBill({
        tenantId: data.tenantId,
        billingMonth: `${data.billingMonth}-01`, // First day of month
        dueDate: data.dueDate,
        notes: data.notes,
      });
      toast.success('Bill created successfully');
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bill Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Select Tenant *</Label>
              <Select onValueChange={handleTenantSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select tenant" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.name} - Room {tenant.room}, Bed {tenant.bed}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedTenant && (
              <div className="rounded-lg border bg-muted/50 p-4">
                <h4 className="font-medium">Tenant Details</h4>
                <div className="mt-2 space-y-1 text-sm">
                  <p>
                    <span className="text-muted-foreground">Name:</span> {selectedTenant.name}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Location:</span> Room{' '}
                    {selectedTenant.room}, Bed {selectedTenant.bed}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Monthly Rent:</span>{' '}
                    {formatCurrency(selectedTenant.rent)}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="billingMonth">Billing Month *</Label>
              <Input
                id="billingMonth"
                type="month"
                {...register('billingMonth', { required: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date *</Label>
              <Input
                id="dueDate"
                type="date"
                {...register('dueDate', { required: true })}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any notes about this bill..."
                rows={3}
                {...register('notes')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedTenant && (
        <Card>
          <CardHeader>
            <CardTitle>Bill Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Monthly Rent</span>
                <span>{formatCurrency(selectedTenant.rent)}</span>
              </div>
              <hr />
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>{formatCurrency(selectedTenant.rent)}</span>
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              You can add additional charges (electricity, maintenance, etc.) after creating the bill.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => window.history.back()}>
          Cancel
        </Button>
        <Button type="submit" loading={isLoading} disabled={!selectedTenant}>
          Create Bill
        </Button>
      </div>
    </form>
  );
}
