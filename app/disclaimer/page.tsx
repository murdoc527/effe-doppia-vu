import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = pageMetadata.disclaimer;

export default function DisclaimerPage() {
  return (
    <main className="min-h-[calc(100vh-160px)] flex flex-col justify-center py-4 sm:py-6 lg:py-8 px-3 sm:px-4 md:px-6 lg:px-8 pt-20 sm:pt-24 lg:pt-28">
      <div className="max-w-3xl mx-auto w-full">
        <div className="text-center mb-4 sm:mb-6 lg:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-2 sm:mb-3 lg:mb-4 tracking-tight">
            Disclaimer
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-white/80 leading-relaxed max-w-3xl mx-auto">
            Important legal information for navigation tools
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
          {/* Content */}
          <div className="p-4 space-y-2 text-white/90">
            <div className="prose prose-invert max-w-none">
              <p className="text-xs sm:text-sm leading-relaxed">
                The navigation tools provided on this site — including the{" "}
                <strong className="text-white">route builder</strong> and any
                related mapping or coordinate utilities — are offered for
                informational and educational purposes only. They are not
                professional navigation, surveying, or seamanship advice and may
                not be accurate in all conditions.
              </p>

              <p className="text-xs sm:text-sm leading-relaxed mt-2">
                By using these tools, you agree that:
              </p>

              <ul className="space-y-1.5 mt-2 list-none">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5 flex-shrink-0"></div>
                  <p className="text-xs sm:text-sm leading-relaxed">
                    You are solely responsible for any decisions or actions you
                    take based on the tools' output.
                  </p>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5 flex-shrink-0"></div>
                  <p className="text-xs sm:text-sm leading-relaxed">
                    The developer is not liable for any loss, injury, damage, or
                    harm arising from use of the tools, whether direct or
                    indirect.
                  </p>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5 flex-shrink-0"></div>
                  <p className="text-xs sm:text-sm leading-relaxed">
                    These tools are not a substitute for certified charts,
                    official notices, professional training, or sound judgment
                    in the field. Always verify results independently and
                    exercise caution.
                  </p>
                </li>
              </ul>

              <div className="mt-4 p-3 bg-amber-500/20 border border-amber-500/30 rounded-xl">
                <p className="text-xs sm:text-sm font-medium text-amber-200 text-center">
                  Use of these tools constitutes acceptance of this disclaimer.
                  If you do not agree, do not use them.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
