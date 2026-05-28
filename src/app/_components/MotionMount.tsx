"use client";

import { useEffect } from "react";
import { initParallax, initRevealObserver } from "@/lib/motion";

export function MotionMount() {
  useEffect(() => {
    const stopReveal = initRevealObserver();
    const stopParallax = initParallax();
    return () => {
      stopReveal();
      stopParallax();
    };
  }, []);
  return null;
}
