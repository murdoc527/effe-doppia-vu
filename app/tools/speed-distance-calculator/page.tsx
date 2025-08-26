import { SpeedDistanceCalculator } from "@/components/speed-distance-calculator";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata.speedDistanceCalculator;

export default function SpeedDistanceCalculatorPage() {
  return (
    <main className="min-h-[calc(100vh-120px)] flex flex-col justify-start py-4 sm:py-6 lg:py-8 px-3 sm:px-4 md:px-6 lg:px-8 pt-24 sm:pt-28 lg:pt-32">
      <div className="max-w-4xl mx-auto w-full">
        <SpeedDistanceCalculator />
      </div>
    </main>
  );
}
