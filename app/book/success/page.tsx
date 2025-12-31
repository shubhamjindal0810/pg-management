import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function BookingSuccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4">
        <Card className="mx-auto max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-600" />
              <h1 className="mb-2 text-2xl font-bold">Booking Request Submitted!</h1>
              <p className="mb-6 text-muted-foreground">
                Thank you for your interest. We have received your booking request and will review
                it shortly. Our team will contact you soon to confirm your booking.
              </p>
              <div className="space-y-2">
                <Link href="/" className="block">
                  <Button variant="outline" className="w-full">
                    Back to Home
                  </Button>
                </Link>
                <Link href="/book" className="block">
                  <Button className="w-full">Submit Another Request</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

