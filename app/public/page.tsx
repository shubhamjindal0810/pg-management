import Link from 'next/link';
import Image from 'next/image';
import {
  Building2,
  MapPin,
  Wifi,
  Car,
  Droplets,
  Shield,
  Utensils,
  Sparkles,
  Heart,
  Star,
  CheckCircle2,
  ArrowRight,
  Users,
  BedDouble,
  Lock,
  Camera,
} from 'lucide-react';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { GoogleMapsSection } from '@/components/public/google-maps-section';
import { TestimonialsCarousel } from '@/components/public/testimonials-carousel';

async function getProperty() {
  const property = await db.property.findFirst({
    where: {
      OR: [
        { name: { contains: 'Ashiana', mode: 'insensitive' } },
        { isActive: true },
      ],
    },
    include: {
      rooms: {
        where: { isActive: true },
        include: {
          beds: {
            where: { status: 'AVAILABLE' },
            orderBy: { bedNumber: 'asc' },
          },
        },
        orderBy: { roomNumber: 'asc' },
        // Select monthlyRent and securityDeposit from room
      },
      testimonials: {
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  return property;
}

export default async function PublicLandingPage() {
  const property = await getProperty();

  if (!property) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Property Not Found</h1>
          <p className="text-muted-foreground">Please contact the administrator.</p>
        </div>
      </div>
    );
  }

  const amenities = (property.amenities as string[]) || [];
  const rules = (property.rules as string[]) || [];
  const propertyImages = (property.images as string[]) || [];
  const primaryImage = propertyImages[0] || null;
  const totalAvailableBeds = property.rooms.reduce(
    (sum, room) => sum + room.beds.length,
    0
  );
  
  // Get property data for maps section
  const propertyData = {
    googleMapsLink: property.googleMapsLink,
    name: property.name,
    address: property.address,
    city: property.city,
    state: property.state,
  };

  const amenityIcons: Record<string, any> = {
    WiFi: Wifi,
    Parking: Car,
    'Water Purifier': Droplets,
    Security: Shield,
    Laundry: Utensils,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-pink-50 to-white">
      {/* Hero Section - Full Width */}
      <section className="relative overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-rose-400/20 via-pink-300/20 to-purple-300/20" />
        
        <div className="relative container mx-auto px-4 py-20 lg:py-32">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            {/* Left Content */}
            <div className="space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full bg-rose-100 px-4 py-2 text-sm font-medium text-rose-700">
                <Sparkles className="h-4 w-4" />
                <span>Luxury Living for Women</span>
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
                  {property.name}
                </span>
              </h1>
              
              <p className="text-xl lg:text-2xl text-gray-700 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                {property.description || 
                  'Experience luxury, comfort, and security in our premium women\'s PG accommodation. Your home away from home.'}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/public/browse">
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white shadow-lg shadow-rose-500/50 text-lg px-8 py-6 rounded-full"
                  >
                    Explore Rooms
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/public/book">
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="border-2 border-rose-300 text-rose-700 hover:bg-rose-50 text-lg px-8 py-6 rounded-full"
                  >
                    Book Now
                  </Button>
                </Link>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4 pt-8">
                <div className="text-center lg:text-left">
                  <div className="text-3xl font-bold text-rose-600">{property.rooms.length}</div>
                  <div className="text-sm text-gray-600">Rooms</div>
                </div>
                <div className="text-center lg:text-left">
                  <div className="text-3xl font-bold text-pink-600">{totalAvailableBeds}</div>
                  <div className="text-sm text-gray-600">Available Beds</div>
                </div>
                <div className="text-center lg:text-left">
                  <div className="text-3xl font-bold text-purple-600">100%</div>
                  <div className="text-sm text-gray-600">Secure</div>
                </div>
              </div>
            </div>

            {/* Right Image */}
            {primaryImage && (
              <div className="relative">
                <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl">
                  <Image
                    src={primaryImage}
                    alt={property.name}
                    fill
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
                {/* Decorative elements */}
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-rose-200/50 rounded-full blur-2xl" />
                <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-pink-200/50 rounded-full blur-2xl" />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-white/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
              Why Choose Us
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Luxury, hospitality, and a safe haven designed exclusively for women
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 border-rose-100 bg-gradient-to-br from-rose-50 to-pink-50 hover:shadow-xl transition-all">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-800">Luxurious Living</h3>
                <p className="text-gray-600">
                  Premium amenities, elegant interiors, and thoughtfully designed spaces that make every day feel special.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-pink-100 bg-gradient-to-br from-pink-50 to-purple-50 hover:shadow-xl transition-all">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Heart className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-800">Warm Hospitality</h3>
                <p className="text-gray-600">
                  A caring community where you're not just a resident, but part of a family that looks out for each other.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-100 bg-gradient-to-br from-purple-50 to-rose-50 hover:shadow-xl transition-all">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Lock className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-800">Women's Safety</h3>
                <p className="text-gray-600">
                  Round-the-clock security, CCTV surveillance, and a safe environment where you can focus on your dreams.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Rooms */}
      {totalAvailableBeds > 0 && (
        <section className="py-20 bg-gradient-to-b from-white to-rose-50/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
                Featured Rooms
              </h2>
              <p className="text-xl text-gray-600">
                Discover your perfect space
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {property.rooms.slice(0, 6).map((room) => {
                if (room.beds.length === 0) return null;
                const roomImages = (room.images as string[]) || [];
                const roomImage = roomImages[0] || primaryImage;

                return (
                  <Card key={room.id} className="overflow-hidden border-2 border-rose-100 hover:border-rose-300 transition-all hover:shadow-xl group">
                    {roomImage && (
                      <div className="relative h-64 overflow-hidden">
                        <Image
                          src={roomImage}
                          alt={`Room ${room.roomNumber}`}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute top-4 right-4">
                          <Badge className="bg-white/90 text-rose-700 border-rose-200">
                            {room.beds.length} bed{room.beds.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                      </div>
                    )}
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-2xl font-bold text-gray-800">Room {room.roomNumber}</h3>
                        <div className="flex gap-1">
                          {room.hasAc && (
                            <Badge variant="outline" className="border-rose-200 text-rose-700">
                              AC
                            </Badge>
                          )}
                          {room.hasAttachedBath && (
                            <Badge variant="outline" className="border-pink-200 text-pink-700">
                              Bath
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-600 mb-4">
                        Starting from {formatCurrency(Number(room.monthlyRent || 0))}/month
                      </p>
                      <Link href={`/public/rooms/${room.id}`}>
                        <Button className="w-full bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 rounded-full">
                          View Details
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {property.rooms.length > 6 && (
              <div className="text-center mt-12">
                <Link href="/public/browse">
                  <Button size="lg" variant="outline" className="border-2 border-rose-300 text-rose-700 hover:bg-rose-50 rounded-full px-8">
                    View All Rooms
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Meal Services */}
      {(property.breakfastEnabled || property.lunchEnabled || property.dinnerEnabled) && (
        <section className="py-20 bg-gradient-to-b from-white to-rose-50/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
                Meal Services
              </h2>
              <p className="text-xl text-gray-600">
                Nutritious meals available as paid add-ons
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {property.breakfastEnabled && (
                <Card className="border-2 border-rose-100 hover:shadow-lg transition-all">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Utensils className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Breakfast</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Start your day with a nutritious breakfast
                    </p>
                    <Badge className="bg-rose-100 text-rose-700">Available</Badge>
                  </CardContent>
                </Card>
              )}

              {property.lunchEnabled && (
                <Card className="border-2 border-pink-100 hover:shadow-lg transition-all">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Utensils className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Lunch</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Wholesome lunch to keep you energized
                    </p>
                    <Badge className="bg-pink-100 text-pink-700">Available</Badge>
                  </CardContent>
                </Card>
              )}

              {property.dinnerEnabled && (
                <Card className="border-2 border-purple-100 hover:shadow-lg transition-all">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Utensils className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Dinner</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Satisfying dinner to end your day
                    </p>
                    <Badge className="bg-purple-100 text-purple-700">Available</Badge>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="text-center mt-8">
              <p className="text-sm text-muted-foreground">
                Meal services can be added during booking or from your tenant dashboard
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Amenities */}
      {amenities.length > 0 && (
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
                Premium Amenities
              </h2>
              <p className="text-xl text-gray-600">
                Everything you need for a comfortable stay
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {amenities.map((amenity) => {
                const Icon = amenityIcons[amenity] || Building2;
                return (
                  <div
                    key={amenity}
                    className="flex items-center gap-4 rounded-xl border-2 border-rose-100 bg-gradient-to-br from-rose-50 to-pink-50 p-6 hover:shadow-lg transition-all group"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-pink-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <span className="font-semibold text-gray-800">{amenity}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials / Features */}
      <section className="py-20 bg-gradient-to-br from-rose-100 via-pink-100 to-purple-100">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-gray-800">
                A Home That Cares
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">24/7 Security</h3>
                    <p className="text-gray-600">CCTV surveillance and security personnel for your peace of mind</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Clean & Hygienic</h3>
                    <p className="text-gray-600">Regular cleaning and maintenance for a healthy living environment</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-rose-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Community Support</h3>
                    <p className="text-gray-600">A supportive community of like-minded women on their journey</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="relative aspect-square rounded-3xl overflow-hidden shadow-2xl">
                {primaryImage ? (
                  <Image
                    src={primaryImage}
                    alt="Luxury accommodation"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center">
                    <Building2 className="h-24 w-24 text-white/50" />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-6 -right-6 bg-white rounded-2xl shadow-xl p-6 border-2 border-rose-100">
                <div className="flex items-center gap-2 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="font-semibold text-gray-800">Rated 5.0 by Residents</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Carousel */}
      {property.testimonials && property.testimonials.length > 0 && (
        <TestimonialsCarousel
          testimonials={property.testimonials.map((t) => ({
            id: t.id,
            name: t.name,
            photo: t.photo,
            testimonial: t.testimonial,
            rating: t.rating,
          }))}
        />
      )}

      {/* Google Maps Location */}
      {(property.googleMapsLink || property.latitude || property.longitude) && (
        <GoogleMapsSection
          googleMapsLink={property.googleMapsLink}
          latitude={property.latitude ? Number(property.latitude) : null}
          longitude={property.longitude ? Number(property.longitude) : null}
          propertyName={property.name}
          address={property.address}
          city={property.city}
          state={property.state}
        />
      )}

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative container mx-auto px-4 text-center">
          <h2 className="text-4xl lg:text-6xl font-bold mb-6">
            Ready to Begin Your Journey?
          </h2>
          <p className="text-xl lg:text-2xl mb-10 opacity-90 max-w-2xl mx-auto">
            Join our community of empowered women in a space designed for your comfort and success
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/public/browse">
              <Button 
                size="lg" 
                className="bg-white text-rose-600 hover:bg-rose-50 text-lg px-8 py-6 rounded-full shadow-xl"
              >
                Explore Rooms
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/public/book">
              <Button 
                size="lg" 
                variant="outline"
                className="border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-6 rounded-full"
              >
                Book Now
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
