"use client";

import { useEffect, useState } from "react";

export function Footer() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop =
        document.documentElement.scrollTop || document.body.scrollTop;
      const clientHeight = document.documentElement.clientHeight;

      // Calculate scroll progress (0 to 1)
      const maxScroll = scrollHeight - clientHeight;
      const progress = maxScroll > 0 ? Math.min(scrollTop / maxScroll, 1) : 1;

      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });

    // Check initial state
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  // Footer is always visible, no parallax hiding
  return (
    <footer className="relative z-30 mt-auto">
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl px-6 py-4 border border-white/20">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-white/80 text-sm">
            <div className="text-center">
              <p>
                &copy; {new Date().getFullYear()} Effe Doppia Vu. All rights
                reserved.
              </p>
              <p className="mt-2 text-xs">
                Use of these navigation tools is at your own risk.{" "}
                <a
                  href="/disclaimer"
                  className="underline hover:text-white transition-colors"
                >
                  View disclaimer
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
