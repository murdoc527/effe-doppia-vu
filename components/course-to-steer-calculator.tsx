"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CourseCalculation {
  desiredTrack: number | null;
  vesselSpeed: number | null;
  tidalSet: number | null;
  tidalRate: number | null;
  leeway: number | null;
  legDistance: number | null;
  courseToSteer: number | null;
  groundSpeed: number | null;
  eta: number | null;
}

function calculateCourseToSteer(
  desiredTrack: number,
  vesselSpeed: number,
  tidalSet: number,
  tidalRate: number,
  leeway = 0
): { courseToSteer: number; groundSpeed: number } {
  // Convert degrees to radians
  const desiredTrackRad = (desiredTrack * Math.PI) / 180;
  const tidalSetRad = (tidalSet * Math.PI) / 180;

  // Tidal vector components
  const tidalX = tidalRate * Math.sin(tidalSetRad);
  const tidalY = tidalRate * Math.cos(tidalSetRad);

  // Desired track vector components (unit vector)
  const trackX = Math.sin(desiredTrackRad);
  const trackY = Math.cos(desiredTrackRad);

  // Solve for course to steer using iterative method
  // We need to find CTS such that the resultant vector points in the desired track direction
  let courseToSteer = desiredTrack; // Initial guess
  let iterations = 0;
  const maxIterations = 100;
  const tolerance = 0.001;

  while (iterations < maxIterations) {
    const ctsRad = (courseToSteer * Math.PI) / 180;

    // Ship's velocity vector components
    const shipX = vesselSpeed * Math.sin(ctsRad);
    const shipY = vesselSpeed * Math.cos(ctsRad);

    // Resultant vector (ship + tidal)
    const resultantX = shipX + tidalX;
    const resultantY = shipY + tidalY;

    // Calculate actual track angle
    const actualTrackRad = Math.atan2(resultantX, resultantY);
    const actualTrack = (actualTrackRad * 180) / Math.PI;

    // Calculate error
    let error = desiredTrack - actualTrack;

    // Normalize error to [-180, 180]
    while (error > 180) error -= 360;
    while (error < -180) error += 360;

    if (Math.abs(error) < tolerance) break;

    // Adjust course to steer
    courseToSteer += error * 0.5; // Damping factor for stability

    // Normalize course to [0, 360)
    courseToSteer = ((courseToSteer % 360) + 360) % 360;

    iterations++;
  }

  // Apply leeway correction
  courseToSteer += leeway;
  courseToSteer = ((courseToSteer % 360) + 360) % 360;

  // Calculate final ground speed
  const finalCtsRad = (courseToSteer * Math.PI) / 180;
  const finalShipX = vesselSpeed * Math.sin(finalCtsRad);
  const finalShipY = vesselSpeed * Math.cos(finalCtsRad);
  const finalResultantX = finalShipX + tidalX;
  const finalResultantY = finalShipY + tidalY;
  const groundSpeed = Math.sqrt(
    finalResultantX * finalResultantX + finalResultantY * finalResultantY
  );

  return { courseToSteer, groundSpeed };
}

