type LastEdited =
  | "speed"
  | "distance"
  | "timeHours"
  | "timeMinutes"
  | "timeSeconds"
  | null;

export type CalcState = {
  speed: number | null; // knots (generic ok)
  distance: number | null; // nm (generic ok)
  timeHours: number; // int >= 0
  timeMinutes: number; // 0–59
  timeSeconds: number; // 0–59
  lastEdited: LastEdited;
  editOrder: ("speed" | "distance" | "time")[]; // tracks the order of main field edits
  speedUnit: "knots" | "mph" | "kmh" | "ms";
  distanceUnit: "nm" | "km" | "mi" | "cables" | "m";
};

export const initialState: CalcState = {
  speed: null,
  distance: null,
  timeHours: 0,
  timeMinutes: 0,
  timeSeconds: 0,
  lastEdited: null,
  editOrder: [],
  speedUnit: "knots",
  distanceUnit: "nm",
};

export const round = (n: number, dp: number) =>
  Math.round(n * Math.pow(10, dp)) / Math.pow(10, dp);

export const hmsToSeconds = (h: number, m: number, s: number) =>
  Math.max(0, (h | 0) * 3600 + (m | 0) * 60 + (s | 0));

export const secondsToHMS = (total: number) => {
  const clamped = Math.max(0, Math.floor(total));
  const hours = Math.floor(clamped / 3600);
  const minutes = Math.floor((clamped % 3600) / 60);
  const seconds = clamped % 60;
  return { hours, minutes, seconds };
};

export const normalizeHMS = (h: number, m: number, s: number) => {
  const total = Math.max(
    0,
    Math.floor((h | 0) * 3600 + (m | 0) * 60 + (s | 0))
  );
  return { ...secondsToHMS(total), totalSeconds: total };
};

const isValidNumber = (v: any): v is number =>
  typeof v === "number" && isFinite(v) && v >= 0;

const updateEditOrder = (
  editOrder: ("speed" | "distance" | "time")[],
  newField: "speed" | "distance" | "time"
) => {
  const filtered = editOrder.filter((field) => field !== newField);
  return [...filtered, newField].slice(-3); // Keep only last 3 edits
};

const shouldRecalculateField = (
  currentField: "speed" | "distance" | "time",
  editOrder: ("speed" | "distance" | "time")[],
  hasSpeed: boolean,
  hasDistance: boolean,
  hasTime: boolean
) => {
  const fieldCount =
    (hasSpeed ? 1 : 0) + (hasDistance ? 1 : 0) + (hasTime ? 1 : 0);

  // If we have exactly 2 fields, calculate the missing one
  if (fieldCount === 2) {
    if (!hasSpeed) return "speed";
    if (!hasDistance) return "distance";
    if (!hasTime) return "time";
  }

  // If we have all 3 fields, recalculate the field that was edited longest ago
  if (fieldCount === 3) {
    // Find which field was never edited, so recalculate it
    const fields = ["speed", "distance", "time"] as const;

    for (const field of fields) {
      const lastEditIndex = editOrder.lastIndexOf(field);
      if (lastEditIndex === -1) {
        // This field was never edited, so recalculate it
        return field;
      }
    }

    // All fields have been edited, find the oldest one (excluding the current field)
    const otherFields = fields.filter((f) => f !== currentField);
    const oldestField = otherFields.reduce((oldest, field) => {
      const oldestIndex = editOrder.lastIndexOf(oldest);
      const fieldIndex = editOrder.lastIndexOf(field);
      return fieldIndex < oldestIndex ? field : oldest;
    });

    return oldestField;
  }

  return null;
};

const computeTimeFromSD = (speed: number, distance: number) => {
  if (speed <= 0) return null;
  const seconds = (distance / speed) * 3600;
  return seconds;
};

const computeSpeedFromDT = (distance: number, seconds: number) => {
  if (seconds <= 0) return null;
  return distance / (seconds / 3600);
};

