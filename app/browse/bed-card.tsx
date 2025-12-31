import Link from 'next/link';
import { BedDouble, Users, Droplets, Wind, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';

interface BedCardProps {
  bed: {
    id: string;
    bedNumber: string;
    images?: string[] | null;
    description?: string | null;
    room: {
      id: string;
      roomNumber: string;
      roomType: string;
      hasAc: boolean;
      hasAttachedBath: boolean;
      floor: number;
      monthlyRent: number;
      securityDeposit: number;
      images?: string[] | null;
      property: {
        id: string;
        name: string;
        address: string;
        city: string;
        amenities?: string[] | null;
      };
    };
  };
}

const roomTypeLabels: Record<string, string> = {
  single: 'Single',
  double: 'Double',
  triple: 'Triple',
  dormitory: 'Dormitory',
};

export function BedCard({ bed }: BedCardProps) {
  // Use bed images if available, otherwise use room images
  const images = (bed.images as string[]) || (bed.room.images as string[]) || [];
  const primaryImage = images[0] || '/placeholder-room.jpg';
  const propertyAmenities = (bed.room.property.amenities as string[]) || [];

  // Determine sharing type
  const sharingType =
    bed.room.roomType === 'single'
      ? 'Non-sharing'
      : bed.room.roomType === 'double'
        ? '2-sharing'
        : bed.room.roomType === 'triple'
          ? '3-sharing'
          : '4+ sharing';

  return (
    <Card className="group overflow-hidden transition-shadow hover:shadow-lg">
      {/* Image Gallery */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={`Room ${bed.room.roomNumber}, Bed ${bed.bedNumber}`}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
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
        <div className="absolute bottom-2 left-2 flex gap-1">
          {bed.room.hasAc && (
            <Badge variant="secondary" className="bg-white/90">
              <Wind className="mr-1 h-3 w-3" />
              AC
            </Badge>
          )}
          {bed.room.hasAttachedBath && (
            <Badge variant="secondary" className="bg-white/90">
              <Droplets className="mr-1 h-3 w-3" />
              Attached Bath
            </Badge>
          )}
        </div>
      </div>

      <CardContent className="p-4">
        {/* Location */}
        <div className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span>{bed.room.property.city}</span>
        </div>

        {/* Title */}
        <h3 className="mb-1 text-lg font-semibold">
          {bed.room.property.name} - Room {bed.room.roomNumber}
        </h3>
        <p className="mb-3 text-sm text-muted-foreground">
          Bed {bed.bedNumber} • {roomTypeLabels[bed.room.roomType]} • {sharingType}
        </p>

        {/* Features */}
        <div className="mb-3 flex flex-wrap gap-2">
          <Badge variant="outline" className="text-xs">
            <Users className="mr-1 h-3 w-3" />
            {sharingType}
          </Badge>
          {bed.room.floor === 0 ? (
            <Badge variant="outline" className="text-xs">
              Ground Floor
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs">
              Floor {bed.room.floor}
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
            <p className="text-2xl font-bold">{formatCurrency(Number(bed.room.monthlyRent))}</p>
            <p className="text-xs text-muted-foreground">per month</p>
          </div>
          {Number(bed.room.securityDeposit) > 0 && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Security Deposit</p>
              <p className="text-sm font-medium">{formatCurrency(Number(bed.room.securityDeposit))}</p>
            </div>
          )}
        </div>

        {/* Action */}
        <Link href={`/rooms/${bed.room.id}`} className="block">
          <Button className="w-full">View Details & Book</Button>
        </Link>
      </CardContent>
    </Card>
  );
}

