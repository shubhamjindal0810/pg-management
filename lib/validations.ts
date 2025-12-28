import { z } from 'zod';

// Property Schema
export const propertySchema = z.object({
  name: z.string().min(2, 'Property name is required'),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().regex(/^\d{6}$/, 'Enter a valid 6-digit pincode'),
  description: z.string().optional(),
  amenities: z.array(z.string()).optional(),
  rules: z.array(z.string()).optional(),
  phone: z.string().optional(),
  email: z
    .string()
    .refine((val) => !val || z.string().email().safeParse(val).success, {
      message: 'Enter a valid email address',
    })
    .optional(),
  googleMapsLink: z
    .string()
    .refine((val) => !val || z.string().url().safeParse(val).success, {
      message: 'Enter a valid URL',
    })
    .optional(),
  latitude: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
    z.number().min(-90).max(90).optional()
  ),
  longitude: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
    z.number().min(-180).max(180).optional()
  ),
  website: z
    .string()
    .refine((val) => !val || z.string().url().safeParse(val).success, {
      message: 'Enter a valid URL',
    })
    .optional(),
  facebook: z
    .string()
    .refine((val) => !val || z.string().url().safeParse(val).success, {
      message: 'Enter a valid URL',
    })
    .optional(),
  instagram: z
    .string()
    .refine((val) => !val || z.string().url().safeParse(val).success, {
      message: 'Enter a valid URL',
    })
    .optional(),
  whatsapp: z.string().optional(),
  // Meal Configuration
  breakfastEnabled: z.boolean().optional(),
  breakfastPrice: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
    z.number().min(0).optional()
  ),
  breakfastMenu: z.string().optional(),
  lunchEnabled: z.boolean().optional(),
  lunchPrice: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
    z.number().min(0).optional()
  ),
  lunchMenu: z.string().optional(),
  dinnerEnabled: z.boolean().optional(),
  dinnerPrice: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
    z.number().min(0).optional()
  ),
  dinnerMenu: z.string().optional(),
});

export type PropertyInput = z.infer<typeof propertySchema>;

// Room Schema
export const roomSchema = z.object({
  propertyId: z.string().min(1, 'Property is required'),
  roomNumber: z.string().min(1, 'Room number is required'),
  floor: z.coerce.number().int().min(0),
  roomType: z.enum(['single', 'double', 'triple', 'dormitory']),
  hasAc: z.boolean(),
  hasAttachedBath: z.boolean(),
  acCharge: z.coerce.number().min(0).default(0),
  description: z.string().optional(),
  amenities: z.array(z.string()).optional(),
});

export type RoomInput = z.infer<typeof roomSchema>;

// Bed Schema
export const bedSchema = z.object({
  roomId: z.string().min(1, 'Room is required'),
  bedNumber: z.string().min(1, 'Bed number is required'),
  monthlyRent: z.coerce.number().min(0),
  securityDeposit: z.coerce.number().min(0),
  status: z.enum(['AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE']),
  description: z.string().optional(),
});

export type BedInput = z.infer<typeof bedSchema>;

// Tenant Schema
export const tenantSchema = z.object({
  userId: z.string().optional(),
  bedId: z.string().optional(),
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().min(10, 'Phone number is required'),
  checkInDate: z.string().optional(),
  expectedCheckout: z.string().optional(),
  noticePeriodDays: z.coerce.number().int().min(0).default(30),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactRelation: z.string().optional(),
  workAddress: z.string().optional(),
  workPhone: z.string().optional(),
  status: z.enum(['ACTIVE', 'CHECKED_OUT', 'NOTICE_GIVEN']).default('ACTIVE'),
});

export type TenantInput = z.infer<typeof tenantSchema>;

// Testimonial Schema
export const testimonialSchema = z.object({
  propertyId: z.string().min(1, 'Property is required'),
  name: z.string().min(2, 'Name is required'),
  photo: z.string().url('Invalid photo URL').optional().or(z.literal('')),
  testimonial: z.string().min(10, 'Testimonial must be at least 10 characters'),
  rating: z.coerce.number().min(1).max(5),
  isActive: z.boolean().default(true),
});

export type TestimonialInput = z.infer<typeof testimonialSchema>;
