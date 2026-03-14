"use client";

import { useDesign } from "@/contexts/design-context";
import { Navigation } from "@/components/navigation";
import NavigationTerminal from "@/components/navigation-terminal";
import { DefaultFadeInFooter } from "@/components/FadeInFooter";
import FooterTerminal from "@/components/footer-terminal";
import { BackgroundCycling } from "@/components/background-cycling";
import BackgroundTerminal from "@/components/background-terminal";
import DesignToggle from "@/components/design-toggle";

interface DesignWrapperProps {
  children: React.ReactNode;
}

export default function DesignWrapper({ children }: DesignWrapperProps) {
  const { mode } = useDesign();

  return (
    <>
      {/* Background */}
      {mode === "classic" ? <BackgroundCycling /> : <BackgroundTerminal />}

      {/* Navigation */}
      <nav id="navigation" role="navigation" aria-label="Main navigation">
        {mode === "classic" ? <Navigation /> : <NavigationTerminal />}
      </nav>

      {/* Main Content */}
      <main id="main-content" role="main">
        <div style={{ minHeight: "calc(100vh - 200px)" }}>{children}</div>
      </main>

      {/* Footer */}
      {mode === "classic" ? <DefaultFadeInFooter /> : <FooterTerminal />}

      {/* Design Toggle Button */}
      <DesignToggle />
    </>
  );
}

