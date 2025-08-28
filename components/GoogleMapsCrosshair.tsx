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
import { Slider } from "@/components/ui/slider";
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
  Plus,
  Minus,
  Ruler,
  Check,
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
  const [showZoomSlider, setShowZoomSlider] = useState(false);
  const [mapScale, setMapScale] = useState({
    distance: "1 km",
    imperialDistance: "0.6 mi",
    pixels: 100,
    meters: 1000,
  });
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [measureStep, setMeasureStep] = useState<
    "idle" | "first-point" | "second-point"
  >("idle");
  const [measurePoints, setMeasurePoints] = useState<google.maps.LatLng[]>([]);
  const [measureResult, setMeasureResult] = useState<{
    distance: string;
    bearing: string;
    distanceMeters: number;
  } | null>(null);
  const [measureSwapCount, setMeasureSwapCount] = useState(0);

  const mapRef = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const autocomplete = useRef<google.maps.places.Autocomplete | null>(null);
  const [mapKey, setMapKey] = useState(0);
  const measureMarkersRef = useRef<google.maps.Marker[]>([]);
  const measureLineRef = useRef<google.maps.Polyline | null>(null);

  // Calculate distance and bearing between two points
  const calculateDistanceAndBearing = (
    point1: google.maps.LatLng,
    point2: google.maps.LatLng
  ) => {
    // Calculate distance using Haversine formula
    const R = 6371000; // Earth's radius in meters
    const lat1Rad = (point1.lat() * Math.PI) / 180;
    const lat2Rad = (point2.lat() * Math.PI) / 180;
    const deltaLatRad = ((point2.lat() - point1.lat()) * Math.PI) / 180;
    const deltaLngRad = ((point2.lng() - point1.lng()) * Math.PI) / 180;

    const a =
      Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
      Math.cos(lat1Rad) *
        Math.cos(lat2Rad) *
        Math.sin(deltaLngRad / 2) *
        Math.sin(deltaLngRad / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceMeters = R * c;

    // Calculate bearing
    const y = Math.sin(deltaLngRad) * Math.cos(lat2Rad);
    const x =
      Math.cos(lat1Rad) * Math.sin(lat2Rad) -
      Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(deltaLngRad);
    const bearingRad = Math.atan2(y, x);
    const bearingDeg = ((bearingRad * 180) / Math.PI + 360) % 360;

    // Format distance
    let distanceStr: string;
    if (distanceMeters < 1000) {
      distanceStr = `${Math.round(distanceMeters)} m`;
    } else {
      distanceStr = `${(distanceMeters / 1000).toFixed(2)} km`;
    }

    // Format bearing
    const bearingStr = `${Math.round(bearingDeg)}°`;

    return { distance: distanceStr, bearing: bearingStr, distanceMeters };
  };

  // Start measuring mode - place first green marker at crosshair
  const startMeasuring = () => {
    // If there are already measurement points, clear everything first
    if (measurePoints.length > 0 || measureResult) {
      cancelMeasuring();
      return;
    }

    if (map.current) {
      const center = map.current.getCenter();
      if (center) {
        setIsMeasuring(true);
        setMeasureStep("first-point");
        setMeasurePoints([center]);
        setMeasureResult(null);

        // Add green marker at crosshair center
        const marker = new google.maps.Marker({
          position: center,
          map: map.current,
          title: "First Point",
          draggable: true, // Enable dragging
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#00ff00", // Green color
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          },
        });
        measureMarkersRef.current = [marker];
      }
    }
  };

  // Confirm second point and complete measurement
  const confirmSecondPoint = () => {
    if (map.current && measurePoints.length === 1) {
      const center = map.current.getCenter();
      if (center) {
        const newPoints = [...measurePoints, center];
        setMeasurePoints(newPoints);

        // Add red marker for second point
        const redMarker = new google.maps.Marker({
          position: center,
          map: map.current,
          title: "Second Point (Click to reverse)",
          draggable: true, // Enable dragging
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#ff0000", // Red color
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          },
        });

        measureMarkersRef.current.push(redMarker);

        // Calculate distance and bearing
        const result = calculateDistanceAndBearing(newPoints[0], newPoints[1]);
        setMeasureResult(result);

        // Draw great circle line between points
        measureLineRef.current = new google.maps.Polyline({
          path: newPoints,
          geodesic: true, // Great circle
          strokeColor: "#ff0000",
          strokeOpacity: 1.0,
          strokeWeight: 3,
          map: map.current,
        });

        // Complete measurement
        setMeasureStep("idle");
        setIsMeasuring(false);
      }
    }
  };

  // Reverse measurement - any red marker click should swap points
  const reverseMeasurement = (clickedMarkerIsGreen: boolean) => {
    console.log(
      "reverseMeasurement called with clickedMarkerIsGreen:",
      clickedMarkerIsGreen
    );
    console.log("Current measurePoints:", measurePoints);

    if (
      measurePoints.length === 2 &&
      map.current &&
      measureMarkersRef.current.length === 2
    ) {
      // Only red marker click should do anything
      if (clickedMarkerIsGreen) {
        // Clicked green marker - do nothing, just return
        console.log("Green marker clicked - no action taken");
        return;
      }

      // Get current marker positions (not from state, but from actual markers)
      const currentGreenMarker = measureMarkersRef.current[0];
      const currentRedMarker = measureMarkersRef.current[1];
      const currentGreenPosition = currentGreenMarker.getPosition();
      const currentRedPosition = currentRedMarker.getPosition();

      if (!currentGreenPosition || !currentRedPosition) return;

      // Clicked red marker - swap points to make red the new start
      // Use current marker positions, not state positions
      const newFirstPoint = currentRedPosition; // Red becomes green
      const newSecondPoint = currentGreenPosition; // Green becomes red

      const reversedPoints = [newFirstPoint, newSecondPoint];
      setMeasurePoints(reversedPoints);
      setMeasureSwapCount((prev) => prev + 1); // Increment swap count to trigger useEffect

      // Move crosshair to the new first point (clicked red marker position)
      map.current.setCenter(newFirstPoint);

      // Recalculate with new direction
      const result = calculateDistanceAndBearing(
        reversedPoints[0],
        reversedPoints[1]
      );
      setMeasureResult(result);

      // Clear existing markers and line
      measureMarkersRef.current.forEach((marker) => marker.setMap(null));
      if (measureLineRef.current) {
        measureLineRef.current.setMap(null);
      }

      // Create new markers
      const greenMarker = new google.maps.Marker({
        position: reversedPoints[0],
        map: map.current,
        title: "First Point (Click to move crosshair here)",
        draggable: true, // Enable dragging
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#00ff00", // Green for start point
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });

      const redMarker = new google.maps.Marker({
        position: reversedPoints[1],
        map: map.current,
        title: "Second Point (Click to swap to start)",
        draggable: true, // Enable dragging
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#ff0000", // Red for end point
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });

      // Add click listeners with clear marker identification
      greenMarker.addListener("click", () => {
        console.log("Green marker clicked (in reverseMeasurement)!");
        reverseMeasurement(true); // true = green marker clicked
      });

      redMarker.addListener("click", () => {
        console.log("Red marker clicked (in reverseMeasurement)!");
        reverseMeasurement(false); // false = red marker clicked
      });

      // Add drag listeners to the new markers
      greenMarker.addListener("dragend", () => {
        const newPosition = greenMarker.getPosition();
        const redPosition = redMarker.getPosition();
        if (newPosition && redPosition) {
          const newPoints = [newPosition, redPosition];
          setMeasurePoints(newPoints);

          // Recalculate distance and bearing
          const result = calculateDistanceAndBearing(
            newPoints[0],
            newPoints[1]
          );
          setMeasureResult(result);

          // Update the polyline
          if (measureLineRef.current) {
            measureLineRef.current.setPath(newPoints);
          }
        }
      });

      redMarker.addListener("dragend", () => {
        const greenPosition = greenMarker.getPosition();
        const newPosition = redMarker.getPosition();
        if (greenPosition && newPosition) {
          const newPoints = [greenPosition, newPosition];
          setMeasurePoints(newPoints);

          // Recalculate distance and bearing
          const result = calculateDistanceAndBearing(
            newPoints[0],
            newPoints[1]
          );
          setMeasureResult(result);

          // Update the polyline
          if (measureLineRef.current) {
            measureLineRef.current.setPath(newPoints);
          }
        }
      });

      measureMarkersRef.current = [greenMarker, redMarker];

      // Draw new line
      measureLineRef.current = new google.maps.Polyline({
        path: reversedPoints,
        geodesic: true,
        strokeColor: "#ff0000",
        strokeOpacity: 1.0,
        strokeWeight: 3,
        map: map.current,
      });
    }
  };

  // Cancel measuring and clear everything
  const cancelMeasuring = () => {
    setIsMeasuring(false);
    setMeasureStep("idle");
    setMeasurePoints([]);
    setMeasureResult(null);
    setMeasureSwapCount(0); // Reset swap count

    // Clear markers
    measureMarkersRef.current.forEach((marker) => marker.setMap(null));
    measureMarkersRef.current = [];

    // Clear line
    if (measureLineRef.current) {
      measureLineRef.current.setMap(null);
      measureLineRef.current = null;
    }
  };

  // Add click listeners to markers when measurement is complete
  useEffect(() => {
    if (
      measurePoints.length === 2 &&
      !isMeasuring &&
      measureMarkersRef.current.length === 2
    ) {
      console.log(
        "Adding click listeners to markers, measurePoints length:",
        measurePoints.length,
        "swap count:",
        measureSwapCount
      );

      const greenMarker = measureMarkersRef.current[0];
      const redMarker = measureMarkersRef.current[1];

      // Clear any existing listeners first
      google.maps.event.clearInstanceListeners(greenMarker);
      google.maps.event.clearInstanceListeners(redMarker);

      greenMarker.setTitle("First Point (Click to move crosshair here)");

      greenMarker.addListener("click", () => {
        console.log("Green marker clicked!");
        reverseMeasurement(true); // true = green marker clicked
      });

      redMarker.addListener("click", () => {
        console.log("Red marker clicked!");
        reverseMeasurement(false); // false = red marker clicked
      });

      // Add drag listeners to update measurement when markers are moved
      greenMarker.addListener("dragend", () => {
        const newPosition = greenMarker.getPosition();
        const redPosition = redMarker.getPosition();
        if (newPosition && redPosition) {
          const newPoints = [newPosition, redPosition];
          setMeasurePoints(newPoints);

          // Recalculate distance and bearing
          const result = calculateDistanceAndBearing(
            newPoints[0],
            newPoints[1]
          );
          setMeasureResult(result);

          // Update the polyline
          if (measureLineRef.current) {
            measureLineRef.current.setPath(newPoints);
          }
        }
      });

      redMarker.addListener("dragend", () => {
        const greenPosition = greenMarker.getPosition();
        const newPosition = redMarker.getPosition();
        if (greenPosition && newPosition) {
          const newPoints = [greenPosition, newPosition];
          setMeasurePoints(newPoints);

          // Recalculate distance and bearing
          const result = calculateDistanceAndBearing(
            newPoints[0],
            newPoints[1]
          );
          setMeasureResult(result);

          // Update the polyline
          if (measureLineRef.current) {
            measureLineRef.current.setPath(newPoints);
          }
        }
      });
    }
  }, [isMeasuring, measureSwapCount]); // Removed measurePoints.length to prevent circular dependency

  // Calculate dynamic scale bar with appropriate intervals
  const calculateScale = () => {
    if (map.current) {
      const zoom = map.current.getZoom();
      const center = map.current.getCenter();
      if (zoom !== undefined && center) {
        const lat = center.lat();

        // Earth's circumference at equator in meters
        const earthCircumference = 40075016.686;

        // Calculate meters per pixel at this zoom level and latitude
        const metersPerPixel =
          (earthCircumference * Math.cos((lat * Math.PI) / 180)) /
          Math.pow(2, zoom + 8);

        // Target scale bar length in pixels (flexible)
        const targetPixels = 200;
        const targetMeters = metersPerPixel * targetPixels;

        // Choose nice round numbers for scale intervals
        const niceDistances = [
          1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000,
          10000, 20000, 25000, 50000, 100000, 200000, 250000, 500000, 1000000,
        ];

        // Find the best distance that's close to our target
        let bestDistance = niceDistances[0];
        for (const distance of niceDistances) {
          if (distance <= targetMeters * 1.2) {
            bestDistance = distance;
          } else {
            break;
          }
        }

        // Calculate actual pixel width for this distance
        const actualPixels = bestDistance / metersPerPixel;

        // Format metric distance
        let metricLabel: string;
        if (bestDistance < 1000) {
          metricLabel = `${bestDistance} m`;
        } else {
          metricLabel = `${bestDistance / 1000} km`;
        }

        // Convert to miles for imperial scale
        const miles = bestDistance * 0.000621371;
        let imperialLabel: string;
        if (miles < 1) {
          const feet = bestDistance * 3.28084;
          if (feet < 1000) {
            imperialLabel = `${Math.round(feet)} ft`;
          } else {
            imperialLabel = `${(feet / 5280).toFixed(1)} mi`;
          }
        } else {
          imperialLabel = `${miles.toFixed(miles < 10 ? 1 : 0)} mi`;
        }

        setMapScale({
          distance: metricLabel,
          imperialDistance: imperialLabel,
          pixels: Math.round(actualPixels),
          meters: bestDistance,
        });
      }
    }
  };

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

        // Update scale
        calculateScale();

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
            disableDefaultUI: true, // Disable all default UI
            zoomControl: false,
            mapTypeControl: false,
            scaleControl: false,
            streetViewControl: false,
            rotateControl: false,
            fullscreenControl: false,
            gestureHandling: "greedy",
            keyboardShortcuts: false,
          });

          // Update coordinates when map moves
          map.current.addListener("center_changed", updateCoordinates);
          map.current.addListener("zoom_changed", () => {
            updateCoordinates();
            setShowZoomSlider(true);
          });

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

              // Style the autocomplete dropdown to match our modal design
              setTimeout(() => {
                const style = document.createElement("style");
                style.textContent = `
                  .pac-container {
                    background: rgba(0, 0, 0, 0.7) !important;
                    backdrop-filter: blur(16px) !important;
                    border: 1px solid rgba(255, 255, 255, 0.3) !important;
                    border-radius: 12px !important;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3) !important;
                    margin-top: 4px !important;
                    overflow: hidden !important;
                  }
                  .pac-item {
                    background: transparent !important;
                    color: rgba(255, 255, 255, 0.9) !important;
                    border: none !important;
                    padding: 12px 16px !important;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.2) !important;
                    transition: all 0.2s ease !important;
                  }
                  .pac-item:hover, .pac-item-selected {
                    background: rgba(255, 255, 255, 0.2) !important;
                    color: white !important;
                  }
                  .pac-item:last-child {
                    border-bottom: none !important;
                  }
                  .pac-item .pac-icon {
                    background-image: none !important;
                    width: 16px !important;
                    height: 16px !important;
                    margin-right: 12px !important;
                  }
                  .pac-item .pac-icon::before {
                    content: "📍" !important;
                    font-size: 14px !important;
                    line-height: 16px !important;
                  }
                  .pac-item .pac-item-query {
                    color: white !important;
                    font-weight: 500 !important;
                  }
                  .pac-item .pac-matched {
                    color: rgba(255, 255, 255, 0.7) !important;
                    font-weight: 400 !important;
                  }
                  .pac-logo::after {
                    display: none !important;
                  }
                `;
                document.head.appendChild(style);
              }, 100);
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

  const handleZoomChange = (value: number[]) => {
    const newZoom = value[0];
    setCurrentZoom(newZoom);
    setShowZoomSlider(true);
    if (map.current) {
      map.current.setZoom(newZoom);
    }
  };

  // Auto-hide zoom slider after 1 second of inactivity
  useEffect(() => {
    if (showZoomSlider) {
      const timer = setTimeout(() => {
        setShowZoomSlider(false);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [showZoomSlider, currentZoom]);

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
        <div className="relative flex-1 max-w-md">
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
        {!isMeasuring ? (
          <Button
            onClick={startMeasuring}
            className="bg-orange-600 hover:bg-orange-700 text-white h-10 w-10 p-0 flex-shrink-0"
          >
            <Ruler className="w-4 h-4" />
          </Button>
        ) : (
          <>
            <Button
              onClick={confirmSecondPoint}
              className="bg-green-600 hover:bg-green-700 text-white h-10 w-10 p-0 flex-shrink-0"
            >
              <Check className="w-4 h-4" />
            </Button>
            <Button
              onClick={cancelMeasuring}
              className="bg-red-600 hover:bg-red-700 text-white h-10 w-10 p-0 flex-shrink-0"
            >
              ×
            </Button>
          </>
        )}
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

        {/* Measurement Result Display */}
        {measureResult && (
          <div className="absolute top-20 left-2 pointer-events-auto">
            <div className="bg-black/90 backdrop-blur-sm rounded-lg border border-white/30 p-3">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-orange-400" />
                  <span className="text-white text-sm font-medium">
                    Measurement
                  </span>
                  <Button
                    onClick={() => {
                      setMeasureResult(null);
                      // Clear markers and line
                      measureMarkersRef.current.forEach((marker) =>
                        marker.setMap(null)
                      );
                      measureMarkersRef.current = [];
                      if (measureLineRef.current) {
                        measureLineRef.current.setMap(null);
                        measureLineRef.current = null;
                      }
                      setMeasurePoints([]);
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white h-6 w-6 p-0 ml-auto"
                  >
                    ×
                  </Button>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="text-white/90 text-sm">
                    <span className="text-white/70">Distance: </span>
                    <span className="font-medium">
                      {measureResult.distance}
                    </span>
                  </div>
                  <div className="text-white/90 text-sm">
                    <span className="text-white/70">True Bearing: </span>
                    <span className="font-medium">{measureResult.bearing}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Measuring Instructions */}
        {isMeasuring && (
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 pointer-events-none">
            <div className="bg-orange-600/90 backdrop-blur-sm rounded-lg border border-orange-400/30 px-3 py-2">
              <div className="text-white text-sm font-medium text-center">
                Move crosshair to target location, then click ✓ to measure
              </div>
            </div>
          </div>
        )}

        {/* Custom Zoom Slider - Bottom Positioned with Fade */}
        {!isLoading && (
          <div
            className={`absolute bottom-2 left-1/2 transform -translate-x-1/2 pointer-events-auto transition-opacity duration-500 ${
              showZoomSlider ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="bg-black/90 backdrop-blur-sm rounded-lg border border-white/30 p-3">
              <div className="flex items-center gap-3">
                <span className="text-white/70 text-xs font-medium">Zoom</span>
                <div className="w-24">
                  <Slider
                    value={[currentZoom]}
                    onValueChange={handleZoomChange}
                    min={1}
                    max={20}
                    step={0.5}
                    className="w-full"
                  />
                </div>
                <span className="text-white/60 text-xs min-w-[32px] text-center">
                  {Math.round((currentZoom / 20) * 100)}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Scale Bar */}
        {!isLoading && (
          <div className="absolute bottom-8 right-4 pointer-events-none">
            <div className="flex flex-col gap-2">
              {/* Metric Scale */}
              <div className="flex flex-col items-start gap-1">
                <div className="flex items-end">
                  <div className="relative">
                    {/* Main scale bar */}
                    <div
                      className="bg-white h-0.5"
                      style={{ width: `${mapScale.pixels}px` }}
                    ></div>
                    {/* Start tick */}
                    <div className="absolute left-0 top-0 w-0.5 h-2 bg-white transform -translate-y-1"></div>
                    {/* Quarter tick */}
                    <div
                      className="absolute top-0 w-0.5 h-1 bg-white transform -translate-y-0.5"
                      style={{ left: `${mapScale.pixels * 0.25}px` }}
                    ></div>
                    {/* Half tick */}
                    <div
                      className="absolute top-0 w-0.5 h-1.5 bg-white transform -translate-y-1"
                      style={{ left: `${mapScale.pixels * 0.5}px` }}
                    ></div>
                    {/* Three quarter tick */}
                    <div
                      className="absolute top-0 w-0.5 h-1 bg-white transform -translate-y-0.5"
                      style={{ left: `${mapScale.pixels * 0.75}px` }}
                    ></div>
                    {/* End tick */}
                    <div
                      className="absolute top-0 w-0.5 h-2 bg-white transform -translate-y-1"
                      style={{ left: `${mapScale.pixels}px` }}
                    ></div>
                  </div>
                </div>
                <div className="flex justify-between w-full text-white/70 text-xs font-medium">
                  <span>0</span>
                  <span>{mapScale.distance}</span>
                </div>
              </div>

              {/* Imperial Scale */}
              <div className="flex flex-col items-start gap-1">
                <div className="flex items-end">
                  <div className="relative">
                    {/* Main scale bar */}
                    <div
                      className="bg-white h-0.5"
                      style={{ width: `${mapScale.pixels}px` }}
                    ></div>
                    {/* Alternating black and white segments for imperial */}
                    <div className="absolute top-0 left-0 flex h-0.5">
                      <div
                        className="bg-black h-full"
                        style={{ width: `${mapScale.pixels * 0.125}px` }}
                      ></div>
                      <div
                        className="bg-white h-full"
                        style={{ width: `${mapScale.pixels * 0.125}px` }}
                      ></div>
                      <div
                        className="bg-black h-full"
                        style={{ width: `${mapScale.pixels * 0.125}px` }}
                      ></div>
                      <div
                        className="bg-white h-full"
                        style={{ width: `${mapScale.pixels * 0.125}px` }}
                      ></div>
                      <div
                        className="bg-black h-full"
                        style={{ width: `${mapScale.pixels * 0.125}px` }}
                      ></div>
                      <div
                        className="bg-white h-full"
                        style={{ width: `${mapScale.pixels * 0.125}px` }}
                      ></div>
                      <div
                        className="bg-black h-full"
                        style={{ width: `${mapScale.pixels * 0.125}px` }}
                      ></div>
                      <div
                        className="bg-white h-full"
                        style={{ width: `${mapScale.pixels * 0.125}px` }}
                      ></div>
                    </div>
                    {/* Start tick */}
                    <div className="absolute left-0 bottom-0 w-0.5 h-2 bg-white transform translate-y-1"></div>
                    {/* End tick */}
                    <div
                      className="absolute bottom-0 w-0.5 h-2 bg-white transform translate-y-1"
                      style={{ left: `${mapScale.pixels}px` }}
                    ></div>
                  </div>
                </div>
                <div className="flex justify-between w-full text-white/70 text-xs font-medium">
                  <span>0</span>
                  <span>{mapScale.imperialDistance}</span>
                </div>
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
