import Link from 'next/link';
import { Plus } from 'lucide-react';
import { db } from '@/lib/db';
import { PageHeader } from '@/components/dashboard/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Star } from 'lucide-react';
import { TestimonialActions } from './testimonial-actions';

async function getTestimonials() {
  return db.testimonial.findMany({
    include: {
      property: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export default async function TestimonialsPage() {
  const testimonials = await getTestimonials();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Testimonials"
        description="Manage customer testimonials"
        action={
          <Link href="/dashboard/testimonials/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Testimonial
            </Button>
          </Link>
        }
      />

      {testimonials.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="mb-4 text-muted-foreground">No testimonials added yet</p>
            <Link href="/dashboard/testimonials/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Testimonial
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id} className="h-full">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {testimonial.photo ? (
                      <div className="relative h-12 w-12 overflow-hidden rounded-full">
                        <Image
                          src={testimonial.photo}
                          alt={testimonial.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <span className="text-lg font-semibold">
                          {testimonial.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-base">{testimonial.name}</CardTitle>
                      <CardDescription className="text-xs">
                        {testimonial.property.name}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={testimonial.isActive ? 'available' : 'secondary'}>
                    {testimonial.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < testimonial.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {testimonial.testimonial}
                </p>
                <TestimonialActions testimonial={testimonial} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

