import Link from 'next/link';
import { db } from '@/lib/db';
import { Phone, Mail, MapPin, Menu, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

async function getProperty() {
  return db.property.findFirst({
    where: {
      OR: [
        { name: { contains: 'Ashiana', mode: 'insensitive' } },
        { isActive: true },
      ],
    },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      googleMapsLink: true,
      whatsapp: true,
    },
  });
}

export async function PublicHeader() {
  const property = await getProperty();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      {/* Top Bar - Contact Info */}
      {property && (property.phone || property.email || property.whatsapp) && (
        <div className="border-b bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between py-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                {property.phone && (
                  <a
                    href={`tel:${property.phone}`}
                    className="flex items-center gap-1.5 hover:text-primary transition-colors"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    <span>{property.phone}</span>
                  </a>
                )}
                {property.whatsapp && (
                  <a
                    href={
                      property.whatsapp.startsWith('http')
                        ? property.whatsapp
                        : `https://wa.me/${property.whatsapp.replace(/[^0-9]/g, '')}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 hover:text-[#25D366] transition-colors"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>WhatsApp</span>
                  </a>
                )}
                {property.email && (
                  <a
                    href={`mailto:${property.email}`}
                    className="flex items-center gap-1.5 hover:text-primary transition-colors"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    <span>{property.email}</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Navigation */}
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <span className="text-lg font-bold">PG</span>
              </div>
              <span className="text-xl font-bold">{property?.name || 'PG Accommodation'}</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Home
            </Link>
            <Link
              href="/browse"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Browse Rooms
            </Link>
            <Link
              href="/book"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Book Now
            </Link>
            {property?.googleMapsLink && (
              <a
                href={property.googleMapsLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                <MapPin className="h-4 w-4" />
                <span>Location</span>
              </a>
            )}
          </nav>

          {/* CTA Button */}
          <div className="flex items-center gap-4">
            <Link href="/public/book">
              <Button size="sm" className="hidden sm:inline-flex">
                Book Now
              </Button>
            </Link>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

