import Link from "next/link";
import { Button } from "@/components/ui/button";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata.tools;

export default function ToolsPage() {
  return (
    <main className="min-h-[calc(100vh-160px)] flex flex-col justify-center py-4 sm:py-6 lg:py-8 px-3 sm:px-4 md:px-6 lg:px-8 pt-24 sm:pt-28 lg:pt-32">
      <div className="max-w-5xl mx-auto w-full">
        <div className="text-center mb-6 sm:mb-8 lg:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-3 sm:mb-4 lg:mb-6 tracking-tight">
            Tools
          </h1>
        </div>

        {/* Tools Grid */}
        <div
          id="tools-grid"
          className="grid gap-4 sm:gap-6 lg:gap-8 md:grid-cols-2 xl:grid-cols-3"
        >
          {/* Lat/Long Coordinate Converter */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-6 lg:p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105 transform">
            <div className="mb-3 sm:mb-4 lg:mb-6">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-white mb-2 lg:mb-3">
                Lat/Long Coordinate Converter
              </h2>
              <p className="text-sm sm:text-base lg:text-lg text-white/80 leading-relaxed">
                Convert between coordinate formats: DD, DDM, DMS, BNG, and MGRS.
                Essential for navigation, mapping, and position reporting.
              </p>
            </div>

            <div className="mb-3 sm:mb-4">
              <div className="flex flex-wrap gap-1.5">
                <span className="bg-white/20 text-white/90 px-2 py-0.5 rounded-full text-xs">
                  DD/DDM/DMS
                </span>
                <span className="bg-white/20 text-white/90 px-2 py-0.5 rounded-full text-xs">
                  BNG/MGRS
                </span>
                <span className="bg-white/20 text-white/90 px-2 py-0.5 rounded-full text-xs">
                  GPS Formats
                </span>
              </div>
            </div>

            <Link href="/tools/lat-long-converter">
              <Button className="w-full bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm">
                Open Converter
              </Button>
            </Link>
          </div>

          {/* Speed Distance Time Calculator */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-6 lg:p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105 transform">
            <div className="mb-3 sm:mb-4 lg:mb-6">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-white mb-2 lg:mb-3">
                Speed Distance Time Calculator
              </h2>
              <p className="text-sm sm:text-base lg:text-lg text-white/80 leading-relaxed">
                Calculate speed, distance, or time for maritime navigation.
                Essential for passage planning, ETA calculations, and fuel
                consumption estimates.
              </p>
            </div>

            <div className="mb-3 sm:mb-4">
              <div className="flex flex-wrap gap-1.5">
                <span className="bg-white/20 text-white/90 px-2 py-0.5 rounded-full text-xs">
                  Speed Calculations
                </span>
                <span className="bg-white/20 text-white/90 px-2 py-0.5 rounded-full text-xs">
                  Distance Planning
                </span>
                <span className="bg-white/20 text-white/90 px-2 py-0.5 rounded-full text-xs">
                  ETA Estimates
                </span>
              </div>
            </div>

            <Link href="/tools/speed-distance-calculator">
              <Button className="w-full bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm">
                Open Calculator
              </Button>
            </Link>
          </div>

          {/* Vertical Clearance Calculator */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-6 lg:p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105 transform">
            <div className="mb-3 sm:mb-4 lg:mb-6">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-white mb-2 lg:mb-3">
                Vertical Clearance Calculator
              </h2>
              <p className="text-sm sm:text-base lg:text-lg text-white/80 leading-relaxed">
                Calculate safe passage under bridges and overhead obstacles.
                Account for tide heights, vessel air draft, and safety margins.
              </p>
            </div>

            <div className="mb-3 sm:mb-4">
              <div className="flex flex-wrap gap-1.5">
                <span className="bg-white/20 text-white/90 px-2 py-0.5 rounded-full text-xs">
                  Bridge Clearance
                </span>
                <span className="bg-white/20 text-white/90 px-2 py-0.5 rounded-full text-xs">
                  Tide Calculations
                </span>
                <span className="bg-white/20 text-white/90 px-2 py-0.5 rounded-full text-xs">
                  Safety Margins
                </span>
              </div>
            </div>

            <Link href="/tools/vertical-clearance-calculator">
              <Button className="w-full bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm">
                Open Calculator
              </Button>
            </Link>
          </div>

          {/* Course to Steer Calculator */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-6 lg:p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105 transform">
            <div className="mb-3 sm:mb-4 lg:mb-6">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-white mb-2 lg:mb-3">
                Course to Steer Calculator
              </h2>
              <p className="text-sm sm:text-base lg:text-lg text-white/80 leading-relaxed">
                Calculate the compass course to steer accounting for current,
                wind, and compass variations. Essential for accurate navigation.
              </p>
            </div>

            <div className="mb-3 sm:mb-4">
              <div className="flex flex-wrap gap-1.5">
                <span className="bg-white/20 text-white/90 px-2 py-0.5 rounded-full text-xs">
                  Course Corrections
                </span>
                <span className="bg-white/20 text-white/90 px-2 py-0.5 rounded-full text-xs">
                  Current & Wind
                </span>
                <span className="bg-white/20 text-white/90 px-2 py-0.5 rounded-full text-xs">
                  Compass Deviation
                </span>
              </div>
            </div>

            <Link href="/tools/course-to-steer-calculator">
              <Button className="w-full bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm">
                Open Calculator
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
