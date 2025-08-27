import proj4 from "proj4";
import * as mgrs from "mgrs";

// Coordinate format types
export type CoordinateFormat = "DD" | "DDM" | "DMS" | "BNG" | "MGRS";

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface FormattedCoordinates {
  DD: string;
  DDM: string;
  DMS: string;
  BNG: string;
  MGRS: string;
}

// Define coordinate reference systems
const WGS84 = "EPSG:4326"; // World Geodetic System 1984 (standard GPS coordinates)

// British National Grid projection definition (EPSG:27700)
const OSGB36_PROJ =
  "+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +towgs84=446.448,-125.157,542.06,0.15,0.247,0.842,-20.489 +units=m +no_defs";

// Register the projection
proj4.defs("EPSG:27700", OSGB36_PROJ);

// Grid square letters for BNG - organized from South to North (bottom to top)
const GRID_LETTERS = [
  ["SV", "SW", "SX", "SY", "SZ", "TV", "TW"], // 0-99km (South)
  ["SQ", "SR", "SS", "ST", "SU", "TQ", "TR"], // 100-199km
  ["SL", "SM", "SN", "SO", "SP", "TL", "TM"], // 200-299km
  ["SF", "SG", "SH", "SJ", "SK", "TF", "TG"], // 300-399km
  ["SA", "SB", "SC", "SD", "SE", "TA", "TB"], // 400-499km
  ["NV", "NW", "NX", "NY", "NZ", "OV", "OW"], // 500-599km
  ["NQ", "NR", "NS", "NT", "NU", "OQ", "OR"], // 600-699km
  ["NL", "NM", "NN", "NO", "NP", "OL", "OM"], // 700-799km
  ["NF", "NG", "NH", "NJ", "NK", "OF", "OG"], // 800-899km
  ["NA", "NB", "NC", "ND", "NE", "OA", "OB"], // 900-999km
  ["HV", "HW", "HX", "HY", "HZ", "JV", "JW"], // 1000-1099km
  ["HQ", "HR", "HS", "HT", "HU", "JQ", "JR"], // 1100-1199km
  ["HL", "HM", "HN", "HO", "HP", "JL", "JM"], // 1200-1299km (North)
];

// Utility functions for coordinate conversions
export function validateDD(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

export function ddToDDM(dd: number, isLatitude: boolean): string {
  const abs = Math.abs(dd);
  const degrees = Math.floor(abs);
  const minutes = (abs - degrees) * 60;
  const direction = isLatitude ? (dd >= 0 ? "N" : "S") : dd >= 0 ? "E" : "W";

  // Format degrees with leading zeros: latitude 00, longitude 000
  const degreesFormatted = isLatitude
    ? degrees.toString().padStart(2, "0")
    : degrees.toString().padStart(3, "0");

  return `${degreesFormatted}° ${minutes.toFixed(3)}' ${direction}`;
}

export function ddToDMS(dd: number, isLatitude: boolean): string {
  const abs = Math.abs(dd);
  const degrees = Math.floor(abs);
  const minutesFloat = (abs - degrees) * 60;
  const minutes = Math.floor(minutesFloat);
  const seconds = (minutesFloat - minutes) * 60;
  const direction = isLatitude ? (dd >= 0 ? "N" : "S") : dd >= 0 ? "E" : "W";

  // Format degrees with leading zeros: latitude 00, longitude 000
  const degreesFormatted = isLatitude
    ? degrees.toString().padStart(2, "0")
    : degrees.toString().padStart(3, "0");

  return `${degreesFormatted}° ${minutes
    .toString()
    .padStart(2, "0")}' ${seconds.toFixed(1)}" ${direction}`;
}

// Proper BNG conversion using proj4
export function ddToBNG(lat: number, lng: number): string {
  try {
    // Check if coordinates are roughly within UK bounds
    if (lat < 49.5 || lat > 61 || lng < -8.5 || lng > 2) {
      return "Out of range";
    }

    // Transform WGS84 to OSGB36 (BNG)
    const transformed = proj4(WGS84, "EPSG:27700", [lng, lat]);
    const easting = Math.round(transformed[0]);
    const northing = Math.round(transformed[1]);

    // Check if within valid BNG range
    if (easting < 0 || easting > 800000 || northing < 0 || northing > 1300000) {
      return "Out of range";
    }

    // Calculate grid square
    const gridX = Math.floor(easting / 100000);
    const gridY = Math.floor(northing / 100000);

    if (gridY >= GRID_LETTERS.length || gridX >= GRID_LETTERS[0].length) {
      return "Out of range";
    }

    // Grid array is organized South to North, so we use direct indexing
    const gridSquare = GRID_LETTERS[gridY][gridX];

    // Calculate local coordinates within grid square
    const localEasting = easting % 100000;
    const localNorthing = northing % 100000;

    return `${gridSquare} ${localEasting
      .toString()
      .padStart(5, "0")} ${localNorthing.toString().padStart(5, "0")}`;
  } catch (error) {
    return "Out of range";
  }
}

// Proper MGRS conversion using the mgrs library (1m precision)
export function ddToMGRS(lat: number, lng: number): string {
  try {
    const result = mgrs.forward([lng, lat], 5); // 5-digit precision (1m)
    // Format: "30UVA1552382607" -> "30U VA 15523 82607"
    const match = result.match(/^(\d{1,2})([A-Z])([A-Z]{2})(\d{5})(\d{5})$/);
    if (match) {
      return `${match[1]}${match[2]} ${match[3]} ${match[4]} ${match[5]}`;
    }
    return result; // fallback to original format
  } catch (error) {
    return "Invalid coordinates";
  }
}

// Convert coordinates to all formats
export function convertCoordinates(
  lat: number,
  lng: number
): FormattedCoordinates {
  if (!validateDD(lat, lng)) {
    throw new Error("Invalid coordinates");
  }

  return {
    DD: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
    DDM: `${ddToDDM(lat, true)}, ${ddToDDM(lng, false)}`,
    DMS: `${ddToDMS(lat, true)}, ${ddToDMS(lng, false)}`,
    BNG: ddToBNG(lat, lng),
    MGRS: ddToMGRS(lat, lng),
  };
}

// Generate navigation URLs
export function generateNavigationUrls(lat: number, lng: number) {
  return {
    googleMaps: `https://www.google.com/maps?q=${lat},${lng}`,
    waze: `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`,
  };
}

// Check if a result is an error message
export function isErrorResult(value: string): boolean {
  const errorPatterns = [
    /out.*of.*range/i,
    /invalid/i,
    /error/i,
    /failed/i,
    /not.*valid/i,
    /conversion.*failed/i,
    /unable/i,
  ];
  return errorPatterns.some((pattern) => pattern.test(value));
}
