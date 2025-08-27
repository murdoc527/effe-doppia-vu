"use client";

import dynamic from "next/dynamic";

const GoogleMapsCrosshair = dynamic(
  () =>
    import("@/components/GoogleMapsCrosshair").then((mod) => ({
      default: mod.GoogleMapsCrosshair,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
          <div>Loading Google Maps...</div>
        </div>
      </div>
    ),
  }
);

interface GoogleMapsCrosshairWrapperProps {
  height?: number;
  initialCenter?: [number, number];
  initialZoom?: number;
  apiKey: string;
}

export function GoogleMapsCrosshairWrapper(
  props: GoogleMapsCrosshairWrapperProps
) {
  return <GoogleMapsCrosshair {...props} />;
}
