import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

const PROGRESS_DURATION_MS = 420;
const HIDE_DELAY_MS = 260;

export const RouteProgressBar = () => {
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<number | null>(null);
  const previousPathname = useRef(pathname);

  useEffect(() => {
    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;

    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    setVisible(true);
    setProgress(0);

    const start = performance.now();
    let rafId = 0;

    const animate = (now: number) => {
      const elapsed = now - start;
      const next = Math.min(1, elapsed / PROGRESS_DURATION_MS);
      setProgress(next);
      if (next < 1) {
        rafId = requestAnimationFrame(animate);
      } else {
        timerRef.current = window.setTimeout(() => {
          setVisible(false);
          setProgress(0);
        }, HIDE_DELAY_MS);
      }
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [pathname]);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-100 h-0.5 bg-anime-border">
      <div
        className="h-full bg-sabio shadow-[0_0_12px_rgba(135,169,135,0.6)] transition-none"
        style={{ width: `${progress * 100}%` }}
        aria-hidden="true"
      />
    </div>
  );
};
