import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Map } from "lucide-react";
import { pageMetadata } from "@/lib/seo";
import RouteBuilder from "@/components/route-builder";

export const metadata: Metadata = pageMetadata.routeBuilder;

export default function RouteBuilderPage() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <main className="min-h-[calc(100vh-160px)] flex flex-col justify-center py-4 sm:py-6 lg:py-8 px-3 sm:px-4 md:px-6 lg:px-8 pt-20 sm:pt-24 lg:pt-28">
        <div className="max-w-5xl mx-auto w-full">
          <div className="text-center mb-4 sm:mb-6">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3">
              Route Builder
            </h1>
            <p className="text-red-400">
              Google Maps API key is not configured. Please set
              NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment variables.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-160px)] flex flex-col py-4 sm:py-6 lg:py-8 px-3 sm:px-4 md:px-6 lg:px-8 pt-20 sm:pt-24 lg:pt-28">
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center gap-4 mb-3">
            <Link href="/tools">
              <Button
                variant="ghost"
                size="sm"
                className="text-white/70 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Tools
              </Button>
            </Link>
            <Link href="/tools/map-crosshair">
              <Button
                variant="ghost"
                size="sm"
                className="text-white/70 hover:text-white"
              >
                <Map className="w-4 h-4 mr-2" />
                Interactive Map
              </Button>
            </Link>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 sm:mb-3">
            Route Builder
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-white/80 leading-relaxed max-w-3xl">
            Plan and create routes by adding waypoints on the map. Export to GPX
            format, calculate distances and bearings, and manage multiple routes
            with elevation data.
          </p>
        </div>

        {/* Route Builder Component */}
        <div className="flex-1 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-4 sm:p-6">
          <RouteBuilder
            apiKey={apiKey}
            height={600}
            initialCenter={[-0.1278, 51.5074]} // London
            initialZoom={10}
          />
        </div>

        {/* Usage Instructions */}
        <div className="mt-6 sm:mt-8 grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-3">
              Add Waypoints
            </h3>
            <p className="text-white/70 text-sm sm:text-base">
              Click anywhere on the map to add waypoints to your route. The
              first point becomes your start, and subsequent points extend the
              route.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-3">
              Edit & Manage
            </h3>
            <p className="text-white/70 text-sm sm:text-base">
              Drag markers to reposition waypoints, edit names by clicking the
              edit button, or delete waypoints individually without starting
              over.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-3">
              Export & Save
            </h3>
            <p className="text-white/70 text-sm sm:text-base">
              Save routes locally for later use, or export to GPX format for use
              with GPS devices, navigation apps, and mapping software.
            </p>
          </div>
        </div>

        {/* Coordinate Format Support */}
        <div className="mt-6 sm:mt-8 bg-white/5 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-3">
            Coordinate Format Support
          </h3>
          <p className="text-white/70 text-sm sm:text-base mb-4">
            View coordinates in multiple formats and search for locations using
            any coordinate system:
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="bg-white/20 text-white/90 px-3 py-1 rounded-full text-xs sm:text-sm">
              DD (Decimal Degrees)
            </span>
            <span className="bg-white/20 text-white/90 px-3 py-1 rounded-full text-xs sm:text-sm">
              DDM (Degrees Decimal Minutes)
            </span>
            <span className="bg-white/20 text-white/90 px-3 py-1 rounded-full text-xs sm:text-sm">
              DMS (Degrees Minutes Seconds)
            </span>
            <span className="bg-white/20 text-white/90 px-3 py-1 rounded-full text-xs sm:text-sm">
              BNG (British National Grid)
            </span>
            <span className="bg-white/20 text-white/90 px-3 py-1 rounded-full text-xs sm:text-sm">
              MGRS (Military Grid Reference)
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
