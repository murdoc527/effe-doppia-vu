"use client";

import { useState, useEffect } from "react";
import { LoadingScreen } from "@/components/loading-screen";
import { BackgroundCycling } from "@/components/background-cycling";

interface AppWrapperProps {
  children: React.ReactNode;
}

export function AppWrapper({ children }: AppWrapperProps) {
  const [hasLoaded, setHasLoaded] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);

  useEffect(() => {
    // Check if this is the first time loading the site
    const hasVisited = sessionStorage.getItem('hasVisited');
    
    if (!hasVisited) {
      // First visit - show loading screen
      setShowLoadingScreen(true);
      sessionStorage.setItem('hasVisited', 'true');
    } else {
      // Already visited - no loading screen
      setHasLoaded(true);
    }
  }, []);

  const handleLoadingComplete = () => {
    setShowLoadingScreen(false);
    setHasLoaded(true);
  };

  const handleImagesLoaded = () => {
    // Images are loaded
  };

  return (
    <>
      {showLoadingScreen && <LoadingScreen onComplete={handleLoadingComplete} />}

      <BackgroundCycling onImagesLoaded={handleImagesLoaded} />

      {/* Content - always visible after first load */}
      <div className={hasLoaded ? "opacity-100" : "opacity-0"}>
        {children}
      </div>
    </>
  );
}
