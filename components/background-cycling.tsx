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

// Global state to persist across navigation
let globalCurrentIndex = 0;
let globalImagesLoaded = false;
let globalCyclingInterval: NodeJS.Timeout | null = null;

export function BackgroundCycling({ onImagesLoaded }: BackgroundCyclingProps) {
  const [currentIndex, setCurrentIndex] = useState(globalCurrentIndex);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [allImagesLoaded, setAllImagesLoaded] = useState(globalImagesLoaded);

  // Preload images only if not already loaded
  useEffect(() => {
    if (globalImagesLoaded) {
      setAllImagesLoaded(true);
      onImagesLoaded?.();
      return;
    }

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
        globalImagesLoaded = true;
        onImagesLoaded?.();
      } catch (error) {
        console.error("Failed to preload background images:", error);
        setAllImagesLoaded(true);
        globalImagesLoaded = true;
        onImagesLoaded?.();
      }
    };

    preloadImages();
  }, [onImagesLoaded]);

  // Start cycling only after images are loaded
  useEffect(() => {
    if (!allImagesLoaded) return;

    // Clear any existing interval
    if (globalCyclingInterval) {
      clearInterval(globalCyclingInterval);
    }

    // Start new interval
    globalCyclingInterval = setInterval(() => {
      globalCurrentIndex = (globalCurrentIndex + 1) % images.length;
      setCurrentIndex(globalCurrentIndex);
    }, 6000); // Change every 6 seconds

    return () => {
      if (globalCyclingInterval) {
        clearInterval(globalCyclingInterval);
        globalCyclingInterval = null;
      }
    };
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
