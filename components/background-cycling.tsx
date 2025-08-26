"use client";

import { useEffect, useState } from "react";

const images = [
  "/images/middle-island.jpg",
  "/images/aerial.jpg",
  "/images/aerial1.jpg",
];

interface BackgroundCyclingProps {
  onImagesLoaded?: () => void;
}

export function BackgroundCycling({ onImagesLoaded }: BackgroundCyclingProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [allImagesLoaded, setAllImagesLoaded] = useState(false);

  // Preload images
  useEffect(() => {
    const preloadImages = async () => {
      const imagePromises = images.map((src) => {
        return new Promise<string>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(src);
          img.onerror = reject;
          img.src = src;
        });
      });

      try {
        const loadedSrcs = await Promise.all(imagePromises);
        setLoadedImages(new Set(loadedSrcs));
        setAllImagesLoaded(true);
        onImagesLoaded?.();
      } catch (error) {
        console.error("Failed to preload background images:", error);
        // Still show images even if preloading fails
        setAllImagesLoaded(true);
        onImagesLoaded?.();
      }
    };

    preloadImages();
  }, [onImagesLoaded]);

  // Start cycling only after images are loaded
  useEffect(() => {
    if (!allImagesLoaded) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 6000); // Change every 6 seconds

    return () => clearInterval(interval);
  }, [allImagesLoaded]);

  return (
    <div className="fixed inset-0 -z-10">
      {images.map((image, index) => (
        <div
          key={image}
          className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-2000 ${
            index === currentIndex && allImagesLoaded
              ? "opacity-100"
              : "opacity-0"
          }`}
          style={{ backgroundImage: `url(${image})` }}
        />
      ))}
      {/* Frosted glass overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Fallback solid background while loading */}
      {!allImagesLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
      )}
    </div>
  );
}