function VesselNavigationDiagram({
  desiredTrack,
  courseToSteer,
  tidalSet,
  tidalRate,
}: {
  desiredTrack: number | null;
  courseToSteer: number | null;
  tidalSet: number | null;
  tidalRate: number | null;
}) {
  if (!desiredTrack || !courseToSteer || !tidalSet) return null;

  const centerX = 250;
  const centerY = 250;
  const radius = 150;

  const formatBearing = (bearing: number | null) => {
    if (bearing === null) return "---°T";
    const formatted =
      bearing % 1 === 0 ? bearing.toString() : bearing.toFixed(1);
    return `${formatted.padStart(3, "0")}°T`;
  };

  // Convert angles to SVG coordinates (SVG 0° is at 3 o'clock, we want 0° at 12 o'clock)
  const toSVGAngle = (bearing: number) => bearing - 90;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

  // Calculate arrow endpoints
  const desiredTrackAngle = toRadians(toSVGAngle(desiredTrack));
  const courseToSteerAngle = toRadians(toSVGAngle(courseToSteer));
  const tidalSetOppositeAngle = toRadians(toSVGAngle(tidalSet + 180)); // Opposite direction

  const desiredTrackEnd = {
    x: centerX + radius * Math.cos(desiredTrackAngle),
    y: centerY + radius * Math.sin(desiredTrackAngle),
  };

  const courseToSteerEnd = {
    x: centerX + radius * Math.cos(courseToSteerAngle),
    y: centerY + radius * Math.sin(courseToSteerAngle),
  };

  const tidalLength = Math.min(90, (tidalRate || 0) * 30); // Scale tidal vector
  const tidalSetStart = {
    x: centerX + tidalLength * Math.cos(tidalSetOppositeAngle),
    y: centerY + tidalLength * Math.sin(tidalSetOppositeAngle),
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-4 border border-slate-700/50 shadow-2xl">
      <h3 className="text-lg font-bold text-white mb-3 text-center">
        Navigation Vector Diagram
      </h3>

      <div className="mb-4 flex justify-center gap-6 text-sm">
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-green-500 rounded"></div>
            <span className="text-slate-200">Desired Track</span>
          </div>
          <span
            style={{
              fontSize: "16px",
              fontWeight: "bold",
              fontFamily: "monospace",
              color: "#e2e8f0",
            }}
          >
            {formatBearing(desiredTrack)}
          </span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-blue-500 rounded"></div>
            <span className="text-slate-200">Course to Steer</span>
          </div>
          <span
            style={{
              fontSize: "16px",
              fontWeight: "bold",
              fontFamily: "monospace",
              color: "#e2e8f0",
            }}
          >
            {formatBearing(courseToSteer)}
          </span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-red-500 rounded"></div>
            <span className="text-slate-200">Tidal Set</span>
          </div>
          <span
            style={{
              fontSize: "16px",
              fontWeight: "bold",
              fontFamily: "monospace",
              color: "#e2e8f0",
            }}
          >
            {formatBearing(tidalSet)}
          </span>
        </div>
      </div>

      <svg
        width="100%"
        height="500"
        viewBox="0 0 500 500"
        className="mx-auto bg-slate-800/30 rounded-xl max-w-full"
      >
        {/* Enhanced compass rose background with multiple circles */}
        <circle
          cx={centerX}
          cy={centerY}
          r={radius + 25}
          fill="none"
          stroke="rgba(148, 163, 184, 0.2)"
          strokeWidth="1"
          strokeDasharray="4,4"
        />
        <circle
          cx={centerX}
          cy={centerY}
          r={radius}
          fill="none"
          stroke="rgba(148, 163, 184, 0.15)"
          strokeWidth="1"
        />
        <circle
          cx={centerX}
          cy={centerY}
          r={radius - 40}
          fill="none"
          stroke="rgba(148, 163, 184, 0.1)"
          strokeWidth="1"
        />

        {/* Enhanced cardinal directions with better positioning */}
        <text
          x={centerX}
          y={centerY - radius - 40}
          textAnchor="middle"
          fill="#e2e8f0"
          fontSize="16"
          fontWeight="bold"
          fontFamily="monospace"
        >
          000°T
        </text>
        <text
          x={centerX + radius + 40}
          y={centerY + 6}
          textAnchor="middle"
          fill="#e2e8f0"
          fontSize="16"
          fontWeight="bold"
          fontFamily="monospace"
        >
          090°T
        </text>
        <text
          x={centerX}
          y={centerY + radius + 50}
          textAnchor="middle"
          fill="#e2e8f0"
          fontSize="16"
          fontWeight="bold"
          fontFamily="monospace"
        >
          180°T
        </text>
        <text
          x={centerX - radius - 40}
          y={centerY + 6}
          textAnchor="middle"
          fill="#e2e8f0"
          fontSize="16"
          fontWeight="bold"
          fontFamily="monospace"
        >
          270°T
        </text>

        <g transform={`rotate(${courseToSteer} ${centerX} ${centerY})`}>
          {/* Ship hull */}
          <path
            d={`M ${centerX} ${centerY - 20} 
                L ${centerX - 8} ${centerY - 10}
                L ${centerX - 10} ${centerY + 8}
                L ${centerX - 6} ${centerY + 15}
                L ${centerX + 6} ${centerY + 15}
                L ${centerX + 10} ${centerY + 8}
                L ${centerX + 8} ${centerY - 10}
                Z`}
            fill="#ffffff"
            stroke="#1e293b"
            strokeWidth="1.5"
          />
          {/* Bridge/Superstructure */}
          <rect
            x={centerX - 4}
            y={centerY - 8}
            width="8"
            height="10"
            fill="#e2e8f0"
            stroke="#1e293b"
            strokeWidth="1"
            rx="1"
          />
          {/* Bow indicator */}
          <circle
            cx={centerX}
            cy={centerY - 15}
            r="2"
            fill="#3b82f6"
            stroke="#1e293b"
            strokeWidth="1"
          />
        </g>

        {/* Enhanced arrow markers with better styling */}
        <defs>
          <marker
            id="arrowhead-green"
            markerWidth="8"
            markerHeight="6"
            refX="7"
            refY="3"
            orient="auto"
          >
            <polygon
              points="0 0, 8 3, 0 6"
              fill="#22c55e"
              stroke="#16a34a"
              strokeWidth="0.5"
            />
          </marker>
          <marker
            id="arrowhead-blue"
            markerWidth="8"
            markerHeight="6"
            refX="7"
            refY="3"
            orient="auto"
          >
            <polygon
              points="0 0, 8 3, 0 6"
              fill="#3b82f6"
              stroke="#2563eb"
              strokeWidth="0.5"
            />
          </marker>
          <marker
            id="arrowhead-red"
            markerWidth="8"
            markerHeight="6"
            refX="7"
            refY="3"
            orient="auto"
          >
            <polygon
              points="0 0, 8 3, 0 6"
              fill="#ef4444"
              stroke="#dc2626"
              strokeWidth="0.5"
            />
          </marker>
        </defs>

        {/* Enhanced Desired Track arrow */}
        <line
          x1={centerX}
          y1={centerY}
          x2={desiredTrackEnd.x}
          y2={desiredTrackEnd.y}
          stroke="#22c55e"
          strokeWidth="5"
          markerEnd="url(#arrowhead-green)"
          strokeLinecap="round"
        />

        {/* Enhanced Course to Steer arrow */}
        <line
          x1={centerX}
          y1={centerY}
          x2={courseToSteerEnd.x}
          y2={courseToSteerEnd.y}
          stroke="#3b82f6"
          strokeWidth="5"
          markerEnd="url(#arrowhead-blue)"
          strokeLinecap="round"
        />

        {/* Enhanced Tidal Set arrow */}
        <line
          x1={tidalSetStart.x}
          y1={tidalSetStart.y}
          x2={centerX}
          y2={centerY}
          stroke="#ef4444"
          strokeWidth="4"
          markerEnd="url(#arrowhead-red)"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

export function CourseToSteerCalculator() {
  const [values, setValues] = useState<CourseCalculation>({
    desiredTrack: null,
    vesselSpeed: null,
    tidalSet: null,
    tidalRate: null,
    leeway: null,
    legDistance: null,
    courseToSteer: null,
    groundSpeed: null,
    eta: null,
  });

  useEffect(() => {
    if (
      values.desiredTrack !== null &&
      values.vesselSpeed !== null &&
      values.tidalSet !== null &&
      values.tidalRate !== null
    ) {
      const result = calculateCourseToSteer(
        values.desiredTrack,
        values.vesselSpeed,
        values.tidalSet,
        values.tidalRate,
        values.leeway || 0
      );

      // Calculate ETA if leg distance is provided
      let eta = null;
      if (values.legDistance !== null && result.groundSpeed > 0) {
        eta = values.legDistance / result.groundSpeed; // Hours
      }

      setValues((prev) => ({
        ...prev,
        courseToSteer: Math.round(result.courseToSteer * 10) / 10,
        groundSpeed: Math.round(result.groundSpeed * 100) / 100,
        eta: eta ? Math.round(eta * 100) / 100 : null,
      }));
    } else {
      setValues((prev) => ({
        ...prev,
        courseToSteer: null,
        groundSpeed: null,
        eta: null,
      }));
    }
  }, [
    values.desiredTrack,
    values.vesselSpeed,
    values.tidalSet,
    values.tidalRate,
    values.leeway,
    values.legDistance,
  ]);

  const handleInputChange = (field: keyof CourseCalculation, value: string) => {
    let numValue = value === "" ? null : Number.parseFloat(value);

    if (numValue !== null) {
      if (
        field === "desiredTrack" ||
        field === "tidalSet" ||
        field === "leeway"
      ) {
        // Constrain bearings to 0-360 degrees
        if (numValue < 0) numValue = 0;
        if (numValue > 360) numValue = 360;
      } else if (
        field === "vesselSpeed" ||
        field === "tidalRate" ||
        field === "legDistance"
      ) {
        // Prevent negative values for speed/rate/distance fields
        if (numValue < 0) numValue = 0;
        if (field === "vesselSpeed" && numValue > 99) numValue = 99;
      }
    }

    setValues((prev) => ({ ...prev, [field]: numValue }));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <h2 className="text-base font-semibold text-white mb-2 sm:mb-0">
            Course to Steer Calculator
          </h2>
        </div>

        {/* Desired Track */}
        <div className="mb-4">
          <Label className="text-white mb-2 block">Desired Track (°T)</Label>
          <Input
            type="number"
            placeholder="Enter desired track"
            value={values.desiredTrack?.toString() || ""}
            onChange={(e) => handleInputChange("desiredTrack", e.target.value)}
            onWheel={(e) => e.currentTarget.blur()}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
            min="0"
            max="360"
          />
        </div>

        {/* Vessel Speed */}
        <div className="mb-4">
          <Label className="text-white mb-2 block">Vessel Speed (knots)</Label>
          <Input
            type="number"
            placeholder="Speed through water"
            value={values.vesselSpeed?.toString() || ""}
            onChange={(e) => handleInputChange("vesselSpeed", e.target.value)}
            onWheel={(e) => e.currentTarget.blur()}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
            min="0"
            max="99"
            step="0.1"
          />
        </div>

        {/* Tidal Set and Rate */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <Label className="text-white mb-2 block">Tidal Set (°T)</Label>
            <Input
              type="number"
              placeholder="Tidal direction"
              value={values.tidalSet?.toString() || ""}
              onChange={(e) => handleInputChange("tidalSet", e.target.value)}
              onWheel={(e) => e.currentTarget.blur()}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              min="0"
              max="360"
            />
          </div>
          <div>
            <Label className="text-white mb-2 block">Tidal Rate (knots)</Label>
            <Input
              type="number"
              placeholder="Tidal speed"
              value={values.tidalRate?.toString() || ""}
              onChange={(e) => handleInputChange("tidalRate", e.target.value)}
              onWheel={(e) => e.currentTarget.blur()}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              min="0"
              step="0.1"
            />
          </div>
        </div>

        {/* Optional inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <Label className="text-white mb-2 block">
              Leeway (°) <span className="text-white/60">Optional</span>
            </Label>
            <Input
              type="number"
              placeholder="Lateral bias"
              value={values.leeway?.toString() || ""}
              onChange={(e) => handleInputChange("leeway", e.target.value)}
              onWheel={(e) => e.currentTarget.blur()}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              min="0"
              max="360"
              step="0.1"
            />
          </div>
          <div>
            <Label className="text-white mb-2 block">
              Leg Distance (NM) <span className="text-white/60">Optional</span>
            </Label>
            <Input
              type="number"
              placeholder="For ETA calculation"
              value={values.legDistance?.toString() || ""}
              onChange={(e) => handleInputChange("legDistance", e.target.value)}
              onWheel={(e) => e.currentTarget.blur()}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              min="0"
              step="0.1"
            />
          </div>
        </div>

        {values.courseToSteer !== null && (
          <>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10 mb-4">
              <h3 className="text-sm font-semibold text-white mb-2">Results</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-lg font-bold text-white">
                    {values.courseToSteer % 1 === 0
                      ? values.courseToSteer.toString().padStart(3, "0")
                      : values.courseToSteer.toFixed(1).padStart(5, "0")}
                    °T
                  </div>
                  <div className="text-xs text-white/80">Course to Steer</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-white">
                    {values.groundSpeed?.toFixed(2)} kts
                  </div>
                  <div className="text-xs text-white/80">Ground Speed</div>
                </div>
              </div>
              {values.eta !== null && (
                <div className="mt-2 pt-2 border-t border-white/10">
                  <div className="text-lg font-bold text-white">
                    {Math.floor(values.eta)}h{" "}
                    {Math.round((values.eta % 1) * 60)}m
                  </div>
                  <div className="text-xs text-white/80">
                    Estimated Time of Arrival
                  </div>
                </div>
              )}
            </div>

            <VesselNavigationDiagram
              desiredTrack={values.desiredTrack}
              courseToSteer={values.courseToSteer}
              tidalSet={values.tidalSet}
              tidalRate={values.tidalRate}
            />
          </>
        )}

        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
          <h3 className="text-xs font-semibold text-white mb-2">How to Use</h3>
          <ul className="text-white/80 text-xs space-y-1">
            <li>• Enter desired track (true bearing where you want to go)</li>
            <li>• Add vessel speed through water</li>
            <li>• Include tidal set (direction) and rate (speed)</li>
            <li>• Optionally add leeway and leg distance for ETA</li>
            <li>• Course to steer and ground speed calculated automatically</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