const computeDistanceFromST = (speed: number, seconds: number) => {
  return speed * (seconds / 3600);
};

const convertSpeed = (
  value: number,
  fromUnit: string,
  toUnit: string
): number => {
  if (fromUnit === toUnit) return value;

  // Convert to knots first
  let knots = value;
  if (fromUnit === "mph") knots = value * 0.868976;
  else if (fromUnit === "kmh") knots = value * 0.539957;
  else if (fromUnit === "ms") knots = value * 1.94384;

  // Convert from knots to target unit
  if (toUnit === "mph") return knots * 1.15078;
  else if (toUnit === "kmh") return knots * 1.852;
  else if (toUnit === "ms") return knots * 0.514444;
  return knots;
};

const convertDistance = (
  value: number,
  fromUnit: string,
  toUnit: string
): number => {
  if (fromUnit === toUnit) return value;

  // Convert to nautical miles first
  let nm = value;
  if (fromUnit === "km") nm = value * 0.539957;
  else if (fromUnit === "mi") nm = value * 0.868976;
  else if (fromUnit === "cables") nm = value * 0.1;
  else if (fromUnit === "m") nm = value * 0.000539957;

  // Convert from nautical miles to target unit
  if (toUnit === "km") return nm * 1.852;
  else if (toUnit === "mi") return nm * 1.15078;
  else if (toUnit === "cables") return nm * 10;
  else if (toUnit === "m") return nm * 1852;
  return nm;
};

type Action =
  | { type: "setSpeed"; value: number | null }
  | { type: "setDistance"; value: number | null }
  | {
      type: "setTime";
      hours?: number | null;
      minutes?: number | null;
      seconds?: number | null;
    }
  | { type: "setSpeedUnit"; unit: "knots" | "mph" | "kmh" | "ms" }
  | { type: "setDistanceUnit"; unit: "nm" | "km" | "mi" | "cables" | "m" };

