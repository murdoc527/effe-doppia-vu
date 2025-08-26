import { CountdownTimer } from "@/components/countdown-timer";
import Image from "next/image";

export default function HomePage() {
  return (
    <main className="min-h-[calc(100vh-160px)] flex flex-col justify-center py-4 sm:py-6 lg:py-8 px-3 sm:px-4 md:px-6 lg:px-8">
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
        </div>

        {/* Countdown Section */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-6 md:p-8 lg:p-12 border border-white/20 max-w-3xl mx-auto">
          <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-semibold text-white mb-4 sm:mb-6 lg:mb-8 text-center">
            Launching Soon
          </h2>
          <CountdownTimer />
        </div>
      </div>
    </main>
  );
}
