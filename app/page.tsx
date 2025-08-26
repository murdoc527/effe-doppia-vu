import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Calculator, MapPin, Anchor, Route } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-[calc(100vh-160px)] flex flex-col pt-16 sm:pt-20 md:pt-24 lg:pt-32 pb-4 sm:pb-6 lg:pb-8 px-3 sm:px-4 md:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto w-full">
        {/* Hero Section */}
        <div className="text-center mb-6 sm:mb-8 md:mb-12 px-2">
          <div className="flex items-center justify-center gap-4 sm:gap-6 lg:gap-8 mb-4 sm:mb-6 lg:mb-8">
            <Image
              src="/images/edv-logo-final.png"
              alt="Effe Doppia Vu Logo"
              width={80}
              height={80}
              className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20"
            />
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white tracking-tight leading-tight">
              Effe Doppia Vu
            </h1>
          </div>
          <p className="text-lg sm:text-xl md:text-2xl text-white/80 max-w-2xl mx-auto mb-8">
            Professional navigation tools suite for mariners and navigators
          </p>
        </div>

        {/* Tools Section */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-6 md:p-8 lg:p-12 border border-white/20 max-w-3xl mx-auto">
          <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-semibold text-white mb-4 sm:mb-6 lg:mb-8 text-center">
            Navigation Tools Available
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-center gap-3 mb-2">
                <MapPin className="w-5 h-5 text-blue-400" />
                <h3 className="text-white font-medium">Lat/Long Converter</h3>
              </div>
              <p className="text-white/70 text-sm">
                DD, DDM, DMS, BNG, MGRS formats
              </p>
            </div>

            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-center gap-3 mb-2">
                <Calculator className="w-5 h-5 text-green-400" />
                <h3 className="text-white font-medium">Speed Distance Time</h3>
              </div>
              <p className="text-white/70 text-sm">
                Calculate passage planning
              </p>
            </div>

            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-center gap-3 mb-2">
                <Anchor className="w-5 h-5 text-orange-400" />
                <h3 className="text-white font-medium">Vertical Clearance</h3>
              </div>
              <p className="text-white/70 text-sm">
                Bridge clearance calculations
              </p>
            </div>

            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-center gap-3 mb-2">
                <Route className="w-5 h-5 text-purple-400" />
                <h3 className="text-white font-medium">Course to Steer</h3>
              </div>
              <p className="text-white/70 text-sm">
                Tidal and leeway calculations
              </p>
            </div>
          </div>

          <div className="text-center">
            <Link href="/tools">
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-medium"
              >
                Access Navigation Tools
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
