# Vercel Blob Setup Guide

## Overview
This application now uses Vercel Blob for image storage instead of storing base64 images in the database.

## Setup Instructions

### 1. Install Vercel Blob (Already Done)
```bash
npm install @vercel/blob
```

### 2. Configure Vercel Blob Token
You need to add your Vercel Blob token to your environment variables:

1. Go to your Vercel dashboard
2. Navigate to your project settings
3. Go to "Storage" → "Blob"
4. Create a new Blob store or use an existing one
5. Copy the `BLOB_READ_WRITE_TOKEN` from the store settings
6. Add it to your `.env` file:

```env
BLOB_READ_WRITE_TOKEN=vercel_blob_xxxxx...
```

### 3. For Local Development
If you're running locally, you can use Vercel CLI to get the token:
```bash
vercel link
vercel env pull
```

Or manually add the token to your `.env.local` file.

### 4. Clean Up Existing Base64 Images
Run the cleanup script to remove all base64 images from the database:

```bash
npx tsx scripts/cleanup-base64-images.ts
```

**⚠️ Warning:** This will permanently delete all base64 images from:
- Properties
- Rooms
- Beds
- Maintenance Requests
- Tenant Documents

Make sure to backup your database before running this script if you want to keep any of these images.

## How It Works

### Image Upload Flow
1. User selects an image file
2. File is uploaded to `/api/upload` endpoint
3. Endpoint uploads to Vercel Blob storage
4. Vercel Blob returns a public URL
5. URL is stored in the database (not the image data)

### API Endpoint
- **Route:** `/api/upload`
- **Method:** POST
- **Auth:** Requires admin authentication
- **Body:** FormData with `file` field
- **Response:** `{ url: "https://..." }`

### Image Storage Locations
- **Properties:** `property.images` (array of URLs)
- **Rooms:** `room.images` (array of URLs)
- **Beds:** `bed.images` (array of URLs)
- **Maintenance Requests:** `maintenanceRequest.images` (array of URLs)
- **Tenant Documents:** `tenantDocument.fileUrl` (single URL)

## Image Optimization

### Automatic Compression & Optimization
**Yes!** Images are automatically optimized when using Next.js `Image` component:

1. **Next.js Image Component** automatically:
   - Compresses images (reduces file size by 30-50%)
   - Converts to modern formats (WebP, AVIF when supported)
   - Resizes images based on device/viewport size
   - Lazy loads images (loads as user scrolls)
   - Caches optimized images on Vercel CDN

2. **Vercel Blob** stores original images, but:
   - Next.js Image serves optimized versions
   - Optimization happens on-demand
   - Results are cached for fast delivery

### Using Next.js Image Component
The app uses Next.js `Image` component in most places, which means:
- ✅ Images are automatically optimized
- ✅ No manual compression needed
- ✅ Faster page loads
- ✅ Better user experience

**Note:** If you see any `<img>` tags in the code, they should be replaced with Next.js `Image` component for optimization.

## Benefits
- ✅ Faster page loads (images loaded from CDN + optimized)
- ✅ Reduced database size (no base64 storage)
- ✅ Better scalability
- ✅ Automatic image optimization via Next.js Image component
- ✅ Lower database costs
- ✅ Automatic format conversion (WebP, AVIF)
- ✅ Responsive image sizing

## Troubleshooting

### Images Not Uploading
1. Check that `BLOB_READ_WRITE_TOKEN` is set in your environment
2. Verify you're logged in as an admin
3. Check browser console for error messages
4. Verify Vercel Blob store is active in your Vercel dashboard

### Images Not Displaying
1. Check that the URL is a valid Vercel Blob URL
2. Verify `next.config.js` includes the Vercel Blob domain pattern
3. Check browser network tab to see if images are loading

