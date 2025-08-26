"use client";

import { useState, useEffect } from "react";
import proj4 from "proj4";
import * as mgrs from "mgrs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Copy, CheckCircle, AlertCircle } from "lucide-react";

// Coordinate format types
type CoordinateFormat = "DD" | "DDM" | "DMS" | "BNG" | "MGRS";

interface Coordinates {
  lat: number;
  lng: number;
}

interface FormattedCoordinates {
  DD: string;
  DDM: string;
  DMS: string;
  BNG: string;
  MGRS: string;
}

// Utility functions for coordinate conversions
function validateDD(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

function ddToDDM(dd: number, isLatitude: boolean): string {
  const abs = Math.abs(dd);
  const degrees = Math.floor(abs);
  const minutes = (abs - degrees) * 60;
  const direction = isLatitude ? (dd >= 0 ? "N" : "S") : dd >= 0 ? "E" : "W";
  return `${degrees}° ${minutes.toFixed(3)}' ${direction}`;
}

function ddToDMS(dd: number, isLatitude: boolean): string {
  const abs = Math.abs(dd);
  const degrees = Math.floor(abs);
  const minutesFloat = (abs - degrees) * 60;
  const minutes = Math.floor(minutesFloat);
  const seconds = (minutesFloat - minutes) * 60;
  const direction = isLatitude ? (dd >= 0 ? "N" : "S") : dd >= 0 ? "E" : "W";
  return `${degrees}° ${minutes}' ${seconds.toFixed(1)}" ${direction}`;
}

function parseDDM(ddm: string): number {
  // Parse format like "51° 30.123' N"
  const match = ddm.match(/(\d+)°\s*(\d+\.?\d*)'?\s*([NSEW])/i);
  if (!match) throw new Error("Invalid DDM format");

  const degrees = parseInt(match[1]);
  const minutes = parseFloat(match[2]);
  const direction = match[3].toUpperCase();

  let result = degrees + minutes / 60;
  if (direction === "S" || direction === "W") result = -result;

  return result;
}

function parseDMS(dms: string): number {
  // Parse format like "51° 30' 7.2" N"
  const match = dms.match(/(\d+)°\s*(\d+)'?\s*(\d+\.?\d*)"?\s*([NSEW])/i);
  if (!match) throw new Error("Invalid DMS format");

  const degrees = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const seconds = parseFloat(match[3]);
  const direction = match[4].toUpperCase();

  let result = degrees + minutes / 60 + seconds / 3600;
  if (direction === "S" || direction === "W") result = -result;

  return result;
}

// Define coordinate reference systems
const WGS84 = "EPSG:4326"; // World Geodetic System 1984 (standard GPS coordinates)
const OSGB36 =
  "+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +datum=OSGB36 +units=m +no_defs"; // British National Grid

// Grid square letters for BNG - organized from South to North (bottom to top)
// Each row represents increasing northing values, columns represent easting values
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

// Proper BNG conversion using proj4
function ddToBNG(lat: number, lng: number): string {
  try {
    // Check if coordinates are roughly within UK bounds
    if (lat < 49.5 || lat > 61 || lng < -8.5 || lng > 2) {
      return "Outside BNG area";
    }

    // Transform WGS84 to OSGB36 (BNG)
    const transformed = proj4(WGS84, OSGB36, [lng, lat]);
    const easting = Math.round(transformed[0]);
    const northing = Math.round(transformed[1]);

    // Check if within valid BNG range
    if (easting < 0 || easting > 800000 || northing < 0 || northing > 1300000) {
      return "Outside BNG grid";
    }

    // Calculate grid square
    const gridX = Math.floor(easting / 100000);
    const gridY = Math.floor(northing / 100000);

    if (gridY >= GRID_LETTERS.length || gridX >= GRID_LETTERS[0].length) {
      return "Outside BNG grid";
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
    throw new Error("BNG conversion failed");
  }
}

function parseBNG(bng: string): Coordinates {
  try {
    // Parse format like "TQ 12345 67890" or "TQ12345 67890" or "TQ 1234567890"
    const cleanBng = bng.replace(/\s+/g, " ").trim();
    let match = cleanBng.match(/^([A-Z]{2})\s*(\d{5})\s*(\d{5})$/i);

    if (!match) {
      // Try alternative format: "TQ 1234567890"
      match = cleanBng.match(/^([A-Z]{2})\s*(\d{10})$/i);
      if (match) {
        const coords = match[2];
        match = [
          match[0],
          match[1],
          coords.substring(0, 5),
          coords.substring(5, 10),
        ];
      }
    }

    if (!match) throw new Error("Invalid BNG format");

    const gridSquare = match[1].toUpperCase();
    const easting = parseInt(match[2]);
    const northing = parseInt(match[3]);

    // Find grid square in lookup table
    let gridX = -1,
      gridY = -1;
    for (let y = 0; y < GRID_LETTERS.length; y++) {
      for (let x = 0; x < GRID_LETTERS[y].length; x++) {
        if (GRID_LETTERS[y][x] === gridSquare) {
          gridX = x;
          gridY = y; // Direct mapping since array is South to North
          break;
        }
      }
      if (gridX !== -1) break;
    }

    if (gridX === -1 || gridY === -1) {
      throw new Error("Invalid BNG grid square");
    }

    // Calculate full OSGB36 coordinates
    const fullEasting = gridX * 100000 + easting;
    const fullNorthing = gridY * 100000 + northing;

    // Transform OSGB36 back to WGS84
    const transformed = proj4(OSGB36, WGS84, [fullEasting, fullNorthing]);

    return { lat: transformed[1], lng: transformed[0] };
  } catch (error) {
    throw new Error("Invalid BNG format");
  }
}

// Proper MGRS conversion using the mgrs library
function ddToMGRS(lat: number, lng: number): string {
  try {
    const result = mgrs.forward([lng, lat], 5); // 5-digit precision
    // Format: "30UVA1552382607" -> "30U VA 15523 82607"
    const match = result.match(/^(\d{1,2})([A-Z])([A-Z]{2})(\d{5})(\d{5})$/);
    if (match) {
      return `${match[1]}${match[2]} ${match[3]} ${match[4]} ${match[5]}`;
    }
    return result; // fallback to original format
  } catch (error) {
    throw new Error("MGRS conversion failed");
  }
}

function parseMGRS(mgrsString: string): Coordinates {
  try {
    const [lng, lat] = mgrs.inverse(mgrsString.trim());
    return { lat, lng };
  } catch (error) {
    throw new Error("Invalid MGRS format");
  }
}

export function LatLongConverter() {
  const [inputFormat, setInputFormat] = useState<CoordinateFormat>("DD");
  const [inputValue, setInputValue] = useState("");
  const [results, setResults] = useState<FormattedCoordinates | null>(null);
  const [error, setError] = useState("");
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const formatExamples = {
    DD: "50.664782,-3.4386112",
    DDM: "50° 39.887' N, 3° 26.317' W",
    DMS: "50° 39' 53.2\" N, 3° 26' 19.0\" W",
    BNG: "TQ 30500 81500",
    MGRS: "30U YC 56789 12345",
  };

  // Check if permissions are already determined
  const checkLocationPermission = async () => {
    if ("permissions" in navigator) {
      try {
        const permission = await navigator.permissions.query({
          name: "geolocation",
        });
        return permission.state;
      } catch (error) {
        return "unknown";
      }
    }
    return "unknown";
  };

  // Geolocation function
  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser");
      return;
    }

    // Check current permission status
    const permissionState = await checkLocationPermission();

    if (permissionState === "denied") {
      setLocationError(
        "Location access was previously denied. To enable: Go to your browser settings → Site permissions → Location → Allow, then refresh this page."
      );
      return;
    }

    // Check if we're on HTTP (not HTTPS) which may cause issues on mobile
    if (
      typeof window !== "undefined" &&
      window.location.protocol === "http:" &&
      window.location.hostname !== "localhost"
    ) {
      setLocationError(
        "Location access may require HTTPS on mobile devices. Try accessing via HTTPS or localhost."
      );
      return;
    }

    setIsGettingLocation(true);
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setInputFormat("DD");
        setInputValue(`${latitude.toFixed(8)},${longitude.toFixed(8)}`);
        setIsGettingLocation(false);
        setLocationError(""); // Clear any previous errors on success
      },
      (error) => {
        let errorMessage = "Unable to get location";
        let helpText = "";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied";
            if (
              typeof window !== "undefined" &&
              /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
            ) {
              // Mobile-specific guidance
              helpText =
                "Mobile fix: 1) Check if location is enabled in your device settings, 2) Clear this site's data in browser settings, 3) Refresh and try again.";
            } else {
              helpText =
                "Check your browser/device location settings. You may need to enable location services and refresh the page.";
            }
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable";
            helpText =
              "Make sure you're connected to the internet and location services are enabled on your device.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out";
            helpText =
              "The location request took too long. Try again or check your internet connection.";
            break;
        }
        setLocationError(`${errorMessage}. ${helpText}`);
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000, // Increased timeout for mobile
        maximumAge: 30000, // Reduced cache time for more recent location
      }
    );
  };

  // Copy to clipboard function
  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };

  const convertCoordinates = () => {
    try {
      setError("");
      let lat: number, lng: number;

      // Parse input based on format
      switch (inputFormat) {
        case "DD":
          // Parse comma-separated DD coordinates like "51.5074, -0.1278"
          const ddParts = inputValue.split(",").map((part) => part.trim());
          if (ddParts.length !== 2) {
            throw new Error(
              "DD format requires two coordinates separated by comma (e.g., 51.5074, -0.1278)"
            );
          }
          lat = parseFloat(ddParts[0]);
          lng = parseFloat(ddParts[1]);
          if (isNaN(lat) || isNaN(lng) || !validateDD(lat, lng)) {
            throw new Error("Invalid DD coordinates");
          }
          break;

        case "DDM":
          // Parse comma-separated DDM coordinates like "50° 39.887' N, 3° 26.317' W"
          const ddmParts = inputValue.split(",").map((part) => part.trim());
          if (ddmParts.length !== 2) {
            throw new Error(
              "DDM format requires two coordinates separated by comma (e.g., 50° 39.887' N, 3° 26.317' W)"
            );
          }
          lat = parseDDM(ddmParts[0]);
          lng = parseDDM(ddmParts[1]);
          break;

        case "DMS":
          // Parse comma-separated DMS coordinates like "50° 39' 53.2\" N, 3° 26' 19.0\" W"
          const dmsParts = inputValue.split(",").map((part) => part.trim());
          if (dmsParts.length !== 2) {
            throw new Error(
              "DMS format requires two coordinates separated by comma (e.g., 50° 39' 53.2\" N, 3° 26' 19.0\" W)"
            );
          }
          lat = parseDMS(dmsParts[0]);
          lng = parseDMS(dmsParts[1]);
          break;

        case "BNG":
          const bngCoords = parseBNG(inputValue);
          lat = bngCoords.lat;
          lng = bngCoords.lng;
          break;

        case "MGRS":
          const mgrsCoords = parseMGRS(inputValue);
          lat = mgrsCoords.lat;
          lng = mgrsCoords.lng;
          break;

        default:
          throw new Error("Unknown format");
      }

      // Convert to all formats
      const converted: FormattedCoordinates = {
        DD: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        DDM: `${ddToDDM(lat, true)}, ${ddToDDM(lng, false)}`,
        DMS: `${ddToDMS(lat, true)}, ${ddToDMS(lng, false)}`,
        BNG: ddToBNG(lat, lng),
        MGRS: ddToMGRS(lat, lng),
      };

      setResults(converted);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Conversion failed");
      setResults(null);
    }
  };

  const resetCalculator = () => {
    setInputValue("");
    setResults(null);
    setError("");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Input Section */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Coordinate Input</CardTitle>
          <CardDescription className="text-white/80">
            Enter coordinates in your preferred format
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="format" className="text-white text-sm font-medium">
              Input Format
            </Label>
            <Select
              value={inputFormat}
              onValueChange={(value: CoordinateFormat) => setInputFormat(value)}
            >
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DD">DD - Decimal Degrees</SelectItem>
                <SelectItem value="DDM">
                  DDM - Degrees Decimal Minutes
                </SelectItem>
                <SelectItem value="DMS">
                  DMS - Degrees Minutes Seconds
                </SelectItem>
                <SelectItem value="BNG">BNG - British National Grid</SelectItem>
                <SelectItem value="MGRS">
                  MGRS - Military Grid Reference
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label
                htmlFor="input1"
                className="text-white text-sm font-medium"
              >
                Coordinates
              </Label>
              <div className="flex gap-2">
                <Input
                  id="input1"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={formatExamples[inputFormat]}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 flex-1"
                />
                <Button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={isGettingLocation}
                  className="bg-blue-600/80 hover:bg-blue-600 text-white border border-blue-500/30 backdrop-blur-sm px-3"
                  title="Get current location"
                >
                  {isGettingLocation ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <MapPin className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="text-xs text-white/60">
            Example: {formatExamples[inputFormat]}
          </div>

          {locationError && (
            <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-300 mt-0.5 flex-shrink-0" />
              <p className="text-yellow-200 text-sm">{locationError}</p>
            </div>
          )}

          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-300 mt-0.5 flex-shrink-0" />
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              onClick={convertCoordinates}
              className="bg-white/20 hover:bg-white/30 text-white border border-white/30"
            >
              Convert
            </Button>
            <Button
              onClick={resetCalculator}
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
            >
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {results && (
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Conversion Results</CardTitle>
            <CardDescription className="text-white/80">
              Coordinates in all supported formats
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(results).map(([format, value]) => (
              <div
                key={format}
                className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Badge
                    variant="outline"
                    className="border-white/30 text-white flex-shrink-0"
                  >
                    {format}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-white font-mono text-sm">{value}</div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(value, format)}
                    className="h-8 w-8 p-0 text-white/60 hover:text-white hover:bg-white/10"
                    title={`Copy ${format} coordinates`}
                  >
                    {copiedField === format ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Format Guide */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Format Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <div className="text-white font-medium">DD - Decimal Degrees</div>
              <div className="text-white/60 text-sm">
                Standard decimal format (-90 to 90, -180 to 180)
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-white font-medium">
                DDM - Degrees Decimal Minutes
              </div>
              <div className="text-white/60 text-sm">
                Degrees with decimal minutes (e.g., 51° 30.444' N)
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-white font-medium">
                DMS - Degrees Minutes Seconds
              </div>
              <div className="text-white/60 text-sm">
                Traditional navigation format (e.g., 51° 30' 26.6" N)
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-white font-medium">
                BNG - British National Grid
              </div>
              <div className="text-white/60 text-sm">
                UK Ordnance Survey grid (easting northing)
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-white font-medium">
                MGRS - Military Grid Reference
              </div>
              <div className="text-white/60 text-sm">
                NATO standard grid system
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <h4 className="text-white font-medium text-sm mb-2">
              💡 Quick Tips
            </h4>
            <ul className="text-white/70 text-sm space-y-1">
              <li>
                • Click the <MapPin className="w-3 h-3 inline mx-1" /> button to
                use your current location
              </li>
              <li>
                • Click the <Copy className="w-3 h-3 inline mx-1" /> button to
                copy any result to clipboard
              </li>
              <li>
                • All conversions update automatically when you change formats
              </li>
              <li>
                • <strong>Mobile:</strong> Enable location services in your
                device settings first
              </li>
              <li>
                • <strong>No popup?</strong> Clear site data in browser settings
                and refresh
              </li>
              <li>
                • <strong>Still denied?</strong> Try HTTPS or check if location
                was previously blocked
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
