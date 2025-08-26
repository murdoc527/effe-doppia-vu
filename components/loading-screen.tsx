"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface LoadingScreenProps {
  onComplete: () => void;
}

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [logoLoaded, setLogoLoaded] = useState(false);

  useEffect(() => {
    if (logoLoaded) {
      // Give a minimum loading time to feel polished
      const timer = setTimeout(() => {
        setIsVisible(false);
        // Wait for fade out animation to complete
        setTimeout(onComplete, 300);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [logoLoaded, onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Animated background pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]" />
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white/10 rounded-full animate-pulse" />
          <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-white/20 rounded-full animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-3/4 w-1.5 h-1.5 bg-white/15 rounded-full animate-pulse delay-500" />
        </div>
      </div>

      {/* Loading content */}
      <div className="relative z-10 text-center">
        {/* Logo */}
        <div className="mb-8 relative">
          <Image
            src="/images/edv-logo-final.png"
            alt="Effe Doppia Vu"
            width={120}
            height={120}
            className="mx-auto animate-pulse"
            onLoad={() => setLogoLoaded(true)}
            priority
          />
        </div>

        {/* App name */}
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-wide">
          Effe Doppia Vu
        </h1>

        {/* Tagline */}
        <p className="text-lg text-white/80 mb-8 font-light">
          Loading your experience...
        </p>

        {/* Loading indicator */}
        <div className="flex items-center justify-center space-x-2">
          <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" />
          <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce delay-150" />
          <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce delay-300" />
        </div>
      </div>
    </div>
  );
}
