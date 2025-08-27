"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";

export function Navigation() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show nav only when at the very top of the page
      setIsVisible(currentScrollY <= 0);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 p-3 sm:p-6 lg:p-8 transition-opacity duration-300 ease-in-out ${
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="max-w-7xl mx-auto">
        <div className="bg-white/10 backdrop-blur-md rounded-full px-4 sm:px-6 lg:px-8 py-3 lg:py-4 border border-white/20">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl lg:text-2xl font-bold text-white"
            >
              <Image
                src="/images/edv-logo-final.png"
                alt="Effe Doppia Vu Logo"
                width={32}
                height={32}
                className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8"
              />
              Effe Doppia Vu
            </Link>
            <div className="flex items-center gap-4 sm:gap-6 lg:gap-8">
              <Link
                href="/"
                className={`text-white/80 hover:text-white transition-colors font-medium text-sm sm:text-base lg:text-lg ${
                  pathname === "/" ? "text-white" : ""
                }`}
              >
                Home
              </Link>
              <Link
                href="/tools"
                className={`text-white/80 hover:text-white transition-colors font-medium text-sm sm:text-base lg:text-lg ${
                  pathname === "/tools" ? "text-white" : ""
                }`}
              >
                Tools
              </Link>
              <Link
                href="/projects"
                className={`text-white/80 hover:text-white transition-colors font-medium text-sm sm:text-base lg:text-lg ${
                  pathname === "/projects" ? "text-white" : ""
                }`}
              >
                Projects
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
