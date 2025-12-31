import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
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
  Calendar,
} from 'lucide-react';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { GoogleMapsSection } from '@/components/public/google-maps-section';
import { TestimonialsCarousel } from '@/components/public/testimonials-carousel';
import { PublicHeader } from '@/components/public/header';
import { PublicFooter } from '@/components/public/footer';
import { WhatsAppFloat } from '@/components/public/whatsapp-float';
import { NavigationLoading } from '@/components/navigation-loading';

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

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  // If logged in, redirect to appropriate dashboard
  if (session) {
    if (session.user.role === 'TENANT') {
      redirect('/tenant');
    }
    redirect('/dashboard');
  }

  // Show public landing page for non-logged-in users
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

  const totalAvailableBeds = property.rooms.reduce(
    (sum, room) => sum + room.beds.length,
    0
  );

  // Calculate cheapest bed price (monthly rent)
  const allRoomPrices = property.rooms
    .filter(room => room.monthlyRent && room.beds.length > 0)
    .map(room => Number(room.monthlyRent));
  const cheapestPrice = allRoomPrices.length > 0 ? Math.min(...allRoomPrices) : null;

  // Check if daily bookings are available (any room with dailyPrice)
  const hasDailyBookings = property.rooms.some(room => room.dailyPrice && Number(room.dailyPrice) > 0);

  const propertyImages = (property.images as string[]) || [];
  const primaryImage = propertyImages[0] || '/placeholder-property.jpg';
  const amenities = (property.amenities as string[]) || [];

  const propertyForLayout = await db.property.findFirst({
    where: {
      OR: [
        { name: { contains: 'Ashiana', mode: 'insensitive' } },
        { isActive: true },
      ],
    },
    select: {
      whatsapp: true,
      phone: true,
    },
  });

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main className="flex-1">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            {/* Left Content */}
            <div className="space-y-6 text-center lg:text-left">
              <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100">
                <Sparkles className="mr-2 h-3 w-3" />
                Premium PG Accommodation
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 lg:text-6xl">
                Welcome to{' '}
                <span className="bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
                  {property.name}
                </span>
              </h1>
              <p className="text-lg text-gray-600 lg:text-xl">
                {property.description ||
                  'Experience comfortable living with modern amenities. Your perfect home away from home.'}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/browse">
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white shadow-lg shadow-rose-500/50 text-lg px-8 py-6 rounded-full"
                  >
                    Explore Rooms
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/book">
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
                  {cheapestPrice ? (
                    <>
                      <div className="text-3xl font-bold text-purple-600">
                        {formatCurrency(cheapestPrice)}
                      </div>
                      <div className="text-sm text-gray-600">Starting From</div>
                    </>
                  ) : (
                    <>
                      <div className="text-3xl font-bold text-purple-600">100%</div>
                      <div className="text-sm text-gray-600">Secure</div>
                    </>
                  )}
                </div>
              </div>
              
              {/* Starting Price Banner */}
              {cheapestPrice && (
                <div className="mt-6 rounded-lg bg-gradient-to-r from-rose-100 to-pink-100 border-2 border-rose-200 p-4">
                  <p className="text-center text-sm font-medium text-gray-800">
                    <span className="font-bold text-rose-600">PG prices start from {formatCurrency(cheapestPrice)}/month</span>
                    {hasDailyBookings && (
                      <span className="block mt-1 text-xs text-gray-600">
                        Daily bookings also available
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Right Image */}
            {primaryImage && (
              <div className="relative">
                <div className="absolute -inset-4 rounded-2xl bg-gradient-to-r from-rose-400 to-pink-400 opacity-20 blur-2xl"></div>
                <div className="relative overflow-hidden rounded-2xl shadow-2xl">
                  <Image
                    src={primaryImage}
                    alt={property.name}
                    width={600}
                    height={400}
                    className="h-full w-full object-cover"
                    priority
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Pricing & Booking Options */}
      <section className="py-16 bg-gradient-to-br from-rose-50 to-pink-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Flexible Booking Options</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Choose the booking option that works best for you
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Monthly Bookings */}
              <Card className="border-2 border-rose-200 bg-white">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Calendar className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Monthly Bookings</h3>
                  {cheapestPrice ? (
                    <p className="text-2xl font-bold text-rose-600 mb-2">
                      Starting from {formatCurrency(cheapestPrice)}/month
                    </p>
                  ) : (
                    <p className="text-lg text-gray-600 mb-2">Available</p>
                  )}
                  <p className="text-sm text-gray-600">
                    Perfect for long-term stays. Book for 1, 2, 3, 6, or 12 months.
                  </p>
                </CardContent>
              </Card>

              {/* Daily Bookings */}
              {hasDailyBookings && (
                <Card className="border-2 border-pink-200 bg-white">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Calendar className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Daily Bookings</h3>
                    <p className="text-lg font-semibold text-rose-600 mb-2">Available</p>
                    <p className="text-sm text-gray-600">
                      Short-term stays welcome! Book by the day for your convenience.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      {amenities.length > 0 && (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Us?</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                We provide the best facilities and amenities for a comfortable living experience
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {amenities.slice(0, 8).map((amenity, index) => (
                <Card key={index} className="border-2 hover:border-rose-200 transition-colors">
                  <CardContent className="p-6 text-center">
                    <div className="flex justify-center mb-4">
                      <div className="rounded-full bg-rose-100 p-3">
                        <Star className="h-6 w-6 text-rose-600" />
                      </div>
                    </div>
                    <h3 className="font-semibold text-gray-900">{amenity}</h3>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Rooms Preview */}
      {property.rooms.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Rooms</h2>
              <p className="text-gray-600">Explore our comfortable and well-maintained rooms</p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {property.rooms.slice(0, 6).map((room) => {
                const roomImages = (room.images as string[]) || [];
                const roomImage = roomImages[0] || '/placeholder-room.jpg';
                const availableBeds = room.beds.length;

                return (
                  <Card key={room.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <Link href={`/rooms/${room.id}`}>
                      <div className="relative h-48 overflow-hidden">
                        <Image
                          src={roomImage}
                          alt={`Room ${room.roomNumber}`}
                          fill
                          className="object-cover hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-4 right-4">
                          <Badge className="bg-white/90 text-gray-900">
                            {availableBeds} {availableBeds === 1 ? 'Bed' : 'Beds'} Available
                          </Badge>
                        </div>
                      </div>
                      <CardContent className="p-6">
                        <h3 className="text-xl font-bold mb-2">Room {room.roomNumber}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                          {room.hasAc && (
                            <span className="flex items-center gap-1">
                              <Wifi className="h-4 w-4" />
                              AC Available
                              <Badge variant="outline" className="ml-1 text-xs border-rose-300 text-rose-700">
                                Extra Charge
                              </Badge>
                            </span>
                          )}
                          {room.hasAttachedBath && (
                            <span className="flex items-center gap-1">
                              <Droplets className="h-4 w-4" />
                              Attached Bath
                            </span>
                          )}
                        </div>
                        {room.monthlyRent && (
                          <div className="text-2xl font-bold text-rose-600">
                            {formatCurrency(Number(room.monthlyRent))}
                            <span className="text-sm font-normal text-gray-600">/month</span>
                          </div>
                        )}
                      </CardContent>
                    </Link>
                  </Card>
                );
              })}
            </div>
            <div className="text-center mt-12">
              <Link href="/browse">
                <Button size="lg" variant="outline" className="border-2 border-rose-300 text-rose-700 hover:bg-rose-50">
                  View All Rooms
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Meal Services Section */}
      {(property.breakfastEnabled || property.lunchEnabled || property.dinnerEnabled) && (
        <section className="py-16 bg-gradient-to-br from-rose-50 to-pink-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Meal Services Available</h2>
              <p className="text-lg text-gray-700 mb-2 font-semibold">
                Nutritious meals available as <span className="text-rose-600">paid add-ons</span>
              </p>
              <p className="text-sm text-gray-600 max-w-2xl mx-auto">
                Meals can be added during booking or from your tenant dashboard. Charges apply separately from room rent.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {property.breakfastEnabled && (
                <Card className="border-2 border-rose-200 bg-white">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Utensils className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Breakfast</h3>
                    {property.breakfastPrice && (
                      <p className="text-lg font-semibold text-rose-600 mb-2">
                        {formatCurrency(Number(property.breakfastPrice) * 30)}/month
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mb-2">
                      {property.breakfastPrice && `(${formatCurrency(Number(property.breakfastPrice))}/day)`}
                    </p>
                    <Badge className="bg-rose-100 text-rose-700 border-rose-300">
                      Extra Charge
                    </Badge>
                  </CardContent>
                </Card>
              )}

              {property.lunchEnabled && (
                <Card className="border-2 border-pink-200 bg-white">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Utensils className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Lunch</h3>
                    {property.lunchPrice && (
                      <p className="text-lg font-semibold text-rose-600 mb-2">
                        {formatCurrency(Number(property.lunchPrice) * 30)}/month
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mb-2">
                      {property.lunchPrice && `(${formatCurrency(Number(property.lunchPrice))}/day)`}
                    </p>
                    <Badge className="bg-pink-100 text-pink-700 border-pink-300">
                      Extra Charge
                    </Badge>
                  </CardContent>
                </Card>
              )}

              {property.dinnerEnabled && (
                <Card className="border-2 border-purple-200 bg-white">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Utensils className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Dinner</h3>
                    {property.dinnerPrice && (
                      <p className="text-lg font-semibold text-rose-600 mb-2">
                        {formatCurrency(Number(property.dinnerPrice) * 30)}/month
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mb-2">
                      {property.dinnerPrice && `(${formatCurrency(Number(property.dinnerPrice))}/day)`}
                    </p>
                    <Badge className="bg-purple-100 text-purple-700 border-purple-300">
                      Extra Charge
                    </Badge>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </section>
      )}

      {/* AC Information Section */}
      {property.rooms.some(room => room.hasAc) && property.acMonthlyRent && (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-2xl flex items-center justify-center">
                  <Wifi className="h-10 w-10 text-white" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Air Conditioning Available</h2>
              <p className="text-lg text-gray-700 mb-4 font-semibold">
                AC is available as a <span className="text-rose-600">paid add-on</span> for rooms with AC facilities
              </p>
              <div className="bg-rose-50 border-2 border-rose-200 rounded-lg p-6">
                <p className="text-gray-700 mb-2">
                  <span className="font-semibold">AC Monthly Rent:</span>{' '}
                  <span className="text-rose-600 font-bold text-lg">
                    {formatCurrency(Number(property.acMonthlyRent))}/bed/month
                  </span>
                </p>
                {property.acSecurityDeposit && (
                  <p className="text-gray-700">
                    <span className="font-semibold">AC Security Deposit:</span>{' '}
                    <span className="text-rose-600 font-bold">
                      {formatCurrency(Number(property.acSecurityDeposit))}/bed
                    </span>
                  </p>
                )}
                <p className="text-sm text-gray-600 mt-4">
                  AC charges are separate from room rent and can be added during booking or later from your tenant dashboard.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {property.testimonials.length > 0 && (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">What Our Tenants Say</h2>
              <p className="text-gray-600">Hear from our satisfied residents</p>
            </div>
            <TestimonialsCarousel testimonials={property.testimonials} />
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-rose-600 to-pink-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Find Your Perfect Room?</h2>
          <p className="text-lg mb-8 text-rose-100 max-w-2xl mx-auto">
            Browse our available rooms and book your stay today. Comfortable living awaits you!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/browse">
              <Button size="lg" variant="secondary" className="bg-white text-rose-600 hover:bg-rose-50">
                Browse Rooms
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/book">
              <Button size="lg" variant="outline" className="border-2 border-white bg-white/10 backdrop-blur-sm text-white font-semibold hover:bg-white hover:text-rose-600 transition-all">
                Book Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Google Maps */}
      {property.googleMapsLink && (
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
      </main>
      <PublicFooter />
      <WhatsAppFloat whatsappLink={propertyForLayout?.whatsapp} phone={propertyForLayout?.phone} />
      <NavigationLoading />
    </div>
  );
}
