"use client";

import dynamic from "next/dynamic";

// Dynamically import the RouteBuilder component to avoid SSR issues
const RouteBuilder = dynamic(() => import("@/components/route-builder"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-96">
      <div className="text-white">Loading Route Builder...</div>
    </div>
  ),
});

interface RouteBuilderWrapperProps {
  apiKey: string;
  height?: number;
  initialCenter?: [number, number];
  initialZoom?: number;
}

export function RouteBuilderWrapper(props: RouteBuilderWrapperProps) {
  return <RouteBuilder {...props} />;
}
