'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { X, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { propertySchema, type PropertyInput } from '@/lib/validations';
import { createProperty, updateProperty } from '@/app/dashboard/properties/actions';

interface PropertyFormProps {
  property?: {
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    description: string | null;
    amenities: string[] | null;
    rules: string[] | null;
    phone: string | null;
    email: string | null;
    googleMapsLink: string | null;
    latitude: number | null;
    longitude: number | null;
    website: string | null;
    facebook: string | null;
    instagram: string | null;
    whatsapp: string | null;
    breakfastEnabled: boolean;
    breakfastPrice: number | null;
    breakfastMenu: string | null;
    lunchEnabled: boolean;
    lunchPrice: number | null;
    lunchMenu: string | null;
    dinnerEnabled: boolean;
    dinnerPrice: number | null;
    dinnerMenu: string | null;
    acMonthlyRent: number | null;
    acSecurityDeposit: number | null;
  };
}

const commonAmenities = [
  'WiFi',
  'AC',
  'Parking',
  'Laundry',
  'Security',
  'CCTV',
  'Power Backup',
  'Water Purifier',
  'Gym',
  'Common Area',
];

export function PropertyForm({ property }: PropertyFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [amenities, setAmenities] = useState<string[]>(
    (property?.amenities as string[]) || []
  );
  const [newAmenity, setNewAmenity] = useState('');
  const [rules, setRules] = useState<string[]>((property?.rules as string[]) || []);
  const [newRule, setNewRule] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PropertyInput>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      name: property?.name || '',
      address: property?.address || '',
      city: property?.city || 'Hyderabad',
      state: property?.state || 'Telangana',
      pincode: property?.pincode || '',
      description: property?.description || '',
      phone: property?.phone || '',
      email: property?.email || '',
      googleMapsLink: property?.googleMapsLink || '',
      latitude: property?.latitude !== null && property?.latitude !== undefined ? String(property.latitude) : undefined,
      longitude: property?.longitude !== null && property?.longitude !== undefined ? String(property.longitude) : undefined,
      website: property?.website || '',
      facebook: property?.facebook || '',
      instagram: property?.instagram || '',
      whatsapp: property?.whatsapp || '',
      breakfastEnabled: property?.breakfastEnabled || false,
      breakfastPrice: property?.breakfastPrice ? String(property.breakfastPrice) : '',
      breakfastMenu: property?.breakfastMenu || '',
      lunchEnabled: property?.lunchEnabled || false,
      lunchPrice: property?.lunchPrice ? String(property.lunchPrice) : '',
      lunchMenu: property?.lunchMenu || '',
      dinnerEnabled: property?.dinnerEnabled || false,
      dinnerPrice: property?.dinnerPrice ? String(property.dinnerPrice) : '',
      dinnerMenu: property?.dinnerMenu || '',
      acMonthlyRent: property?.acMonthlyRent ? String(property.acMonthlyRent) : '',
      acSecurityDeposit: property?.acSecurityDeposit ? String(property.acSecurityDeposit) : '',
    } as any, // Type assertion needed because form inputs are strings but schema expects numbers after preprocessing
  });

  const hasAc = amenities.includes('AC');

  const addAmenity = (amenity: string) => {
    if (amenity && !amenities.includes(amenity)) {
      setAmenities([...amenities, amenity]);
    }
    setNewAmenity('');
  };

  const removeAmenity = (amenity: string) => {
    setAmenities(amenities.filter((a) => a !== amenity));
  };

  const addRule = () => {
    if (newRule.trim() && !rules.includes(newRule.trim())) {
      setRules([...rules, newRule.trim()]);
      setNewRule('');
    }
  };

  const removeRule = (rule: string) => {
    setRules(rules.filter((r) => r !== rule));
  };

  const onSubmit = async (data: PropertyInput) => {
    setIsLoading(true);
    try {
      const formData = {
        ...data,
        amenities,
        rules,
      };

      if (property) {
        await updateProperty(property.id, formData);
        toast.success('Property updated successfully');
        router.refresh(); // Refresh to show updated values
      } else {
        await createProperty(formData);
        toast.success('Property created successfully');
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Property Name *</Label>
              <Input
                id="name"
                placeholder="My PG"
                {...register('name')}
                error={errors.name?.message}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pincode">Pincode *</Label>
              <Input
                id="pincode"
                placeholder="500001"
                {...register('pincode')}
                error={errors.pincode?.message}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                placeholder="123, Main Street, Locality"
                {...register('address')}
                error={errors.address?.message}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                placeholder="Hyderabad"
                {...register('city')}
                error={errors.city?.message}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State *</Label>
              <Input
                id="state"
                placeholder="Telangana"
                {...register('state')}
                error={errors.state?.message}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your property..."
                rows={3}
                {...register('description')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Amenities */}
      <Card>
        <CardContent className="pt-6">
          <Label className="mb-4 block">Amenities</Label>
          
          {/* Quick add buttons */}
          <div className="mb-4 flex flex-wrap gap-2">
            {commonAmenities.map((amenity) => (
              <Button
                key={amenity}
                type="button"
                variant={amenities.includes(amenity) ? 'default' : 'outline'}
                size="sm"
                onClick={() =>
                  amenities.includes(amenity)
                    ? removeAmenity(amenity)
                    : addAmenity(amenity)
                }
              >
                {amenity}
              </Button>
            ))}
          </div>

          {/* Custom amenity input */}
          <div className="flex gap-2">
            <Input
              placeholder="Add custom amenity"
              value={newAmenity}
              onChange={(e) => setNewAmenity(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addAmenity(newAmenity);
                }
              }}
            />
            <Button type="button" variant="outline" onClick={() => addAmenity(newAmenity)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Selected amenities */}
          {amenities.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {amenities.map((amenity) => (
                <Badge key={amenity} variant="secondary" className="gap-1">
                  {amenity}
                  <button type="button" onClick={() => removeAmenity(amenity)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="mb-4 text-lg font-semibold">Contact Information</h3>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                placeholder="+91 9876543210"
                {...register('phone')}
                error={errors.phone?.message}
              />
              <p className="text-xs text-muted-foreground">
                Contact phone number (displayed in header/footer)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="contact@example.com"
                {...register('email')}
                error={errors.email?.message}
              />
              <p className="text-xs text-muted-foreground">
                Contact email address
              </p>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="googleMapsLink">Google Maps Link</Label>
              <Input
                id="googleMapsLink"
                type="url"
                placeholder="https://maps.google.com/..."
                {...register('googleMapsLink')}
                error={errors.googleMapsLink?.message}
              />
              <p className="text-xs text-muted-foreground">
                Google Maps share link (optional if coordinates are provided)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                placeholder="17.3850"
                {...register('latitude')}
                error={errors.latitude?.message}
              />
              <p className="text-xs text-muted-foreground">
                Decimal degrees (e.g., 17.3850 for Hyderabad)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                placeholder="78.4867"
                {...register('longitude')}
                error={errors.longitude?.message}
              />
              <p className="text-xs text-muted-foreground">
                Decimal degrees (e.g., 78.4867 for Hyderabad)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website URL</Label>
              <Input
                id="website"
                type="url"
                placeholder="https://www.example.com"
                {...register('website')}
                error={errors.website?.message}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp Number/Link</Label>
              <Input
                id="whatsapp"
                placeholder="+91 9876543210 or https://wa.me/..."
                {...register('whatsapp')}
                error={errors.whatsapp?.message}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="facebook">Facebook Page URL</Label>
              <Input
                id="facebook"
                type="url"
                placeholder="https://facebook.com/..."
                {...register('facebook')}
                error={errors.facebook?.message}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram Profile URL</Label>
              <Input
                id="instagram"
                type="url"
                placeholder="https://instagram.com/..."
                {...register('instagram')}
                error={errors.instagram?.message}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* House Rules */}
      <Card>
        <CardContent className="pt-6">
          <Label className="mb-4 block">House Rules</Label>
          
          <div className="flex gap-2">
            <Input
              placeholder="Add a house rule"
              value={newRule}
              onChange={(e) => setNewRule(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addRule();
                }
              }}
            />
            <Button type="button" variant="outline" onClick={addRule}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {rules.length > 0 && (
            <ul className="mt-4 space-y-2">
              {rules.map((rule, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <span className="text-sm">{rule}</span>
                  <button
                    type="button"
                    onClick={() => removeRule(rule)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* AC Configuration */}
      {hasAc && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="mb-4 text-lg font-semibold">AC Configuration</h3>
            <p className="mb-6 text-sm text-muted-foreground">
              Configure AC pricing for this property. These settings apply to all rooms with AC option.
            </p>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="acMonthlyRent">AC Monthly Rent per Bed (₹)</Label>
                <Input
                  id="acMonthlyRent"
                  type="number"
                  step="0.01"
                  placeholder="1000.00"
                  {...register('acMonthlyRent')}
                  error={errors.acMonthlyRent?.message}
                />
                <p className="text-xs text-muted-foreground">
                  Monthly rent per bed when AC option is selected
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="acSecurityDeposit">AC Security Deposit per Bed (₹)</Label>
                <Input
                  id="acSecurityDeposit"
                  type="number"
                  step="0.01"
                  placeholder="2000.00"
                  {...register('acSecurityDeposit')}
                  error={errors.acSecurityDeposit?.message}
                />
                <p className="text-xs text-muted-foreground">
                  Security deposit per bed when AC option is selected
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Meal Configuration */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="mb-4 text-lg font-semibold">Meal Services</h3>
          <p className="mb-6 text-sm text-muted-foreground">
            Configure meal options available for tenants. Meal services are available only on a monthly subscription basis - not per meal.
          </p>

          <div className="space-y-8">
            {/* Breakfast */}
            <div className="space-y-4 border-b pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">Breakfast</h4>
                  <p className="text-sm text-muted-foreground">Morning meal service</p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('breakfastEnabled')}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span className="text-sm">Enable Breakfast</span>
                </label>
              </div>
              {watch('breakfastEnabled') && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="breakfastPrice">Price per Meal (₹)</Label>
                    <Input
                      id="breakfastPrice"
                      type="number"
                      step="0.01"
                      placeholder="50.00"
                      {...register('breakfastPrice')}
                      error={errors.breakfastPrice?.message}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="breakfastMenu">Menu Description</Label>
                    <Textarea
                      id="breakfastMenu"
                      placeholder="e.g., Paratha, Sabzi, Tea, Bread, Butter, Jam..."
                      rows={3}
                      {...register('breakfastMenu')}
                      error={errors.breakfastMenu?.message}
                    />
                    <p className="text-xs text-muted-foreground">
                      Describe what's typically included in breakfast
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Lunch */}
            <div className="space-y-4 border-b pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">Lunch</h4>
                  <p className="text-sm text-muted-foreground">Afternoon meal service</p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('lunchEnabled')}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span className="text-sm">Enable Lunch</span>
                </label>
              </div>
              {watch('lunchEnabled') && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="lunchPrice">Price per Meal (₹)</Label>
                    <Input
                      id="lunchPrice"
                      type="number"
                      step="0.01"
                      placeholder="80.00"
                      {...register('lunchPrice')}
                      error={errors.lunchPrice?.message}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="lunchMenu">Menu Description</Label>
                    <Textarea
                      id="lunchMenu"
                      placeholder="e.g., Rice, Dal, Sabzi, Roti, Salad..."
                      rows={3}
                      {...register('lunchMenu')}
                      error={errors.lunchMenu?.message}
                    />
                    <p className="text-xs text-muted-foreground">
                      Describe what's typically included in lunch
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Dinner */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">Dinner</h4>
                  <p className="text-sm text-muted-foreground">Evening meal service</p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('dinnerEnabled')}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span className="text-sm">Enable Dinner</span>
                </label>
              </div>
              {watch('dinnerEnabled') && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="dinnerPrice">Price per Meal (₹)</Label>
                    <Input
                      id="dinnerPrice"
                      type="number"
                      step="0.01"
                      placeholder="80.00"
                      {...register('dinnerPrice')}
                      error={errors.dinnerPrice?.message}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="dinnerMenu">Menu Description</Label>
                    <Textarea
                      id="dinnerMenu"
                      placeholder="e.g., Rice, Dal, Sabzi, Roti, Salad..."
                      rows={3}
                      {...register('dinnerMenu')}
                      error={errors.dinnerMenu?.message}
                    />
                    <p className="text-xs text-muted-foreground">
                      Describe what's typically included in dinner
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => window.history.back()}>
          Cancel
        </Button>
        <Button type="submit" loading={isLoading}>
          {property ? 'Update Property' : 'Create Property'}
        </Button>
      </div>
    </form>
  );
}
