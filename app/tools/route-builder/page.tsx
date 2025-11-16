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
      <main className="min-h-screen flex flex-col justify-center items-center px-4">
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3">
            Route Builder
          </h1>
          <p className="text-red-400">
            Google Maps API key is not configured. Please set
            NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment variables.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative h-screen w-full overflow-hidden">
      {/* Floating Navigation - Top Left */}
      <div className="absolute top-3 left-3 z-50 flex gap-2">
        <Link href="/tools">
          <Button
            variant="ghost"
            size="sm"
            className="bg-black/60 backdrop-blur-sm text-white/90 hover:text-white hover:bg-white/20 shadow-lg"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Back to Tools</span>
            <span className="sm:hidden">Back</span>
          </Button>
        </Link>
        <Link href="/tools/map-crosshair">
          <Button
            variant="ghost"
            size="sm"
            className="bg-black/60 backdrop-blur-sm text-white/90 hover:text-white hover:bg-white/20 shadow-lg"
          >
            <Map className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Interactive Map</span>
            <span className="sm:hidden">Map</span>
          </Button>
        </Link>
      </div>

      {/* Full-screen Route Builder */}
      <RouteBuilder
        apiKey={apiKey}
        height="100vh"
        initialCenter={[-0.1278, 51.5074]} // London
        initialZoom={10}
      />
    </main>
  );
}
