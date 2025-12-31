'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Calendar, Users, Shield, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';

interface RoomBookingCardProps {
  room: {
    id: string;
    roomNumber: string;
    roomType: string;
    hasAc: boolean;
    monthlyRent: number;
    multiBedPricing: Record<string, number> | null;
    beds: Array<{
      id: string;
      bedNumber: string;
    }>;
    property: {
      acMonthlyRent: number | null;
      acSecurityDeposit: number | null;
    };
  };
}

export function RoomBookingCard({ room }: RoomBookingCardProps) {
  const rent = Number(room.monthlyRent);

  return (
    <Card className="border-2 shadow-lg">
      <CardHeader className="border-b">
        <div className="flex items-baseline justify-between">
          <div>
            <CardTitle className="text-2xl">
              {formatCurrency(rent)}
            </CardTitle>
            <p className="text-sm text-muted-foreground">per bed per month</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Quick Info */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Available Beds</span>
            <span className="font-medium">{room.beds.length} beds</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Room Type</span>
            <span className="font-medium">
              {room.roomType === 'single'
                ? 'Non-sharing'
                : room.roomType === 'double'
                  ? '2-sharing'
                  : room.roomType === 'triple'
                    ? '3-sharing'
                    : '4+ sharing'}
            </span>
          </div>
          {room.hasAc && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">AC Available</span>
              <span className="font-medium">
                {room.property.acMonthlyRent
                  ? `+${formatCurrency(Number(room.property.acMonthlyRent))}/bed/month`
                  : 'Included'}
              </span>
            </div>
          )}
        </div>

        {/* Multi-bed Discount Info */}
        {room.multiBedPricing && Object.keys(room.multiBedPricing).length > 0 && (
          <div className="rounded-lg bg-green-50 p-3">
            <p className="text-sm font-medium text-green-800">Multi-bed Discounts Available</p>
            <div className="mt-2 space-y-1">
              {Object.entries(room.multiBedPricing).map(([bedCount, discount]) => (
                <p key={bedCount} className="text-xs text-green-700">
                  Book {bedCount} beds: Save {formatCurrency(Number(discount))} per bed
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Features */}
        <div className="space-y-2 border-t pt-4">
          <div className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-green-600" />
            <span>Instant booking confirmation</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-green-600" />
            <span>Flexible check-in dates</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-green-600" />
            <span>Secure online payment</span>
          </div>
        </div>

        {/* CTA Button */}
        <Link href={`/book?roomId=${room.id}`} className="block">
          <Button size="lg" className="w-full">
            Reserve Now
          </Button>
        </Link>

        <p className="text-center text-xs text-muted-foreground">
          You won't be charged yet
        </p>
      </CardContent>
    </Card>
  );
}

