/**
 * Skip links for keyboard navigation accessibility
 * Allows keyboard users to skip to main content areas
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Accessible skip links that appear on keyboard focus
 * Essential for screen reader users and keyboard navigation
 */
export function SkipLinks() {
  const pathname = usePathname();

  // Determine available skip targets based on current page
  const isCalculatorPage =
    pathname.includes("/tools/") && pathname !== "/tools";
  const isToolsPage = pathname === "/tools";
  const isHomePage = pathname === "/";

  return (
    <div className="sr-only focus-within:not-sr-only">
      <div className="fixed top-0 left-0 right-0 z-[9999] bg-slate-900 border-b border-white/20 p-2">
        <div className="flex gap-2 justify-center">
          <Link
            href="#main-content"
            className="bg-white text-slate-900 px-4 py-2 rounded text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            Skip to main content
          </Link>

          <Link
            href="#navigation"
            className="bg-white text-slate-900 px-4 py-2 rounded text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            Skip to navigation
          </Link>

          {isCalculatorPage && (
            <Link
              href="#calculator"
              className="bg-white text-slate-900 px-4 py-2 rounded text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              Skip to calculator
            </Link>
          )}

          {isToolsPage && (
            <Link
              href="#tools-grid"
              className="bg-white text-slate-900 px-4 py-2 rounded text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              Skip to tools
            </Link>
          )}

          {isHomePage && (
            <Link
              href="#countdown"
              className="bg-white text-slate-900 px-4 py-2 rounded text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              Skip to countdown
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
