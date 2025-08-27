"use client";

import { useReducer } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { reducer, initialState } from "@/lib/calculator-reducer";

export function SpeedDistanceCalculator() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const handleSpeedChange = (value: string) => {
    const numValue = value === "" ? null : Number.parseFloat(value);
    dispatch({ type: "setSpeed", value: numValue });
  };

  const handleDistanceChange = (value: string) => {
    const numValue = value === "" ? null : Number.parseFloat(value);
    dispatch({ type: "setDistance", value: numValue });
  };

  const handleTimeChange = (
    field: "hours" | "minutes" | "seconds",
    value: string
  ) => {
    const numValue = value === "" ? null : Number.parseInt(value, 10);
    dispatch({
      type: "setTime",
      [field]: numValue,
    });
  };

  const handleSpeedUnitChange = (unit: string) => {
    dispatch({
      type: "setSpeedUnit",
      unit: unit as "knots" | "mph" | "kmh" | "ms",
    });
  };

  const handleDistanceUnitChange = (unit: string) => {
    dispatch({
      type: "setDistanceUnit",
      unit: unit as "nm" | "km" | "mi" | "cables" | "m",
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-6 lg:p-8 border border-white/20">
        <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4 sm:mb-6">
          Speed Distance Time Calculator
        </h2>

        {/* Speed Input */}
        <div className="mb-4 sm:mb-6">
          <Label className="text-white mb-2 block text-sm sm:text-base">
            Speed
          </Label>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Auto-calculated"
              value={state.speed?.toString() || ""}
              onChange={(e) => handleSpeedChange(e.target.value)}
              onWheel={(e) => e.currentTarget.blur()}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50 text-sm sm:text-base"
            />
            <Select
              value={state.speedUnit}
              onValueChange={handleSpeedUnitChange}
            >
              <SelectTrigger className="w-20 sm:w-32 bg-white/10 border-white/20 text-white text-sm sm:text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="knots">Knots</SelectItem>
                <SelectItem value="mph">MPH</SelectItem>
                <SelectItem value="kmh">KM/H</SelectItem>
                <SelectItem value="ms">m/s</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Distance Input */}
        <div className="mb-4 sm:mb-6">
          <Label className="text-white mb-2 block text-sm sm:text-base">
            Distance
          </Label>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Auto-calculated"
              value={state.distance?.toString() || ""}
              onChange={(e) => handleDistanceChange(e.target.value)}
              onWheel={(e) => e.currentTarget.blur()}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50 text-sm sm:text-base"
            />
            <Select
              value={state.distanceUnit}
              onValueChange={handleDistanceUnitChange}
            >
              <SelectTrigger className="w-20 sm:w-32 bg-white/10 border-white/20 text-white text-sm sm:text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nm">NM</SelectItem>
                <SelectItem value="km">KM</SelectItem>
                <SelectItem value="mi">Mi</SelectItem>
                <SelectItem value="cables">Cables</SelectItem>
                <SelectItem value="m">Metres</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Time Input */}
        <div className="mb-4 sm:mb-6">
          <Label className="text-white mb-2 block text-sm sm:text-base">
            Time
          </Label>
          <div className="flex gap-1 sm:gap-2">
            <div className="flex-1">
              <Input
                type="number"
                placeholder="HH"
                value={state.timeHours === 0 ? "" : state.timeHours.toString()}
                onChange={(e) => handleTimeChange("hours", e.target.value)}
                onWheel={(e) => e.currentTarget.blur()}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 text-center text-sm sm:text-base"
                min="0"
              />
              <Label className="text-white/60 text-xs block text-center mt-1">
                Hours
              </Label>
            </div>
            <div className="flex-1">
              <Input
                type="number"
                placeholder="MM"
                value={state.timeMinutes === 0 ? "" : state.timeMinutes.toString()}
                onChange={(e) => handleTimeChange("minutes", e.target.value)}
                onWheel={(e) => e.currentTarget.blur()}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 text-center text-sm sm:text-base"
                min="0"
                max="59"
              />
              <Label className="text-white/60 text-xs block text-center mt-1">
                Minutes
              </Label>
            </div>
            <div className="flex-1">
              <Input
                type="number"
                placeholder="SS"
                value={state.timeSeconds === 0 ? "" : state.timeSeconds.toString()}
                onChange={(e) => handleTimeChange("seconds", e.target.value)}
                onWheel={(e) => e.currentTarget.blur()}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 text-center text-sm sm:text-base"
                min="0"
                max="59"
              />
              <Label className="text-white/60 text-xs block text-center mt-1">
                Seconds
              </Label>
            </div>
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/10">
          <h3 className="text-sm sm:text-base font-semibold text-white mb-2">
            How to Use
          </h3>
          <p className="text-white/80 text-sm sm:text-base leading-relaxed">
            Enter any 2 values and the third will be calculated automatically.
            Time normalizes automatically (e.g., 75 seconds becomes 1 minute 15
            seconds).
          </p>
        </div>
      </div>
    </div>
  );
}
