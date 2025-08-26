import { pageMetadata } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export const metadata = pageMetadata.projects;

export default function ProjectsPage() {
  return (
    <main className="min-h-[calc(100vh-160px)] flex flex-col justify-center py-4 sm:py-6 lg:py-8 px-3 sm:px-4 md:px-6 lg:px-8 pt-24 sm:pt-28 lg:pt-32">
      <div className="max-w-5xl mx-auto w-full">
        <div className="text-center mb-6 sm:mb-8 lg:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-3 sm:mb-4 lg:mb-6 tracking-tight">
            Projects
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-white/80 leading-relaxed max-w-3xl mx-auto">
            Explore some of our most recent projects.
          </p>
        </div>

        {/* Projects Grid */}
        <div className="flex flex-wrap gap-3 sm:gap-4 lg:gap-6 justify-center">
          {/* Villa Marang Website */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 sm:p-4 lg:p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105 transform w-full max-w-sm">
            {/* Logo */}
            <div className="flex justify-center mb-3 sm:mb-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 bg-white/20 rounded-full backdrop-blur-sm overflow-hidden">
                <Image
                  src="/images/villa-marang-logo.png"
                  alt="Villa Marang Logo"
                  width={112}
                  height={112}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            <div className="mb-2 sm:mb-3 lg:mb-4">
              <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-white mb-1 lg:mb-2 text-center">
                Villa Marang Website
              </h2>
              <p className="text-xs sm:text-sm lg:text-base text-white/80 leading-relaxed text-center">
                A modern, responsive website for Villa Marang showcasing
                accommodations and amenities.
              </p>
            </div>

            <div className="mb-2 sm:mb-3">
              <div className="flex flex-wrap gap-1.5">
                <span className="bg-white/20 text-white/90 px-2 py-0.5 rounded-full text-xs">
                  Web Design
                </span>
                <span className="bg-white/20 text-white/90 px-2 py-0.5 rounded-full text-xs">
                  Responsive
                </span>
                <span className="bg-white/20 text-white/90 px-2 py-0.5 rounded-full text-xs">
                  Modern UI
                </span>
              </div>
            </div>

            <Button
              className="w-full bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm"
              disabled
            >
              Coming Soon
            </Button>
          </div>

          {/* Placeholder for future projects */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 sm:p-6 lg:p-8 border border-white/20 flex items-center justify-center w-full max-w-sm">
            <p className="text-sm sm:text-base text-white/60 italic">
              More projects coming soon...
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
