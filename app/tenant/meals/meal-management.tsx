'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Utensils, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { updateMealSubscriptions } from './actions';

interface MealManagementProps {
  tenant: {
    id: string;
    breakfastSubscribed: boolean;
    lunchSubscribed: boolean;
    dinnerSubscribed: boolean;
  };
  property: {
    id: string;
    name: string;
    breakfastEnabled: boolean;
    breakfastPrice: number | null;
    breakfastMenu: string | null;
    lunchEnabled: boolean;
    lunchPrice: number | null;
    lunchMenu: string | null;
    dinnerEnabled: boolean;
    dinnerPrice: number | null;
    dinnerMenu: string | null;
  };
}

export function MealManagement({ tenant, property }: MealManagementProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [breakfastSelected, setBreakfastSelected] = useState(tenant.breakfastSubscribed);
  const [lunchSelected, setLunchSelected] = useState(tenant.lunchSubscribed);
  const [dinnerSelected, setDinnerSelected] = useState(tenant.dinnerSubscribed);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateMealSubscriptions({
        tenantId: tenant.id,
        breakfast: breakfastSelected,
        lunch: lunchSelected,
        dinner: dinnerSelected,
      });
      toast.success('Meal subscriptions updated successfully');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update meal subscriptions');
    } finally {
      setIsLoading(false);
    }
  };

  const hasChanges =
    breakfastSelected !== tenant.breakfastSubscribed ||
    lunchSelected !== tenant.lunchSubscribed ||
    dinnerSelected !== tenant.dinnerSubscribed;

  const calculateMonthlyCost = () => {
    let total = 0;
    if (breakfastSelected && property.breakfastPrice) {
      total += Number(property.breakfastPrice) * 30;
    }
    if (lunchSelected && property.lunchPrice) {
      total += Number(property.lunchPrice) * 30;
    }
    if (dinnerSelected && property.dinnerPrice) {
      total += Number(property.dinnerPrice) * 30;
    }
    return total;
  };

  const monthlyCost = calculateMonthlyCost();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Utensils className="h-5 w-5" />
            Available Meal Services
          </CardTitle>
          <CardDescription>
            Subscribe to meal services individually. Charges are added to your monthly bill.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Breakfast */}
          {property.breakfastEnabled && (
            <div className="flex items-start justify-between rounded-lg border p-4">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={breakfastSelected}
                    onCheckedChange={(checked) => setBreakfastSelected(checked === true)}
                    disabled={isLoading}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Label className="cursor-pointer font-medium">Breakfast</Label>
                      {tenant.breakfastSubscribed && (
                        <Badge variant="available" className="text-xs">Active</Badge>
                      )}
                    </div>
                    {property.breakfastMenu && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {property.breakfastMenu}
                      </p>
                    )}
                    <p className="mt-2 text-sm font-medium text-primary">
                      {formatCurrency(Number(property.breakfastPrice || 0))} per meal
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">
                  {formatCurrency(Number(property.breakfastPrice || 0) * 30)}/month
                </p>
                <p className="text-xs text-muted-foreground">30 meals</p>
              </div>
            </div>
          )}

          {/* Lunch */}
          {property.lunchEnabled && (
            <div className="flex items-start justify-between rounded-lg border p-4">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={lunchSelected}
                    onCheckedChange={(checked) => setLunchSelected(checked === true)}
                    disabled={isLoading}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Label className="cursor-pointer font-medium">Lunch</Label>
                      {tenant.lunchSubscribed && (
                        <Badge variant="available" className="text-xs">Active</Badge>
                      )}
                    </div>
                    {property.lunchMenu && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {property.lunchMenu}
                      </p>
                    )}
                    <p className="mt-2 text-sm font-medium text-primary">
                      {formatCurrency(Number(property.lunchPrice || 0))} per meal
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">
                  {formatCurrency(Number(property.lunchPrice || 0) * 30)}/month
                </p>
                <p className="text-xs text-muted-foreground">30 meals</p>
              </div>
            </div>
          )}

          {/* Dinner */}
          {property.dinnerEnabled && (
            <div className="flex items-start justify-between rounded-lg border p-4">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={dinnerSelected}
                    onCheckedChange={(checked) => setDinnerSelected(checked === true)}
                    disabled={isLoading}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Label className="cursor-pointer font-medium">Dinner</Label>
                      {tenant.dinnerSubscribed && (
                        <Badge variant="available" className="text-xs">Active</Badge>
                      )}
                    </div>
                    {property.dinnerMenu && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {property.dinnerMenu}
                      </p>
                    )}
                    <p className="mt-2 text-sm font-medium text-primary">
                      {formatCurrency(Number(property.dinnerPrice || 0))} per meal
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">
                  {formatCurrency(Number(property.dinnerPrice || 0) * 30)}/month
                </p>
                <p className="text-xs text-muted-foreground">30 meals</p>
              </div>
            </div>
          )}

          {!property.breakfastEnabled && !property.lunchEnabled && !property.dinnerEnabled && (
            <div className="rounded-lg border p-6 text-center">
              <Utensils className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Meal services are not currently available at {property.name}.
              </p>
            </div>
          )}

          {/* Monthly Cost Summary */}
          {monthlyCost > 0 && (
            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Estimated Monthly Cost</span>
                <span className="text-lg font-bold">{formatCurrency(monthlyCost)}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                This amount will be added to your monthly bill
              </p>
            </div>
          )}

          {/* Save Button */}
          {(property.breakfastEnabled || property.lunchEnabled || property.dinnerEnabled) && (
            <div className="flex justify-end">
              <Button onClick={handleSave} loading={isLoading} disabled={!hasChanges}>
                Save Changes
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

