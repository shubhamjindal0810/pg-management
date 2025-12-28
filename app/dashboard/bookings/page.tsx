import Link from 'next/link';
import { db } from '@/lib/db';
import { PageHeader } from '@/components/dashboard/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate, formatCurrency } from '@/lib/utils';
import { BookingActions } from './booking-actions';

async function getBookings() {
  return db.booking.findMany({
    include: {
      bed: {
        include: {
          room: {
            include: {
              property: {
                select: { name: true },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export default async function BookingsPage() {
  const bookings = await getBookings();

  const statusConfig: Record<string, { label: string; variant: any }> = {
    pending: { label: 'Pending', variant: 'secondary' },
    approved: { label: 'Approved', variant: 'available' },
    rejected: { label: 'Rejected', variant: 'cancelled' },
    cancelled: { label: 'Cancelled', variant: 'cancelled' },
    converted: { label: 'Converted', variant: 'paid' },
  };

  const pendingCount = bookings.filter((b) => b.status === 'pending').length;
  const approvedCount = bookings.filter((b) => b.status === 'approved').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Booking Requests"
        description="Manage booking requests from prospective tenants"
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{bookings.length}</div>
            <p className="text-sm text-muted-foreground">Total Bookings</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">{pendingCount}</div>
            <p className="text-sm text-muted-foreground">Pending Review</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
            <p className="text-sm text-muted-foreground">Approved</p>
          </CardContent>
        </Card>
      </div>

      {bookings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">No booking requests yet</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Booking Requests</CardTitle>
            <CardDescription>{bookings.length} total requests</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Bed</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Advance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => {
                  const status = statusConfig[booking.status] || statusConfig.pending;

                  return (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">{booking.name}</TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <p>{booking.phone}</p>
                          {booking.email && (
                            <p className="text-muted-foreground">{booking.email}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>
                            {booking.bed.room.property.name} - Room{' '}
                            {booking.bed.room.roomNumber}
                          </p>
                          <p className="text-muted-foreground">Bed {booking.bed.bedNumber}</p>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(booking.requestedCheckin)}</TableCell>
                      <TableCell>{booking.durationMonths} months</TableCell>
                      <TableCell>
                        {booking.advanceAmount ? (
                          <span className="font-medium">
                            {formatCurrency(Number(booking.advanceAmount))}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(booking.createdAt)}
                      </TableCell>
                      <TableCell>
                        <BookingActions booking={booking} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

