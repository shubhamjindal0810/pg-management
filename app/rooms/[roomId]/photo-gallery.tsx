'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PhotoGalleryProps {
  images: string[];
  roomNumber: string;
}

export function PhotoGallery({ images, roomNumber }: PhotoGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (images.length === 0) {
    return (
      <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-muted flex items-center justify-center">
        <span className="text-muted-foreground">No photos available</span>
      </div>
    );
  }

  const openLightbox = (index: number) => {
    setSelectedIndex(index);
  };

  const closeLightbox = () => {
    setSelectedIndex(null);
  };

  const nextImage = () => {
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex + 1) % images.length);
    }
  };

  const prevImage = () => {
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex - 1 + images.length) % images.length);
    }
  };

  return (
    <>
      <div className="grid gap-2 rounded-xl overflow-hidden">
        {images.length === 1 ? (
          <div className="relative aspect-[16/9] overflow-hidden bg-muted cursor-pointer group">
            <Image
              src={images[0]}
              alt={`Room ${roomNumber} - Photo 1`}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              priority
              sizes="100vw"
              onClick={() => openLightbox(0)}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {/* Main large image */}
            <div className="relative col-span-2 aspect-[16/9] overflow-hidden bg-muted cursor-pointer group">
              <Image
                src={images[0]}
                alt={`Room ${roomNumber} - Photo 1`}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                priority
                sizes="100vw"
                onClick={() => openLightbox(0)}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              {images.length > 1 && (
                <button
                  onClick={() => openLightbox(0)}
                  className="absolute bottom-4 right-4 bg-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg hover:bg-gray-50 transition-colors"
                >
                  Show all photos
                </button>
              )}
            </div>

            {/* Thumbnail grid */}
            {images.slice(1, 5).map((image, index) => (
              <div
                key={index + 1}
                className="relative aspect-square overflow-hidden bg-muted cursor-pointer group"
              >
                <Image
                  src={image}
                  alt={`Room ${roomNumber} - Photo ${index + 2}`}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 25vw"
                  onClick={() => openLightbox(index + 1)}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                {index === 3 && images.length > 5 && (
                  <div
                    onClick={() => openLightbox(4)}
                    className="absolute inset-0 flex items-center justify-center bg-black/50 text-white font-semibold cursor-pointer hover:bg-black/60 transition-colors"
                  >
                    +{images.length - 5} more
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {selectedIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          <div className="relative max-w-7xl w-full h-full flex items-center justify-center">
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
              onClick={(e) => {
                e.stopPropagation();
                prevImage();
              }}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>

            <div className="relative w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
              <Image
                src={images[selectedIndex]}
                alt={`Room ${roomNumber} - Photo ${selectedIndex + 1}`}
                fill
                className="object-contain"
                sizes="100vw"
              />
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
              onClick={(e) => {
                e.stopPropagation();
                nextImage();
              }}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-white hover:bg-white/20"
              onClick={closeLightbox}
            >
              <X className="h-6 w-6" />
            </Button>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
              {selectedIndex + 1} / {images.length}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

