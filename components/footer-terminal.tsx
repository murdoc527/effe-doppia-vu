"use client";

import Link from "next/link";
import { Terminal, Github, Mail } from "lucide-react";

export default function FooterTerminal() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="border-t font-mono text-sm"
      style={{
        background: "rgba(0, 0, 0, 0.95)",
        borderTop: "1px solid #00ff00",
      }}
    >
      {/* Scanline effect */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, #00ff00 2px, #00ff00 4px)",
        }}
      />

      <div className="container mx-auto px-4 py-8 relative">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left: Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[#00ff00]">
              <Terminal className="w-5 h-5" />
              <span className="font-bold">EFFE DOPPIA VU</span>
            </div>
            <p className="text-[#00ff00]/60 text-xs leading-relaxed">
              {'>'} Navigation tools and calculators
              <br />
              {'>'} Professional maritime utilities
              <br />
              {'>'} Open source • Free to use
            </p>
          </div>

          {/* Center: Quick Links */}
          <div className="space-y-3">
            <div className="text-[#00ff00] font-bold text-xs uppercase tracking-wider">
              [QUICK_ACCESS]
            </div>
            <div className="space-y-2 text-xs">
              <Link
                href="/tools"
                className="block text-[#00ff00]/80 hover:text-[#00ff00] hover:translate-x-1 transition-all"
              >
                {'>'} Tools & Calculators
              </Link>
              <Link
                href="/projects"
                className="block text-[#00ff00]/80 hover:text-[#00ff00] hover:translate-x-1 transition-all"
              >
                {'>'} Projects
              </Link>
              <Link
                href="/disclaimer"
                className="block text-[#00ff00]/80 hover:text-[#00ff00] hover:translate-x-1 transition-all"
              >
                {'>'} Disclaimer
              </Link>
            </div>
          </div>

          {/* Right: System Info */}
          <div className="space-y-3">
            <div className="text-[#00ff00] font-bold text-xs uppercase tracking-wider">
              [SYSTEM_INFO]
            </div>
            <div className="space-y-2 text-xs text-[#00ff00]/60">
              <div className="flex items-center gap-2">
                <span className="text-[#00ff00]">STATUS:</span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-2 h-2 bg-[#00ff00] rounded-full animate-pulse" />
                  OPERATIONAL
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#00ff00]">BUILD:</span>
                <span>v1.0.{currentYear}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#00ff00]">UPTIME:</span>
                <span>99.9%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-6 border-t border-[#00ff00]/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#00ff00]/60">
          <div>
            © {currentYear} Effe Doppia Vu • All systems operational
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#00ff00]/60 hover:text-[#00ff00] transition-colors"
            >
              <Github className="w-4 h-4" />
            </a>
            <a
              href="mailto:info@effedoppiavu.co.uk"
              className="text-[#00ff00]/60 hover:text-[#00ff00] transition-colors"
            >
              <Mail className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

