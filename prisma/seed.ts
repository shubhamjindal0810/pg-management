import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { phone: '9999999999' },
    update: {},
    create: {
      name: 'Admin User',
      phone: '9999999999',
      email: 'admin@pgmanager.com',
      passwordHash: adminPassword,
      role: 'ADMIN',
      phoneVerified: new Date(),
    },
  });
  console.log('✅ Admin user created:', admin.phone);

  // Create a sample property
  const property = await prisma.property.upsert({
    where: { id: 'sample-property' },
    update: {},
    create: {
      id: 'sample-property',
      name: 'Sunshine PG',
      address: '123, Jubilee Hills',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500033',
      description: 'A comfortable PG accommodation with all modern amenities',
      amenities: ['WiFi', 'AC', 'Power Backup', 'Water Purifier', 'CCTV', 'Security'],
      rules: [
        'No smoking inside the premises',
        'Visitors allowed till 8 PM only',
        'Rent due by 5th of every month',
      ],
    },
  });
  console.log('✅ Property created:', property.name);

  // Create rooms
  const rooms = await Promise.all([
    prisma.room.upsert({
      where: { propertyId_roomNumber: { propertyId: property.id, roomNumber: '101' } },
      update: {},
      create: {
        propertyId: property.id,
        roomNumber: '101',
        floor: 1,
        roomType: 'double',
        hasAc: true,
        hasAttachedBath: true,
        monthlyRent: 12000,
        securityDeposit: 24000,
      },
    }),
    prisma.room.upsert({
      where: { propertyId_roomNumber: { propertyId: property.id, roomNumber: '102' } },
      update: {},
      create: {
        propertyId: property.id,
        roomNumber: '102',
        floor: 1,
        roomType: 'triple',
        hasAc: true,
        hasAttachedBath: false,
        monthlyRent: 8000,
        securityDeposit: 16000,
      },
    }),
    prisma.room.upsert({
      where: { propertyId_roomNumber: { propertyId: property.id, roomNumber: '201' } },
      update: {},
      create: {
        propertyId: property.id,
        roomNumber: '201',
        floor: 2,
        roomType: 'double',
        hasAc: false,
        hasAttachedBath: true,
        monthlyRent: 9000,
        securityDeposit: 18000,
      },
    }),
  ]);
  console.log('✅ Rooms created:', rooms.length);

  // Create beds
  const beds = await Promise.all([
    // Room 101 - 2 beds
    prisma.bed.upsert({
      where: { roomId_bedNumber: { roomId: rooms[0].id, bedNumber: 'A' } },
      update: {},
      create: {
        roomId: rooms[0].id,
        bedNumber: 'A',
        status: 'AVAILABLE',
      },
    }),
    prisma.bed.upsert({
      where: { roomId_bedNumber: { roomId: rooms[0].id, bedNumber: 'B' } },
      update: {},
      create: {
        roomId: rooms[0].id,
        bedNumber: 'B',
        status: 'AVAILABLE',
      },
    }),
    // Room 102 - 3 beds
    prisma.bed.upsert({
      where: { roomId_bedNumber: { roomId: rooms[1].id, bedNumber: 'A' } },
      update: {},
      create: {
        roomId: rooms[1].id,
        bedNumber: 'A',
        status: 'AVAILABLE',
      },
    }),
    prisma.bed.upsert({
      where: { roomId_bedNumber: { roomId: rooms[1].id, bedNumber: 'B' } },
      update: {},
      create: {
        roomId: rooms[1].id,
        bedNumber: 'B',
        status: 'AVAILABLE',
      },
    }),
    prisma.bed.upsert({
      where: { roomId_bedNumber: { roomId: rooms[1].id, bedNumber: 'C' } },
      update: {},
      create: {
        roomId: rooms[1].id,
        bedNumber: 'C',
        status: 'AVAILABLE',
      },
    }),
    // Room 201 - 2 beds
    prisma.bed.upsert({
      where: { roomId_bedNumber: { roomId: rooms[2].id, bedNumber: 'A' } },
      update: {},
      create: {
        roomId: rooms[2].id,
        bedNumber: 'A',
        status: 'AVAILABLE',
      },
    }),
    prisma.bed.upsert({
      where: { roomId_bedNumber: { roomId: rooms[2].id, bedNumber: 'B' } },
      update: {},
      create: {
        roomId: rooms[2].id,
        bedNumber: 'B',
        status: 'AVAILABLE',
      },
    }),
  ]);
  console.log('✅ Beds created:', beds.length);

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📝 Login credentials:');
  console.log('   Phone: 9999999999');
  console.log('   Password: admin123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
