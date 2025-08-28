"use client";

import { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import {
  convertCoordinates,
  generateNavigationUrls,
  isErrorResult,
  parseMGRS,
  parseBNG,
  parseDD,
  parseDDM,
  parseDMS,
  type CoordinateFormat,
  type FormattedCoordinates,
} from "@/lib/coords";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Copy,
  CheckCircle,
  MapPin,
  Crosshair,
  Navigation,
  Layers,
  ChevronDown,
  Search,
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
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
  const [currentFormatIndex, setCurrentFormatIndex] = useState(0);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [mapType, setMapType] = useState<
    "roadmap" | "satellite" | "hybrid" | "terrain"
  >("hybrid");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentCenter, setCurrentCenter] = useState<{
    lat: number;
    lng: number;
  }>({
    lat: initialCenter[1],
    lng: initialCenter[0],
  });
  const [currentZoom, setCurrentZoom] = useState(initialZoom);

  const mapRef = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const autocomplete = useRef<google.maps.places.Autocomplete | null>(null);
  const [mapKey, setMapKey] = useState(0);

  // Convert current center to all coordinate formats
  const updateCoordinates = () => {
    if (map.current) {
      const center = map.current.getCenter();
      const zoom = map.current.getZoom();
      if (center) {
        const lat = center.lat();
        const lng = center.lng();

        // Store current position and zoom
        setCurrentCenter({ lat, lng });
        if (zoom !== undefined) {
          setCurrentZoom(zoom);
        }

        try {
          const converted = convertCoordinates(lat, lng);
          setCoordinates(converted);
        } catch (error) {
          console.error("Coordinate conversion error:", error);
        }
      }
    }
  };

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Initialize Google Maps
  useEffect(() => {
    if (!apiKey) {
      setError("Google Maps API key is required");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const loader = new Loader({
      apiKey: apiKey,
      version: "weekly",
      libraries: ["maps", "places", "marker"],
    });

    loader
      .load()
      .then(() => {
        if (mapRef.current) {
          // Clean up existing map
          if (map.current) {
            google.maps.event.clearInstanceListeners(map.current);
          }

          map.current = new google.maps.Map(mapRef.current, {
            center: currentCenter,
            zoom: currentZoom,
            mapTypeId: mapType,
            disableDefaultUI: false,
            zoomControl: true,
            mapTypeControl: false, // Disable built-in map type control
            scaleControl: true,
            streetViewControl: false,
            rotateControl: false,
            fullscreenControl: false,
            gestureHandling: "greedy",
          });

          // Update coordinates when map moves
          map.current.addListener("center_changed", updateCoordinates);
          map.current.addListener("zoom_changed", updateCoordinates);

          // Initialize Places Autocomplete (New API)
          if (searchInputRef.current) {
            try {
              autocomplete.current = new google.maps.places.Autocomplete(
                searchInputRef.current,
                {
                  types: ["establishment", "geocode"],
                  fields: ["place_id", "geometry", "name", "formatted_address"],
                }
              );

              autocomplete.current.addListener("place_changed", () => {
                const place = autocomplete.current?.getPlace();
                if (place?.geometry?.location && map.current) {
                  const location = place.geometry.location;
                  map.current.setCenter(location);
                  map.current.setZoom(15);
                  setSearchValue(place.formatted_address || place.name || "");
                  setIsSearching(false);
                }
              });
            } catch (error) {
              console.warn("Places Autocomplete not available:", error);
            }
          }

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
  }, [apiKey, initialCenter, initialZoom, mapKey]);

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

  const nextFormat = () => {
    setCurrentFormatIndex((prev) => (prev + 1) % formatDisplays.length);
  };

  const prevFormat = () => {
    setCurrentFormatIndex((prev) =>
      prev === 0 ? formatDisplays.length - 1 : prev - 1
    );
  };

  const goToFormat = (index: number) => {
    setCurrentFormatIndex(index);
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

  const toggleFullscreen = () => {
    // Capture current position before switching
    if (map.current) {
      const center = map.current.getCenter();
      const zoom = map.current.getZoom();
      if (center) {
        setCurrentCenter({ lat: center.lat(), lng: center.lng() });
      }
      if (zoom !== undefined) {
        setCurrentZoom(zoom);
      }
    }

    setIsFullscreen(!isFullscreen);
    // Force map re-initialization
    setMapKey((prev) => prev + 1);
  };

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    if (isFullscreen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isFullscreen]);

  // Handle map resize when switching fullscreen modes
  useEffect(() => {
    if (map.current) {
      // Multiple timeouts to ensure proper resize
      const timeoutId1 = setTimeout(() => {
        google.maps.event.trigger(map.current, "resize");
      }, 50);

      const timeoutId2 = setTimeout(() => {
        if (map.current) {
          const center = map.current.getCenter();
          if (center) {
            map.current.setCenter(center);
          }
          google.maps.event.trigger(map.current, "resize");
          updateCoordinates();
        }
      }, 200);

      return () => {
        clearTimeout(timeoutId1);
        clearTimeout(timeoutId2);
      };
    }
  }, [isFullscreen]);

  const parseCoordinateInput = (
    input: string
  ): { lat: number; lng: number } | null => {
    // Try MGRS format first (most specific)
    const mgrsResult = parseMGRS(input);
    if (mgrsResult) return mgrsResult;

    // Try BNG format
    const bngResult = parseBNG(input);
    if (bngResult) return bngResult;

    // Try DMS format (most detailed traditional format)
    const dmsResult = parseDMS(input);
    if (dmsResult) return dmsResult;

    // Try DDM format
    const ddmResult = parseDDM(input);
    if (ddmResult) return ddmResult;

    // Try DD format (simplest, try last to avoid false positives)
    const ddResult = parseDD(input);
    if (ddResult) return ddResult;

    return null;
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchValue.trim() || !map.current) return;

    setIsSearching(true);

    try {
      // First try to parse as coordinate input (MGRS, BNG, DD)
      const coords = parseCoordinateInput(searchValue);

      if (coords) {
        // Direct coordinate input - center map immediately
        map.current.setCenter({ lat: coords.lat, lng: coords.lng });
        map.current.setZoom(15);
        setIsSearching(false);
        return;
      }

      // Try Places API text search first (better for airports, ICAO codes, etc.)
      const service = new google.maps.places.PlacesService(map.current);

      service.textSearch(
        {
          query: searchValue,
        },
        (results, status) => {
          if (
            status === google.maps.places.PlacesServiceStatus.OK &&
            results?.[0]
          ) {
            const result = results[0];
            if (result.geometry?.location && map.current) {
              map.current.setCenter(result.geometry.location);
              map.current.setZoom(15);
              setSearchValue(
                result.formatted_address || result.name || searchValue
              );
              setIsSearching(false);
              return;
            }
          }

          // Fall back to geocoding if Places API doesn't find anything
          const geocoder = new google.maps.Geocoder();

          geocoder.geocode(
            {
              address: searchValue,
            },
            (geocodeResults, geocodeStatus) => {
              setIsSearching(false);
              if (
                geocodeStatus === google.maps.GeocoderStatus.OK &&
                geocodeResults?.[0]
              ) {
                const result = geocodeResults[0];
                if (result.geometry?.location && map.current) {
                  map.current.setCenter(result.geometry.location);
                  map.current.setZoom(15);
                  setSearchValue(result.formatted_address || searchValue);
                }
              } else {
                alert(
                  "Location not found. Please try a different search term or coordinate format."
                );
              }
            }
          );
        }
      );
    } catch (error) {
      console.error("Search error:", error);
      setIsSearching(false);
      alert("Search service unavailable. Please try again later.");
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

  const mapContent = (
    <div className="space-y-2 sm:space-y-4">
      {/* Location Search */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" />
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="Search places or input values"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-10 bg-white/20 text-white border-white/30 placeholder:text-white/60 hover:bg-white/30 focus:bg-white/30 h-10"
          />
        </div>
        <Button
          type="submit"
          disabled={isSearching || !searchValue.trim()}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white h-10 px-4"
        >
          {isSearching ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </Button>
      </form>

      {/* Map Type Controls - Mobile Optimized */}
      <div className="flex gap-2 items-center">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-white flex-shrink-0" />
          <Select
            value={mapType}
            onValueChange={(value) => changeMapType(value as any)}
          >
            <SelectTrigger className="w-auto min-w-[100px] bg-white/20 text-white border-white/30 hover:bg-white/30 h-10">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent className="bg-black/90 border-white/20">
              {mapTypes.map((type) => (
                <SelectItem
                  key={type.id}
                  value={type.id}
                  className="text-white hover:bg-white/20 focus:bg-white/20"
                >
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={getCurrentLocation}
          className="bg-blue-600 hover:bg-blue-700 text-white h-10 w-10 p-0 flex-shrink-0"
        >
          <MapPin className="w-4 h-4" />
        </Button>
        <Button
          onClick={toggleFullscreen}
          className="bg-purple-600 hover:bg-purple-700 text-white h-10 w-10 p-0 flex-shrink-0"
        >
          {isFullscreen ? (
            <Minimize className="w-4 h-4" />
          ) : (
            <Maximize className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Map Container */}
      <div className="relative">
        <div
          key={mapKey}
          ref={mapRef}
          className="w-full border-2 border-white/20 rounded-lg overflow-hidden"
          style={{
            height: isFullscreen
              ? "calc(100vh - 220px)"
              : isMobile
              ? "75vh"
              : `${height}px`,
          }}
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
            </div>
          </div>
        )}

        {/* Coordinate Slider Overlay */}
        {!isLoading && coordinates && (
          <div className="absolute top-2 left-2 pointer-events-auto">
            <div className="bg-black/90 backdrop-blur-sm rounded-lg border border-white/30 p-3 sm:p-4 w-80 sm:w-96 max-w-[calc(100vw-32px)]">
              {/* Current Format Display */}
              <div className="flex items-center justify-between mb-3 gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-white/70 text-xs font-medium">
                    {formatDisplays[currentFormatIndex].key}
                  </span>
                  <span className="text-white/50 text-xs hidden sm:inline">
                    {formatDisplays[currentFormatIndex].label}
                  </span>
                </div>

                {/* Navigation Controls */}
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={prevFormat}
                    className="h-8 w-8 p-0 text-white/60 hover:text-white hover:bg-white/20"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-white/60 text-xs px-2">
                    {currentFormatIndex + 1}/{formatDisplays.length}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={nextFormat}
                    className="h-8 w-8 p-0 text-white/60 hover:text-white hover:bg-white/20"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Coordinate Value */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  {(() => {
                    const currentFormat = formatDisplays[currentFormatIndex];
                    const value = coordinates[currentFormat.key];
                    const isError = isErrorResult(value);

                    return (
                      <div
                        className={`${
                          isError
                            ? "text-red-300 text-xs sm:text-sm"
                            : "text-white font-bold text-xs sm:text-sm md:text-base tracking-wide"
                        } break-all`}
                        style={{
                          fontFamily:
                            'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                        }}
                      >
                        {value}
                      </div>
                    );
                  })()}
                </div>

                {/* Copy Button */}
                {(() => {
                  const currentFormat = formatDisplays[currentFormatIndex];
                  const value = coordinates[currentFormat.key];
                  const isError = isErrorResult(value);

                  return !isError ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(value, currentFormat.key)}
                      className="h-8 w-8 p-0 text-white/60 hover:text-white hover:bg-white/20 flex-shrink-0"
                    >
                      {copiedField === currentFormat.key ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  ) : null;
                })()}
              </div>

              {/* Format Indicators */}
              <div className="flex justify-center gap-1 mt-3">
                {formatDisplays.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToFormat(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentFormatIndex
                        ? "bg-white"
                        : "bg-white/30 hover:bg-white/50"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Links - Mobile Optimized */}
      <div className="flex gap-2">
        <Button
          onClick={() => window.open(getNavigationUrls().googleMaps, "_blank")}
          className="bg-blue-600 hover:bg-blue-700 text-white h-10 flex-1 text-xs sm:text-sm"
        >
          <Navigation className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
          Google Maps
        </Button>
        <Button
          onClick={() => window.open(getNavigationUrls().waze, "_blank")}
          className="bg-cyan-600 hover:bg-cyan-700 text-white h-10 flex-1 text-xs sm:text-sm"
        >
          <Navigation className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
          Waze
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Normal View */}
      {!isFullscreen && (
        <div className="w-full max-w-6xl mx-auto space-y-6">
          <Card className="overflow-hidden bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-2 sm:p-4">{mapContent}</CardContent>
          </Card>
        </div>
      )}

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-sm">
          <div className="h-full w-full p-4 pb-6">
            {/* Map content in fullscreen */}
            <div className="h-full overflow-hidden">{mapContent}</div>
          </div>
        </div>
      )}
    </>
  );
}
