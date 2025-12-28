'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { testimonialSchema, type TestimonialInput } from '@/lib/validations';

export async function createTestimonial(data: TestimonialInput) {
  const validated = testimonialSchema.parse(data);

  const testimonial = await db.testimonial.create({
    data: {
      propertyId: validated.propertyId,
      name: validated.name,
      photo: validated.photo?.trim() || null,
      testimonial: validated.testimonial,
      rating: validated.rating,
      isActive: validated.isActive,
    },
  });

  revalidatePath('/dashboard/testimonials');
  revalidatePath('/public');
  redirect(`/dashboard/testimonials`);
}

export async function updateTestimonial(id: string, data: TestimonialInput) {
  const validated = testimonialSchema.parse(data);

  await db.testimonial.update({
    where: { id },
    data: {
      propertyId: validated.propertyId,
      name: validated.name,
      photo: validated.photo?.trim() || null,
      testimonial: validated.testimonial,
      rating: validated.rating,
      isActive: validated.isActive,
    },
  });

  revalidatePath('/dashboard/testimonials');
  revalidatePath('/public');
}

export async function deleteTestimonial(id: string) {
  await db.testimonial.delete({
    where: { id },
  });

  revalidatePath('/dashboard/testimonials');
  revalidatePath('/public');
  redirect('/dashboard/testimonials');
}

export async function toggleTestimonialStatus(id: string) {
  const testimonial = await db.testimonial.findUnique({
    where: { id },
    select: { isActive: true },
  });

  if (!testimonial) {
    throw new Error('Testimonial not found');
  }

  await db.testimonial.update({
    where: { id },
    data: { isActive: !testimonial.isActive },
  });

  revalidatePath('/dashboard/testimonials');
  revalidatePath('/public');
}

