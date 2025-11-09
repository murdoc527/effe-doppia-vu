"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

import { Loader } from "@googlemaps/js-api-loader";
import {
  convertCoordinates,
  isErrorResult,
  parseMGRS,
  parseBNG,
  parseDD,
  parseDDM,
  parseDMS,
  type CoordinateFormat,
  type FormattedCoordinates,
  type Coordinates,
} from "@/lib/coords";
import {
  generateWaypointId,
  generateRouteId,
  generateWaypointName,
  calculateRouteSegments,
  calculateRouteStats,
  formatDistance,
  formatElevation,
  reverseRoute,
  downloadGPX,
  saveRoute,
  loadRoutes,
} from "@/lib/route-utils";
import {
  Waypoint,
  Route,
  RouteStats,
  GPXExportOptions,
} from "@/lib/route-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Navigation,
  Layers,
  Search,
  Plus,
  Route as RouteIcon,
  Download,
  Save,
  Trash2,
  Edit,
  X,
  Copy,
  CheckCircle,
  Settings,
  Menu,
  ChevronUp,
  ChevronDown,
  Trash,
  ArrowUpDown,
  Undo2,
} from "lucide-react";

interface RouteBuilderProps {
  height?: number;
  initialCenter?: [number, number];
  initialZoom?: number;
  apiKey: string;
}

interface WaypointPanelProps {
  waypoints: Waypoint[];
  setWaypoints: React.Dispatch<React.SetStateAction<Waypoint[]>>;
  routeName: string;
  setRouteName: React.Dispatch<React.SetStateAction<string>>;
  currentFormatIndex: number;
  setCurrentFormatIndex: React.Dispatch<React.SetStateAction<number>>;
  routeStats: RouteStats | null;
  formatDisplays: Array<{ key: CoordinateFormat; label: string }>;
  setShowSaveDialog: React.Dispatch<React.SetStateAction<boolean>>;
  setShowGPXDialog: React.Dispatch<React.SetStateAction<boolean>>;
  handleSearch: () => Promise<void>;
  isSearching: boolean;
  searchValue: string;
  setSearchValue: React.Dispatch<React.SetStateAction<string>>;
  deleteWaypoint: (waypointId: string) => void;
  convertCoordinates: (lat: number, lng: number) => FormattedCoordinates;
  formatElevation: (elevation: number) => string;
  editingWaypointId: string | null;
  setEditingWaypointId: React.Dispatch<React.SetStateAction<string | null>>;
  editingWaypointName: string;
  setEditingWaypointName: React.Dispatch<React.SetStateAction<string>>;
  labelDensity: "auto" | "sparse" | "dense";
  setLabelDensity: React.Dispatch<
    React.SetStateAction<"auto" | "sparse" | "dense">
  >;
  formatLeg: (
    a: Coordinates,
    b: Coordinates
  ) => { distStr: string; brg: number };
  clearRoute: () => void;
  addCurrentLocation: () => void;
  moveWaypoint: (index: number, direction: -1 | 1) => void;
  searchInputRef: React.RefObject<HTMLInputElement>;
  cruisingSpeed: number;
  setCruisingSpeed: React.Dispatch<React.SetStateAction<number>>;
}

interface WaypointMarker {
  marker: google.maps.Marker;
  waypoint: Waypoint;
}

const formatDisplays = [
  { key: "DD" as CoordinateFormat, label: "Decimal Degrees" },
  { key: "DDM" as CoordinateFormat, label: "Degrees Decimal Minutes" },
  { key: "DMS" as CoordinateFormat, label: "Degrees Minutes Seconds" },
  { key: "BNG" as CoordinateFormat, label: "British National Grid" },
  { key: "MGRS" as CoordinateFormat, label: "Military Grid Reference" },
];

