"use client";

import { BackgroundCycling } from "@/components/background-cycling";

interface AppWrapperProps {
  children: React.ReactNode;
}

export function AppWrapper({ children }: AppWrapperProps) {
  return (
    <>
      <BackgroundCycling />
      {children}
    </>
  );
}
