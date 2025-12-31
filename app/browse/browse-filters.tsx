'use client';

import { useState, useEffect, useTransition } from 'react';
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
    hasBalcony?: boolean;
    checkInDate?: string;
    expectedCheckout?: string;
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
    hasBalcony: initialFilters.hasBalcony ?? false,
    checkInDate: initialFilters.checkInDate || '',
    expectedCheckout: initialFilters.expectedCheckout || '',
    maxRent: initialFilters.maxRent || 50000,
  });

  // Apply filters in realtime with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
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
        if (filters.hasBalcony) {
          params.set('hasBalcony', 'true');
        }
        if (filters.checkInDate) {
          params.set('checkInDate', filters.checkInDate);
        }
        if (filters.expectedCheckout) {
          params.set('expectedCheckout', filters.expectedCheckout);
        }
        if (filters.maxRent && filters.maxRent < 50000) {
          params.set('maxRent', filters.maxRent.toString());
        }

        router.push(`/browse?${params.toString()}`);
        router.refresh();
      });
    }, 300); // 300ms debounce delay

    return () => clearTimeout(timeoutId);
  }, [filters, router]);

  const applyFilters = () => {
    // Filters are now applied automatically via useEffect
    // This function is kept for backward compatibility but can be removed
  };

  const clearFilters = () => {
    setFilters({
      hasAttachedBath: false,
      roomType: 'all',
      hasAc: false,
      hasBalcony: false,
      checkInDate: '',
      expectedCheckout: '',
      maxRent: 50000,
    });
    router.push('/browse');
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
            onChange={(e) => {
              const selectedDate = e.target.value;
              const today = new Date().toISOString().split('T')[0];
              if (selectedDate >= today) {
                setFilters({ ...filters, checkInDate: selectedDate });
                // Reset expected checkout if it's before the new check-in date
                if (filters.expectedCheckout && filters.expectedCheckout < selectedDate) {
                  setFilters({ ...filters, checkInDate: selectedDate, expectedCheckout: '' });
                }
              }
            }}
          />
        </div>

        {/* Expected Checkout Date */}
        <div className="space-y-2">
          <Label htmlFor="expectedCheckout">Expected Checkout Date</Label>
          <Input
            id="expectedCheckout"
            type="date"
            min={filters.checkInDate || new Date().toISOString().split('T')[0]}
            value={filters.expectedCheckout}
            onChange={(e) => {
              const selectedDate = e.target.value;
              const minDate = filters.checkInDate || new Date().toISOString().split('T')[0];
              if (selectedDate >= minDate) {
                setFilters({ ...filters, expectedCheckout: selectedDate });
              }
            }}
          />
          <p className="text-xs text-muted-foreground">
            Show rooms available for your entire stay duration
          </p>
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
              <SelectItem value="single">Single (all beds available)</SelectItem>
              <SelectItem value="double">Double (2 beds, at least 1 available)</SelectItem>
              <SelectItem value="triple">Triple (3 beds, at least 1 available)</SelectItem>
              <SelectItem value="dormitory">Dormitory (4+ beds, at least 1 available)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Filter by room type and bed availability
          </p>
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
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={filters.hasBalcony}
                onChange={(e) => setFilters({ ...filters, hasBalcony: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="text-sm">Balcony</span>
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
          <Button onClick={clearFilters} variant="outline" className="w-full" disabled={isPending}>
            Clear All Filters
          </Button>
        </div>
        {isPending && (
          <p className="text-xs text-center text-muted-foreground">Updating results...</p>
        )}
      </CardContent>
    </Card>
  );
}

