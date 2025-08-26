"use client";

import { useEffect, useState } from "react";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

/**
 * Countdown timer component for launch date display
 *
 * Features:
 * - Real-time countdown to September 1, 2025
 * - Responsive 2x2 (mobile) to 1x4 (desktop) grid layout
 * - Glass morphism styling matching site theme
 * - Automatic updates every second
 * - Graceful handling of past target dates
 *
 * @returns JSX element containing the countdown display
 */
export function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const targetDate = new Date("2025-09-01T00:00:00").getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor(
            (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
          ),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 md:gap-4 text-center max-w-lg sm:max-w-2xl mx-auto">
      <div className="bg-white/20 backdrop-blur-md rounded-xl p-3 sm:p-4 md:p-6 border border-white/30">
        <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white">
          {timeLeft.days}
        </div>
        <div className="text-xs sm:text-sm md:text-base text-white/80 uppercase tracking-wide font-medium">
          Days
        </div>
      </div>
      <div className="bg-white/20 backdrop-blur-md rounded-xl p-3 sm:p-4 md:p-6 border border-white/30">
        <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white">
          {timeLeft.hours}
        </div>
        <div className="text-xs sm:text-sm md:text-base text-white/80 uppercase tracking-wide font-medium">
          Hours
        </div>
      </div>
      <div className="bg-white/20 backdrop-blur-md rounded-xl p-3 sm:p-4 md:p-6 border border-white/30">
        <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white">
          {timeLeft.minutes}
        </div>
        <div className="text-xs sm:text-sm md:text-base text-white/80 uppercase tracking-wide font-medium">
          Minutes
        </div>
      </div>
      <div className="bg-white/20 backdrop-blur-md rounded-xl p-3 sm:p-4 md:p-6 border border-white/30">
        <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white">
          {timeLeft.seconds}
        </div>
        <div className="text-xs sm:text-sm md:text-base text-white/80 uppercase tracking-wide font-medium">
          Seconds
        </div>
      </div>
    </div>
  );
}
