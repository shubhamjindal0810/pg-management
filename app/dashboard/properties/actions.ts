'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { propertySchema, type PropertyInput } from '@/lib/validations';

export async function createProperty(data: PropertyInput) {
  const validated = propertySchema.parse(data);

  const property = await db.property.create({
    data: {
      name: validated.name,
      address: validated.address,
      city: validated.city,
      state: validated.state,
      pincode: validated.pincode,
      description: validated.description || null,
      amenities: validated.amenities || [],
      rules: validated.rules || [],
      phone: validated.phone?.trim() || null,
      email: validated.email?.trim() || null,
      googleMapsLink: validated.googleMapsLink?.trim() || null,
      latitude: validated.latitude !== undefined ? validated.latitude : null,
      longitude: validated.longitude !== undefined ? validated.longitude : null,
      website: validated.website?.trim() || null,
      facebook: validated.facebook?.trim() || null,
      instagram: validated.instagram?.trim() || null,
      whatsapp: validated.whatsapp?.trim() || null,
      breakfastEnabled: validated.breakfastEnabled || false,
      breakfastPrice: validated.breakfastPrice || null,
      breakfastMenu: validated.breakfastMenu?.trim() || null,
      lunchEnabled: validated.lunchEnabled || false,
      lunchPrice: validated.lunchPrice || null,
      lunchMenu: validated.lunchMenu?.trim() || null,
      dinnerEnabled: validated.dinnerEnabled || false,
      dinnerPrice: validated.dinnerPrice || null,
      dinnerMenu: validated.dinnerMenu?.trim() || null,
    },
  });

  revalidatePath('/dashboard/properties');
  revalidatePath('/public');
  redirect(`/dashboard/properties/${property.id}`);
}

export async function updateProperty(id: string, data: PropertyInput) {
  const validated = propertySchema.parse(data);

  await db.property.update({
    where: { id },
    data: {
      name: validated.name,
      address: validated.address,
      city: validated.city,
      state: validated.state,
      pincode: validated.pincode,
      description: validated.description || null,
      amenities: validated.amenities || [],
      rules: validated.rules || [],
      phone: validated.phone?.trim() || null,
      email: validated.email?.trim() || null,
      googleMapsLink: validated.googleMapsLink?.trim() || null,
      latitude: validated.latitude !== undefined ? validated.latitude : null,
      longitude: validated.longitude !== undefined ? validated.longitude : null,
      website: validated.website?.trim() || null,
      facebook: validated.facebook?.trim() || null,
      instagram: validated.instagram?.trim() || null,
      whatsapp: validated.whatsapp?.trim() || null,
      breakfastEnabled: validated.breakfastEnabled || false,
      breakfastPrice: validated.breakfastPrice || null,
      breakfastMenu: validated.breakfastMenu?.trim() || null,
      lunchEnabled: validated.lunchEnabled || false,
      lunchPrice: validated.lunchPrice || null,
      lunchMenu: validated.lunchMenu?.trim() || null,
      dinnerEnabled: validated.dinnerEnabled || false,
      dinnerPrice: validated.dinnerPrice || null,
      dinnerMenu: validated.dinnerMenu?.trim() || null,
    },
  });

  revalidatePath('/dashboard/properties');
  revalidatePath(`/dashboard/properties/${id}`);
  revalidatePath('/public');
}

export async function deleteProperty(id: string) {
  await db.property.delete({
    where: { id },
  });

  revalidatePath('/dashboard/properties');
  redirect('/dashboard/properties');
}

export async function togglePropertyStatus(id: string) {
  const property = await db.property.findUnique({
    where: { id },
    select: { isActive: true },
  });

  if (!property) {
    throw new Error('Property not found');
  }

  await db.property.update({
    where: { id },
    data: { isActive: !property.isActive },
  });

  revalidatePath('/dashboard/properties');
  revalidatePath(`/dashboard/properties/${id}`);
}
