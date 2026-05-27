'use client';

import React, { useState, useEffect } from 'react';
import { useUIStore } from '@/stores/ui-store';

export function SplashScreen() {
  const { theme } = useUIStore();
  const [show, setShow] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Step 1: Wait 1500ms then start fading out
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 1600);

    // Step 2: After 2100ms (500ms transition), unmount from DOM
    const removeTimer = setTimeout(() => {
      setShow(false);
    }, 2100);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [theme]);

  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-background transition-opacity duration-500 ease-in-out select-none ${fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
    >
      {/* Dynamic glowing background element */}
      <div className="absolute w-[800px] h-[800px] rounded-full bg-primary/10 blur-[150px] animate-splash-glow pointer-events-none" />

      {/* Main banner image container */}
      <div className="relative z-10 flex flex-col items-center w-[90vw] max-w-[850px] min-w-[280px] animate-splash-fade-in-up">
        {/* Banner - Always using the Light version as requested */}
        <img
          src="/assets/02_BANNER_LIGHT.png"
          alt="Ragi Instant Banner"
          className="w-full h-auto object-contain"
        />

        {/* Subtle subtext / indicator at the bottom */}
        <div className="mt-8 flex items-center space-x-2 text-xs font-medium tracking-widest text-muted-foreground/60 uppercase">
          <span>Regulatory Intelligence</span>
          <span className="w-1 h-1 rounded-full bg-primary/50 animate-pulse" />
          <span>v0.1.0</span>
        </div>
      </div>
    </div>
  );
}
