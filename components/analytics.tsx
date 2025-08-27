/**
 * Google Analytics component
 * Handles Google Analytics tracking for the application
 */

import Script from "next/script";

const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID || "G-VKV4Z8DL7H";

export function Analytics() {
  // Don't load analytics in development
  if (process.env.NODE_ENV === "development") {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_TRACKING_ID}');
        `}
      </Script>
    </>
  );
}
