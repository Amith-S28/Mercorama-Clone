"use client";

import type { ReactNode } from "react";
import { SiteHeader } from "@/components/landing";

export interface AgencyShellProps {
  children: ReactNode;
}

export function AgencyShell({ children }: AgencyShellProps) {
  return (
    <div className="min-h-screen w-full relative overflow-x-hidden">
      {/* Navigation Bar */}
      <SiteHeader />

      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        src="/ascii-magic-1.mp4"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />
      {/* Black translucent overlay */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0, 0, 0, 0.75)",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />

      <main className="relative z-10 pt-14 w-full min-h-screen">
        {children}
      </main>
    </div>
  );
}
