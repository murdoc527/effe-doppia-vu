/**
 * SEO and metadata configuration
 * Provides comprehensive SEO optimization for all pages
 */

import type { Metadata } from "next";
// Use direct environment variables to avoid SSR issues
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Effe Doppia Vu";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://effedoppiavu.co.uk";

interface SEOConfig {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: "website" | "article";
  noIndex?: boolean;
}

/**
 * Base metadata shared across all pages
 */
const baseMetadata = {
  metadataBase: new URL(APP_URL),
  title: {
    template: `${APP_NAME} | %s`,
    default: APP_NAME,
  },
  description: "Tools and calculators.",
  keywords: [
    "maritime navigation",
    "navigation calculator",
    "course to steer",
    "speed distance time",
    "vertical clearance",
    "maritime tools",
    "nautical calculator",
    "navigation planning",
    "maritime safety",
    "tidal calculations",
  ],
  authors: [{ name: "Effe Doppia Vu" }],
  creator: "Effe Doppia Vu",
  publisher: "Effe Doppia Vu",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#ffffff",
  category: "Navigation Tools",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: APP_URL,
    siteName: APP_NAME,
    title: APP_NAME,
    description:
      "Professional maritime navigation tools and calculators for mariners. Features coordinate conversion, course planning, clearance calculations, and more.",
    images: [
      {
        url: "/images/og-effe-doppia-vu.jpg?v=2",
        width: 1200,
        height: 630,
        alt: "Effe Doppia Vu - Professional Maritime Navigation Tools & Calculators",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: APP_NAME,
    description:
      "Professional maritime navigation tools and calculators for mariners. Features coordinate conversion, course planning, clearance calculations, and more.",
    images: ["/images/og-effe-doppia-vu.jpg?v=2"],
    creator: "@effedoppiavu", // Update with actual Twitter handle
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // DNS verification handled at domain level (Vercel DNS)
    // No HTML meta tag verification needed
  },
} satisfies Metadata;

/**
 * Generates page-specific metadata with SEO optimization
 */
export function generateMetadata(config: SEOConfig = {}): Metadata {
  const {
    title,
    description,
    keywords = [],
    image,
    url,
    type = "website",
    noIndex = false,
  } = config;

  const metadata: Metadata = {
    ...baseMetadata,
  };

  // Override title if provided
  if (title) {
    metadata.title = title;
    if (metadata.openGraph) {
      metadata.openGraph.title = title;
    }
    if (metadata.twitter) {
      metadata.twitter.title = title;
    }
  }

  // Override description if provided
  if (description) {
    metadata.description = description;
    if (metadata.openGraph) {
      metadata.openGraph.description = description;
    }
    if (metadata.twitter) {
      metadata.twitter.description = description;
    }
  }

  // Add page-specific keywords
  if (keywords.length > 0 && metadata.keywords) {
    metadata.keywords = [
      ...(Array.isArray(metadata.keywords) ? metadata.keywords : []),
      ...keywords,
    ];
  }

  // Override image if provided
  if (image) {
    const imageUrl = image.startsWith("http") ? image : `${APP_URL}${image}`;

    if (metadata.openGraph) {
      metadata.openGraph.images = [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title || (metadata.openGraph.title as string),
        },
      ];
    }

    if (metadata.twitter) {
      metadata.twitter.images = [imageUrl];
    }
  }

  // Override URL if provided
  if (url) {
    const fullUrl = url.startsWith("http") ? url : `${APP_URL}${url}`;
    if (metadata.openGraph) {
      metadata.openGraph.url = fullUrl;
    }
  }

  // Set type (OpenGraph type is read-only in Next.js, so we recreate the object)
  if (metadata.openGraph) {
    metadata.openGraph = {
      ...metadata.openGraph,
      type: type as "website" | "article",
    };
  }

  // Handle noIndex
  if (noIndex) {
    metadata.robots = {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    };
  }

  return metadata;
}

/**
 * Pre-configured metadata for common pages
 */
