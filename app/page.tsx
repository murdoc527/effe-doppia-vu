import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="w-full max-w-lg mx-auto px-4">
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
    </div>
  );
}
