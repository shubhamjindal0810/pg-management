'use client';

import { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

interface OccupancyCalendarProps {
  beds: Array<{
    id: string;
    bedNumber: string;
    status: string;
    tenants: Array<{
      checkInDate: Date | null;
      expectedCheckout: Date | null;
      user: { name: string };
    }>;
    bookings: Array<{
      id: string;
      requestedCheckin: Date | string;
      expectedCheckout: Date | string | null;
      durationMonths: number;
      status: string;
    }>;
  }>;
}

export function OccupancyCalendar({ beds }: OccupancyCalendarProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const checkDate = new Date(selectedDate);
  checkDate.setHours(0, 0, 0, 0);

  // Get occupancy for selected date
  const getOccupancyForDate = () => {
    const occupancy: Array<{
      bedId: string;
      bedNumber: string;
      type: 'tenant' | 'booking';
      name: string;
      checkIn: Date;
      checkOut: Date | null;
    }> = [];

    beds.forEach((bed) => {
      // Check active tenants
      bed.tenants.forEach((tenant) => {
        if (tenant.checkInDate) {
          const checkIn = new Date(tenant.checkInDate);
          checkIn.setHours(0, 0, 0, 0);
          const checkOut = tenant.expectedCheckout
            ? new Date(tenant.expectedCheckout)
            : null;
          if (checkOut) checkOut.setHours(0, 0, 0, 0);

          if (checkDate >= checkIn && (!checkOut || checkDate <= checkOut)) {
            occupancy.push({
              bedId: bed.id,
              bedNumber: bed.bedNumber,
              type: 'tenant',
              name: tenant.user.name,
              checkIn,
              checkOut,
            });
          }
        }
      });

      // Check bookings
      bed.bookings.forEach((booking) => {
        const checkIn = new Date(booking.requestedCheckin);
        checkIn.setHours(0, 0, 0, 0);
        let checkOut: Date;
        if (booking.expectedCheckout) {
          checkOut = new Date(booking.expectedCheckout);
        } else {
          checkOut = new Date(checkIn);
          checkOut.setMonth(checkOut.getMonth() + booking.durationMonths);
        }
        checkOut.setHours(0, 0, 0, 0);

        if (checkDate >= checkIn && checkDate <= checkOut) {
          occupancy.push({
            bedId: bed.id,
            bedNumber: bed.bedNumber,
            type: 'booking',
            name: `Booking (${booking.status})`,
            checkIn,
            checkOut: booking.expectedCheckout ? checkOut : null,
          });
        }
      });
    });

    return occupancy;
  };

  const occupancy = getOccupancyForDate();
  const availableBeds = beds.length - occupancy.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Date-wise Occupancy
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="occupancyDate">Select Date</Label>
          <Input
            id="occupancyDate"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="rounded-lg border bg-muted/50 p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{beds.length}</div>
              <div className="text-xs text-muted-foreground">Total Beds</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{availableBeds}</div>
              <div className="text-xs text-muted-foreground">Available</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{occupancy.length}</div>
              <div className="text-xs text-muted-foreground">Occupied</div>
            </div>
          </div>
        </div>

        {occupancy.length > 0 ? (
          <div className="space-y-2">
            <h4 className="font-medium">Occupied Beds on {formatDate(checkDate)}</h4>
            <div className="space-y-2">
              {occupancy.map((occ, index) => (
                <div
                  key={`${occ.bedId}-${index}`}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <div className="font-medium">Bed {occ.bedNumber}</div>
                    <div className="text-sm text-muted-foreground">{occ.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatDate(occ.checkIn)} -{' '}
                      {occ.checkOut ? formatDate(occ.checkOut) : 'Ongoing'}
                    </div>
                  </div>
                  <Badge variant={occ.type === 'tenant' ? 'occupied' : 'reserved'}>
                    {occ.type === 'tenant' ? 'Tenant' : 'Booking'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
            <p className="text-sm font-medium text-green-800">
              All beds are available on {formatDate(checkDate)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

