import { Coordinates } from "./coords";
import {
  Waypoint,
  Route,
  RouteSegment,
  ElevationPoint,
  RouteStats,
  GPXExportOptions,
} from "./route-types";

// Calculate distance between two points using Haversine formula
export function calculateDistance(
  point1: Coordinates,
  point2: Coordinates
): number {
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
}

// Calculate bearing between two points
export function calculateBearing(
  point1: Coordinates,
  point2: Coordinates
): number {
  const lat1Rad = (point1.lat * Math.PI) / 180;
  const lat2Rad = (point2.lat * Math.PI) / 180;
  const deltaLngRad = ((point2.lng - point1.lng) * Math.PI) / 180;

  const y = Math.sin(deltaLngRad) * Math.cos(lat2Rad);
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(deltaLngRad);
  const bearingRad = Math.atan2(y, x);
  return ((bearingRad * 180) / Math.PI + 360) % 360;
}

// Calculate route segments
export function calculateRouteSegments(waypoints: Waypoint[]): RouteSegment[] {
  const segments: RouteSegment[] = [];

  for (let i = 0; i < waypoints.length - 1; i++) {
    const start = waypoints[i];
    const end = waypoints[i + 1];

    const distance = calculateDistance(start.coordinates, end.coordinates);
    const bearing = calculateBearing(start.coordinates, end.coordinates);

    let elevationGain = 0;
    let elevationLoss = 0;

    if (start.elevation !== undefined && end.elevation !== undefined) {
      const elevationDiff = end.elevation - start.elevation;
      if (elevationDiff > 0) {
        elevationGain = elevationDiff;
      } else {
        elevationLoss = Math.abs(elevationDiff);
      }
    }

    segments.push({
      startWaypoint: start,
      endWaypoint: end,
      distance,
      bearing,
      elevationGain,
      elevationLoss,
    });
  }

  return segments;
}

// Calculate route statistics
export function calculateRouteStats(route: Route): RouteStats {
  const totalDistance = route.segments.reduce(
    (sum, segment) => sum + segment.distance,
    0
  );
  const totalElevationGain = route.segments.reduce(
    (sum, segment) => sum + segment.elevationGain,
    0
  );
  const totalElevationLoss = route.segments.reduce(
    (sum, segment) => sum + segment.elevationLoss,
    0
  );

  const elevations = route.waypoints
    .map((wp) => wp.elevation)
    .filter((elev): elev is number => elev !== undefined);

  const minElevation = elevations.length > 0 ? Math.min(...elevations) : 0;
  const maxElevation = elevations.length > 0 ? Math.max(...elevations) : 0;

  const averageGrade =
    totalDistance > 0 ? (totalElevationGain / totalDistance) * 100 : 0;

  return {
    totalDistance,
    elevationGain: totalElevationGain,
    elevationLoss: totalElevationLoss,
    minElevation,
    maxElevation,
    averageGrade,
  };
}

// Format distance for display (nautical miles for consistency with knots)
export function formatDistance(meters: number): string {
  const nauticalMiles = meters / 1852;
  if (nauticalMiles < 0.1) {
    return `${Math.round(meters)} m`;
  } else if (nauticalMiles < 10) {
    return `${nauticalMiles.toFixed(1)} nm`;
  } else {
    return `${Math.round(nauticalMiles)} nm`;
  }
}

// Format elevation for display
export function formatElevation(meters: number): string {
  return `${Math.round(meters)} m`;
}

// Format bearing for display
export function formatBearing(degrees: number): string {
  return `${Math.round(degrees)}°`;
}

