import Image from 'next/image';
import {
  Building2,
  BedDouble,
  Users,
  Snowflake,
  Droplets,
  MapPin,
  Shield,
  Wifi,
  Car,
  Utensils,
  Droplet,
  Star,
  Check,
  Home,
  Coffee,
  Soup,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils';
import { PhotoGallery } from './photo-gallery';

interface RoomDetailViewProps {
  room: {
    id: string;
    roomNumber: string;
    floor: number;
    roomType: string;
    hasAc: boolean;
    hasAttachedBath: boolean;
    hasBalcony: boolean;
    multiBedPricing: Record<string, number> | null;
    description: string | null;
    images: string[] | null;
    property: {
      id: string;
      name: string;
      address: string;
      city: string;
      state: string;
      amenities: string[] | null;
      rules: string[] | null;
      images: string[] | null;
      description: string | null;
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
    monthlyRent: number;
    securityDeposit: number;
    beds: Array<{
      id: string;
      bedNumber: string;
      images: string[] | null;
      description: string | null;
    }>;
  };
}

const roomTypeLabels: Record<string, string> = {
  single: 'Single (Non-sharing)',
  double: 'Double (2-sharing)',
  triple: 'Triple (3-sharing)',
  dormitory: 'Dormitory (4+ sharing)',
};

const amenityIcons: Record<string, any> = {
  WiFi: Wifi,
  Wifi: Wifi,
  Parking: Car,
  'Water Purifier': Droplet,
  Security: Shield,
  Laundry: Utensils,
  'Power Backup': Shield,
  Gym: Users,
  'Common Area': Building2,
};

export function RoomDetailView({ room }: RoomDetailViewProps) {
  const roomImages = (room.images as string[]) || [];
  const propertyImages = (room.property.images as string[]) || [];
  const allImages = [...roomImages, ...propertyImages];

  const propertyAmenities = (room.property.amenities as string[]) || [];
  const houseRules = (room.property.rules as string[]) || [];

  const sharingType =
    room.roomType === 'single'
      ? 'Non-sharing'
      : room.roomType === 'double'
        ? '2-sharing'
        : room.roomType === 'triple'
          ? '3-sharing'
          : '4+ sharing';

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div>
        <h1 className="mb-3 text-3xl font-semibold">
          {room.property.name} - Room {room.roomNumber}
        </h1>
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            <span>
              {room.property.city}, {room.property.state}
            </span>
          </div>
          <Separator orientation="vertical" className="h-4" />
          <span>{sharingType}</span>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center gap-1">
            <Snowflake className="h-4 w-4" />
            <span>{room.hasAc ? 'AC Optional' : 'Non AC'}</span>
          </div>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center gap-1">
            <Droplets className="h-4 w-4" />
            <span>{room.hasAttachedBath ? 'Attached Bath' : 'Common Bath'}</span>
          </div>
          {room.hasBalcony && (
            <>
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center gap-1">
                <Home className="h-4 w-4" />
                <span>Balcony</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Photo Gallery */}
      <PhotoGallery images={allImages} roomNumber={room.roomNumber} />

      {/* Main Content Grid */}
      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        {/* Left Column - Main Content */}
        <div className="space-y-8">
          {/* Room Overview */}
          <div className="border-b pb-8">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="mb-2 text-2xl font-semibold">
                  {sharingType} room in {room.property.name}
                </h2>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{room.beds.length} bed{room.beds.length !== 1 ? 's' : ''} available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <span>
                      Floor {room.floor === 0 ? 'Ground' : room.floor}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Room Description */}
          {room.description && (
            <div>
              <h3 className="mb-4 text-xl font-semibold">About this room</h3>
              <p className="whitespace-pre-line text-muted-foreground leading-relaxed">
                {room.description}
              </p>
            </div>
          )}

          {/* Property Description */}
          {room.property.description && (
            <div>
              <h3 className="mb-4 text-xl font-semibold">About {room.property.name}</h3>
              <p className="whitespace-pre-line text-muted-foreground leading-relaxed">
                {room.property.description}
              </p>
            </div>
          )}

          {/* Available Beds */}
          <div>
            <h3 className="mb-4 text-xl font-semibold">Available Beds</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {room.beds.map((bed) => {
                const bedImages = (bed.images as string[]) || [];
                const bedImage = bedImages[0] || allImages[0] || null;
                return (
                  <Card key={bed.id} className="overflow-hidden">
                    {bedImage && (
                      <div className="relative h-48 w-full">
                        <Image
                          src={bedImage}
                          alt={`Bed ${bed.bedNumber}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                      </div>
                    )}
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <h4 className="font-semibold">Bed {bed.bedNumber}</h4>
                        {bed.description && (
                          <p className="text-sm text-muted-foreground">{bed.description}</p>
                        )}
                        <div className="flex items-baseline justify-between pt-2">
                          <div>
                            <p className="text-lg font-bold">
                              {formatCurrency(Number(room.monthlyRent))}
                            </p>
                            <p className="text-xs text-muted-foreground">per month</p>
                          </div>
                          {Number(room.securityDeposit) > 0 && (
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Deposit</p>
                              <p className="text-sm font-medium">
                                {formatCurrency(Number(room.securityDeposit))}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Room Features */}
          <div>
            <h3 className="mb-4 text-xl font-semibold">What this room offers</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Room Type</p>
                  <p className="text-sm text-muted-foreground">{roomTypeLabels[room.roomType]}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Snowflake className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Air Conditioning</p>
                  <p className="text-sm text-muted-foreground">
                    {room.hasAc
                      ? room.property.acMonthlyRent
                        ? `AC Optional (+${formatCurrency(Number(room.property.acMonthlyRent))}/bed/month)`
                        : 'AC Optional'
                      : 'Non AC'}
                  </p>
                  {room.hasAc && room.property.acMonthlyRent && (
                    <p className="mt-1 text-xs text-blue-600 font-medium">
                      ℹ️ AC security deposit: {formatCurrency(Number(room.property.acSecurityDeposit || 0))} per bed
                    </p>
                  )}
                  {room.hasAc && (
                    <p className="mt-1 text-xs text-amber-600 font-medium">
                      ⚠️ AC usage charges will be billed separately based on electricity consumption at the end of each month
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Droplets className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Bathroom</p>
                  <p className="text-sm text-muted-foreground">
                    {room.hasAttachedBath ? 'Attached Bath' : 'Common Bath'}
                  </p>
                </div>
              </div>
              {room.hasBalcony && (
                <div className="flex items-start gap-3">
                  <Home className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Balcony</p>
                    <p className="text-sm text-muted-foreground">Private balcony included</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Floor</p>
                  <p className="text-sm text-muted-foreground">
                    {room.floor === 0 ? 'Ground Floor' : `Floor ${room.floor}`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Property Amenities */}
          {propertyAmenities.length > 0 && (
            <div>
              <h3 className="mb-4 text-xl font-semibold">Property Amenities</h3>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {propertyAmenities.map((amenity) => {
                  const Icon = amenityIcons[amenity] || Building2;
                  return (
                    <div key={amenity} className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="text-sm">{amenity}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Meal Services */}
          {(room.property.breakfastEnabled || room.property.lunchEnabled || room.property.dinnerEnabled) && (
            <div>
              <h3 className="mb-4 text-xl font-semibold flex items-center gap-2">
                <Utensils className="h-5 w-5" />
                Meal Services (Add-on)
              </h3>
              <div className="space-y-4 rounded-lg border p-4">
                {room.property.breakfastEnabled && (
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Coffee className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Breakfast</p>
                        {room.property.breakfastMenu && (
                          <p className="text-sm text-muted-foreground">{room.property.breakfastMenu}</p>
                        )}
                      </div>
                    </div>
                    <p className="font-semibold">{formatCurrency(Number(room.property.breakfastPrice || 0))}/meal</p>
                  </div>
                )}
                {room.property.lunchEnabled && (
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Soup className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Lunch</p>
                        {room.property.lunchMenu && (
                          <p className="text-sm text-muted-foreground">{room.property.lunchMenu}</p>
                        )}
                      </div>
                    </div>
                    <p className="font-semibold">{formatCurrency(Number(room.property.lunchPrice || 0))}/meal</p>
                  </div>
                )}
                {room.property.dinnerEnabled && (
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Utensils className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Dinner</p>
                        {room.property.dinnerMenu && (
                          <p className="text-sm text-muted-foreground">{room.property.dinnerMenu}</p>
                        )}
                      </div>
                    </div>
                    <p className="font-semibold">{formatCurrency(Number(room.property.dinnerPrice || 0))}/meal</p>
                  </div>
                )}
                <div className="mt-3 rounded-lg bg-blue-50 border border-blue-200 p-3">
                  <p className="text-sm font-medium text-blue-900 mb-1">
                    ⚠️ Important: Meal Services Subscription
                  </p>
                  <p className="text-sm text-blue-800">
                    Meal services are available only on a monthly subscription basis - not per meal. You can select them during booking or add them later from your tenant dashboard.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* House Rules */}
          {houseRules.length > 0 && (
            <div>
              <h3 className="mb-4 text-xl font-semibold flex items-center gap-2">
                <Shield className="h-5 w-5" />
                House Rules
              </h3>
              <div className="space-y-3">
                {houseRules.map((rule, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{rule}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Location */}
          <div>
            <h3 className="mb-4 text-xl font-semibold flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Where you'll be
            </h3>
            <div className="space-y-2">
              <p className="font-medium">{room.property.name}</p>
              <p className="text-sm text-muted-foreground">{room.property.address}</p>
              <p className="text-sm text-muted-foreground">
                {room.property.city}, {room.property.state}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column - Sticky Booking Card (handled by parent) */}
      </div>
    </div>
  );
}
