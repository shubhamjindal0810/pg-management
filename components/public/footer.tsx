import Link from 'next/link';
import { db } from '@/lib/db';
import { Phone, Mail, MapPin, Facebook, Instagram, MessageCircle, Globe } from 'lucide-react';

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
      address: true,
      city: true,
      state: true,
      pincode: true,
      phone: true,
      email: true,
      website: true,
      facebook: true,
      instagram: true,
      whatsapp: true,
      googleMapsLink: true,
    },
  });
}

export async function PublicFooter() {
  const property = await getProperty();

  if (!property) {
    return null;
  }

  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* About */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">{property.name}</h3>
            <p className="text-sm text-muted-foreground">
              Your trusted PG accommodation provider. Comfortable living spaces with modern
              amenities.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/browse"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Browse Rooms
                </Link>
              </li>
              <li>
                <Link
                  href="/book"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Book Now
                </Link>
              </li>
              {property.googleMapsLink && (
                <li>
                  <a
                    href={property.googleMapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Location
                  </a>
                </li>
              )}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Contact Us</h3>
            <ul className="space-y-3 text-sm">
              {property.address && (
                <li className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">
                    {property.address}, {property.city}, {property.state} - {property.pincode}
                  </span>
                </li>
              )}
              {property.phone && (
                <li>
                  <a
                    href={`tel:${property.phone}`}
                    className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Phone className="h-4 w-4 flex-shrink-0" />
                    <span>{property.phone}</span>
                  </a>
                </li>
              )}
              {property.email && (
                <li>
                  <a
                    href={`mailto:${property.email}`}
                    className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Mail className="h-4 w-4 flex-shrink-0" />
                    <span>{property.email}</span>
                  </a>
                </li>
              )}
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Follow Us</h3>
            <div className="flex flex-wrap gap-3">
              {property.facebook && (
                <a
                  href={property.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full border bg-background text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  aria-label="Facebook"
                >
                  <Facebook className="h-5 w-5" />
                </a>
              )}
              {property.instagram && (
                <a
                  href={property.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full border bg-background text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  aria-label="Instagram"
                >
                  <Instagram className="h-5 w-5" />
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
                  className="flex h-10 w-10 items-center justify-center rounded-full border bg-background text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  aria-label="WhatsApp"
                >
                  <MessageCircle className="h-5 w-5" />
                </a>
              )}
              {property.website && (
                <a
                  href={property.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full border bg-background text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  aria-label="Website"
                >
                  <Globe className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 border-t pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} {property.name}. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link href="/public" className="hover:text-primary transition-colors">
                Privacy Policy
              </Link>
              <Link href="/public" className="hover:text-primary transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

