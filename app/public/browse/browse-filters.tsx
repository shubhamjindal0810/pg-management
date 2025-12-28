'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

interface BrowseFiltersProps {
  initialFilters: {
    hasAttachedBath?: boolean;
    roomType?: string;
    hasAc?: boolean;
    checkInDate?: string;
    maxRent?: number;
  };
  propertyAmenities: string[];
}

export function BrowseFilters({ initialFilters, propertyAmenities }: BrowseFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [filters, setFilters] = useState({
    hasAttachedBath: initialFilters.hasAttachedBath ?? false,
    roomType: initialFilters.roomType || 'all',
    hasAc: initialFilters.hasAc ?? false,
    checkInDate: initialFilters.checkInDate || '',
    maxRent: initialFilters.maxRent || 50000,
  });

  const applyFilters = () => {
    startTransition(() => {
      const params = new URLSearchParams();

      if (filters.hasAttachedBath) {
        params.set('hasAttachedBath', 'true');
      }
      if (filters.roomType && filters.roomType !== 'all') {
        params.set('roomType', filters.roomType);
      }
      if (filters.hasAc) {
        params.set('hasAc', 'true');
      }
      if (filters.checkInDate) {
        params.set('checkInDate', filters.checkInDate);
      }
      if (filters.maxRent && filters.maxRent < 50000) {
        params.set('maxRent', filters.maxRent.toString());
      }

      router.push(`/public/browse?${params.toString()}`);
      router.refresh();
    });
  };

  const clearFilters = () => {
    setFilters({
      hasAttachedBath: false,
      roomType: 'all',
      hasAc: false,
      checkInDate: '',
      maxRent: 50000,
    });
    router.push('/public/browse');
  };

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Check-in Date */}
        <div className="space-y-2">
          <Label htmlFor="checkInDate">Check-in Date</Label>
          <Input
            id="checkInDate"
            type="date"
            min={new Date().toISOString().split('T')[0]}
            value={filters.checkInDate}
            onChange={(e) => setFilters({ ...filters, checkInDate: e.target.value })}
          />
        </div>

        {/* Room Type */}
        <div className="space-y-2">
          <Label htmlFor="roomType">Room Type</Label>
          <Select
            value={filters.roomType}
            onValueChange={(value) => setFilters({ ...filters, roomType: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="single">Single (1 bed)</SelectItem>
              <SelectItem value="double">Double (2 beds)</SelectItem>
              <SelectItem value="triple">Triple (3 beds)</SelectItem>
              <SelectItem value="dormitory">Dormitory (4+ beds)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Features */}
        <div className="space-y-3">
          <Label>Features</Label>
          <div className="space-y-2">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={filters.hasAttachedBath}
                onChange={(e) =>
                  setFilters({ ...filters, hasAttachedBath: e.target.checked })
                }
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="text-sm">Attached Bathroom</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={filters.hasAc}
                onChange={(e) => setFilters({ ...filters, hasAc: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="text-sm">Air Conditioned</span>
            </label>
          </div>
        </div>

        {/* Max Rent */}
        <div className="space-y-2">
          <Label>Max Monthly Rent: {formatCurrency(filters.maxRent)}</Label>
          <Slider
            value={[filters.maxRent]}
            onValueChange={([value]) => setFilters({ ...filters, maxRent: value })}
            min={0}
            max={50000}
            step={1000}
            className="w-full"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button onClick={applyFilters} className="flex-1" loading={isPending} disabled={isPending}>
            Apply Filters
          </Button>
          <Button onClick={clearFilters} variant="outline" disabled={isPending}>
            Clear
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