const WaypointPanel: React.FC<WaypointPanelProps> = ({
  waypoints,
  setWaypoints,
  routeName,
  setRouteName,
  currentFormatIndex,
  setCurrentFormatIndex,
  routeStats,
  formatDisplays,
  setShowSaveDialog,
  setShowGPXDialog,
  handleSearch,
  isSearching,
  searchValue,
  setSearchValue,
  deleteWaypoint,
  convertCoordinates,
  formatElevation,
  editingWaypointId,
  setEditingWaypointId,
  editingWaypointName,
  setEditingWaypointName,
  labelDensity,
  setLabelDensity,
  formatLeg,
  clearRoute,
  addCurrentLocation,
  moveWaypoint,
  searchInputRef,
  cruisingSpeed,
  setCruisingSpeed,
}) => {
  return (
    <div className="w-full h-full flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <RouteIcon className="w-5 h-5" />
            Route Builder
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Route name (moved here from AppBar) */}
          <div className="space-y-1">
            <Label className="text-xs" htmlFor="route-name">
              Route name
            </Label>
            <Input
              id="route-name"
              value={routeName}
              onChange={(e) => setRouteName(e.target.value)}
              className="h-8 text-sm"
            />
          </div>

          <div className="text-sm text-muted-foreground">
            Click on the map to add waypoints. Click on a route leg to insert a waypoint. Drag markers to reposition.
          </div>

          {/* Search Bar */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  placeholder="Search address or coordinates (DD, DDM, DMS, BNG, MGRS)"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearch();
                    }
                  }}
                  className="pl-10"
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={isSearching || !searchValue.trim()}
                size="sm"
              >
                {isSearching ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
              <Button
                onClick={addCurrentLocation}
                size="sm"
                variant="secondary"
                title="Locate"
              >
                <Navigation className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Label Density Control */}
          <div className="flex items-center gap-2">
            <Label className="text-xs">Labels:</Label>
            <Select
              value={labelDensity}
              onValueChange={(v: any) => setLabelDensity(v)}
            >
              <SelectTrigger className="h-7 w-[110px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dense">All (recommended)</SelectItem>
                <SelectItem value="auto">All (auto)</SelectItem>
                <SelectItem value="sparse">Every 2nd</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Cruising Speed Input */}
          <div className="space-y-1">
            <Label className="text-xs" htmlFor="cruising-speed">
              Cruising Speed (kn)
            </Label>
            <Input
              id="cruising-speed"
              type="number"
              value={cruisingSpeed || ""}
              onChange={(e) => setCruisingSpeed(parseFloat(e.target.value) || 0)}
              onWheel={(e) => e.currentTarget.blur()}
              placeholder="Optional"
              min="0"
              step="0.5"
              className="h-8 text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Set speed to see ETAs on labels
            </p>
          </div>

          {routeStats && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Route Statistics</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Distance:</span>{" "}
                  {formatDistance(routeStats.totalDistance)}
                </div>
                <div>
                  <span className="text-muted-foreground">Waypoints:</span>{" "}
                  {waypoints.length}
                </div>
                {cruisingSpeed > 0 && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Total Time:</span>{" "}
                    {(() => {
                      const distanceNm = routeStats.totalDistance / 1852;
                      const hours = distanceNm / cruisingSpeed;
                      const h = Math.floor(hours);
                      const m = Math.round((hours - h) * 60);
                      return h > 0 ? `${h}h ${m}m` : `${m}m`;
                    })()}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => setShowSaveDialog(true)}
              disabled={waypoints.length === 0}
            >
              <Save className="w-4 h-4 mr-1" />
              Save Route
            </Button>
            <Button
              size="sm"
              onClick={() => setShowGPXDialog(true)}
              disabled={waypoints.length === 0}
            >
              <Download className="w-4 h-4 mr-1" />
              GPX Export
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={clearRoute}
              disabled={waypoints.length === 0}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Waypoints List */}
      {waypoints.length > 0 && (
        <Card className="flex-1 min-h-0 flex flex-col">
          <CardHeader className="flex-shrink-0">
            <CardTitle className="text-sm">
              Waypoints ({waypoints.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto space-y-2 pr-2">
            {waypoints.map((waypoint, index) => {
              const next = waypoints[index + 1];
              return (
                <div key={waypoint.id} className="space-y-1">
                  <div className="flex items-center gap-2 p-2 rounded border border-gray-200">
                    <div className="flex-1">
                      {editingWaypointId === waypoint.id ? (
                        <Input
                          value={editingWaypointName}
                          onChange={(e) =>
                            setEditingWaypointName(e.target.value)
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              // Save edit
                              setWaypoints((prev) =>
                                prev.map((wp) =>
                                  wp.id === waypoint.id
                                    ? { ...wp, name: editingWaypointName }
                                    : wp
                                )
                              );
                              setEditingWaypointId(null);
                            } else if (e.key === "Escape") {
                              setEditingWaypointId(null);
                            }
                          }}
                          autoFocus
                          className="h-6 text-xs"
                        />
                      ) : (
                        <div>
                          <div className="text-xs font-medium">
                            {waypoint.name}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {
                              convertCoordinates(
                                waypoint.coordinates.lat,
                                waypoint.coordinates.lng
                              )[formatDisplays[currentFormatIndex].key]
                            }
                          </div>
                          {waypoint.elevation !== undefined && (
                            <div className="text-xs text-muted-foreground">
                              Elevation: {formatElevation(waypoint.elevation)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => moveWaypoint(index, -1)}
                        disabled={index === 0}
                        className="h-6 w-6 p-0"
                        title="Move up"
                        aria-label={`Move ${waypoint.name} up in route`}
                      >
                        <ChevronUp className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => moveWaypoint(index, 1)}
                        disabled={index === waypoints.length - 1}
                        className="h-6 w-6 p-0"
                        title="Move down"
                        aria-label={`Move ${waypoint.name} down in route`}
                      >
                        <ChevronDown className="w-3 h-3" />
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (editingWaypointId === waypoint.id) {
                          setEditingWaypointId(null);
                        } else {
                          setEditingWaypointId(waypoint.id);
                          setEditingWaypointName(waypoint.name);
                        }
                      }}
                      className="h-6 w-6 p-0"
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteWaypoint(waypoint.id)}
                      className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      title={`Delete ${waypoint.name}`}
                      aria-label={`Delete waypoint ${waypoint.name}`}
                    >
                      <Trash className="w-3 h-3" />
                    </Button>
                  </div>

                  {/* Leg info between waypoints */}
                  {next && (
                    <div className="ml-1 pl-2 border-l-2 border-dashed border-gray-200">
                      <div className="inline-flex items-center gap-2 text-[11px] text-muted-foreground px-2 py-1 rounded bg-muted/30">
                        <RouteIcon className="w-3 h-3" />
                        <span>
                          {(() => {
                            const { distStr, brg } = formatLeg(
                              waypoint.coordinates,
                              next.coordinates
                            );
                            return `${distStr} • ${brg}°T to ${next.name}`;
                          })()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// AppBar component for professional layout
const AppBar = React.forwardRef<
  HTMLDivElement,
  {
    routeName: string;
    setRouteName: (v: string) => void;
    onSave: () => void;
    onExport: () => void;
    onClear: () => void;
    onReverse: () => void;
    onUndo: () => void;
    canUndo: boolean;
    mapType: "roadmap" | "satellite" | "hybrid" | "terrain";
    setMapType: (t: any) => void;
    hasUnsavedChanges: boolean;
    currentFormatIndex: number;
    setCurrentFormatIndex: (v: number) => void;
    formatDisplays: Array<{ key: string; label: string }>;
    waypoints: Waypoint[];
    searchValue: string;
    setSearchValue: (v: string) => void;
    handleSearch: () => void;
    isSearching: boolean;
    addCurrentLocation: () => void;
    openWaypoints: () => void;
    searchInputAppBarRef: React.RefObject<HTMLInputElement>;
  }
>(function AppBar(
  {
    routeName,
    setRouteName,
    onSave,
    onExport,
    onClear,
    onReverse,
    onUndo,
    canUndo,
    mapType,
    setMapType,
    hasUnsavedChanges,
    currentFormatIndex,
    setCurrentFormatIndex,
    formatDisplays,
    waypoints,
    searchValue,
    setSearchValue,
    handleSearch,
    isSearching,
    addCurrentLocation,
    openWaypoints,
    searchInputAppBarRef,
  },
  ref
) {
  return (
    <div
      ref={ref}
      className="absolute top-3 left-3 right-3 z-30 rounded-xl border border-white/20 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 shadow-lg"
    >
      <div className="flex flex-col gap-2 p-2">
        {/* Top row: full-width search */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              ref={searchInputAppBarRef}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
              placeholder="Search address or coords (DD, DDM, DMS, BNG, MGRS)"
              className="h-8 text-sm pl-8"
            />
          </div>
          <Button
            size="sm"
            onClick={handleSearch}
            className="h-8"
            title="Search"
          >
            <Search className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={addCurrentLocation}
            disabled={isSearching}
            className="h-8"
            title="Locate"
          >
            {isSearching ? (
              <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Navigation className="w-3 h-3" />
            )}
          </Button>
          {hasUnsavedChanges && (
            <span className="hidden sm:inline text-[11px] leading-none text-amber-600 whitespace-nowrap">
              Unsaved
            </span>
          )}
        </div>

        {/* Action buttons row - wrap on mobile, single line on desktop */}
        <div className="flex flex-wrap items-center gap-1 md:flex-nowrap">
          {/* Waypoints button */}
          <Button
            size="sm"
            variant="secondary"
            onClick={openWaypoints}
            className="h-8"
            title="Open waypoints"
          >
            <Menu className="w-3 h-3" />
            <span className="hidden sm:inline">Waypoints</span>
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={onSave}
            className="h-8"
            title="Save route"
          >
            <Save className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            onClick={onExport}
            className="h-8"
            title="Export GPX"
          >
            <Download className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onReverse}
            className="h-8"
            title="Reverse route order"
          >
            <ArrowUpDown className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onUndo}
            disabled={!canUndo}
            className="h-8"
            title="Undo last action"
          >
            <Undo2 className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={onClear}
            disabled={waypoints.length === 0}
            className="h-8"
            title={
              waypoints.length === 0
                ? "No waypoints to clear"
                : "Clear all waypoints"
            }
          >
            <X className="w-3 h-3" />
          </Button>
          <Select value={mapType} onValueChange={setMapType}>
            <SelectTrigger className="h-8 w-[80px]" title="Map type">
              <Layers className="w-3 h-3" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hybrid">Hybrid</SelectItem>
              <SelectItem value="roadmap">Roadmap</SelectItem>
              <SelectItem value="terrain">Terrain</SelectItem>
              <SelectItem value="satellite">Satellite</SelectItem>
            </SelectContent>
          </Select>

          {/* Coordinate Format Selector */}
          <Select
            value={currentFormatIndex.toString()}
            onValueChange={(value) => setCurrentFormatIndex(parseInt(value))}
          >
            <SelectTrigger className="h-8 w-[80px]" title="Coordinate format">
              <Settings className="w-3 h-3" />
            </SelectTrigger>
            <SelectContent>
              {formatDisplays.map((format, index) => (
                <SelectItem key={format.key} value={index.toString()}>
                  {format.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
});

export default function RouteBuilder({
  height = 420,
  initialCenter = [-0.1278, 51.5074], // London
  initialZoom = 12,
  apiKey,
}: RouteBuilderProps) {
  // Core state
  const [coordinates, setCoordinates] = useState<FormattedCoordinates | null>(
    null
  );
  const [currentFormatIndex, setCurrentFormatIndex] = useState(0);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper functions for label collision avoidance
  // meters-per-pixel at a given latitude/zoom (Web Mercator)
  const metersPerPixel = (latDeg: number, zoom: number) => {
    const R = 6378137; // WebMercator Earth radius (m)
    return (
      (Math.cos((latDeg * Math.PI) / 180) * 2 * Math.PI * R) /
      (256 * Math.pow(2, zoom))
    );
  };

  type Rect = { x: number; y: number; w: number; h: number };
  const rectsOverlap = (a: Rect, b: Rect) =>
    !(a.x + a.w < b.x || b.x + b.w < a.x || a.y + a.h < b.y || b.y + b.h < a.y);
  const [searchValue, setSearchValue] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Search is now only triggered manually by user clicking search button or pressing Enter
  // No more auto-search while typing
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Mobile UX states - default to "dense" (show all labels) for best UX
  const [labelDensity, setLabelDensity] = useState<"auto" | "sparse" | "dense">(
    "dense"
  );
  const [pendingCoord, setPendingCoord] = useState<Coordinates | null>(null);
  const [showAddHereToast, setShowAddHereToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [undoStack, setUndoStack] = useState<Waypoint[][]>([]);
  const [cursorLatLng, setCursorLatLng] = useState<Coordinates | null>(null);
  const [routeName, setRouteName] = useState("New Route");
  const [mapType, setMapType] = useState<
    "roadmap" | "satellite" | "hybrid" | "terrain"
  >("hybrid");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [cruisingSpeed, setCruisingSpeed] = useState<number>(0); // in knots, 0 = not set
  const [currentCenter, setCurrentCenter] = useState<Coordinates>({
    lat: initialCenter[1],
    lng: initialCenter[0],
  });
  const [currentZoom, setCurrentZoom] = useState(initialZoom);
  const [showZoomSlider, setShowZoomSlider] = useState(false);

  // Route state
  const [currentRoute, setCurrentRoute] = useState<Route | null>(null);
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [routeStats, setRouteStats] = useState<RouteStats | null>(null);
  const [savedRoutes, setSavedRoutes] = useState<Route[]>([]);
  const [editingWaypointId, setEditingWaypointId] = useState<string | null>(
    null
  );
  const [editingWaypointName, setEditingWaypointName] = useState("");
  const [showGPXDialog, setShowGPXDialog] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [routeDescription, setRouteDescription] = useState("");
  const [importFile, setImportFile] = useState<File | null>(null);

  // Controlled waypoints sheet state
  const [isWaypointsOpen, setIsWaypointsOpen] = useState(false);

  // Disclaimer consent state
  const [showDisclaimerModal, setShowDisclaimerModal] = useState(false);

  // AppBar height measurement
  const appBarRef = useRef<HTMLDivElement | null>(null);
  const [appBarH, setAppBarH] = useState(0);

  // Disclaimer consent hook
  const useLocalConsent = (key: string) => {
    const [accepted, setAccepted] = useState(false); // default false SSR-safe, flip on mount
    useEffect(() => {
      const v =
        typeof window !== "undefined" ? localStorage.getItem(key) : null;
      setAccepted(!!v);
    }, [key]);
    const accept = () => {
      localStorage.setItem(key, "1");
      setAccepted(true);
    };
    const reset = () => {
      localStorage.removeItem(key);
      setAccepted(false);
    };
    return { accepted, accept, reset };
  };
  const { accepted, accept } = useLocalConsent("nav-tools-disclaimer");

  // Refs
  const mapRef = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchInputAppBarRef = useRef<HTMLInputElement>(null);
  const autocomplete = useRef<google.maps.places.Autocomplete | null>(null);
  const autocompleteAppBar = useRef<google.maps.places.Autocomplete | null>(
    null
  );
  const currentFormatRef = useRef<CoordinateFormat>("DD");
  const waypointMarkersRef = useRef<WaypointMarker[]>([]);
  const routePolylineRef = useRef<google.maps.Polyline | null>(null);

  // Keep the ref in sync with current format index
  useEffect(() => {
    currentFormatRef.current = formatDisplays[currentFormatIndex].key;
  }, [currentFormatIndex]);

  // Load saved routes on mount
  useEffect(() => {
    setSavedRoutes(loadRoutes());
  }, []);

  // Update route statistics when waypoints change
  useEffect(() => {
    if (waypoints.length >= 2) {
      const segments = calculateRouteSegments(waypoints);
      const route: Route = {
        id: currentRoute?.id || generateRouteId(),
        name: routeName,
        description: routeDescription,
        waypoints,
        segments,
        totalDistance: 0,
        totalElevationGain: 0,
        totalElevationLoss: 0,
        minElevation: 0,
        maxElevation: 0,
        created: currentRoute?.created || new Date(),
        modified: new Date(),
      };

      const stats = calculateRouteStats(route);
      setRouteStats(stats);
      setCurrentRoute({ ...route, ...stats });
    } else {
      setRouteStats(null);
      setCurrentRoute(null);
    }
  }, [waypoints, routeName, routeDescription]);

  // Update coordinates display
  const updateCoordinates = useCallback(() => {
    if (map.current) {
      const center = map.current.getCenter();
      const zoom = map.current.getZoom();

      if (center) {
        const newCenter = { lat: center.lat(), lng: center.lng() };
        setCurrentCenter(newCenter);
        setCurrentZoom(zoom || 12);

        try {
          const formatted = convertCoordinates(newCenter.lat, newCenter.lng);
          setCoordinates(formatted);
        } catch (error) {
          console.error("Coordinate conversion failed:", error);
        }
      }
    }
  }, []);

  // Initialize Google Maps
  useEffect(() => {
    if (!apiKey) {
      setError("Google Maps API key is required");
      setIsLoading(false);
      return;
    }

    // Handle Google Maps quota errors globally
    const handleGoogleMapsError = (event: any) => {
      if (
        event.error &&
        event.error.includes &&
        event.error.includes("OverQuotaMapError")
      ) {
        setError(
          "Google Maps quota exceeded. Please try again later or contact support."
        );
        setIsLoading(false);
      }
    };

    window.addEventListener("error", handleGoogleMapsError);

    setIsLoading(true);
    const loader = new Loader({
      apiKey: apiKey,
      version: "weekly",
      libraries: ["maps", "places", "marker"], // Match GoogleMapsCrosshair
    });

    // Professional map styles
    const mapStyles = [
      { elementType: "geometry", stylers: [{ color: "#1f1f1f" }] },
      { elementType: "labels.text.fill", stylers: [{ color: "#e0e0e0" }] },
      { elementType: "labels.text.stroke", stylers: [{ color: "#1f1f1f" }] },
      { featureType: "poi", stylers: [{ visibility: "off" }] },
      { featureType: "road", stylers: [{ color: "#2a2a2a" }] },
      { featureType: "water", stylers: [{ color: "#0e4a68" }] },
      {
        featureType: "administrative",
        elementType: "geometry.stroke",
        stylers: [{ color: "#4a4a4a" }],
      },
      {
        featureType: "landscape",
        elementType: "geometry",
        stylers: [{ color: "#2a2a2a" }],
      },
    ];

    loader
      .load()
      .then(() => {
        if (mapRef.current) {
          map.current = new google.maps.Map(mapRef.current, {
            center: { lat: initialCenter[1], lng: initialCenter[0] },
            zoom: initialZoom,
            mapTypeId: mapType as google.maps.MapTypeId,
            disableDefaultUI: true,
            gestureHandling: "greedy",
            clickableIcons: false,
            styles: mapType === "roadmap" ? mapStyles : [],
          });

          // Update coordinates when map moves
          map.current.addListener("center_changed", updateCoordinates);
          map.current.addListener("zoom_changed", () => {
            updateCoordinates();
            setShowZoomSlider(true);
            setTimeout(() => setShowZoomSlider(false), 3000);
          });

          // Add click listener to add waypoints
          map.current.addListener(
            "click",
            (event: google.maps.MapMouseEvent) => {
              if (event.latLng) {
                addWaypoint({
                  lat: event.latLng.lat(),
                  lng: event.latLng.lng(),
                });
              }
            }
          );

          updateCoordinates();
          setIsLoading(false);
        }
      })
      .catch((error) => {
        console.error("Failed to load Google Maps:", error);
        if (error.message && error.message.includes("quota")) {
          setError(
            "Google Maps quota exceeded. Please try again later or contact support."
          );
        } else {
          setError(
            `Failed to load Google Maps: ${error.message || "Unknown error"}`
          );
        }
        setIsLoading(false);
      });

    return () => {
      window.removeEventListener("error", handleGoogleMapsError);
    };
  }, [apiKey, initialCenter, initialZoom, updateCoordinates]);

  // Initialize Places Autocomplete for both search inputs
  useEffect(() => {
    if (!map.current) return;

    // Initialize autocomplete for WaypointPanel search input
    if (searchInputRef.current && !autocomplete.current) {
      try {
        autocomplete.current = new google.maps.places.Autocomplete(
          searchInputRef.current,
          {
            types: ["establishment", "geocode"],
            fields: ["place_id", "geometry", "name", "formatted_address"],
          }
        );

        // Handle place selection
        autocomplete.current.addListener("place_changed", () => {
          const place = autocomplete.current?.getPlace();

          if (place && place.geometry && place.geometry.location) {
            const coords = {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
            };

            // Center map and show confirmation
            map.current!.setCenter(coords);
            map.current!.setZoom(15);

            // Show confirmation CTA instead of auto-adding
            setPendingCoord(coords);
            setShowAddHereToast(true);

            // Clear search input
            setSearchValue("");
          }
        });
      } catch (error) {
        console.warn("Places Autocomplete not available:", error);
      }
    }

    // Initialize autocomplete for AppBar search input
    if (searchInputAppBarRef.current && !autocompleteAppBar.current) {
      try {
        autocompleteAppBar.current = new google.maps.places.Autocomplete(
          searchInputAppBarRef.current,
          {
            types: ["establishment", "geocode"],
            fields: ["place_id", "geometry", "name", "formatted_address"],
          }
        );

        // Handle place selection
        autocompleteAppBar.current.addListener("place_changed", () => {
          const place = autocompleteAppBar.current?.getPlace();

          if (place && place.geometry && place.geometry.location) {
            const coords = {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
            };

            // Center map and show confirmation
            map.current!.setCenter(coords);
            map.current!.setZoom(15);

            // Show confirmation CTA instead of auto-adding
            setPendingCoord(coords);
            setShowAddHereToast(true);

            // Clear search input
            setSearchValue("");
          }
        });
      } catch (error) {
        console.warn("Places Autocomplete not available:", error);
      }
    }
  }, [map.current]);

  // Set up overlay for projection and idle listener for debounced rebuilds
  useEffect(() => {
    if (!map.current) return;

    // Set up overlay for pixel projection
    const overlay = new google.maps.OverlayView();
    overlay.onAdd = () => {};
    overlay.draw = () => {};
    overlay.onRemove = () => {};
    overlay.setMap(map.current);
    overlayRef.current = overlay;

    // Debounced rebuild on map idle
    const onIdle = () => {
      if (rebuildRef.current) cancelAnimationFrame(rebuildRef.current);
      rebuildRef.current = requestAnimationFrame(() => {
        updateCoordinates();
        updateRoutePolyline(waypoints);
      });
    };
    const idleListener = map.current.addListener("idle", onIdle);

    return () => {
      overlay.setMap(null);
      idleListener.remove();
      if (rebuildRef.current) cancelAnimationFrame(rebuildRef.current);
    };
  }, [waypoints, updateCoordinates]);

  // Refresh markers and polylines every time waypoints changes
  useEffect(() => {
    if (!map.current) return;

    console.log(
      `useEffect triggered - waypoints changed, count: ${waypoints.length}`
    );
    console.log(`Current markers in ref: ${waypointMarkersRef.current.length}`);

    // Compare by id, not array index (robust to reorder/drag)
    const markerById = new Map(
      waypointMarkersRef.current.map((m) => [m.waypoint.id, m])
    );

    const needsRecreation =
      waypointMarkersRef.current.length !== waypoints.length ||
      waypoints.some((wp, idx) => {
        const m = markerById.get(wp.id);
        if (!m) return true; // new marker required
        const pos = m.marker.getPosition();
        if (!pos) return true;
        // Check if coordinates changed OR if order changed (for reverse route)
        const orderChanged = waypointMarkersRef.current[idx]?.waypoint.id !== wp.id;
        return (
          orderChanged ||
          Math.abs(pos.lat() - wp.coordinates.lat) > 0.0001 ||
          Math.abs(pos.lng() - wp.coordinates.lng) > 0.0001
        );
      });

    if (needsRecreation) {
      console.log("Recreating all markers due to changes");

      // Clear all existing markers before recreating
      waypointMarkersRef.current.forEach((m, index) => {
        if (m.marker) {
          console.log(`Removing existing marker ${index}: ${m.waypoint.name}`);
          m.marker.setMap(null);
          google.maps.event.clearInstanceListeners(m.marker);
        }
      });
      waypointMarkersRef.current = [];

      // Recreate all markers from current waypoints state
      waypoints.forEach((waypoint, index) => {
        console.log(`Recreating marker ${index}: ${waypoint.name}`);
        const isStart = index === 0;
        const isEnd = index === waypoints.length - 1 && waypoints.length > 1;

        const icon: google.maps.Symbol = {
          path: "M -8 0 L 8 0 M 0 -8 L 0 8",
          scale: 2,
          strokeColor: isStart ? "#22c55e" : isEnd ? "#ef4444" : "#20d7d7",
          strokeWeight: 4,
        };

        let title = waypoint.name;
        if (isStart) title = `${title} (Start)`;
        else if (isEnd) title = `${title} (Finish)`;

        const marker = new google.maps.Marker({
          position: waypoint.coordinates,
          map: map.current,
          title,
          draggable: true,
          icon,
          zIndex: 1100,
          crossOnDrag: false,
          optimized: false,
        });

        marker.addListener("dragend", () => {
          const p = marker.getPosition();
          if (!p) return;

          const newCoordinates = { lat: p.lat(), lng: p.lng() };
          console.log(`Marker dragged: ${waypoint.name} to`, newCoordinates);

          setWaypoints((prev) =>
            prev.map((w) =>
              w.id === waypoint.id ? { ...w, coordinates: newCoordinates } : w
            )
          );

          fetchElevationForWaypoint(waypoint.id, newCoordinates);

          // Keep the marker ref's waypoint snapshot roughly in sync
          const i = waypointMarkersRef.current.findIndex(
            (m) => m.waypoint.id === waypoint.id
          );
          if (i >= 0) {
            waypointMarkersRef.current[i].waypoint = {
              ...waypointMarkersRef.current[i].waypoint,
              coordinates: newCoordinates,
            };
          }
        });

        // Long-press to delete waypoint (mobile)
        let longPressTimer: NodeJS.Timeout | null = null;
        let isDragging = false;

        marker.addListener("mousedown", () => {
          isDragging = false;
          longPressTimer = setTimeout(() => {
            if (!isDragging && confirm(`Delete waypoint "${waypoint.name}"?`)) {
              console.log(`Long-press delete: ${waypoint.name}`);
              deleteWaypoint(waypoint.id);
            }
          }, 800); // 800ms for long-press
        });

        marker.addListener("mouseup", () => {
          if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
          }
        });

        // Add real-time drag listener to update polylines while dragging (lightweight - no labels)
        marker.addListener("drag", () => {
          // Cancel long-press timer when dragging starts
          isDragging = true;
          if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
          }

          // Update polylines in real-time
          const p = marker.getPosition();
          if (!p) return;
          const newCoordinates = { lat: p.lat(), lng: p.lng() };

          if (dragRafRef.current) return;
          dragRafRef.current = requestAnimationFrame(() => {
            updatePolylinesForWaypointDrag(waypoint.id, newCoordinates);
            dragRafRef.current = null;
          });
        });

        // Right-click to delete waypoint (desktop)
        marker.addListener("rightclick", (e: google.maps.MapMouseEvent) => {
          e.stop(); // Prevent default context menu
          if (confirm(`Delete waypoint "${waypoint.name}"?`)) {
            console.log(`Right-click delete: ${waypoint.name}`);
            deleteWaypoint(waypoint.id);
          }
        });

        waypointMarkersRef.current.push({ marker, waypoint });
      });
    } else {
      console.log("Markers are up to date, just refreshing colors");
      refreshWaypointMarkers(waypoints);
    }

    updateRoutePolyline(waypoints);
  }, [waypoints]);

  // Insert waypoint at specific index (for clicking on polylines)
  const insertWaypointAtIndex = useCallback(
    (index: number, coordinates: Coordinates) => {
      setWaypoints((prev) => {
        // Save current state for undo
        saveToUndoStack(prev);

        const wp: Waypoint = {
          id: generateWaypointId(),
          name: generateWaypointName(prev.length), // Name based on total count
          coordinates,
          timestamp: Date.now(),
        };

        // Insert at the specified index
        const next = [...prev.slice(0, index), wp, ...prev.slice(index)];

        // Fetch elevation for new waypoint
        setTimeout(() => fetchElevationForWaypoint(wp.id, wp.coordinates), 100);

        // Mark as having unsaved changes
        setHasUnsavedChanges(true);

        return next;
      });
    },
    [setWaypoints]
  );

  // Add waypoint function (moved here to fix hoisting issue)
  const addWaypoint = useCallback(
    (coordinates: Coordinates) => {
      setWaypoints((prev) => {
        // Save current state for undo
        saveToUndoStack(prev);

        const wp: Waypoint = {
          id: generateWaypointId(),
          name: generateWaypointName(prev.length), // ✅ use prev length, not stale
          coordinates,
          timestamp: Date.now(),
        };
        const next = [...prev, wp];

        // Fetch elevation for new waypoint
        setTimeout(() => fetchElevationForWaypoint(wp.id, wp.coordinates), 100);

        // Mark as having unsaved changes
        setHasUnsavedChanges(true);

        return next;
      });
    },
    [setWaypoints]
  );

  // Mobile long-press to add waypoints
  useEffect(() => {
    if (!map.current) return;
    const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (!isTouch) return;

    let pressTimer: any = null;
    const down = (e: google.maps.MapMouseEvent) => {
      pressTimer = setTimeout(() => {
        if (e.latLng) addWaypoint({ lat: e.latLng.lat(), lng: e.latLng.lng() });
      }, 500);
    };
    const up = () => {
      if (pressTimer) clearTimeout(pressTimer);
    };

    const tl = map.current.addListener("touchstart", down);
    const tu = map.current.addListener("touchend", up);
    return () => {
      google.maps.event.removeListener(tl);
      google.maps.event.removeListener(tu);
    };
  }, [addWaypoint]);

  // Desktop cursor tracking for keyboard shortcuts
  useEffect(() => {
    if (!map.current) return;
    const mm = map.current.addListener(
      "mousemove",
      (e: google.maps.MapMouseEvent) => {
        if (!e.latLng) return;
        setCursorLatLng({ lat: e.latLng.lat(), lng: e.latLng.lng() });
      }
    );
    return () => google.maps.event.removeListener(mm);
  }, []);

  // Keyboard shortcut for desktop (A to add at cursor)
  useEffect(() => {
    if (!map.current) return;
    const onKey = (ev: KeyboardEvent) => {
      if ((ev.key === "a" || ev.key === "A") && cursorLatLng)
        addWaypoint(cursorLatLng);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cursorLatLng, addWaypoint]);

  // Window resize handler for label recalculation
  useEffect(() => {
    const onResize = () => {
      if (rebuildRef.current) cancelAnimationFrame(rebuildRef.current);
      rebuildRef.current = requestAnimationFrame(() =>
        updateRoutePolyline(waypoints)
      );
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [waypoints, currentZoom]);

  // Rebuild labels when density/zoom/speed changes (heavily debounced for stability)
  useEffect(() => {
    if (!map.current) return;
    
    // Cancel any pending animation frame
    if (rebuildRef.current) cancelAnimationFrame(rebuildRef.current);
    
    // Heavy debounce for maximum label stability
    const debounceTimer = setTimeout(() => {
      rebuildRef.current = requestAnimationFrame(() =>
        updateRoutePolyline(waypoints)
      );
    }, 400); // Wait 400ms after last change before updating labels (maximum stability)
    
    return () => {
      clearTimeout(debounceTimer);
      if (rebuildRef.current) cancelAnimationFrame(rebuildRef.current);
    };
  }, [labelDensity, currentZoom, cruisingSpeed, waypoints]);

  // Handle map type changes
  useEffect(() => {
    if (map.current) {
      map.current.setMapTypeId(mapType as google.maps.MapTypeId);
      // Apply styles only to roadmap
      const mapStyles = [
        { elementType: "geometry", stylers: [{ color: "#1f1f1f" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#e0e0e0" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#1f1f1f" }] },
        { featureType: "poi", stylers: [{ visibility: "off" }] },
        { featureType: "road", stylers: [{ color: "#2a2a2a" }] },
        { featureType: "water", stylers: [{ color: "#0e4a68" }] },
        {
          featureType: "administrative",
          elementType: "geometry.stroke",
          stylers: [{ color: "#4a4a4a" }],
        },
        {
          featureType: "landscape",
          elementType: "geometry",
          stylers: [{ color: "#2a2a2a" }],
        },
      ];
      map.current.setOptions({
        styles: mapType === "roadmap" ? mapStyles : [],
      });
    }
  }, [mapType]);

  // Auto-hide search CTA after timeout
  useEffect(() => {
    if (!showAddHereToast) return;
    const t = setTimeout(() => setShowAddHereToast(false), 6000);
    return () => clearTimeout(t);
  }, [showAddHereToast]);

  // Autosave to localStorage
  useEffect(() => {
    if (waypoints.length === 0) return;

    const autosaveTimer = setTimeout(() => {
      const autosaveRoute = {
        id: "autosave",
        name: routeName || "Autosaved Route",
        description: "Automatically saved route",
        waypoints,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      localStorage.setItem(
        "routeBuilder_autosave",
        JSON.stringify(autosaveRoute)
      );
    }, 2000); // Autosave after 2 seconds of no changes

    return () => clearTimeout(autosaveTimer);
  }, [waypoints, routeName]);

  // Autosave feature disabled - was causing confusion by auto-loading previous routes
  // Users should explicitly load routes from the saved routes list
  // useEffect(() => {
  //   const autosaved = localStorage.getItem("routeBuilder_autosave");
  //   if (autosaved && waypoints.length === 0) {
  //     try {
  //       const route = JSON.parse(autosaved);
  //       // Only load if it has waypoints and is recent (within 24 hours)
  //       if (
  //         route.waypoints?.length > 0 &&
  //         Date.now() - route.updatedAt < 24 * 60 * 60 * 1000
  //       ) {
  //         setWaypoints(route.waypoints);
  //         setRouteName(route.name);
  //         setHasUnsavedChanges(true);
  //       }
  //     } catch (error) {
  //       console.warn("Failed to load autosaved route:", error);
  //     }
  //   }
  // }, []);

  // Parse coordinate input (from GoogleMapsCrosshair)
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

  // Handle search functionality
  const handleSearch = async () => {
    if (!searchValue.trim() || !map.current) return;

    setIsSearching(true);

    try {
      // First try to parse as coordinate input
      const coords = parseCoordinateInput(searchValue);

      if (coords) {
        // Direct coordinate input - center map and show confirmation
        map.current.setCenter({ lat: coords.lat, lng: coords.lng });
        map.current.setZoom(15);

        // Show confirmation CTA instead of auto-adding
        setPendingCoord({ lat: coords.lat, lng: coords.lng });
        setShowAddHereToast(true);

        setIsSearching(false);
        setSearchValue(""); // Clear search after successful coordinate input
        return;
      }

      // Try Google Geocoding API for addresses
      const geocoder = new google.maps.Geocoder();

      geocoder.geocode({ address: searchValue }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
          const location = results[0].geometry.location;
          const coords = { lat: location.lat(), lng: location.lng() };

          // Center map and show confirmation
          map.current!.setCenter(coords);
          map.current!.setZoom(15);

          // Show confirmation CTA instead of auto-adding
          setPendingCoord(coords);
          setShowAddHereToast(true);

          setSearchValue(""); // Clear search after successful address search
        } else {
          console.warn("Geocoding failed:", status);
          // Could add user notification here
        }
        setIsSearching(false);
      });
    } catch (error) {
      console.error("Search error:", error);
      setIsSearching(false);
    }
  };

  // Measure AppBar height on mount + resize + content changes
  useEffect(() => {
    if (!appBarRef.current) return;

    const read = () =>
      setAppBarH(appBarRef.current!.getBoundingClientRect().height);
    read();

    const ro = new ResizeObserver(read);
    ro.observe(appBarRef.current);

    const onResize = () => read();
    window.addEventListener("resize", onResize);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // Add waypoint at current map center (mobile UX)
  const addWaypointAtCenter = () => {
    if (!map.current) return;
    const c = map.current.getCenter();
    if (!c) return;
    addWaypoint({ lat: c.lat(), lng: c.lng() });
  };

  // iOS feature detect
  const isIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  // Single, resilient entry point for location
  const getDeviceLocation = (): Promise<GeolocationPosition> => {
    if (!("geolocation" in navigator)) {
      return Promise.reject(
        new Error("Geolocation is not available on this device.")
      );
    }
    if (!isSecureContext) {
      return Promise.reject(
        new Error("Location requires HTTPS. Open this page over https://")
      );
    }

    return new Promise((resolve, reject) => {
      let resolved = false;
      let watchId: number | null = null;

      const cleanup = () => {
        if (watchId !== null) {
          navigator.geolocation.clearWatch(watchId);
          watchId = null;
        }
      };

      // iOS sometimes only returns quickly via watchPosition
      // Start a watch that will resolve on the first fix.
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          if (resolved) return;
          resolved = true;
          cleanup();
          resolve(pos);
        },
        (err) => {
          // don't reject immediately; let the getCurrentPosition attempt run too
          // but if both fail, we'll reject below
          console.warn("watchPosition error:", err);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 15000,
        }
      );

      // In parallel, try a quick getCurrentPosition (often enough on desktop)
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (resolved) return;
          resolved = true;
          cleanup();
          resolve(pos);
        },
        (err) => {
          console.warn("getCurrentPosition error:", err);
          // Only reject if the watch hasn't produced anything after a grace period
          setTimeout(() => {
            if (!resolved) {
              cleanup();
              reject(err);
            }
          }, 16000); // give watchPosition time to produce a fix
        },
        {
          // Start with a pragmatic timeout; iOS can take longer cold
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 8000,
        }
      );
    });
  };

  // Add current location as waypoint
  const addCurrentLocation = async () => {
    try {
      // Show loading state for iOS devices that might take longer
      if (isIOS) {
        setIsSearching(true);
      }

      const pos = await getDeviceLocation();
      const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      map.current?.setCenter(coords);
      map.current?.setZoom(16);
      setPendingCoord(coords);
      setShowAddHereToast(true);
    } catch (err: any) {
      console.warn("Geolocation failed:", err);
      // Friendly, actionable iOS guidance
      let msg = "Unable to get your location.";
      if (err?.code === 1 /* PERMISSION_DENIED */) {
        msg =
          "Location permission is blocked. On iPhone/iPad: Settings → Privacy & Security → Location Services → Safari Websites → Allow While Using & enable Precise Location. Then reload the page.";
      } else if (!isSecureContext) {
        msg =
          "Location requires HTTPS. Open this page over https:// and retry.";
      } else if (isIOS) {
        msg =
          "iOS couldn't get a fix. Make sure Location Services are ON and Precise Location is enabled for Safari Websites, then try again.";
      }
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(null), 8000);
    } finally {
      // Always clear loading state
      setIsSearching(false);
    }
  };

  // AppBar handlers
  const handleSave = () => {
    if (waypoints.length === 0) return;
    setShowSaveDialog(true);
    // Don't clear hasUnsavedChanges here - wait until actually saved
  };

  const handleExport = () => {
    if (waypoints.length === 0) return;
    setShowGPXDialog(true);
  };

  const handleReverse = () => {
    if (waypoints.length < 2) return;
    setWaypoints((prev) => {
      // Save current state for undo
      saveToUndoStack(prev);
      
      // Create a temporary route object for reversal
      const tempRoute: Route = {
        id: generateRouteId(),
        name: "Temporary Route",
        waypoints: prev,
        segments: [],
        totalDistance: 0,
        totalElevationGain: 0,
        totalElevationLoss: 0,
        minElevation: 0,
        maxElevation: 0,
        created: new Date(),
        modified: new Date(),
      };

      const reversed = reverseRoute(tempRoute).waypoints;
      setHasUnsavedChanges(true);
      return reversed;
    });
  };

  // Waypoint reordering
  const moveWaypoint = (index: number, direction: -1 | 1) => {
    setWaypoints((prev) => {
      const next = [...prev];
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= next.length) return prev;
      [next[index], next[newIndex]] = [next[newIndex], next[index]];
      setHasUnsavedChanges(true);
      return next;
    });
  };

  // Format leg between waypoints
  const formatLeg = (a: Coordinates, b: Coordinates) => {
    const d = calculateSegmentDistance(a, b);
    const brg = Math.round(calculateSegmentBearing(a, b));
    const nm = d / 1852;
    const distStr = nm < 1 ? `${Math.round(d)} m` : `${nm.toFixed(2)} nm`;
    return { distStr, brg };
  };

  // GPX import function
  const importGPX = async (file: File) => {
    try {
      const text = await file.text();
      const parser = new DOMParser();
      const xml = parser.parseFromString(text, "application/xml");

      // Check for parsing errors
      const parseError = xml.querySelector("parsererror");
      if (parseError) {
        throw new Error("Invalid GPX file");
      }

      // Extract waypoints from GPX (routes have priority for planning)
      const rtepts = Array.from(xml.getElementsByTagName("rtept"));
      const trkpts = Array.from(xml.getElementsByTagName("trkpt"));
      const wpts = Array.from(xml.getElementsByTagName("wpt"));

      // Prefer route points, then track points, then waypoints
      const allPoints =
        rtepts.length > 0 ? rtepts : trkpts.length > 0 ? trkpts : wpts;

      if (allPoints.length === 0) {
        throw new Error("No waypoints found in GPX file");
      }

      const newWaypoints: Waypoint[] = allPoints.map((pt, i) => {
        const lat = parseFloat(pt.getAttribute("lat") || "0");
        const lng = parseFloat(pt.getAttribute("lon") || "0");
        const nameEl = pt.querySelector("name");
        const name = nameEl?.textContent || generateWaypointName(i);

        return {
          id: generateWaypointId(),
          name,
          coordinates: { lat, lng },
          timestamp: Date.now(),
        };
      });

      // Clear existing route and add imported waypoints
      clearRoute();
      setWaypoints(newWaypoints);
      setHasUnsavedChanges(true);

      // Extract route name if available
      const routeNameEl = xml.querySelector("trk > name, metadata > name");
      if (routeNameEl?.textContent) {
        setRouteName(routeNameEl.textContent);
      }

      // Center map on first waypoint
      if (newWaypoints.length > 0 && map.current) {
        map.current.setCenter(newWaypoints[0].coordinates);
        map.current.setZoom(12);
      }

      setShowGPXDialog(false);
      setImportFile(null);
    } catch (error) {
      console.error("GPX import error:", error);
      setErrorMessage(
        `Failed to import GPX file: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      setTimeout(() => setErrorMessage(null), 5000); // Auto-hide after 5 seconds
    }
  };

  // Fetch elevation data for a waypoint
  const fetchElevationForWaypoint = (
    waypointId: string,
    coordinates: Coordinates
  ) => {
    if (!map.current) return;

    const elevationService = new google.maps.ElevationService();

    elevationService.getElevationForLocations(
      {
        locations: [new google.maps.LatLng(coordinates.lat, coordinates.lng)],
      },
      (results, status) => {
        if (
          status === google.maps.ElevationStatus.OK &&
          results &&
          results[0]
        ) {
          const elevation = Math.round(results[0].elevation);
          console.log(`Elevation for waypoint ${waypointId}: ${elevation}m`);

          // Update waypoint with elevation data
          setWaypoints((prev) =>
            prev.map((wp) => (wp.id === waypointId ? { ...wp, elevation } : wp))
          );
        } else {
          console.warn("Elevation request failed:", status);
        }
      }
    );
  };

  // Create SVG icon for route labels with zoom-aware styling
  const createRouteLabel = (text: string, zoom: number = currentZoom) => {
    // Zoom-aware sizing and styling - wider labels when time info is included
    const hasTimeInfo = text.includes('h') && text.includes('m');
    const baseWidth = hasTimeInfo ? 200 : 160;
    const width = zoom <= 11 ? baseWidth - 20 : baseWidth;
    const height = zoom <= 11 ? 32 : 36;
    const fontSize = zoom <= 11 ? 10 : 11;
    const rectHeight = zoom <= 11 ? 24 : 28;
    const textY = zoom <= 11 ? 17 : 19;
    const opacity = zoom <= 9 ? 0.7 : 0.8;
    const strokeOpacity = zoom <= 9 ? 0.2 : 0.3;

    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <!-- Main bubble rectangle -->
        <rect width="${width}" height="${rectHeight}" x="0" y="0" rx="6" fill="rgba(0,0,0,${opacity})" stroke="rgba(255,255,255,${strokeOpacity})" stroke-width="1"/>
        <!-- Text inside bubble -->
        <text x="${
          width / 2
        }" y="${textY}" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-size="${fontSize}" font-weight="bold" text-anchor="middle" fill="white">${text}</text>
      </svg>
    `;
    return {
      url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg),
      scaledSize: new google.maps.Size(width, height),
      anchor: new google.maps.Point(width / 2, height),
    };
  };

  // Create waypoint marker
  const createWaypointMarker = (
    waypoint: Waypoint,
    index: number,
    totalCount: number
  ) => {
    if (!map.current) return;

    const isStart = index === 0;
    const isEnd = index === totalCount - 1 && totalCount > 1;

    const icon: google.maps.Symbol = {
      path: "M -8 0 L 8 0 M 0 -8 L 0 8",
      scale: 2, // Increased for better visibility
      strokeColor: "#ffffff",
      strokeWeight: 4, // Increased for better visibility
    };

    let title = waypoint.name;
    if (isStart) title = `${title} (Start)`;
    else if (isEnd) title = `${title} (Finish)`;

    const marker = new google.maps.Marker({
      position: waypoint.coordinates,
      map: map.current,
      title,
      draggable: true,
      icon,
      zIndex: 1100,
      crossOnDrag: false,
      optimized: false,
    });

    marker.addListener("dragend", () => {
      const p = marker.getPosition();
      if (!p) return;

      const newCoordinates = { lat: p.lat(), lng: p.lng() };
      console.log(`Marker dragged: ${waypoint.name} to`, newCoordinates);

      // Simply update the waypoints state - useEffect will handle marker recreation
      setWaypoints((prev) =>
        prev.map((w) =>
          w.id === waypoint.id ? { ...w, coordinates: newCoordinates } : w
        )
      );

      // Fetch elevation for the updated waypoint
      fetchElevationForWaypoint(waypoint.id, newCoordinates);

      // Keep the marker ref's waypoint snapshot in sync
      const i = waypointMarkersRef.current.findIndex(
        (m) => m.waypoint.id === waypoint.id
      );
      if (i >= 0) {
        waypointMarkersRef.current[i].waypoint = {
          ...waypointMarkersRef.current[i].waypoint,
          coordinates: newCoordinates,
        };
      }
    });

    // Long-press to delete waypoint (mobile)
    let longPressTimer: NodeJS.Timeout | null = null;
    let isDragging = false;

    marker.addListener("mousedown", () => {
      isDragging = false;
      longPressTimer = setTimeout(() => {
        if (!isDragging && confirm(`Delete waypoint "${waypoint.name}"?`)) {
          console.log(`Long-press delete: ${waypoint.name}`);
          deleteWaypoint(waypoint.id);
        }
      }, 800); // 800ms for long-press
    });

    marker.addListener("mouseup", () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
    });

    // Add real-time drag listener to update polylines while dragging (lightweight - no labels)
    marker.addListener("drag", () => {
      // Cancel long-press timer when dragging starts
      isDragging = true;
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }

      // Update polylines in real-time
      const p = marker.getPosition();
      if (!p) return;
      const newCoordinates = { lat: p.lat(), lng: p.lng() };

      if (dragRafRef.current) return;
      dragRafRef.current = requestAnimationFrame(() => {
        updatePolylinesForWaypointDrag(waypoint.id, newCoordinates);
        dragRafRef.current = null;
      });
    });

    // Right-click to delete waypoint (desktop)
    marker.addListener("rightclick", (e: google.maps.MapMouseEvent) => {
      e.stop(); // Prevent default context menu
      if (confirm(`Delete waypoint "${waypoint.name}"?`)) {
        console.log(`Right-click delete: ${waypoint.name}`);
        deleteWaypoint(waypoint.id);
      }
    });

    // Add to markers array (always append)
    waypointMarkersRef.current.push({ marker, waypoint });
    console.log(
      `Created marker for ${waypoint.name}, total markers: ${waypointMarkersRef.current.length}`
    );
  };

  // Refresh all waypoint markers to update colors based on current positions
  const refreshWaypointMarkers = (currentWaypoints: Waypoint[]) => {
    waypointMarkersRef.current.forEach((markerData, index) => {
      const isStart = index === 0;
      const isEnd =
        index === currentWaypoints.length - 1 && currentWaypoints.length > 1;

      let strokeColor = "#20d7d7"; // Turquoise for regular waypoints
      let title = markerData.waypoint.name;

      if (isStart) {
        strokeColor = "#22c55e"; // Green for start
        title = `${markerData.waypoint.name} (Start)`;
      } else if (isEnd) {
        strokeColor = "#ef4444"; // Red for end
        title = `${markerData.waypoint.name} (Finish)`;
      }

      const icon: google.maps.Symbol = {
        path: "M -8 0 L 8 0 M 0 -8 L 0 8",
        scale: 2,
        strokeColor: strokeColor,
        strokeWeight: 4,
      };

      markerData.marker.setIcon(icon);
      markerData.marker.setTitle(title);
    });
  };

  // Store polyline labels and polylines
  const routeLabelsRef = useRef<google.maps.Marker[]>([]);
  const routePolylinesRef = useRef<google.maps.Polyline[]>([]);
  const overlayRef = useRef<google.maps.OverlayView | null>(null);
  const rebuildRef = useRef<number | null>(null);

  // Store per-segment label markers by a stable id "startId->endId"
  const routeLabelBySegmentIdRef = useRef<Map<string, google.maps.Marker>>(
    new Map()
  );

  // Throttle drag updates to prevent excessive label rebuilding
  const dragRafRef = useRef<number | null>(null);

  // Calculate distance between two points using Haversine formula
  const calculateSegmentDistance = (
    point1: Coordinates,
    point2: Coordinates
  ): number => {
    const R = 6371000; // Earth's radius in meters
    const lat1Rad = (point1.lat * Math.PI) / 180;
    const lat2Rad = (point2.lat * Math.PI) / 180;
    const deltaLatRad = ((point2.lat - point1.lat) * Math.PI) / 180;
    const deltaLngRad = ((point2.lng - point1.lng) * Math.PI) / 180;

    const a =
      Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
      Math.cos(lat1Rad) *
        Math.cos(lat2Rad) *
        Math.sin(deltaLngRad / 2) *
        Math.sin(deltaLngRad / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Calculate bearing between two points
  const calculateSegmentBearing = (
    point1: Coordinates,
    point2: Coordinates
  ): number => {
    const lat1Rad = (point1.lat * Math.PI) / 180;
    const lat2Rad = (point2.lat * Math.PI) / 180;
    const deltaLngRad = ((point2.lng - point1.lng) * Math.PI) / 180;

    const y = Math.sin(deltaLngRad) * Math.cos(lat2Rad);
    const x =
      Math.cos(lat1Rad) * Math.sin(lat2Rad) -
      Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(deltaLngRad);
    const bearingRad = Math.atan2(y, x);
    return ((bearingRad * 180) / Math.PI + 360) % 360;
  };

  // Format distance for display (nautical miles for navigation)
  const formatSegmentDistance = (meters: number): string => {
    const nauticalMiles = meters / 1852;
    if (nauticalMiles < 1) {
      return `${Math.round(meters)} m`;
    } else {
      return `${nauticalMiles.toFixed(2)} nm`;
    }
  };

  // Update route polyline
  const updateRoutePolyline = (updatedWaypoints: Waypoint[]) => {
    // Get current zoom level at the start
    const zoom = currentZoom;

    // Simplified: Show labels for segments longer than 50m (very short segments)
    const MIN_DISTANCE_METERS = 50;

    // For collision culling (only used in sparse mode)
    const placedRects: Rect[] = [];

    // Clear existing polylines (but NOT labels - they'll be updated in place)
    if (routePolylineRef.current) {
      routePolylineRef.current.setMap(null);
      routePolylineRef.current = null;
    }
    routePolylinesRef.current.forEach((polyline) => polyline.setMap(null));
    routePolylinesRef.current = [];
    
    // Clear old label system (not used anymore)
    routeLabelsRef.current.forEach((label) => label.setMap(null));
    routeLabelsRef.current = [];

    // DON'T clear stable labels here - they'll be updated in place to prevent flashing
    // routeLabelBySegmentIdRef maintains labels across updates

    if (updatedWaypoints.length >= 2 && map.current) {
      console.log(
        `Creating polylines for ${updatedWaypoints.length} waypoints`
      );

      // Create polylines between consecutive waypoints
      for (let i = 0; i < updatedWaypoints.length - 1; i++) {
        const start = updatedWaypoints[i];
        const end = updatedWaypoints[i + 1];

        console.log(
          `Creating polyline segment ${i + 1}: ${start.name} -> ${end.name}`
        );

        // Create polyline segment
        const polyline = new google.maps.Polyline({
          path: [start.coordinates, end.coordinates],
          geodesic: true,
          strokeColor: "#3b82f6",
          strokeOpacity: 0.8,
          strokeWeight: 3,
          map: map.current,
          clickable: true,
        });

        // Add hover effect to indicate clickability
        polyline.addListener("mouseover", () => {
          polyline.setOptions({
            strokeColor: "#60a5fa",
            strokeWeight: 4,
          });
        });

        polyline.addListener("mouseout", () => {
          polyline.setOptions({
            strokeColor: "#3b82f6",
            strokeWeight: 3,
          });
        });

        // Add click listener to insert waypoint at clicked position
        polyline.addListener("click", (event: google.maps.PolyMouseEvent) => {
          if (event.latLng) {
            const clickedPosition = {
              lat: event.latLng.lat(),
              lng: event.latLng.lng(),
            };
            
            // Insert waypoint between start and end
            insertWaypointAtIndex(i + 1, clickedPosition);
          }
        });

        // Store all polylines
        routePolylinesRef.current.push(polyline);

        // Keep reference to the last polyline for backwards compatibility
        if (i === updatedWaypoints.length - 2) {
          routePolylineRef.current = polyline;
        }

        // Calculate distance and bearing for this segment
        const distance = calculateSegmentDistance(
          start.coordinates,
          end.coordinates
        );
        const bearing = calculateSegmentBearing(
          start.coordinates,
          end.coordinates
        );

        console.log(
          `Segment ${i + 1}: ${formatSegmentDistance(distance)} • ${Math.round(
            bearing
          )}°T`
        );

        // NOTE: Label creation is handled by the stable label system below
        // This prevents duplicate labels during drag operations
      }

      // --- Begin: stable label update section ---

      const projection = overlayRef.current?.getProjection();
      const labelsMap = routeLabelBySegmentIdRef.current;

      console.log(`Label update: zoom=${zoom}, waypoints=${updatedWaypoints.length}, labelDensity=${labelDensity}`);

      // Clear collision rects for fresh label placement pass
      placedRects.length = 0;

      // Only hide labels at very low zoom (world view)
      const MIN_ZOOM_FOR_LABELS = 5;
      if (!projection) {
        // If projection not ready, skip label work but don't hide existing labels
        console.log("Projection not ready, skipping label update");
        return;
      }
      
      if (zoom < MIN_ZOOM_FOR_LABELS) {
        // Hide all existing labels cleanly at very low zoom (world view)
        console.log(`Zoom ${zoom} < ${MIN_ZOOM_FOR_LABELS}, hiding labels`);
        labelsMap.forEach((marker) => marker.setMap(null));
        return;
      }

      // Simplified density rules - consistent across all zoom levels
      // Collision detection always enabled to prevent overlapping labels
      let step = 1;
      let useCollisionDetection = true; // Always enabled for clean display
      
      if (labelDensity === "sparse") {
        step = 2; // Show every 2nd label
      } else {
        // "dense" and "auto" - show all labels
        step = 1;
      }

      // Track which ids were updated this pass, so we can remove stale ones after
      const touchedIds = new Set<string>();

      for (let i = 0; i < updatedWaypoints.length - 1; i++) {
        if (i % step !== 0) continue;

        const start = updatedWaypoints[i];
        const end = updatedWaypoints[i + 1];
        const segId = `${start.id}->${end.id}`;

        // Calculate distance for this segment
        const distance = calculateSegmentDistance(
          start.coordinates,
          end.coordinates
        );

        // Only skip extremely short segments (< 50m) to reduce clutter
        if (distance < MIN_DISTANCE_METERS) {
          const existing = labelsMap.get(segId);
          if (existing) existing.setMap(null);
          continue;
        }

        // Midpoint position
        const mid = new google.maps.LatLng(
          (start.coordinates.lat + end.coordinates.lat) / 2,
          (start.coordinates.lng + end.coordinates.lng) / 2
        );

        // Collision check in pixel space (only if enabled)
        if (useCollisionDetection) {
          const midPx = projection.fromLatLngToDivPixel(mid);
          // Wider labels when time info is included
          const hasTimeInfo = cruisingSpeed > 0;
          const baseWidth = hasTimeInfo ? 200 : 160;
          const LABEL_W = zoom <= 11 ? baseWidth - 20 : baseWidth;
          const LABEL_H = zoom <= 11 ? 32 : 36;

          if (midPx) {
            const candidate: Rect = {
              x: midPx.x - LABEL_W / 2,
              y: midPx.y - LABEL_H,
              w: LABEL_W,
              h: LABEL_H,
            };
            const collides = placedRects.some((r) => rectsOverlap(r, candidate));
            if (collides) {
              const existing = labelsMap.get(segId);
              if (existing) existing.setMap(null); // hide if currently colliding
              continue;
            }
            placedRects.push(candidate);
          }
        }

        // Build/refresh icon text
        const bearing = Math.round(
          calculateSegmentBearing(start.coordinates, end.coordinates)
        );
        const bearingText = zoom <= 11 ? `${bearing}°` : `${bearing}°T`;
        
        // Calculate time if cruising speed is set
        let labelText: string;
        if (cruisingSpeed > 0) {
          const distanceNm = distance / 1852;
          const hours = distanceNm / cruisingSpeed;
          const h = Math.floor(hours);
          const m = Math.round((hours - h) * 60);
          const timeText = h > 0 ? `${h}h${m}m` : `${m}m`;
          
          labelText =
            distance / 1852 < 1
              ? `${Math.round(distance)} m • ${bearingText} • ${timeText}`
              : `${(distance / 1852).toFixed(2)} nm • ${bearingText} • ${timeText}`;
        } else {
          labelText =
            distance / 1852 < 1
              ? `${Math.round(distance)} m • ${bearingText}`
              : `${(distance / 1852).toFixed(2)} nm • ${bearingText}`;
        }

        const icon = createRouteLabel(labelText, zoom);

        let marker = labelsMap.get(segId);
        if (!marker) {
          // New label (use optimized:false to stop GPU tile flicker)
          marker = new google.maps.Marker({
            position: mid,
            map: map.current!,
            clickable: false,
            icon,
            zIndex: 1000,
            optimized: false,
            crossOnDrag: false,
          });
          labelsMap.set(segId, marker);
        } else {
          // Update existing (no flicker)
          marker.setIcon(icon);
          marker.setPosition(mid);
          if (!marker.getMap()) marker.setMap(map.current!);
        }

        touchedIds.add(segId);
      }

      // Remove labels for segments that no longer qualify
      labelsMap.forEach((marker, id) => {
        if (!touchedIds.has(id)) {
          marker.setMap(null);
        }
      });

      console.log(`Labels created/updated: ${touchedIds.size}, total in map: ${labelsMap.size}`);

      // --- End: stable label update section ---
    }
  };

  // Undo last action
  const undoLastAction = () => {
    if (undoStack.length > 0) {
      const previousState = undoStack[undoStack.length - 1];
      setWaypoints(previousState);
      setUndoStack((prev) => prev.slice(0, -1));
      setHasUnsavedChanges(true);
    }
  };

  // Save current state to undo stack
  const saveToUndoStack = (currentWaypoints: Waypoint[]) => {
    setUndoStack((prev) => [...prev, [...currentWaypoints]]);
  };

  // Delete waypoint
  const deleteWaypoint = (waypointId: string) => {
    setWaypoints((prev) => {
      // Save current state for undo
      saveToUndoStack(prev);

      const next = prev.filter((wp) => wp.id !== waypointId);

      // remove marker
      const idx = waypointMarkersRef.current.findIndex(
        (m) => m.waypoint.id === waypointId
      );
      if (idx >= 0) {
        waypointMarkersRef.current[idx].marker.setMap(null);
        waypointMarkersRef.current.splice(idx, 1);
      }

      setHasUnsavedChanges(true);
      return next;
    });
  };

  // Clear all waypoints
  const clearRoute = () => {
    console.log(
      `Clearing ${waypointMarkersRef.current.length} markers from ref`
    );

    // Clear waypoints state first
    setWaypoints([]);
    setHasUnsavedChanges(true);

    // Clear all waypoint markers with thorough cleanup
    waypointMarkersRef.current.forEach((m, index) => {
      if (m && m.marker) {
        console.log(
          `Removing marker ${index}: ${m.waypoint?.name || "unknown"}`
        );
        try {
          m.marker.setMap(null);
          // Also remove event listeners to prevent memory leaks
          google.maps.event.clearInstanceListeners(m.marker);
        } catch (error) {
          console.warn(`Error removing marker ${index}:`, error);
        }
      } else {
        console.warn(`Invalid marker at index ${index}:`, m);
      }
    });
    waypointMarkersRef.current = [];

    // Clear main polyline
    if (routePolylineRef.current) {
      try {
        routePolylineRef.current.setMap(null);
        routePolylineRef.current = null;
      } catch (error) {
        console.warn("Error clearing main polyline:", error);
      }
    }

    // Clear all polylines
    routePolylinesRef.current.forEach((polyline, index) => {
      try {
        polyline.setMap(null);
      } catch (error) {
        console.warn(`Error clearing polyline ${index}:`, error);
      }
    });
    routePolylinesRef.current = [];

    // Clear route labels (both old and stable label systems)
    routeLabelsRef.current.forEach((label, index) => {
      try {
        label.setMap(null);
      } catch (error) {
        console.warn(`Error clearing label ${index}:`, error);
      }
    });
    routeLabelsRef.current = [];

    // Clear stable label system
    routeLabelBySegmentIdRef.current.forEach((marker) => {
      try {
        marker.setMap(null);
      } catch (error) {
        console.warn("Error clearing stable label:", error);
      }
    });
    routeLabelBySegmentIdRef.current.clear();

    setCurrentRoute(null);
    setRouteStats(null);

    console.log("Clear complete - all refs emptied");

    // Double-check: log final state
    console.log("Final marker count:", waypointMarkersRef.current.length);
    console.log("Final polyline count:", routePolylinesRef.current.length);
    console.log("Final label count:", routeLabelsRef.current.length);
    console.log(
      "Final stable label count:",
      routeLabelBySegmentIdRef.current.size
    );
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  // Rebuild the polylines live while one waypoint is being dragged.
  // This does NOT mutate React state during the drag.
  // Lightweight polyline update during drag (no labels)
  const updatePolylinesForWaypointDrag = (
    waypointId: string,
    coords: Coordinates
  ) => {
    // Find the waypoint index
    const waypointIndex = waypoints.findIndex((w) => w.id === waypointId);
    if (waypointIndex === -1) return;

    // Update the polyline before this waypoint (if it exists)
    if (waypointIndex > 0) {
      const polylineIndex = waypointIndex - 1;
      const prevMarker = waypointMarkersRef.current[waypointIndex - 1];

      if (routePolylinesRef.current[polylineIndex] && prevMarker) {
        // Use real-time marker position instead of stale state
        const prevPos = prevMarker.marker.getPosition();
        if (prevPos) {
          routePolylinesRef.current[polylineIndex].setPath([
            { lat: prevPos.lat(), lng: prevPos.lng() },
            coords,
          ]);
        }
      }
    }

    // Update the polyline after this waypoint (if it exists)
    if (waypointIndex < waypoints.length - 1) {
      const polylineIndex = waypointIndex;
      const nextMarker = waypointMarkersRef.current[waypointIndex + 1];

      if (routePolylinesRef.current[polylineIndex] && nextMarker) {
        // Use real-time marker position instead of stale state
        const nextPos = nextMarker.marker.getPosition();
        if (nextPos) {
          routePolylinesRef.current[polylineIndex].setPath([
            coords,
            { lat: nextPos.lat(), lng: nextPos.lng() },
          ]);
        }
      }
    }
  };

  const updatePolylinesForWaypoint = (
    waypointId: string,
    coords: Coordinates
  ) => {
    const tempWaypoints = waypoints.map((w) =>
      w.id === waypointId ? { ...w, coordinates: coords } : w
    );
    updateRoutePolyline(tempWaypoints);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="p-6">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[100dvh] bg-background">
      {/* Disclaimer Modal - shows once per device */}
      {!accepted && (
        <Dialog open>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Disclaimer</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground mb-4">
              The route builder and related navigation utilities are provided
              for informational use only and may be inaccurate in some
              conditions. By continuing, you accept full responsibility for how
              you use these tools and agree the developer is not liable for any
              resulting loss or harm.
            </p>
            <Button onClick={accept} className="w-full">
              I Understand & Accept
            </Button>
          </DialogContent>
        </Dialog>
      )}
      {/* AppBar */}
      <AppBar
        ref={appBarRef}
        routeName={routeName}
        setRouteName={setRouteName}
        onSave={handleSave}
        onExport={handleExport}
        onClear={clearRoute}
        onReverse={handleReverse}
        onUndo={undoLastAction}
        canUndo={undoStack.length > 0}
        mapType={mapType}
        setMapType={setMapType}
        hasUnsavedChanges={hasUnsavedChanges}
        currentFormatIndex={currentFormatIndex}
        setCurrentFormatIndex={setCurrentFormatIndex}
        formatDisplays={formatDisplays}
        waypoints={waypoints}
        searchValue={searchValue}
        setSearchValue={setSearchValue}
        handleSearch={handleSearch}
        isSearching={isSearching}
        addCurrentLocation={addCurrentLocation}
        openWaypoints={() => setIsWaypointsOpen(true)}
        searchInputAppBarRef={searchInputAppBarRef}
      />

      {/* Map */}
      <div className="absolute inset-0">
        <div className="h-full">
          <div ref={mapRef} className="w-full h-full" />

          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="text-white">Loading map...</div>
            </div>
          )}

          {/* Red Crosshair (Crucifix) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <svg
              width="40"
              height="40"
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Vertical line */}
              <line
                x1="20"
                y1="0"
                x2="20"
                y2="40"
                stroke="#ef4444"
                strokeWidth="2"
              />
              {/* Horizontal line */}
              <line
                x1="0"
                y1="20"
                x2="40"
                y2="20"
                stroke="#ef4444"
                strokeWidth="2"
              />
              {/* Center circle */}
              <circle
                cx="20"
                cy="20"
                r="3"
                stroke="#ef4444"
                strokeWidth="2"
                fill="transparent"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Right panel (desktop/tablet ≥ lg) */}
      <div className="hidden lg:flex absolute right-3 top-3 bottom-3 z-10 w-96">
        <div className="w-full h-full flex flex-col gap-4">
          <WaypointPanel
            waypoints={waypoints}
            setWaypoints={setWaypoints}
            routeName={routeName}
            setRouteName={setRouteName}
            currentFormatIndex={currentFormatIndex}
            setCurrentFormatIndex={setCurrentFormatIndex}
            routeStats={routeStats}
            formatDisplays={formatDisplays}
            setShowSaveDialog={setShowSaveDialog}
            setShowGPXDialog={setShowGPXDialog}
            handleSearch={handleSearch}
            isSearching={isSearching}
            searchValue={searchValue}
            setSearchValue={setSearchValue}
            deleteWaypoint={deleteWaypoint}
            convertCoordinates={convertCoordinates}
            formatElevation={formatElevation}
            editingWaypointId={editingWaypointId}
            setEditingWaypointId={setEditingWaypointId}
            editingWaypointName={editingWaypointName}
            setEditingWaypointName={setEditingWaypointName}
            labelDensity={labelDensity}
            setLabelDensity={setLabelDensity}
            formatLeg={formatLeg}
            clearRoute={clearRoute}
            addCurrentLocation={addCurrentLocation}
            moveWaypoint={moveWaypoint}
            searchInputRef={searchInputRef}
            cruisingSpeed={cruisingSpeed}
            setCruisingSpeed={setCruisingSpeed}
          />
        </div>
      </div>

      {/* Single controlled waypoints sheet */}
      <Sheet open={isWaypointsOpen} onOpenChange={setIsWaypointsOpen}>
        <SheetContent side="bottom" className="h-[70dvh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Route Builder</SheetTitle>
          </SheetHeader>
          <WaypointPanel
            waypoints={waypoints}
            setWaypoints={setWaypoints}
            routeName={routeName}
            setRouteName={setRouteName}
            currentFormatIndex={currentFormatIndex}
            setCurrentFormatIndex={setCurrentFormatIndex}
            routeStats={routeStats}
            formatDisplays={formatDisplays}
            setShowSaveDialog={setShowSaveDialog}
            setShowGPXDialog={setShowGPXDialog}
            handleSearch={handleSearch}
            isSearching={isSearching}
            searchValue={searchValue}
            setSearchValue={setSearchValue}
            deleteWaypoint={deleteWaypoint}
            convertCoordinates={convertCoordinates}
            formatElevation={formatElevation}
            editingWaypointId={editingWaypointId}
            setEditingWaypointId={setEditingWaypointId}
            editingWaypointName={editingWaypointName}
            setEditingWaypointName={setEditingWaypointName}
            labelDensity={labelDensity}
            setLabelDensity={setLabelDensity}
            formatLeg={formatLeg}
            clearRoute={clearRoute}
            addCurrentLocation={addCurrentLocation}
            moveWaypoint={moveWaypoint}
            searchInputRef={searchInputRef}
            cruisingSpeed={cruisingSpeed}
            setCruisingSpeed={setCruisingSpeed}
          />
        </SheetContent>
      </Sheet>

      {/* Add at crosshair button - positioned below measured AppBar height with safety floor */}
      <div
        className="absolute left-1/2 -translate-x-1/2 z-40 flex justify-center"
        style={{
          top: `max(calc(env(safe-area-inset-top) + ${appBarH + 20}px), 120px)`,
        }}
      >
        <Button
          size="lg"
          onClick={addWaypointAtCenter}
          className="shadow-xl bg-blue-600 hover:bg-blue-700 text-white border-0"
        >
          <Plus className="w-4 h-4 mr-2" /> Add at crosshair
        </Button>
      </div>

      {/* Error message toast - positioned below measured AppBar height */}
      {errorMessage && (
        <div
          className="absolute top-3 left-4 right-4 z-30 lg:left-1/2 lg:-translate-x-1/2 lg:right-auto"
          style={{ top: `calc(env(safe-area-inset-top) + ${appBarH + 8}px)` }}
        >
          <div className="bg-red-600/90 backdrop-blur-sm rounded-lg border border-red-400/30 p-3 text-white">
            <div className="flex items-center gap-2">
              <X className="w-4 h-4 text-red-200" />
              <span className="text-sm">{errorMessage}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setErrorMessage(null)}
                className="ml-auto h-6 w-6 p-0 text-red-200 hover:text-white hover:bg-red-500/20"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Search confirmation CTA */}
      {showAddHereToast && pendingCoord && (
        <div
          className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20"
          role="dialog"
          aria-live="polite"
          aria-label="Add waypoint confirmation"
        >
          <Card className="bg-black/80 text-white border-white/20">
            <CardContent className="p-3 flex items-center gap-3">
              <span>Add waypoint here?</span>
              <Button
                size="sm"
                onClick={() => {
                  addWaypoint(pendingCoord);
                  setShowAddHereToast(false);
                  setPendingCoord(null);
                }}
              >
                Add
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowAddHereToast(false);
                  setPendingCoord(null);
                }}
              >
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Current Coordinates Display - compact overlay */}
      {coordinates && (
        <div className="absolute bottom-20 left-4 z-20">
          <div
            className="bg-black/90 backdrop-blur-sm rounded-lg border border-white/30 px-3 py-2"
            aria-live="polite"
          >
            <div className="flex items-center gap-2">
              <div className="text-white/70 text-xs">
                {formatDisplays[currentFormatIndex].label}
              </div>
              <div className="text-white font-mono text-sm">
                {coordinates[formatDisplays[currentFormatIndex].key]}
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  copyToClipboard(
                    coordinates[formatDisplays[currentFormatIndex].key],
                    formatDisplays[currentFormatIndex].key
                  )
                }
                className="text-white/60 hover:text-white hover:bg-white/20 h-6 w-6 p-0"
              >
                {copiedField === formatDisplays[currentFormatIndex].key ? (
                  <CheckCircle className="w-3 h-3 text-green-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Route Statistics Card - Quick Dashboard */}
      {routeStats && waypoints.length >= 2 && (
        <div className="absolute top-20 right-4 z-20 lg:hidden">
          <Card className="bg-black/80 backdrop-blur-sm border-white/20 text-white">
            <CardContent className="p-3 space-y-2">
              <div className="text-xs font-semibold text-white/70">
                Route Stats
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                <div className="text-white/60">Distance:</div>
                <div className="font-mono text-right">
                  {formatDistance(routeStats.totalDistance)}
                </div>
                <div className="text-white/60">Waypoints:</div>
                <div className="font-mono text-right">{waypoints.length}</div>
                {cruisingSpeed > 0 && (
                  <>
                    <div className="text-white/60">Time:</div>
                    <div className="font-mono text-right">
                      {(() => {
                        const distanceNm = routeStats.totalDistance / 1852;
                        const hours = distanceNm / cruisingSpeed;
                        const h = Math.floor(hours);
                        const m = Math.round((hours - h) * 60);
                        return h > 0 ? `${h}h ${m}m` : `${m}m`;
                      })()}
                    </div>
                    <div className="text-white/60">Speed:</div>
                    <div className="font-mono text-right">
                      {cruisingSpeed.toFixed(1)} kn
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Dialogs */}
      <Dialog open={showGPXDialog} onOpenChange={setShowGPXDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>GPX Files</DialogTitle>
            <DialogDescription>
              Import or export GPX files for use with GPS devices.
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="export" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="export">Export</TabsTrigger>
              <TabsTrigger value="import">Import</TabsTrigger>
            </TabsList>

            <TabsContent value="export" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gpx-name">Route Name</Label>
                <Input
                  id="gpx-name"
                  value={routeName}
                  onChange={(e) => setRouteName(e.target.value)}
                  className="h-8"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowGPXDialog(false)}
                  className="h-8"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (currentRoute) {
                      const options: GPXExportOptions = {
                        includeElevation: false,
                        includeTimestamps: true,
                        routeName,
                      };
                      downloadGPX(currentRoute, options);
                      setShowGPXDialog(false);
                      setHasUnsavedChanges(false); // Clear unsaved flag after export
                    }
                  }}
                  disabled={!currentRoute || waypoints.length === 0}
                  className="h-8"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download GPX
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="import" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gpx-file">Select GPX File</Label>
                <Input
                  id="gpx-file"
                  type="file"
                  accept=".gpx"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="h-8"
                />
                {importFile && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {importFile.name}
                  </p>
                )}
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800">
                  <strong>Warning:</strong> Importing will replace your current
                  route.
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowGPXDialog(false);
                    setImportFile(null);
                  }}
                  className="h-8"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (importFile) {
                      importGPX(importFile);
                    }
                  }}
                  disabled={!importFile}
                  className="h-8"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Import GPX
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
