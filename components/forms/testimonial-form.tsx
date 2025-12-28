'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Star } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { testimonialSchema, type TestimonialInput } from '@/lib/validations';
import { createTestimonial, updateTestimonial } from '@/app/dashboard/testimonials/actions';

interface Property {
  id: string;
  name: string;
}

interface TestimonialFormProps {
  properties: Property[];
  testimonial?: {
    id: string;
    propertyId: string;
    name: string;
    photo: string | null;
    testimonial: string;
    rating: number;
    isActive: boolean;
  };
}

export function TestimonialForm({ properties, testimonial }: TestimonialFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [rating, setRating] = useState(testimonial?.rating || 5);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TestimonialInput>({
    resolver: zodResolver(testimonialSchema),
    defaultValues: {
      propertyId: testimonial?.propertyId || properties[0]?.id || '',
      name: testimonial?.name || '',
      photo: testimonial?.photo || '',
      testimonial: testimonial?.testimonial || '',
      rating: testimonial?.rating || 5,
      isActive: testimonial?.isActive ?? true,
    },
  });

  const onSubmit = async (data: TestimonialInput) => {
    setIsLoading(true);
    try {
      const formData = {
        ...data,
        rating,
      };

      if (testimonial) {
        await updateTestimonial(testimonial.id, formData);
        toast.success('Testimonial updated successfully');
      } else {
        await createTestimonial(formData);
        toast.success('Testimonial created successfully');
      }
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="propertyId">Property *</Label>
              <Select
                value={watch('propertyId')}
                onValueChange={(value) => setValue('propertyId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a property" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.propertyId && (
                <p className="text-sm text-destructive">{errors.propertyId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Customer Name *</Label>
              <Input
                id="name"
                placeholder="John Doe"
                {...register('name')}
                error={errors.name?.message}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="photo">Photo URL</Label>
              <Input
                id="photo"
                type="url"
                placeholder="https://example.com/photo.jpg"
                {...register('photo')}
                error={errors.photo?.message}
              />
              <p className="text-xs text-muted-foreground">
                URL to customer photo (optional)
              </p>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="testimonial">Testimonial *</Label>
              <Textarea
                id="testimonial"
                placeholder="Write the customer testimonial here..."
                rows={5}
                {...register('testimonial')}
                error={errors.testimonial?.message}
              />
            </div>

            <div className="space-y-2">
              <Label>Rating *</Label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => {
                      setRating(star);
                      setValue('rating', star);
                    }}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`h-8 w-8 transition-colors ${
                        star <= rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-sm text-muted-foreground">
                  {rating} / 5
                </span>
              </div>
              {errors.rating && (
                <p className="text-sm text-destructive">{errors.rating.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => window.history.back()}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" loading={isLoading}>
          {testimonial ? 'Update Testimonial' : 'Create Testimonial'}
        </Button>
      </div>
    </form>
  );
}

