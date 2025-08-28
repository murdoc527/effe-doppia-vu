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

// Parse MGRS coordinate string to lat/lng
export function parseMGRS(mgrsString: string): Coordinates | null {
  try {
    const cleaned = mgrsString.replace(/\s+/g, "").toUpperCase();
    const [lng, lat] = mgrs.toPoint(cleaned);
    return { lat, lng };
  } catch (error) {
    console.warn("MGRS parsing failed:", error);
    return null;
  }
}

// Parse BNG coordinate string to lat/lng
export function parseBNG(bngString: string): Coordinates | null {
  try {
    const trimmed = bngString.trim().toUpperCase();

    // Match BNG format: "TQ 12345 67890" or "TQ123456789"
    const bngPattern = /^([A-Z]{2})\s*(\d{3,5})\s*(\d{3,5})$/;
    const match = trimmed.match(bngPattern);

    if (!match) {
      return null;
    }

    const [, gridSquare, easting, northing] = match;

    // Find grid square position
    let gridRow = -1;
    let gridCol = -1;

    for (let row = 0; row < GRID_LETTERS.length; row++) {
      const col = GRID_LETTERS[row].indexOf(gridSquare);
      if (col !== -1) {
        gridRow = row;
        gridCol = col;
        break;
      }
    }

    if (gridRow === -1) {
      throw new Error("Invalid BNG grid square");
    }

    // Calculate full easting and northing
    const fullEasting = gridCol * 100000 + parseInt(easting.padEnd(5, "0"));
    const fullNorthing = gridRow * 100000 + parseInt(northing.padEnd(5, "0"));

    // Convert from OSGB36 to WGS84
    const [lng, lat] = proj4("EPSG:27700", WGS84, [fullEasting, fullNorthing]);
    return { lat, lng };
  } catch (error) {
    console.warn("BNG parsing failed:", error);
    return null;
  }
}

// Parse decimal degrees string to lat/lng
export function parseDD(ddString: string): Coordinates | null {
  try {
    const trimmed = ddString.trim();
    const ddPattern = /^(-?\d+\.?\d*)\s*,?\s*(-?\d+\.?\d*)$/;
    const match = trimmed.match(ddPattern);

    if (!match) {
      return null;
    }

    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);

    if (validateDD(lat, lng)) {
      return { lat, lng };
    }

    return null;
  } catch (error) {
    console.warn("DD parsing failed:", error);
    return null;
  }
}

// Parse DDM (Degrees Decimal Minutes) string to lat/lng
export function parseDDM(ddmString: string): Coordinates | null {
  try {
    const trimmed = ddmString.trim().toUpperCase();

    // Match DDM format: "51° 30.444' N, 0° 7.667' W" or "51 30.444 N, 0 7.667 W"
    const ddmPattern =
      /^(\d{1,3})°?\s*(\d{1,2}\.?\d*)'?\s*([NS])\s*,?\s*(\d{1,3})°?\s*(\d{1,2}\.?\d*)'?\s*([EW])$/;
    const match = trimmed.match(ddmPattern);

    if (!match) {
      return null;
    }

    const [, latDeg, latMin, latDir, lngDeg, lngMin, lngDir] = match;

    // Convert DDM to DD
    let lat = parseInt(latDeg) + parseFloat(latMin) / 60;
    let lng = parseInt(lngDeg) + parseFloat(lngMin) / 60;

    // Apply direction
    if (latDir === "S") lat = -lat;
    if (lngDir === "W") lng = -lng;

    if (validateDD(lat, lng)) {
      return { lat, lng };
    }

    return null;
  } catch (error) {
    console.warn("DDM parsing failed:", error);
    return null;
  }
}

// Parse DMS (Degrees Minutes Seconds) string to lat/lng
export function parseDMS(dmsString: string): Coordinates | null {
  try {
    const trimmed = dmsString.trim().toUpperCase();

    // Match DMS format: "51° 30' 26.6" N, 0° 7' 40.0" W" or "51 30 26.6 N, 0 7 40.0 W"
    const dmsPattern =
      /^(\d{1,3})°?\s*(\d{1,2})'?\s*(\d{1,2}\.?\d*)"?\s*([NS])\s*,?\s*(\d{1,3})°?\s*(\d{1,2})'?\s*(\d{1,2}\.?\d*)"?\s*([EW])$/;
    const match = trimmed.match(dmsPattern);

    if (!match) {
      return null;
    }

    const [, latDeg, latMin, latSec, latDir, lngDeg, lngMin, lngSec, lngDir] =
      match;

    // Convert DMS to DD
    let lat =
      parseInt(latDeg) + parseInt(latMin) / 60 + parseFloat(latSec) / 3600;
    let lng =
      parseInt(lngDeg) + parseInt(lngMin) / 60 + parseFloat(lngSec) / 3600;

    // Apply direction
    if (latDir === "S") lat = -lat;
    if (lngDir === "W") lng = -lng;

    if (validateDD(lat, lng)) {
      return { lat, lng };
    }

    return null;
  } catch (error) {
    console.warn("DMS parsing failed:", error);
    return null;
  }
}