// Generate unique waypoint ID
export function generateWaypointId(): string {
  return `waypoint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Generate unique route ID
export function generateRouteId(): string {
  return `route_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Generate default waypoint name
export function generateWaypointName(index: number): string {
  if (index === 0) return "Start";
  return `Waypoint ${index}`;
}

// Reverse a route (flip waypoint order)
export function reverseRoute(route: Route): Route {
  const reversedWaypoints = [...route.waypoints].reverse();
  const reversedSegments = calculateRouteSegments(reversedWaypoints);

  return {
    ...route,
    name: `${route.name} (Reversed)`,
    waypoints: reversedWaypoints,
    segments: reversedSegments,
    modified: new Date(),
  };
}

// Generate GPX file content
export function generateGPX(route: Route, options: GPXExportOptions): string {
  const {
    includeElevation,
    includeTimestamps,
    routeName,
    description,
    author,
  } = options;

  const gpxHeader = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Effe Doppia Vu Route Builder" 
     xmlns="http://www.topografix.com/GPX/1/1"
     xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
     xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>${escapeXml(routeName)}</name>
    ${description ? `<desc>${escapeXml(description)}</desc>` : ""}
    ${author ? `<author><name>${escapeXml(author)}</name></author>` : ""}
    <time>${new Date().toISOString()}</time>
  </metadata>`;

  // Generate waypoints
  const waypointsXml = route.waypoints
    .map((waypoint, index) => {
      const elevationAttr =
        includeElevation && waypoint.elevation !== undefined
          ? ` <ele>${waypoint.elevation.toFixed(1)}</ele>\n`
          : "";
      const timeAttr = includeTimestamps
        ? ` <time>${new Date(waypoint.timestamp).toISOString()}</time>\n`
        : "";

      return `  <wpt lat="${waypoint.coordinates.lat.toFixed(
        8
      )}" lon="${waypoint.coordinates.lng.toFixed(8)}">
    <name>${escapeXml(waypoint.name)}</name>
${elevationAttr}${timeAttr}    <sym>Waypoint</sym>
  </wpt>`;
    })
    .join("\n");

  // Generate route track
  const trackPoints = route.waypoints
    .map((waypoint) => {
      const elevationAttr =
        includeElevation && waypoint.elevation !== undefined
          ? `\n      <ele>${waypoint.elevation.toFixed(1)}</ele>`
          : "";
      const timeAttr = includeTimestamps
        ? `\n      <time>${new Date(waypoint.timestamp).toISOString()}</time>`
        : "";

      return `    <trkpt lat="${waypoint.coordinates.lat.toFixed(
        8
      )}" lon="${waypoint.coordinates.lng.toFixed(
        8
      )}">${elevationAttr}${timeAttr}
    </trkpt>`;
    })
    .join("\n");

  const routeTrack = `  <trk>
    <name>${escapeXml(routeName)}</name>
    <trkseg>
${trackPoints}
    </trkseg>
  </trk>`;

  return `${gpxHeader}
${waypointsXml}
${routeTrack}
</gpx>`;
}

// Helper function to escape XML special characters
function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Download GPX file
export function downloadGPX(route: Route, options: GPXExportOptions): void {
  const gpxContent = generateGPX(route, options);
  const blob = new Blob([gpxContent], { type: "application/gpx+xml" });
  const url = URL.createObjectURL(blob);

  const filename = `${route.name
    .replace(/[^a-z0-9]/gi, "_")
    .toLowerCase()}.gpx`;

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

// Load routes from localStorage
export function loadRoutes(): Route[] {
  try {
    const stored = localStorage.getItem("routes");
    if (!stored) return [];

    const routes = JSON.parse(stored);
    return routes.map((route: any) => ({
      ...route,
      created: new Date(route.created),
      modified: new Date(route.modified),
    }));
  } catch (error) {
    console.error("Failed to load routes:", error);
    return [];
  }
}

// Save routes to localStorage
export function saveRoutes(routes: Route[]): void {
  try {
    localStorage.setItem("routes", JSON.stringify(routes));
  } catch (error) {
    console.error("Failed to save routes:", error);
  }
}

// Save a single route
export function saveRoute(route: Route): void {
  const routes = loadRoutes();
  const existingIndex = routes.findIndex((r) => r.id === route.id);

  if (existingIndex >= 0) {
    routes[existingIndex] = { ...route, modified: new Date() };
  } else {
    routes.push(route);
  }

  saveRoutes(routes);
}

// Delete a route
export function deleteRoute(routeId: string): void {
  const routes = loadRoutes();
  const filteredRoutes = routes.filter((r) => r.id !== routeId);
  saveRoutes(filteredRoutes);
}
