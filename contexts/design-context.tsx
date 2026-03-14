"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type DesignMode = "classic" | "terminal";

interface DesignContextType {
  mode: DesignMode;
  setMode: (mode: DesignMode) => void;
  toggleMode: () => void;
}

const DesignContext = createContext<DesignContextType | undefined>(undefined);

export function DesignProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<DesignMode>("classic");
  const [mounted, setMounted] = useState(false);

  // Load saved design preference on mount
  useEffect(() => {
    setMounted(true);
    const savedMode = localStorage.getItem("designMode") as DesignMode;
    if (savedMode === "terminal" || savedMode === "classic") {
      setModeState(savedMode);
    }
  }, []);

  const setMode = (newMode: DesignMode) => {
    setModeState(newMode);
    localStorage.setItem("designMode", newMode);
    
    // Update body class for global styling
    document.body.classList.remove("design-classic", "design-terminal");
    document.body.classList.add(`design-${newMode}`);
  };

  const toggleMode = () => {
    const newMode = mode === "classic" ? "terminal" : "classic";
    setMode(newMode);
  };

  // Apply body class on mount
  useEffect(() => {
    if (mounted) {
      document.body.classList.add(`design-${mode}`);
    }
  }, [mounted, mode]);

  return (
    <DesignContext.Provider value={{ mode, setMode, toggleMode }}>
      {children}
    </DesignContext.Provider>
  );
}

export function useDesign() {
  const context = useContext(DesignContext);
  if (context === undefined) {
    throw new Error("useDesign must be used within a DesignProvider");
  }
  return context;
}

