import { useEffect, useRef } from 'react';
import Lenis from 'lenis';

/**
 * Hook to manage a single clean instance of Lenis smooth scroll
 * Respects prefers-reduced-motion and accounts for sticky header offsets.
 */
export function useLenis() {
  const lenisRef = useRef(null);

  useEffect(() => {
    // Respect user's motion preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      return;
    }

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.2,
      infinite: false,
    });

    lenisRef.current = lenis;

    let rafId;
    function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    // Intercept in-page anchor links with smooth scroll & sticky header offset (-84px)
    const handleAnchorClick = (e) => {
      const anchor = e.target.closest('a[href^="#"]');
      if (anchor) {
        const hash = anchor.getAttribute('href');
        if (hash && hash !== '#' && hash.startsWith('#')) {
          const targetEl = document.querySelector(hash);
          if (targetEl) {
            e.preventDefault();
            lenis.scrollTo(targetEl, { offset: -84, duration: 1.2 });
          }
        }
      }
    };

    document.addEventListener('click', handleAnchorClick);

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener('click', handleAnchorClick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return lenisRef;
}
