"use client";

import { useEffect, useRef, useState, ReactNode } from "react";

interface FadeInFooterProps {
  children: ReactNode;
  className?: string;
}

export function FadeInFooter({ children, className = "" }: FadeInFooterProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [footerHeight, setFooterHeight] = useState(0);
  const footerRef = useRef<HTMLElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Measure footer height and update spacer
  useEffect(() => {
    const footer = footerRef.current;
    if (!footer) return;

    const measureFooter = () => {
      const rect = footer.getBoundingClientRect();
      const newHeight = rect.height;
      if (newHeight !== footerHeight) {
        setFooterHeight(newHeight);
      }
    };

    // Initial measurement
    measureFooter();

    // ResizeObserver for footer size changes
    const resizeObserver = new ResizeObserver(() => {
      measureFooter();
    });
    resizeObserver.observe(footer);

    // Window resize listener as fallback
    const handleResize = () => {
      measureFooter();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", handleResize);
    };
  }, [footerHeight]);

  // IntersectionObserver for sentinel visibility
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          // Show footer when sentinel is intersecting
          // On short pages, sentinel will be immediately visible
          setIsVisible(entry.isIntersecting);
        }
      },
      {
        threshold: 0.1, // Reduced threshold for better detection on short pages
        rootMargin: "0px 0px -10px 0px", // Small bottom margin to ensure proper triggering
      }
    );

    observer.observe(sentinel);

    // Check initial state immediately and add fallback
    const checkInitialState = () => {
      const rect = sentinel.getBoundingClientRect();
      const isInView = rect.top < window.innerHeight && rect.bottom > 0;

      // Debug logging (remove in production)
      if (process.env.NODE_ENV === "development") {
        console.log("Footer Debug:", {
          isInView,
          sentinelTop: rect.top,
          sentinelBottom: rect.bottom,
          windowHeight: window.innerHeight,
          scrollHeight: document.documentElement.scrollHeight,
          clientHeight: document.documentElement.clientHeight,
        });
      }

      // Show footer if sentinel is in view OR if page doesn't need scrolling
      const pageNeedsScrolling =
        document.documentElement.scrollHeight >
        document.documentElement.clientHeight + 50;

      if (isInView || !pageNeedsScrolling) {
        setIsVisible(true);
      }
    };

    // Use multiple timing strategies to ensure detection
    requestAnimationFrame(checkInitialState);
    setTimeout(checkInitialState, 100); // Fallback timing

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <>
      {/* Sentinel div - placed at the end of main content */}
      <div
        ref={sentinelRef}
        data-testid="footer-sentinel"
        style={{ height: "20px", width: "100%" }}
        aria-hidden="true"
      />

      {/* Spacer div - reserves space equal to footer height */}
      <div
        data-testid="footer-spacer"
        style={{ height: `${footerHeight}px` }}
        aria-hidden="true"
      />

      {/* Fixed footer with fade-in animation */}
      <footer
        ref={footerRef}
        className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ease-out ${className}`}
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? "translateY(0)" : "translateY(8px)",
          pointerEvents: isVisible ? "auto" : "none",
        }}
      >
        {children}
      </footer>
    </>
  );
}

// Convenience wrapper for common usage - matches navigation bar style
export function DefaultFadeInFooter() {
  return (
    <FadeInFooter className="p-3 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white/10 backdrop-blur-md rounded-full px-4 sm:px-6 lg:px-8 py-3 lg:py-4 border border-white/20">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <p className="text-white/80 text-sm sm:text-base lg:text-lg font-medium">
                &copy; {new Date().getFullYear()} Effe Doppia Vu. All rights
                reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </FadeInFooter>
  );
}
