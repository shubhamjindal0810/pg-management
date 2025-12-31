/**
 * Script to clean up base64 images from the database
 * Run with: npx tsx scripts/cleanup-base64-images.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function isBase64Image(str: string): boolean {
  // Base64 images start with data:image/
  return str.startsWith('data:image/');
}

function cleanBase64FromArray(images: any[]): string[] {
  if (!Array.isArray(images)) return [];
  
  // Filter out base64 images, keep only URLs
  return images.filter((img) => {
    if (typeof img === 'string') {
      return !isBase64Image(img);
    }
    return false;
  });
}

async function cleanupBase64Images() {
  console.log('Starting cleanup of base64 images...\n');

  let cleanedCount = 0;

  try {
    // Clean up Property images
    const properties = await prisma.property.findMany({
      select: { id: true, name: true, images: true },
    });

    for (const property of properties) {
      const images = property.images as any;
      if (Array.isArray(images) && images.some((img: any) => typeof img === 'string' && isBase64Image(img))) {
        const cleanedImages = cleanBase64FromArray(images);
        
        await prisma.property.update({
          where: { id: property.id },
          data: { images: cleanedImages.length > 0 ? cleanedImages : undefined },
        });

        const removedCount = images.length - cleanedImages.length;
        if (removedCount > 0) {
          console.log(`✓ Property "${property.name}": Removed ${removedCount} base64 image(s)`);
          cleanedCount += removedCount;
        }
      }
    }

    // Clean up Room images
    const rooms = await prisma.room.findMany({
      select: { id: true, roomNumber: true, images: true },
    });

    for (const room of rooms) {
      const images = room.images as any;
      if (Array.isArray(images) && images.some((img: any) => typeof img === 'string' && isBase64Image(img))) {
        const cleanedImages = cleanBase64FromArray(images);
        
        await prisma.room.update({
          where: { id: room.id },
          data: { images: cleanedImages.length > 0 ? cleanedImages : undefined },
        });

        const removedCount = images.length - cleanedImages.length;
        if (removedCount > 0) {
          console.log(`✓ Room ${room.roomNumber}: Removed ${removedCount} base64 image(s)`);
          cleanedCount += removedCount;
        }
      }
    }

    // Clean up Bed images
    const beds = await prisma.bed.findMany({
      select: { id: true, bedNumber: true, images: true },
    });

    for (const bed of beds) {
      const images = bed.images as any;
      if (Array.isArray(images) && images.some((img: any) => typeof img === 'string' && isBase64Image(img))) {
        const cleanedImages = cleanBase64FromArray(images);
        
        await prisma.bed.update({
          where: { id: bed.id },
          data: { images: cleanedImages.length > 0 ? cleanedImages : undefined },
        });

        const removedCount = images.length - cleanedImages.length;
        if (removedCount > 0) {
          console.log(`✓ Bed ${bed.bedNumber}: Removed ${removedCount} base64 image(s)`);
          cleanedCount += removedCount;
        }
      }
    }

    // Clean up Maintenance Request images
    const maintenanceRequests = await prisma.maintenanceRequest.findMany({
      select: { id: true, images: true },
    });

    for (const request of maintenanceRequests) {
      const images = request.images as any;
      if (Array.isArray(images) && images.some((img: any) => typeof img === 'string' && isBase64Image(img))) {
        const cleanedImages = cleanBase64FromArray(images);
        
        await prisma.maintenanceRequest.update({
          where: { id: request.id },
          data: { images: cleanedImages.length > 0 ? cleanedImages : undefined },
        });

        const removedCount = images.length - cleanedImages.length;
        if (removedCount > 0) {
          console.log(`✓ Maintenance Request ${request.id}: Removed ${removedCount} base64 image(s)`);
          cleanedCount += removedCount;
        }
      }
    }

    // Clean up Tenant Document fileUrl (if it's base64)
    const documents = await prisma.tenantDocument.findMany({
      select: { id: true, fileUrl: true },
    });

    for (const doc of documents) {
      if (doc.fileUrl && isBase64Image(doc.fileUrl)) {
        await prisma.tenantDocument.update({
          where: { id: doc.id },
          data: { fileUrl: undefined },
        });

        console.log(`✓ Tenant Document ${doc.id}: Removed base64 file`);
        cleanedCount++;
      }
    }

    console.log(`\n✅ Cleanup complete! Removed ${cleanedCount} base64 image(s) from database.`);
  } catch (error) {
    console.error('Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupBase64Images()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Cleanup failed:', error);
    process.exit(1);
  });

