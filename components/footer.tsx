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

  // Parallax effect: footer slides up from behind content
  // When scroll progress is 0 (top), footer is completely hidden below viewport
  // When scroll progress is 1 (bottom), footer is fully visible
  const footerHeight = 120; // Approximate footer height
  const translateY = (1 - scrollProgress) * footerHeight;

  return (
    <footer
      className="relative z-30 mt-auto"
      style={{
        transform: `translateY(${translateY}px)`,
        transition: "transform 0.1s ease-out",
      }}
    >
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl px-6 py-4 border border-white/20">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-white/80 text-sm">
            <div className="text-center">
              <p>
                &copy; {new Date().getFullYear()} Effe Doppia Vu. All rights
                reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
