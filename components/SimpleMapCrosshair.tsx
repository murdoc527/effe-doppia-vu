"use client";

import { useState, useRef, useEffect } from "react";
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
import { Copy, CheckCircle, MapPin, Crosshair, Navigation } from "lucide-react";

interface SimpleMapCrosshairProps {
  height?: number;
  initialCenter?: [number, number];
  initialZoom?: number;
}

export function SimpleMapCrosshair({
  height = 420,
  initialCenter = [-0.1278, 51.5074], // London
  initialZoom = 12,
}: SimpleMapCrosshairProps) {
  const [coordinates, setCoordinates] = useState<FormattedCoordinates | null>(
    null
  );
  const [selectedFormats, setSelectedFormats] = useState<Set<CoordinateFormat>>(
    new Set(["DD", "DDM", "DMS", "BNG", "MGRS"])
  );
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [currentCenter, setCurrentCenter] = useState(initialCenter);
  const [zoom, setZoom] = useState(initialZoom);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{
    x: number;
    y: number;
    centerLat: number;
    centerLng: number;
  } | null>(null);

  const mapRef = useRef<HTMLDivElement>(null);

  // Convert current center to all coordinate formats
  useEffect(() => {
    try {
      const converted = convertCoordinates(currentCenter[1], currentCenter[0]); // lat, lng
      setCoordinates(converted);
    } catch (error) {
      console.error("Coordinate conversion error:", error);
    }
  }, [currentCenter]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (mapRef.current) {
      const rect = mapRef.current.getBoundingClientRect();
      setIsDragging(true);
      setDragStart({
        x: e.clientX,
        y: e.clientY,
        centerLat: currentCenter[1],
        centerLng: currentCenter[0],
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && dragStart && mapRef.current) {
      const rect = mapRef.current.getBoundingClientRect();
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      // Convert pixel movement to lat/lng movement based on zoom
      const scale = 0.0001 * Math.pow(2, 12 - zoom); // Adjust scale based on zoom
      const newLng = dragStart.centerLng - deltaX * scale;
      const newLat = dragStart.centerLat + deltaY * scale;

      // Constrain to valid bounds
      const constrainedLat = Math.max(-90, Math.min(90, newLat));
      const constrainedLng = Math.max(-180, Math.min(180, newLng));

      setCurrentCenter([constrainedLng, constrainedLat]);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const newZoom = Math.max(1, Math.min(20, zoom + (e.deltaY > 0 ? -1 : 1)));
    setZoom(newZoom);
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
    if (!coordinates) return { googleMaps: "", waze: "" };
    return generateNavigationUrls(currentCenter[1], currentCenter[0]);
  };

  const getCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentCenter([longitude, latitude]);
          setZoom(15);
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

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Map Container */}
      <Card className="overflow-hidden bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-white">
            <Crosshair className="w-5 h-5" />
            Interactive Map with Crosshair
          </CardTitle>
          <p className="text-white/80 text-sm">
            Move the map to see real-time coordinates at the crosshair center.
            Toggle coordinate formats and copy results.
          </p>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Map Container */}
            <div className="relative">
              <div
                ref={mapRef}
                className="w-full bg-gradient-to-br from-emerald-50 via-blue-50 to-cyan-100 border-2 border-slate-300 rounded-lg overflow-hidden cursor-move relative shadow-inner"
                style={{ height: `${height}px` }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
              >
                {/* Coordinate Grid Lines */}
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    {/* Fine grid pattern */}
                    <pattern
                      id="fine-grid"
                      width="20"
                      height="20"
                      patternUnits="userSpaceOnUse"
                    >
                      <path
                        d="M 20 0 L 0 0 0 20"
                        fill="none"
                        stroke="#e2e8f0"
                        strokeWidth="0.5"
                        opacity="0.4"
                      />
                    </pattern>
                    {/* Major grid pattern */}
                    <pattern
                      id="major-grid"
                      width="100"
                      height="100"
                      patternUnits="userSpaceOnUse"
                    >
                      <path
                        d="M 100 0 L 0 0 0 100"
                        fill="none"
                        stroke="#64748b"
                        strokeWidth="1"
                        opacity="0.6"
                      />
                    </pattern>
                    {/* Water/land texture */}
                    <pattern
                      id="terrain"
                      width="50"
                      height="50"
                      patternUnits="userSpaceOnUse"
                    >
                      <rect width="50" height="50" fill="#f0f9ff" />
                      <circle
                        cx="10"
                        cy="10"
                        r="2"
                        fill="#bfdbfe"
                        opacity="0.3"
                      />
                      <circle
                        cx="30"
                        cy="25"
                        r="1.5"
                        fill="#93c5fd"
                        opacity="0.3"
                      />
                      <circle
                        cx="40"
                        cy="35"
                        r="1"
                        fill="#60a5fa"
                        opacity="0.3"
                      />
                      <path
                        d="M0,20 Q25,15 50,20"
                        stroke="#10b981"
                        strokeWidth="0.5"
                        fill="none"
                        opacity="0.3"
                      />
                      <path
                        d="M0,35 Q25,30 50,35"
                        stroke="#059669"
                        strokeWidth="0.5"
                        fill="none"
                        opacity="0.3"
                      />
                    </pattern>
                  </defs>

                  {/* Background terrain */}
                  <rect width="100%" height="100%" fill="url(#terrain)" />

                  {/* Fine grid overlay */}
                  <rect width="100%" height="100%" fill="url(#fine-grid)" />

                  {/* Major grid overlay */}
                  <rect width="100%" height="100%" fill="url(#major-grid)" />

                  {/* Coordinate labels based on current center */}
                  <g className="coordinate-labels">
                    <text
                      x="20"
                      y="30"
                      fill="#475569"
                      fontSize="10"
                      fontFamily="monospace"
                    >
                      {currentCenter[1].toFixed(3)}°N
                    </text>
                    <text
                      x="20"
                      y="45"
                      fill="#475569"
                      fontSize="10"
                      fontFamily="monospace"
                    >
                      {currentCenter[0].toFixed(3)}°E
                    </text>
                    <text
                      x="20"
                      y={height - 20}
                      fill="#475569"
                      fontSize="10"
                      fontFamily="monospace"
                    >
                      Zoom: {zoom}
                    </text>
                  </g>
                </svg>

                {/* Crosshair */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative">
                    {/* Horizontal line */}
                    <div className="absolute w-8 h-0.5 bg-white shadow-md -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2"></div>
                    {/* Vertical line */}
                    <div className="absolute w-0.5 h-8 bg-white shadow-md -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2"></div>
                    {/* Center circle */}
                    <div className="absolute w-2 h-2 bg-white rounded-full shadow-md -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2"></div>
                  </div>
                </div>

                {/* Controls */}
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  <Button
                    size="sm"
                    onClick={() => setZoom(Math.min(20, zoom + 1))}
                    className="bg-white/20 hover:bg-white/30 text-white border-white/20"
                  >
                    +
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setZoom(Math.max(1, zoom - 1))}
                    className="bg-white/20 hover:bg-white/30 text-white border-white/20"
                  >
                    -
                  </Button>
                  <Button
                    size="sm"
                    onClick={getCurrentLocation}
                    className="bg-white/20 hover:bg-white/30 text-white border-white/20"
                  >
                    <MapPin className="w-4 h-4" />
                  </Button>
                </div>
              </div>
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