export const pageMetadata = {
  home: generateMetadata({
    // No title specified = uses the default "Effe Doppia Vu"
    description: "Effe Doppia Vu - Tools and calculators.",
    keywords: ["navigation", "tools", "calculators"],
    url: "/",
  }),

  tools: generateMetadata({
    title: "Tools",
    description:
      "Comprehensive collection of maritime navigation calculators including course to steer, speed-distance-time, and vertical clearance tools.",
    keywords: [
      "navigation calculator",
      "maritime tools",
      "nautical instruments",
    ],
    url: "/tools",
  }),

  speedDistanceCalculator: generateMetadata({
    title: "Speed Distance Time Calculator",
    description:
      "Calculate speed, distance, or time for maritime navigation. Essential for passage planning, ETA calculations, and fuel consumption estimates.",
    keywords: [
      "speed calculator",
      "distance calculator",
      "time calculator",
      "ETA calculation",
      "passage planning",
    ],
    url: "/tools/speed-distance-calculator",
  }),

  verticalClearanceCalculator: generateMetadata({
    title: "Vertical Clearance Calculator",
    description:
      "Calculate safe passage under bridges and overhead obstacles. Account for tide heights, vessel air draft, and safety margins using HAT methodology.",
    keywords: [
      "vertical clearance",
      "bridge clearance",
      "tide calculation",
      "HAT methodology",
      "safety margin",
    ],
    url: "/tools/vertical-clearance-calculator",
  }),

  courseToSteerCalculator: generateMetadata({
    title: "Course to Steer Calculator",
    description:
      "Calculate the compass course to steer accounting for current, wind, and compass variations. Essential for accurate navigation and course planning.",
    keywords: [
      "course to steer",
      "compass course",
      "tidal set",
      "current calculation",
      "navigation triangle",
    ],
    url: "/tools/course-to-steer-calculator",
  }),

  latLongConverter: generateMetadata({
    title: "Lat/Long Coordinate Converter",
    description:
      "Convert between coordinate formats: DD, DDM, DMS, BNG, and MGRS. Essential for navigation, mapping, and position reporting across different systems.",
    keywords: [
      "coordinate converter",
      "latitude longitude",
      "DD DDM DMS",
      "British National Grid",
      "MGRS converter",
      "position format",
      "GPS coordinates",
    ],
    url: "/tools/lat-long-converter",
  }),

  projects: generateMetadata({
    title: "Projects",
    description:
      "Explore some of our most recent projects. Discover upcoming tools and features for professional mariners.",
    keywords: [
      "maritime projects",
      "navigation development",
      "upcoming features",
      "maritime innovation",
    ],
    url: "/projects",
  }),
} as const;

/**
 * Structured data for rich snippets
 */
export function generateStructuredData() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: APP_NAME,
      description:
        "Professional maritime navigation calculators and tools for mariners",
      url: APP_URL,
      applicationCategory: "Navigation",
      operatingSystem: "Web Browser",
      browserRequirements: "HTML5, JavaScript",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      creator: {
        "@type": "Organization",
        name: APP_NAME,
        url: APP_URL,
      },
      featureList: [
        "Speed Distance Time Calculator",
        "Vertical Clearance Calculator",
        "Course to Steer Calculator",
        "Lat/Long Coordinate Converter",
        "Maritime Navigation Tools",
      ],
      audience: {
        "@type": "Audience",
        audienceType: "Mariners, Ship Officers, Navigation Professionals",
      },
      keywords:
        "maritime navigation, nautical calculator, course planning, navigation tools",
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: APP_NAME,
      url: APP_URL,
      description:
        "Provider of professional maritime navigation tools and calculators",
      sameAs: [
        // Add your social media profiles when available
        // "https://twitter.com/effedoppiavu",
        // "https://linkedin.com/company/effedoppiavu"
      ],
      potentialAction: {
        "@type": "SearchAction",
        target: `${APP_URL}/tools?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Maritime Navigation Tools",
      description: "Professional calculators for maritime navigation",
      numberOfItems: 4,
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          item: {
            "@type": "WebApplication",
            name: "Speed Distance Time Calculator",
            description:
              "Calculate speed, distance, or time for maritime navigation",
            url: `${APP_URL}/tools/speed-distance-calculator`,
            applicationCategory: "Navigation",
          },
        },
        {
          "@type": "ListItem",
          position: 2,
          item: {
            "@type": "WebApplication",
            name: "Vertical Clearance Calculator",
            description:
              "Calculate safe passage under bridges and overhead obstacles",
            url: `${APP_URL}/tools/vertical-clearance-calculator`,
            applicationCategory: "Navigation",
          },
        },
        {
          "@type": "ListItem",
          position: 3,
          item: {
            "@type": "WebApplication",
            name: "Course to Steer Calculator",
            description:
              "Calculate compass course accounting for current and wind",
            url: `${APP_URL}/tools/course-to-steer-calculator`,
            applicationCategory: "Navigation",
          },
        },
        {
          "@type": "ListItem",
          position: 4,
          item: {
            "@type": "WebApplication",
            name: "Lat/Long Coordinate Converter",
            description:
              "Convert between coordinate formats: DD, DDM, DMS, BNG, and MGRS",
            url: `${APP_URL}/tools/lat-long-converter`,
            applicationCategory: "Navigation",
          },
        },
      ],
    },
  ];
}
