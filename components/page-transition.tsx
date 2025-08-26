"use client"

import type React from "react"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

interface PageTransitionProps {
  children: React.ReactNode
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname()
  const [displayPath, setDisplayPath] = useState(pathname)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [displayChildren, setDisplayChildren] = useState(children)
  const [newChildren, setNewChildren] = useState<React.ReactNode>(null)

  useEffect(() => {
    if (pathname !== displayPath) {
      setNewChildren(children)
      setIsTransitioning(true)

      const timer = setTimeout(() => {
        setDisplayPath(pathname)
        setDisplayChildren(children)
        setNewChildren(null)
        setIsTransitioning(false)
      }, 300)

      return () => clearTimeout(timer)
    } else {
      setDisplayChildren(children)
    }
  }, [pathname, displayPath, children])

  return (
    <div className="relative">
      <div className={`transition-opacity duration-300 ease-in-out ${isTransitioning ? "opacity-0" : "opacity-100"}`}>
        {displayChildren}
      </div>

      {isTransitioning && newChildren && (
        <div className="absolute inset-0 transition-opacity duration-300 ease-in-out opacity-100">{newChildren}</div>
      )}
    </div>
  )
}
