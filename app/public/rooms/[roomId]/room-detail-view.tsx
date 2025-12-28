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
    acCharge: number | null;
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
    };
    beds: Array<{
      id: string;
      bedNumber: string;
      monthlyRent: number;
      securityDeposit: number;
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
          {room.hasAc && (
            <>
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center gap-1">
                <Snowflake className="h-4 w-4" />
                <span>AC Available</span>
              </div>
            </>
          )}
          {room.hasAttachedBath && (
            <>
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center gap-1">
                <Droplets className="h-4 w-4" />
                <span>Attached Bathroom</span>
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
                              {formatCurrency(Number(bed.monthlyRent))}
                            </p>
                            <p className="text-xs text-muted-foreground">per month</p>
                          </div>
                          {Number(bed.securityDeposit) > 0 && (
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Deposit</p>
                              <p className="text-sm font-medium">
                                {formatCurrency(Number(bed.securityDeposit))}
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
              {room.hasAc && (
                <div className="flex items-start gap-3">
                  <Snowflake className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Air Conditioning</p>
                    <p className="text-sm text-muted-foreground">
                      {room.acCharge
                        ? `Available (+${formatCurrency(Number(room.acCharge))}/bed/month)`
                        : 'Available'}
                    </p>
                  </div>
                </div>
              )}
              {room.hasAttachedBath && (
                <div className="flex items-start gap-3">
                  <Droplets className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Attached Bathroom</p>
                    <p className="text-sm text-muted-foreground">Private bathroom included</p>
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
