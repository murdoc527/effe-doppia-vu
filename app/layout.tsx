import type React from "react";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Navigation } from "@/components/navigation";
import { DefaultFadeInFooter } from "@/components/FadeInFooter";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SkipLinks } from "@/components/SkipLinks";
import { AppWrapper } from "@/components/app-wrapper";
import { Analytics } from "@/components/analytics";
import { pageMetadata, generateStructuredData } from "@/lib/seo";

export const metadata = pageMetadata.home;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/images/edv-logo-final.png" />
        <link rel="apple-touch-icon" href="/images/edv-logo-final.png" />
        <link
          rel="canonical"
          href={process.env.NEXT_PUBLIC_APP_URL || "https://effedoppiavu.co.uk"}
        />
        <meta name="robots" content="index,follow" />
        <meta name="googlebot" content="index,follow" />
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body
        style={{ minHeight: "100vh", maxHeight: "100vh", overflowY: "auto" }}
      >
        <SkipLinks />
        <ErrorBoundary>
          <AppWrapper>
            <nav id="navigation" role="navigation" aria-label="Main navigation">
              <Navigation />
            </nav>
            <main id="main-content" role="main">
              <div style={{ minHeight: "calc(100vh - 200px)" }}>{children}</div>
            </main>
            <DefaultFadeInFooter />
          </AppWrapper>
        </ErrorBoundary>

        {/* Structured data for SEO */}
        {generateStructuredData().map((data, index) => (
          <script
            key={index}
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(data),
            }}
          />
        ))}

        {/* Google Analytics */}
        <Analytics />
      </body>
    </html>
  );
}
