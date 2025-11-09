import { Coordinates } from "./coords";

export interface Waypoint {
  id: string;
  name: string;
  coordinates: Coordinates;
  elevation?: number;
  timestamp: number;
  description?: string;
}

export interface RouteSegment {
  startWaypoint: Waypoint;
  endWaypoint: Waypoint;
  distance: number; // meters
  bearing: number; // degrees
  elevationGain: number; // meters
  elevationLoss: number; // meters
}

export interface Route {
  id: string;
  name: string;
  description?: string;
  waypoints: Waypoint[];
  segments: RouteSegment[];
  totalDistance: number; // meters
  totalElevationGain: number; // meters
  totalElevationLoss: number; // meters
  minElevation: number; // meters
  maxElevation: number; // meters
  created: Date;
  modified: Date;
}

export interface ElevationPoint {
  distance: number; // cumulative distance from start in meters
  elevation: number; // elevation in meters
  coordinates: Coordinates;
}

export interface RouteStats {
  totalDistance: number;
  totalTime?: number; // estimated time in minutes
  elevationGain: number;
  elevationLoss: number;
  minElevation: number;
  maxElevation: number;
  averageGrade?: number; // percentage
  maxGrade?: number; // percentage
}

export interface GPXExportOptions {
  includeElevation: boolean;
  includeTimestamps: boolean;
  routeName: string;
  description?: string;
  author?: string;
}
