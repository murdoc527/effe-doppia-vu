import { GoogleMapsCrosshairWrapper } from "@/components/GoogleMapsCrosshairWrapper";
import { pageMetadata, baseViewport } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Navigation, Map } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Interactive Map with Crosshair",
  description:
    "Interactive map with fixed crosshair showing real-time coordinates in multiple formats including DD, DDM, DMS, BNG, and MGRS.",
  keywords: [
    "interactive map",
    "crosshair map",
    "coordinate picker",
    "map coordinates",
    "real-time coordinates",
    "maplibre",
  ],
  url: "/tools/map-crosshair",
};

export const viewport = baseViewport;

export default function MapCrosshairPage() {
  return (
    <main className="relative h-screen w-full overflow-hidden">
      {/* Floating Navigation Header */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="border-white/30 bg-black/60 backdrop-blur-sm text-white hover:bg-white/20 hover:text-white shadow-lg"
          asChild
        >
          <Link
            href="/tools/lat-long-converter"
            className="flex items-center gap-2"
          >
            <Navigation className="w-4 h-4" />
            Standard Converter
          </Link>
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="bg-blue-600/90 backdrop-blur-sm hover:bg-blue-700 text-white border-blue-600 shadow-lg"
          asChild
        >
          <span className="flex items-center gap-2">
            <Map className="w-4 h-4" />
            Interactive Map
          </span>
        </Button>
      </div>

      {/* Full-screen Map */}
      <GoogleMapsCrosshairWrapper
        height="100vh"
        initialCenter={[-0.1278, 51.5074]} // London
        initialZoom={12}
        apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}
      />
    </main>
  );
}
