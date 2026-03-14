"use client";

import { useDesign } from "@/contexts/design-context";
import { Terminal, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DesignToggle() {
  const { mode, toggleMode } = useDesign();

  return (
    <Button
      onClick={toggleMode}
      variant="outline"
      size="sm"
      className={`fixed bottom-6 right-6 z-50 shadow-lg transition-all ${
        mode === "terminal"
          ? "bg-black border-[#00ff00] text-[#00ff00] hover:bg-[#00ff00] hover:text-black"
          : "bg-white border-gray-300 text-gray-700 hover:bg-gray-100"
      }`}
      title={`Switch to ${mode === "classic" ? "Terminal" : "Classic"} mode`}
    >
      {mode === "classic" ? (
        <>
          <Terminal className="w-4 h-4 mr-2" />
          <span className="font-mono text-xs">TERMINAL</span>
        </>
      ) : (
        <>
          <Waves className="w-4 h-4 mr-2" />
          <span className="font-mono text-xs">CLASSIC</span>
        </>
      )}
    </Button>
  );
}

