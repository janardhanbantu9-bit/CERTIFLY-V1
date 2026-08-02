"use client";
import { lazy, Suspense, useEffect, useState } from "react";

const HeroScene = lazy(() => import("./HeroScene"));

export default function HeroSceneMount() {
  const [mounted, setMounted] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
  }, []);

  if (!mounted || reduced) {
    return (
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,oklch(0.30_0.15_305/0.5),transparent_70%)]" />
    );
  }

  return (
    <Suspense fallback={null}>
      <HeroScene />
    </Suspense>
  );
}
