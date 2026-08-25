'use client';

import { useRef, useEffect, useState } from 'react';

/**
 * Animated counter that counts from 0 to `target` when scrolled into view.
 * SSR: renders the target value immediately (SEO-friendly).
 * Client: animates from 0 to target when the element scrolls into view.
 */
export function useAnimatedCounter(target: number, duration: number = 2000) {
  const [count, setCount] = useState(target);
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || hasAnimated.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || hasAnimated.current) return;
        hasAnimated.current = true;
        observer.disconnect();

        let current = 0;
        const step = target / (duration / 16);
        const timer = setInterval(() => {
          current += step;
          if (current >= target) {
            setCount(target);
            clearInterval(timer);
          } else {
            setCount(Math.floor(current));
          }
        }, 16);
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  return { count, ref };
}
