"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Terminal, Cpu, Wrench, FolderGit2 } from "lucide-react";

export default function NavigationTerminal() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [currentTime, setCurrentTime] = useState("");

  // Hide nav on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setVisible(false);
      } else {
        setVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // Update time every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString("en-US", { 
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });
      setCurrentTime(timeString);
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { href: "/", label: "home", icon: Terminal },
    { href: "/tools", label: "tools", icon: Wrench },
    { href: "/projects", label: "projects", icon: FolderGit2 },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        visible ? "translate-y-0" : "-translate-y-full"
      }`}
      style={{
        background: "rgba(0, 0, 0, 0.95)",
        borderBottom: "1px solid #00ff00",
        boxShadow: "0 0 10px rgba(0, 255, 0, 0.3)",
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

      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14 font-mono text-sm">
          {/* Left: Logo/Brand */}
          <Link
            href="/"
            className="flex items-center gap-2 text-[#00ff00] hover:text-[#00ff00]/80 transition-colors group"
          >
            <Terminal className="w-5 h-5" />
            <span className="font-bold tracking-wider">
              <span className="text-[#00ff00]">root@</span>
              <span className="text-[#00ff00]/70">effedoppiavu</span>
              <span className="text-[#00ff00]">:~$</span>
            </span>
            <span className="inline-block w-2 h-4 bg-[#00ff00] animate-pulse ml-1" />
          </Link>

          {/* Center: Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-1 transition-all border ${
                    isActive(item.href)
                      ? "text-black bg-[#00ff00] border-[#00ff00]"
                      : "text-[#00ff00] border-[#00ff00]/30 hover:border-[#00ff00] hover:bg-[#00ff00]/10"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>/{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Right: System info */}
          <div className="flex items-center gap-4 text-[#00ff00]/70 text-xs">
            <div className="hidden lg:flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              <span>ONLINE</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#00ff00]">[{currentTime}]</span>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className="md:hidden flex items-center gap-4 pb-3 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-1 whitespace-nowrap transition-all border text-xs ${
                  isActive(item.href)
                    ? "text-black bg-[#00ff00] border-[#00ff00]"
                    : "text-[#00ff00] border-[#00ff00]/30 hover:border-[#00ff00]"
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>/{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

