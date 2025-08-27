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
    <main className="min-h-[calc(100vh-160px)] flex flex-col justify-center py-4 sm:py-6 lg:py-8 px-3 sm:px-4 md:px-6 lg:px-8 pt-24 sm:pt-28 lg:pt-32">
      <div className="max-w-6xl mx-auto w-full space-y-4">
        {/* Navigation Header */}
        <div className="flex justify-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="border-white/30 text-white hover:bg-white/20 hover:text-white"
            asChild
          >
            <Link href="/tools/lat-long-converter" className="flex items-center gap-2">
              <Navigation className="w-4 h-4" />
              Standard Converter
            </Link>
          </Button>
          <Button 
            variant="secondary" 
            size="sm" 
            className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
            asChild
          >
            <span className="flex items-center gap-2">
              <Map className="w-4 h-4" />
              Interactive Map
            </span>
          </Button>
        </div>
        
        <GoogleMapsCrosshairWrapper
          height={500}
          initialCenter={[-61.71188822758061, 12.003224735964608]} // London
          initialZoom={12}
          apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}
        />
      </div>
    </main>
  );
}
