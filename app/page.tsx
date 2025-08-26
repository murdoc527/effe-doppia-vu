import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Calculator, MapPin, Anchor, Route } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-[calc(100vh-160px)] flex items-center justify-center px-4 sm:px-6 md:px-8">
      <div className="w-full max-w-lg mx-auto">
        {/* Pulsating Logo Section */}
        <div className="text-center">
          <Link href="/tools">
            <div className="inline-block animate-pulse hover:animate-none transition-all duration-300 hover:scale-110 cursor-pointer">
              <Image
                src="/images/edv-logo-final.png"
                alt="Access Navigation Tools"
                width={240}
                height={240}
                className="w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 lg:w-60 lg:h-60"
                priority
              />
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}
