"use client";

import { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
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
  MapPin,
  Crosshair,
  Navigation,
  Layers,
} from "lucide-react";

interface GoogleMapsCrosshairProps {
  height?: number;
  initialCenter?: [number, number];
  initialZoom?: number;
  apiKey: string;
}

export function GoogleMapsCrosshair({
  height = 420,
  initialCenter = [-0.1278, 51.5074], // London
  initialZoom = 12,
  apiKey,
}: GoogleMapsCrosshairProps) {
  const [coordinates, setCoordinates] = useState<FormattedCoordinates | null>(
    null
  );
  const [selectedFormats, setSelectedFormats] = useState<Set<CoordinateFormat>>(
    new Set(["DD", "DDM", "DMS", "BNG", "MGRS"])
  );
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [mapType, setMapType] = useState<
    "roadmap" | "satellite" | "hybrid" | "terrain"
  >("roadmap");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mapRef = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);

  // Convert current center to all coordinate formats
  const updateCoordinates = () => {
    if (map.current) {
      const center = map.current.getCenter();
      if (center) {
        const lat = center.lat();
        const lng = center.lng();
        try {
          const converted = convertCoordinates(lat, lng);
          setCoordinates(converted);
        } catch (error) {
          console.error("Coordinate conversion error:", error);
        }
      }
    }
  };

  // Initialize Google Maps
  useEffect(() => {
    if (!apiKey) {
      setError("Google Maps API key is required");
      setIsLoading(false);
      return;
    }

    const loader = new Loader({
      apiKey: apiKey,
      version: "weekly",
      libraries: ["maps"],
    });

    loader
      .load()
      .then(() => {
        if (mapRef.current) {
          map.current = new google.maps.Map(mapRef.current, {
            center: { lat: initialCenter[1], lng: initialCenter[0] },
            zoom: initialZoom,
            mapTypeId: mapType,
            disableDefaultUI: false,
            zoomControl: true,
            mapTypeControl: true,
            scaleControl: true,
            streetViewControl: false,
            rotateControl: false,
            fullscreenControl: true,
            gestureHandling: "greedy",
          });

          // Update coordinates when map moves
          map.current.addListener("center_changed", updateCoordinates);
          map.current.addListener("zoom_changed", updateCoordinates);

          // Initial coordinate update
          updateCoordinates();
          setIsLoading(false);
        }
      })
      .catch((error) => {
        console.error("Error loading Google Maps:", error);
        setError("Failed to load Google Maps. Please check your API key.");
        setIsLoading(false);
      });
  }, [apiKey, initialCenter, initialZoom, mapType]);

  // Change map type
  const changeMapType = (
    newMapType: "roadmap" | "satellite" | "hybrid" | "terrain"
  ) => {
    setMapType(newMapType);
    if (map.current) {
      map.current.setMapTypeId(newMapType);
    }
  };

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const toggleFormat = (format: CoordinateFormat) => {
    const newFormats = new Set(selectedFormats);
    if (newFormats.has(format)) {
      newFormats.delete(format);
    } else {
      newFormats.add(format);
    }
    setSelectedFormats(newFormats);
  };

  const getNavigationUrls = () => {
    if (!coordinates || !map.current) return { googleMaps: "", waze: "" };
    const center = map.current.getCenter();
    if (!center) return { googleMaps: "", waze: "" };
    return generateNavigationUrls(center.lat(), center.lng());
  };

  const getCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          if (map.current) {
            map.current.setCenter({ lat: latitude, lng: longitude });
            map.current.setZoom(15);
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          alert(
            "Unable to get your location. Please check your browser permissions."
          );
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  const formatDisplays = [
    {
      key: "DD" as CoordinateFormat,
      label: "DD (Decimal Degrees)",
      color: "bg-blue-100 text-blue-800",
    },
    {
      key: "DDM" as CoordinateFormat,
      label: "DDM (Degrees Decimal Minutes)",
      color: "bg-green-100 text-green-800",
    },
    {
      key: "DMS" as CoordinateFormat,
      label: "DMS (Degrees Minutes Seconds)",
      color: "bg-purple-100 text-purple-800",
    },
    {
      key: "BNG" as CoordinateFormat,
      label: "BNG (British National Grid)",
      color: "bg-orange-100 text-orange-800",
    },
    {
      key: "MGRS" as CoordinateFormat,
      label: "MGRS (Military Grid Reference)",
      color: "bg-red-100 text-red-800",
    },
  ];

  const mapTypes = [
    { id: "roadmap", label: "Road", icon: "🗺️" },
    { id: "satellite", label: "Satellite", icon: "🛰️" },
    { id: "hybrid", label: "Hybrid", icon: "🗺️🛰️" },
    { id: "terrain", label: "Terrain", icon: "🏔️" },
  ];

  if (error) {
    return (
      <Card className="overflow-hidden bg-white/10 backdrop-blur-md border-white/20">
        <CardContent className="p-8 text-center">
          <div className="text-red-400 mb-4">⚠️ {error}</div>
          <p className="text-white/80 text-sm">
            Please ensure you have:
            <br />• Valid Google Maps API key
            <br />• Maps JavaScript API enabled
            <br />• Correct domain restrictions
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Map Container */}
      <Card className="overflow-hidden bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-white">
            <Crosshair className="w-5 h-5" />
            Google Maps with Crosshair
          </CardTitle>
          <p className="text-white/80 text-sm">
            Move the map to see real-time coordinates at the crosshair center.
            Toggle coordinate formats and copy results.
          </p>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Map Type Controls */}
            <div className="flex flex-wrap gap-2">
              <span className="text-white font-medium">Map type:</span>
              {mapTypes.map((type) => (
                <Button
                  key={type.id}
                  size="sm"
                  variant={mapType === type.id ? "default" : "outline"}
                  onClick={() => changeMapType(type.id as any)}
                  className={
                    mapType === type.id
                      ? "bg-white text-black"
                      : "bg-white/20 text-white border-white/30 hover:bg-white/30"
                  }
                >
                  <Layers className="w-4 h-4 mr-1" />
                  {type.label}
                </Button>
              ))}
              <Button
                size="sm"
                onClick={getCurrentLocation}
                className="bg-blue-600 hover:bg-blue-700 text-white ml-auto"
              >
                <MapPin className="w-4 h-4 mr-1" />
                My Location
              </Button>
            </div>

            {/* Map Container */}
            <div className="relative">
              <div
                ref={mapRef}
                className="w-full border-2 border-white/20 rounded-lg overflow-hidden"
                style={{ height: `${height}px` }}
              />

              {/* Loading State */}
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                  <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                    <div>Loading Google Maps...</div>
                  </div>
                </div>
              )}

              {/* Crosshair Overlay */}
              {!isLoading && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative">
                    {/* Horizontal line */}
                    <div className="absolute w-8 h-0.5 bg-red-500 shadow-lg -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2"></div>
                    {/* Vertical line */}
                    <div className="absolute w-0.5 h-8 bg-red-500 shadow-lg -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2"></div>
                    {/* Center circle */}
                    <div className="absolute w-3 h-3 bg-red-500 rounded-full shadow-lg -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2 border-2 border-white"></div>
                  </div>
                </div>
              )}
            </div>

            {/* Format Toggles */}
            <div className="flex flex-wrap gap-3">
              <span className="text-white font-medium">Show formats:</span>
              {formatDisplays.map(({ key, label }) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={`format-${key}`}
                    checked={selectedFormats.has(key)}
                    onCheckedChange={() => toggleFormat(key)}
                    className="border-white/30"
                  />
                  <Label
                    htmlFor={`format-${key}`}
                    className="text-white/90 text-sm"
                  >
                    {key}
                  </Label>
                </div>
              ))}
            </div>

            {/* Coordinate Results */}
            {coordinates && (
              <div className="space-y-3">
                {formatDisplays
                  .filter(({ key }) => selectedFormats.has(key))
                  .map(({ key, label, color }) => {
                    const value = coordinates[key];
                    const isError = isErrorResult(value);

                    return (
                      <div
                        key={key}
                        className="flex items-center justify-between p-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <Badge className={color}>{key}</Badge>
                          <div>
                            <div className="text-white font-medium text-sm">
                              {label}
                            </div>
                            <div
                              className={`font-mono text-sm ${
                                isError ? "text-red-300" : "text-white/90"
                              }`}
                            >
                              {value}
                            </div>
                          </div>
                        </div>
                        {!isError && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(value, key)}
                            className="text-white/80 hover:text-white hover:bg-white/10"
                          >
                            {copiedField === key ? (
                              <CheckCircle className="w-4 h-4 text-green-400" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}

            {/* Navigation Links */}
            <div className="flex gap-3">
              <Button
                onClick={() =>
                  window.open(getNavigationUrls().googleMaps, "_blank")
                }
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Navigation className="w-4 h-4 mr-2" />
                Google Maps
              </Button>
              <Button
                onClick={() => window.open(getNavigationUrls().waze, "_blank")}
                className="bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                <Navigation className="w-4 h-4 mr-2" />
                Waze
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
