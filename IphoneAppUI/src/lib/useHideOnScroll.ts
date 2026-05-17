import { useEffect, useRef, useState } from "react";

interface UseHideOnScrollOptions {
  threshold?: number;
  delta?: number;
}

/** Hide on scroll down, show on scroll up (window). */
export function useHideOnScroll({
  threshold = 48,
  delta = 8,
}: UseHideOnScrollOptions = {}) {
  const [visible, setVisible] = useState(true);
  const lastY = useRef(0);
  const visibleRef = useRef(true);

  useEffect(() => {
    lastY.current = window.scrollY;

    const onScroll = () => {
      const y = window.scrollY;
      const dy = y - lastY.current;

      if (y <= threshold) {
        if (!visibleRef.current) {
          visibleRef.current = true;
          setVisible(true);
        }
      } else if (dy > delta && visibleRef.current) {
        visibleRef.current = false;
        setVisible(false);
      } else if (dy < -delta && !visibleRef.current) {
        visibleRef.current = true;
        setVisible(true);
      }

      lastY.current = y;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold, delta]);

  return visible;
}
