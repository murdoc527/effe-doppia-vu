import { pageMetadata } from "@/lib/seo";
import { LatLongConverter } from "@/components/lat-long-converter";

export const metadata = pageMetadata.latLongConverter;

export default function LatLongConverterPage() {
  return (
    <main className="min-h-[calc(100vh-160px)] flex flex-col justify-center py-4 sm:py-6 lg:py-8 px-3 sm:px-4 md:px-6 lg:px-8 pt-20 sm:pt-24 lg:pt-28">
      <div className="max-w-5xl mx-auto w-full">
        <div className="text-center mb-4 sm:mb-6 lg:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-2 sm:mb-3 lg:mb-4 tracking-tight">
            Lat/Long Converter
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-white/80 leading-relaxed max-w-3xl mx-auto">
            Convert between different coordinate formats: DD, DDM, DMS, BNG, and
            MGRS. Essential for navigation, mapping, and position reporting.
          </p>
        </div>

        <LatLongConverter />
      </div>
    </main>
  );
}
