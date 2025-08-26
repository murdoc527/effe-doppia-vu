/**
 * Professional loading states and skeleton components
 * Provides consistent loading UX across the application
 */

import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Animated loading spinner with maritime theme
 */
export function LoadingSpinner({
  size = "md",
  className = "",
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <div className="animate-spin rounded-full border-2 border-white/20 border-t-white/80"></div>
    </div>
  );
}

/**
 * Loading state for calculator components
 */
export function CalculatorLoading() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 animate-pulse">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <div className="h-6 bg-white/20 rounded w-48 mb-2 sm:mb-0"></div>
          <div className="h-8 bg-white/20 rounded w-24"></div>
        </div>

        <div className="space-y-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-white/20 rounded w-32"></div>
              <div className="h-10 bg-white/20 rounded"></div>
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          <div className="h-6 bg-white/20 rounded w-24"></div>
          <div className="bg-white/5 rounded-lg p-4 space-y-2">
            <div className="h-4 bg-white/20 rounded w-full"></div>
            <div className="h-4 bg-white/20 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Loading state for navigation tools grid
 */
export function ToolsGridLoading() {
  return (
    <div className="grid gap-4 sm:gap-6 lg:gap-8 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 3 }, (_, i) => (
        <div
          key={i}
          className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-6 lg:p-8 border border-white/20 animate-pulse"
        >
          <div className="mb-3 sm:mb-4 lg:mb-6">
            <div className="h-6 bg-white/20 rounded w-3/4 mb-2"></div>
            <div className="space-y-2">
              <div className="h-4 bg-white/20 rounded w-full"></div>
              <div className="h-4 bg-white/20 rounded w-5/6"></div>
              <div className="h-4 bg-white/20 rounded w-4/6"></div>
            </div>
          </div>

          <div className="mb-3 sm:mb-4 flex gap-2">
            <div className="h-6 bg-white/20 rounded-full w-20"></div>
            <div className="h-6 bg-white/20 rounded-full w-24"></div>
            <div className="h-6 bg-white/20 rounded-full w-16"></div>
          </div>

          <div className="h-10 bg-white/20 rounded"></div>
        </div>
      ))}
    </div>
  );
}

/**
 * Loading state for countdown timer
 */
export function CountdownLoading() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 md:gap-4 text-center max-w-lg sm:max-w-2xl mx-auto">
      {Array.from({ length: 4 }, (_, i) => (
        <div
          key={i}
          className="bg-white/20 backdrop-blur-md rounded-xl p-3 sm:p-4 md:p-6 border border-white/30 animate-pulse"
        >
          <div className="h-8 sm:h-10 md:h-12 bg-white/20 rounded mb-2"></div>
          <div className="h-4 bg-white/20 rounded w-16 mx-auto"></div>
        </div>
      ))}
    </div>
  );
}

/**
 * Generic content loading placeholder
 */
export function ContentLoading({ lines = 3 }: { lines?: number }) {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 bg-white/20 rounded w-full"></div>
          <div className="h-4 bg-white/20 rounded w-5/6"></div>
        </div>
      ))}
    </div>
  );
}

/**
 * Loading wrapper component that shows loading state while children are loading
 */
interface LoadingWrapperProps {
  isLoading: boolean;
  loadingComponent?: React.ReactNode;
  children: React.ReactNode;
}

export function LoadingWrapper({
  isLoading,
  loadingComponent,
  children,
}: LoadingWrapperProps) {
  if (isLoading) {
    return <>{loadingComponent || <LoadingSpinner />}</>;
  }

  return <>{children}</>;
}
