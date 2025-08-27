"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  convertCoordinates,
  generateNavigationUrls,
  isErrorResult,
  type CoordinateFormat,
  type FormattedCoordinates,
} from "@/lib/coords";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Copy,
  CheckCircle,
  Navigation,
  Map,
  MapPin,
  Crosshair,
} from "lucide-react";

interface MapCrosshairProps {
  height?: number;
  initialCenter?: [number, number]; // [lng, lat]
  initialZoom?: number;
}

interface FormatVisibility {
  DD: boolean;
  DDM: boolean;
  DMS: boolean;
  BNG: boolean;
  MGRS: boolean;
}

export function MapCrosshair({
  height = 420,
  initialCenter = [-0.1278, 51.5074], // London
  initialZoom = 10,
}: MapCrosshairProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [currentCoords, setCurrentCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [formattedCoords, setFormattedCoords] =
    useState<FormattedCoordinates | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [formatVisibility, setFormatVisibility] = useState<FormatVisibility>({
    DD: true,
    DDM: true,
    DMS: true,
    BNG: true,
    MGRS: true,
  });

  // Initialize map
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: [
              "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
              "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
              "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
            ],
            tileSize: 256,
            attribution: "© OpenStreetMap contributors",
          },
        },
        layers: [
          {
            id: "osm-tiles",
            type: "raster",
            source: "osm",
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: initialCenter,
      zoom: initialZoom,
      attributionControl: true,
    });

    // Add geolocate control
    const geolocateControl = new maplibregl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true,
      },
      trackUserLocation: true,
      showUserHeading: true,
    });

    map.current.addControl(geolocateControl, "top-right");

    // Add navigation controls
    map.current.addControl(new maplibregl.NavigationControl(), "top-right");

    // Update coordinates on map move
    const updateCoordinates = () => {
      if (!map.current) return;
      const center = map.current.getCenter();
      const coords = { lat: center.lat, lng: center.lng };
      setCurrentCoords(coords);

      try {
        const formatted = convertCoordinates(coords.lat, coords.lng);
        setFormattedCoords(formatted);
      } catch (error) {
        console.error("Coordinate conversion error:", error);
        setFormattedCoords(null);
      }
    };

    // Initial coordinate update
    updateCoordinates();

    // Listen for map movements
    map.current.on("move", updateCoordinates);
    map.current.on("zoom", updateCoordinates);

    // Add comprehensive error handling
    map.current.on("error", (e) => {
      console.error("Map error:", e);
    });

    map.current.on("sourcedata", (e) => {
      if (e.isSourceLoaded) {
        console.log("Source loaded:", e.sourceId);
      }
    });

    map.current.on("data", (e) => {
      if (e.dataType === "source" && e.isSourceLoaded) {
        console.log("Data source loaded:", e.sourceId);
      }
    });

    map.current.on("load", () => {
      console.log("Map loaded successfully");

      // Add a simple grid to visualize map movement
      if (map.current) {
        // Create grid lines at regular intervals
        const bounds = map.current.getBounds();
        const features: any[] = [];

        // Create vertical lines every 0.01 degrees
        for (
          let lng = Math.floor(bounds.getWest() * 100) / 100;
          lng <= bounds.getEast();
          lng += 0.01
        ) {
          features.push({
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: [
                [lng, bounds.getSouth()],
                [lng, bounds.getNorth()],
              ],
            },
          });
        }

        // Create horizontal lines every 0.01 degrees
        for (
          let lat = Math.floor(bounds.getSouth() * 100) / 100;
          lat <= bounds.getNorth();
          lat += 0.01
        ) {
          features.push({
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: [
                [bounds.getWest(), lat],
                [bounds.getEast(), lat],
              ],
            },
          });
        }

        map.current.addSource("grid", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: features,
          },
        });

        map.current.addLayer({
          id: "grid-lines",
          type: "line",
          source: "grid",
          paint: {
            "line-color": "#94a3b8",
            "line-width": 1,
            "line-opacity": 0.3,
          },
        });
      }
    });

    // Add fallback styling if tiles fail to load
    map.current.on("styledata", () => {
      // Add a simple background if no tiles are loaded
      setTimeout(() => {
        const canvas = map.current?.getCanvas();
        if (canvas) {
          const ctx = canvas.getContext("2d");
          if (ctx && canvas.width === 0) {
            console.warn("Map tiles may not be loading, check network/CORS");
          }
        }
      }, 3000);
    });

    return () => {
      map.current?.remove();
    };
  }, [initialCenter, initialZoom]);

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

  // Toggle format visibility
  const toggleFormat = (format: CoordinateFormat) => {
    setFormatVisibility((prev) => ({
      ...prev,
      [format]: !prev[format],
    }));
  };

  // Open navigation apps
  const openInGoogleMaps = () => {
    if (!currentCoords) return;
    const urls = generateNavigationUrls(currentCoords.lat, currentCoords.lng);
    window.open(urls.googleMaps, "_blank");
  };

  const openInWaze = () => {
    if (!currentCoords) return;
    const urls = generateNavigationUrls(currentCoords.lat, currentCoords.lng);
    window.open(urls.waze, "_blank");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Map Container */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20 overflow-hidden">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Crosshair className="w-5 h-5" />
            Interactive Map with Crosshair
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative">
            <div
              ref={mapContainer}
              style={{ height: `${height}px` }}
              className="w-full"
            />
            {/* Fixed Crosshair Overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {/* Vertical line */}
              <div className="absolute w-px h-8 bg-white shadow-lg"></div>
              {/* Horizontal line */}
              <div className="absolute h-px w-8 bg-white shadow-lg"></div>
              {/* Center circle */}
              <div className="absolute w-2 h-2 border border-white bg-black/50 rounded-full shadow-lg"></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Format Toggle Controls */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-white text-lg">Display Formats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(formatVisibility).map(([format, visible]) => (
              <div key={format} className="flex items-center space-x-2">
                <Checkbox
                  id={format}
                  checked={visible}
                  onCheckedChange={() =>
                    toggleFormat(format as CoordinateFormat)
                  }
                  className="border-white/30"
                />
                <Label
                  htmlFor={format}
                  className="text-white text-sm font-medium cursor-pointer"
                >
                  {format}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Coordinate Results */}
      {formattedCoords && currentCoords && (
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white">
              Current Position Coordinates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(formattedCoords)
              .filter(
                ([format]) => formatVisibility[format as CoordinateFormat]
              )
              .map(([format, value]) => (
                <div
                  key={format}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Badge
                      variant="outline"
                      className="border-white/30 text-white flex-shrink-0"
                    >
                      {format}
                    </Badge>
                    <div className="text-white font-mono text-sm md:text-base overflow-hidden">
                      <span className="break-all">{value}</span>
                    </div>
                  </div>
                  {!isErrorResult(value) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(value, format)}
                      className="h-8 w-8 p-0 text-white/60 hover:text-white hover:bg-white/10 flex-shrink-0"
                      title={`Copy ${format} coordinates`}
                    >
                      {copiedField === format ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      {/* Navigation Section */}
      {currentCoords && (
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Navigation className="w-5 h-5" />
              Navigate to Current Position
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={openInGoogleMaps}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
              >
                <Map className="w-4 h-4" />
                Open in Google Maps
              </Button>
              <Button
                onClick={openInWaze}
                className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white flex items-center gap-2"
              >
                <Navigation className="w-4 h-4" />
                Open in Waze
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
