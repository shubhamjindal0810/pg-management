import { PublicHeader } from '@/components/public/header';
import { PublicFooter } from '@/components/public/footer';
import { WhatsAppFloat } from '@/components/public/whatsapp-float';
import { NavigationLoading } from '@/components/navigation-loading';
import { db } from '@/lib/db';

async function getProperty() {
  return db.property.findFirst({
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
}

export default async function RoomsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const property = await getProperty();

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <PublicFooter />
      <WhatsAppFloat whatsappLink={property?.whatsapp} phone={property?.phone} />
      <NavigationLoading />
    </div>
  );
}

