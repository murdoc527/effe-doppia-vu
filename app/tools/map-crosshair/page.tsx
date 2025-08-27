import { GoogleMapsCrosshairWrapper } from "@/components/GoogleMapsCrosshairWrapper";
import { pageMetadata } from "@/lib/seo";

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

export default function MapCrosshairPage() {
  return (
    <main className="min-h-[calc(100vh-160px)] flex flex-col justify-center py-4 sm:py-6 lg:py-8 px-3 sm:px-4 md:px-6 lg:px-8 pt-24 sm:pt-28 lg:pt-32">
      <div className="max-w-6xl mx-auto w-full">
        <div className="text-center mb-6 sm:mb-8 lg:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-3 sm:mb-4 lg:mb-6 tracking-tight">
            Interactive Map with Crosshair
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-white/80 leading-relaxed max-w-3xl mx-auto">
            Move the map to see real-time coordinates at the crosshair center.
            Toggle coordinate formats and copy results instantly.
          </p>
        </div>

        <GoogleMapsCrosshairWrapper
          height={500}
          initialCenter={[-0.1278, 51.5074]} // London
          initialZoom={12}
          apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}
        />
      </div>
    </main>
  );
}
