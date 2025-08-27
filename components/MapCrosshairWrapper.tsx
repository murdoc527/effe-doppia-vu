"use client";

import dynamic from "next/dynamic";

// Dynamically import MapCrosshair to avoid SSR issues with MapLibre GL
const MapCrosshair = dynamic(
  () =>
    import("@/components/MapCrosshair").then((mod) => ({
      default: mod.MapCrosshair,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
        <div className="text-white">Loading interactive map...</div>
      </div>
    ),
  }
);

interface MapCrosshairWrapperProps {
  height?: number;
  initialCenter?: [number, number];
  initialZoom?: number;
}

export function MapCrosshairWrapper(props: MapCrosshairWrapperProps) {
  return <MapCrosshair {...props} />;
}
