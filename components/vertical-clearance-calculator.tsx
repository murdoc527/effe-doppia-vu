"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ClearanceResult {
  bridgeClearanceAtArrival: number;
  vesselRequirement: number;
  isSafe: boolean;
  margin: number;
  fallInTide: number;
}

export function VerticalClearanceCalculator() {
  const [bridgeClearanceAtHAT, setBridgeClearanceAtHAT] = useState("");
  const [hatAtLocation, setHatAtLocation] = useState("");
  const [tideHeightAtArrival, setTideHeightAtArrival] = useState("");
  const [vesselAirDraft, setVesselAirDraft] = useState("");
  const [safetyMargin, setSafetyMargin] = useState("1"); // default 1 meter as per example
  const [unit, setUnit] = useState("meters");
  const [result, setResult] = useState<ClearanceResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    // Clear previous results
    setError("");
    setResult(null);

    // Only calculate if we have all required values
    if (
      !bridgeClearanceAtHAT ||
      !hatAtLocation ||
      !tideHeightAtArrival ||
      !vesselAirDraft ||
      !safetyMargin
    ) {
      return;
    }

    const bridgeVal = Number.parseFloat(bridgeClearanceAtHAT);
    const hatVal = Number.parseFloat(hatAtLocation);
    const tideVal = Number.parseFloat(tideHeightAtArrival);
    const vesselVal = Number.parseFloat(vesselAirDraft);
    const marginVal = Number.parseFloat(safetyMargin);

    // Validate numbers
    if (
      isNaN(bridgeVal) ||
      isNaN(hatVal) ||
      isNaN(tideVal) ||
      isNaN(vesselVal) ||
      isNaN(marginVal)
    ) {
      setError("Please enter valid numbers");
      return;
    }

    if (bridgeVal <= 0 || hatVal <= 0 || vesselVal <= 0 || marginVal < 0) {
      setError(
        "Bridge clearance, HAT, and vessel air draft must be positive values"
      );
      return;
    }

    // Calculate fall in tide from HAT (if tide is below HAT, we get more clearance)
    const fallInTide = hatVal - tideVal;

    // Calculate actual bridge clearance at arrival time
    const bridgeClearanceAtArrival = bridgeVal + fallInTide;

    // Calculate total vessel requirement (air draft + safety margin)
    const vesselRequirement = vesselVal + marginVal;

    // Check if safe
    const isSafe = bridgeClearanceAtArrival >= vesselRequirement;
    const actualMargin = bridgeClearanceAtArrival - vesselRequirement;

    setResult({
      bridgeClearanceAtArrival,
      vesselRequirement,
      isSafe,
      margin: actualMargin,
      fallInTide,
    });
  }, [
    bridgeClearanceAtHAT,
    hatAtLocation,
    tideHeightAtArrival,
    vesselAirDraft,
    safetyMargin,
  ]);

  const convertToFeet = (meters: number) => (meters * 3.28084).toFixed(1);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="text-base font-semibold text-white">
            Vertical Clearance Calculator
          </h2>

          <div className="flex items-center gap-2">
            <Label className="text-white text-sm">Units:</Label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="bg-white/10 border border-white/20 text-white rounded-md px-3 py-2 text-sm min-w-[100px]"
            >
              <option value="meters">Meters</option>
              <option value="feet">Feet</option>
            </select>
          </div>
        </div>

        {/* Bridge Clearance at HAT and HAT at Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="flex flex-col">
            <Label className="text-white mb-2 block">
              Bridge Clearance at HAT ({unit === "meters" ? "m" : "ft"})
            </Label>
            <Input
              type="number"
              placeholder={`Bridge clearance in ${unit}`}
              value={bridgeClearanceAtHAT}
              onChange={(e) => setBridgeClearanceAtHAT(e.target.value)}
              onWheel={(e) => e.currentTarget.blur()}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
            />
            <div className="h-6"></div>
          </div>

          <div className="flex flex-col">
            <Label className="text-white mb-2 block">
              HAT at Location ({unit === "meters" ? "m" : "ft"})
            </Label>
            <Input
              type="number"
              placeholder={`HAT height in ${unit}`}
              value={hatAtLocation}
              onChange={(e) => setHatAtLocation(e.target.value)}
              onWheel={(e) => e.currentTarget.blur()}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
            />
            <p className="text-white/60 text-xs mt-1">
              Highest Astronomical Tide for this location
            </p>
          </div>
        </div>

        {/* Height of Tide at Arrival */}
        <div className="mb-4">
          <Label className="text-white mb-2 block">
            Height of Tide at Arrival ({unit === "meters" ? "m" : "ft"})
          </Label>
          <Input
            type="number"
            placeholder={`Tide height at arrival in ${unit}`}
            value={tideHeightAtArrival}
            onChange={(e) => setTideHeightAtArrival(e.target.value)}
            onWheel={(e) => e.currentTarget.blur()}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
          />
          <p className="text-white/60 text-xs mt-1">
            Predicted tide height when you arrive
          </p>
        </div>

        {/* Vessel Air Draft and Safety Margin */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <Label className="text-white mb-2 block">
              Vessel Air Draft ({unit === "meters" ? "m" : "ft"})
            </Label>
            <Input
              type="number"
              placeholder={`Air draft in ${unit}`}
              value={vesselAirDraft}
              onChange={(e) => setVesselAirDraft(e.target.value)}
              onWheel={(e) => e.currentTarget.blur()}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
            />
            <p className="text-white/60 text-xs mt-1">
              Highest point above waterline
            </p>
          </div>

          <div>
            <Label className="text-white mb-2 block">
              Safety Margin ({unit === "meters" ? "m" : "ft"})
            </Label>
            <Input
              type="number"
              placeholder={`Safety margin in ${unit}`}
              value={safetyMargin}
              onChange={(e) => setSafetyMargin(e.target.value)}
              onWheel={(e) => e.currentTarget.blur()}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
            />
            <p className="text-white/60 text-xs mt-1">
              Additional clearance buffer
            </p>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div
            className={`backdrop-blur-sm rounded-xl p-3 border ${
              result.isSafe
                ? "bg-green-500/10 border-green-500/30"
                : "bg-red-500/10 border-red-500/30"
            }`}
          >
            <h3 className="text-base font-semibold text-white mb-2">
              Clearance Analysis
            </h3>

            <div className="space-y-2">
              <p className="text-white/90 text-sm">
                <span className="font-medium">Fall in Tide from HAT:</span>{" "}
                {result.fallInTide.toFixed(2)} {unit}
                {unit === "meters" &&
                  ` (${convertToFeet(result.fallInTide)} ft)`}
              </p>

              <p className="text-white/90 text-sm">
                <span className="font-medium">
                  Bridge Clearance at Arrival:
                </span>{" "}
                {result.bridgeClearanceAtArrival.toFixed(2)} {unit}
                {unit === "meters" &&
                  ` (${convertToFeet(result.bridgeClearanceAtArrival)} ft)`}
              </p>

              <p className="text-white/90 text-sm">
                <span className="font-medium">Vessel Requirement:</span>{" "}
                {result.vesselRequirement.toFixed(2)} {unit}
                {unit === "meters" &&
                  ` (${convertToFeet(result.vesselRequirement)} ft)`}
              </p>

              <p className="text-white/90 text-sm">
                <span className="font-medium">Clearance Margin:</span>{" "}
                {result.margin >= 0 ? "+" : ""}
                {result.margin.toFixed(2)} {unit}
                {unit === "meters" &&
                  ` (${result.margin >= 0 ? "+" : ""}${convertToFeet(
                    result.margin
                  )} ft)`}
              </p>

              <div
                className={`p-3 rounded-lg ${
                  result.isSafe ? "bg-green-500/20" : "bg-red-500/20"
                }`}
              >
                <p
                  className={`font-semibold text-sm ${
                    result.isSafe ? "text-green-200" : "text-red-200"
                  }`}
                >
                  {result.isSafe
                    ? "✓ SAFE TO PROCEED"
                    : "⚠ UNSAFE - DO NOT PROCEED"}
                </p>
                <p
                  className={`text-xs mt-1 ${
                    result.isSafe ? "text-green-300" : "text-red-300"
                  }`}
                >
                  {result.isSafe
                    ? "Sufficient clearance with safety margin"
                    : "Insufficient clearance - risk of collision"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Usage Instructions */}
      <div className="mt-4 bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
        <h3 className="text-base font-semibold text-white mb-2">How to Use</h3>
        <ul className="text-white/80 space-y-1 text-sm">
          <li>• Enter bridge clearance height at HAT (from charts)</li>
          <li>• Input the HAT value for your location</li>
          <li>• Enter predicted tide height at your arrival time</li>
          <li>• Input vessel air draft and desired safety margin</li>
          <li>
            • Calculator determines if passage is safe using HAT methodology
          </li>
        </ul>
      </div>

      {/* Safety Warning */}
      <div className="mt-4 bg-yellow-500/10 backdrop-blur-sm rounded-xl p-4 border border-yellow-500/30">
        <h3 className="text-base font-semibold text-yellow-200 mb-2">
          ⚠ Safety Notice
        </h3>
        <p className="text-yellow-300/90 text-sm">
          This calculator uses HAT-based methodology for planning purposes only.
          Always verify with current charts, tide tables, and local authorities.
          Consider wave action, vessel squat, and other factors.
        </p>
      </div>
    </div>
  );
}