export function reducer(state: CalcState, action: Action): CalcState {
  const currentSeconds = hmsToSeconds(
    state.timeHours,
    state.timeMinutes,
    state.timeSeconds
  );

  const next: CalcState = { ...state };

  switch (action.type) {
    case "setSpeedUnit": {
      if (next.speed !== null) {
        next.speed = round(
          convertSpeed(next.speed, state.speedUnit, action.unit),
          3
        );
      }
      next.speedUnit = action.unit;
      return next;
    }

    case "setDistanceUnit": {
      if (next.distance !== null) {
        next.distance = round(
          convertDistance(next.distance, state.distanceUnit, action.unit),
          3
        );
      }
      next.distanceUnit = action.unit;
      return next;
    }

    case "setSpeed": {
      next.speed = isValidNumber(action.value) ? action.value : null;
      next.lastEdited = "speed";
      next.editOrder = updateEditOrder(state.editOrder, "speed");

      const seconds = hmsToSeconds(
        next.timeHours,
        next.timeMinutes,
        next.timeSeconds
      );

      const hasSpeed = isValidNumber(next.speed) && next.speed! > 0;
      const hasDistance = isValidNumber(next.distance);
      const hasTime = seconds > 0;

      const recalculate = shouldRecalculateField(
        "speed",
        next.editOrder,
        hasSpeed,
        hasDistance,
        hasTime
      );

      if (recalculate === "time" && hasSpeed && hasDistance) {
        const speedInKnots = convertSpeed(next.speed!, next.speedUnit, "knots");
        const distanceInNM = convertDistance(
          next.distance!,
          next.distanceUnit,
          "nm"
        );
        const t = computeTimeFromSD(speedInKnots, distanceInNM);
        if (t !== null) {
          const hms = secondsToHMS(t);
          next.timeHours = hms.hours;
          next.timeMinutes = hms.minutes;
          next.timeSeconds = hms.seconds;
        }
      } else if (recalculate === "distance" && hasSpeed && hasTime) {
        const speedInKnots = convertSpeed(next.speed!, next.speedUnit, "knots");
        const d = computeDistanceFromST(speedInKnots, seconds);
        const distanceInUnit = convertDistance(d, "nm", next.distanceUnit);
        next.distance = round(distanceInUnit, 3);
      }
      return next;
    }

    case "setDistance": {
      next.distance = isValidNumber(action.value) ? action.value : null;
      next.lastEdited = "distance";
      next.editOrder = updateEditOrder(state.editOrder, "distance");

      const seconds = hmsToSeconds(
        next.timeHours,
        next.timeMinutes,
        next.timeSeconds
      );

      const hasSpeed = isValidNumber(next.speed) && next.speed! > 0;
      const hasDistance = isValidNumber(next.distance);
      const hasTime = seconds > 0;

      const recalculate = shouldRecalculateField(
        "distance",
        next.editOrder,
        hasSpeed,
        hasDistance,
        hasTime
      );

      if (recalculate === "time" && hasSpeed && hasDistance) {
        const speedInKnots = convertSpeed(next.speed!, next.speedUnit, "knots");
        const distanceInNM = convertDistance(
          next.distance!,
          next.distanceUnit,
          "nm"
        );
        const t = computeTimeFromSD(speedInKnots, distanceInNM);
        if (t !== null) {
          const hms = secondsToHMS(t);
          next.timeHours = hms.hours;
          next.timeMinutes = hms.minutes;
          next.timeSeconds = hms.seconds;
        }
      } else if (recalculate === "speed" && hasDistance && hasTime) {
        const distanceInNM = convertDistance(
          next.distance!,
          next.distanceUnit,
          "nm"
        );
        const s = computeSpeedFromDT(distanceInNM, seconds);
        if (s !== null) {
          const speedInUnit = convertSpeed(s, "knots", next.speedUnit);
          next.speed = round(speedInUnit, 3);
        }
      }
      return next;
    }

    case "setTime": {
      const h = action.hours ?? state.timeHours;
      const m = action.minutes ?? state.timeMinutes;
      const s = action.seconds ?? state.timeSeconds;
      const norm = normalizeHMS(h ?? 0, m ?? 0, s ?? 0);

      let timeField: LastEdited = "timeHours";
      if (action.seconds !== undefined) timeField = "timeSeconds";
      else if (action.minutes !== undefined) timeField = "timeMinutes";

      next.lastEdited = timeField;
      next.editOrder = updateEditOrder(state.editOrder, "time");
      next.timeHours = norm.hours;
      next.timeMinutes = norm.minutes;
      next.timeSeconds = norm.seconds;

      const hasSpeed = isValidNumber(next.speed) && next.speed! > 0;
      const hasDistance = isValidNumber(next.distance);
      const hasTime = norm.totalSeconds > 0;

      const recalculate = shouldRecalculateField(
        "time",
        next.editOrder,
        hasSpeed,
        hasDistance,
        hasTime
      );

      if (recalculate === "speed" && hasDistance && hasTime) {
        const distanceInNM = convertDistance(
          next.distance!,
          next.distanceUnit,
          "nm"
        );
        const s2 = computeSpeedFromDT(distanceInNM, norm.totalSeconds);
        if (s2 !== null) {
          const speedInUnit = convertSpeed(s2, "knots", next.speedUnit);
          next.speed = round(speedInUnit, 3);
        }
      } else if (recalculate === "distance" && hasSpeed && hasTime) {
        const speedInKnots = convertSpeed(next.speed!, next.speedUnit, "knots");
        const d2 = computeDistanceFromST(speedInKnots, norm.totalSeconds);
        const distanceInUnit = convertDistance(d2, "nm", next.distanceUnit);
        next.distance = round(distanceInUnit, 3);
      }
      return next;
    }

    default:
      return state;
  }
}
