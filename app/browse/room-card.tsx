import Link from 'next/link';
import Image from 'next/image';
import { BedDouble, Users, Droplets, Wind, MapPin, Home } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';

interface RoomCardProps {
  room: {
    id: string;
    roomNumber: string;
    roomType: string;
    hasAc: boolean;
    hasAttachedBath: boolean;
    hasBalcony: boolean;
    floor: number;
    images?: string[] | null;
    description?: string | null;
    property: {
      id: string;
      name: string;
      address: string;
      city: string;
      amenities?: string[] | null;
    };
    monthlyRent: number;
    securityDeposit: number;
    beds: Array<{
      id: string;
      bedNumber: string;
      status: string;
    }>;
  };
}

const roomTypeLabels: Record<string, string> = {
  single: 'Single',
  double: 'Double',
  triple: 'Triple',
  dormitory: 'Dormitory',
};

export function RoomCard({ room }: RoomCardProps) {
  const images = (room.images as string[]) || [];
  const primaryImage = images[0] || '/placeholder-room.jpg';
  const propertyAmenities = (room.property.amenities as string[]) || [];
  
  // All beds have the same price (room-level pricing)
  const availableBeds = room.beds.filter(bed => bed.status === 'AVAILABLE');
  const price = Number(room.monthlyRent);
  
  // Determine sharing type
  const sharingType =
    room.roomType === 'single'
      ? 'Non-sharing'
      : room.roomType === 'double'
        ? '2-sharing'
        : room.roomType === 'triple'
          ? '3-sharing'
          : '4+ sharing';

  return (
    <Link href={`/rooms/${room.id}`} className="block">
      <Card className="group overflow-hidden transition-shadow hover:shadow-lg cursor-pointer">
        {/* Image Gallery */}
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {primaryImage ? (
          <Image
            src={primaryImage}
            alt={`Room ${room.roomNumber}`}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <BedDouble className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        {images.length > 1 && (
          <div className="absolute right-2 top-2 rounded bg-black/50 px-2 py-1 text-xs text-white">
            +{images.length - 1} more
          </div>
        )}
        <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
          {room.hasAc && (
            <Badge variant="secondary" className="bg-white/90">
              <Wind className="mr-1 h-3 w-3" />
              AC Optional
            </Badge>
          )}
          {!room.hasAc && (
            <Badge variant="secondary" className="bg-white/90">
              Non AC
            </Badge>
          )}
          {room.hasAttachedBath ? (
            <Badge variant="secondary" className="bg-white/90">
              <Droplets className="mr-1 h-3 w-3" />
              Attached Bath
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-white/90">
              <Droplets className="mr-1 h-3 w-3" />
              Common Bath
            </Badge>
          )}
          {room.hasBalcony && (
            <Badge variant="secondary" className="bg-white/90">
              <Home className="mr-1 h-3 w-3" />
              Balcony
            </Badge>
          )}
        </div>
      </div>

      <CardContent className="p-4">
        {/* Location */}
        <div className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span>{room.property.city}</span>
        </div>

        {/* Title */}
        <h3 className="mb-1 text-lg font-semibold">
          {room.property.name} - Room {room.roomNumber}
        </h3>
        <p className="mb-3 text-sm text-muted-foreground">
          {roomTypeLabels[room.roomType]} • {sharingType} • {availableBeds.length} bed{availableBeds.length !== 1 ? 's' : ''} available
        </p>

        {/* Features */}
        <div className="mb-3 flex flex-wrap gap-2">
          <Badge variant="outline" className="text-xs">
            <Users className="mr-1 h-3 w-3" />
            {sharingType}
          </Badge>
          {room.floor === 0 ? (
            <Badge variant="outline" className="text-xs">
              Ground Floor
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs">
              Floor {room.floor}
            </Badge>
          )}
          {room.hasAc && (
            <Badge variant="outline" className="text-xs">
              AC Optional
            </Badge>
          )}
          {!room.hasAc && (
            <Badge variant="outline" className="text-xs">
              Non AC
            </Badge>
          )}
          {room.hasAttachedBath ? (
            <Badge variant="outline" className="text-xs">
              Attached Bath
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs">
              Common Bath
            </Badge>
          )}
          {room.hasBalcony && (
            <Badge variant="outline" className="text-xs">
              Balcony
            </Badge>
          )}
        </div>

        {/* Property Amenities (first 3) */}
        {propertyAmenities.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1">
            {propertyAmenities.slice(0, 3).map((amenity, index) => (
              <span key={index} className="text-xs text-muted-foreground">
                {amenity}
                {index < Math.min(propertyAmenities.length, 3) - 1 && ' • '}
              </span>
            ))}
            {propertyAmenities.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{propertyAmenities.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Price */}
        <div className="mb-4 flex items-baseline justify-between">
          <div>
            <p className="text-2xl font-bold">{formatCurrency(price)}</p>
            <p className="text-xs text-muted-foreground">per bed per month</p>
          </div>
        </div>

        {/* Action */}
        <Button className="w-full">View Details & Book</Button>
      </CardContent>
    </Card>
    </Link>
  );
}

