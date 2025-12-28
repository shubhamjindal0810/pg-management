'use client';

import { MapPin, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GoogleMapsSectionProps {
  googleMapsLink: string | null;
  latitude: number | null;
  longitude: number | null;
  propertyName: string;
  address: string;
  city: string;
  state: string;
}

export function GoogleMapsSection({
  googleMapsLink,
  latitude,
  longitude,
  propertyName,
  address,
  city,
  state,
}: GoogleMapsSectionProps) {
  // Don't show if we have no location data
  if (!googleMapsLink && !latitude && !longitude) {
    return null;
  }

  // Get embed URL - prioritize coordinates if available
  const getEmbedUrl = () => {
    // Priority 1: Use coordinates if available (most accurate)
    if (latitude && longitude) {
      return `https://www.google.com/maps?q=${latitude},${longitude}&output=embed`;
    }

    // Priority 2: Use Google Maps link if provided
    if (googleMapsLink) {
      // If it's already an embed URL, return as is
      if (googleMapsLink.includes('/embed') || googleMapsLink.includes('google.com/maps/embed')) {
        return googleMapsLink;
      }

      // Try to convert share link to embed format
      try {
        const url = new URL(googleMapsLink);
        
        // If it has a 'q' parameter (address, place name, or coordinates)
        const q = url.searchParams.get('q');
        if (q) {
          return `https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed`;
        }
        
        // Extract place identifier from path
        const pathParts = url.pathname.split('/').filter(p => p && p !== 'maps');
        if (pathParts.length > 0) {
          const identifier = pathParts[pathParts.length - 1];
          return `https://www.google.com/maps?q=${encodeURIComponent(identifier)}&output=embed`;
        }
      } catch (e) {
        // If URL parsing fails, fall through to address
      }
    }

    // Priority 3: Fallback to address-based search
    return `https://www.google.com/maps?q=${encodeURIComponent(`${address}, ${city}, ${state}`)}&output=embed`;
  };

  // Get the link to open in Google Maps
  const getMapsLink = () => {
    if (latitude && longitude) {
      return `https://www.google.com/maps?q=${latitude},${longitude}`;
    }
    if (googleMapsLink) {
      return googleMapsLink;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${address}, ${city}, ${state}`)}`;
  };

  const embedUrl = getEmbedUrl();
  const mapsLink = getMapsLink();

  return (
    <section className="py-20 bg-gradient-to-b from-white to-rose-50/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
            Find Us
          </h2>
          <p className="text-xl text-gray-600">
            Visit us at our convenient location
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Address Info */}
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <MapPin className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2 text-gray-800">{propertyName}</h3>
                <p className="text-gray-600 mb-1">{address}</p>
                <p className="text-gray-600">
                  {city}, {state}
                </p>
                {latitude && longitude && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Coordinates: {latitude.toFixed(6)}, {longitude.toFixed(6)}
                  </p>
                )}
              </div>
            </div>

            <div className="pt-6 border-t border-rose-100">
              <a
                href={mapsLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-rose-600 hover:text-rose-700 font-medium transition-colors"
              >
                <span>Open in Google Maps</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Map */}
          <div className="relative h-96 rounded-2xl overflow-hidden shadow-xl border-2 border-rose-100">
            {embedUrl ? (
              <iframe
                src={embedUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full"
                title={`${propertyName} location`}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-rose-100 to-pink-100 flex flex-col items-center justify-center p-8">
                <MapPin className="h-16 w-16 text-rose-400 mb-4" />
                <p className="text-gray-700 font-medium mb-2 text-center">{propertyName}</p>
                <p className="text-sm text-gray-600 text-center mb-4">{address}</p>
                <a
                  href={mapsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 rounded-full">
                    View on Google Maps
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
