"use client";

import { useState, useEffect } from "react";
import { LoadingScreen } from "@/components/loading-screen";
import { BackgroundCycling } from "@/components/background-cycling";

interface AppWrapperProps {
  children: React.ReactNode;
}

export function AppWrapper({ children }: AppWrapperProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);

  const handleLoadingComplete = () => {
    setIsLoading(false);
    setShowContent(true);
  };

  const handleImagesLoaded = () => {
    // Images are loaded, but we'll let the loading screen handle timing
    // This ensures the loading screen has enough time to feel polished
  };

  return (
    <>
      {isLoading && <LoadingScreen onComplete={handleLoadingComplete} />}

      <BackgroundCycling onImagesLoaded={handleImagesLoaded} />

      {/* Content with fade-in effect */}
      <div
        className={`transition-opacity duration-500 ${
          showContent ? "opacity-100" : "opacity-0"
        }`}
      >
        {children}
      </div>
    </>
  );
}
