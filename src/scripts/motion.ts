import Lenis from 'lenis';
import { animate, inView, stagger } from 'motion';

let lenisInstance: Lenis | null = null;

function isReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function initLenis() {
  if (isReducedMotion()) {
    if (lenisInstance) {
      lenisInstance.destroy();
      lenisInstance = null;
    }
    return null;
  }

  if (!lenisInstance) {
    lenisInstance = new Lenis({
      autoRaf: true,
    });

    // Deep link anchor scroll on initial page load
    if (window.location.hash) {
      const hashTarget = document.querySelector(window.location.hash);
      if (hashTarget instanceof HTMLElement) {
        setTimeout(() => {
          lenisInstance?.scrollTo(hashTarget, { offset: 0, immediate: true });
        }, 60);
      }
    }

    // Anchor Link & Skip Link Interceptor
    document.addEventListener('click', (event) => {
      const anchor = (event.target as HTMLElement).closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href) return;

      // Handle pure fragment (#id) or same-page anchor (/page#id)
      let targetId = '';
      if (href.startsWith('#') && href.length > 1) {
        targetId = href.slice(1);
      } else if (href.includes('#')) {
        const [path, fragment] = href.split('#');
        const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
        const linkPath = path.replace(/\/$/, '') || '/';
        if (path === '' || linkPath === currentPath) {
          targetId = fragment;
        }
      }

      if (targetId) {
        const dest = document.getElementById(targetId);
        if (dest) {
          event.preventDefault();
          lenisInstance?.scrollTo(dest, { offset: 0 });

          // Maintain accessible keyboard focus without page jump
          dest.setAttribute('tabindex', '-1');
          dest.focus({ preventScroll: true });

          // Update URL hash without standard jumping
          if (history.pushState) {
            history.pushState(null, '', `#${targetId}`);
          } else {
            window.location.hash = targetId;
          }
        }
      }
    });
  }

  return lenisInstance;
}

function initReveals() {
  if (isReducedMotion()) {
    // Show all content immediately under reduced motion
    document.querySelectorAll<HTMLElement>('[data-reveal], [data-reveal-item]').forEach((el) => {
      el.classList.add('is-revealed');
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
    return;
  }

  // 1. Single reveals
  const singleReveals = document.querySelectorAll<HTMLElement>('[data-reveal]:not([data-reveal-group] [data-reveal])');
  singleReveals.forEach((el) => {
    inView(el, () => {
      animate(el, { opacity: [0, 1], transform: ['translateY(100px)', 'none'] }, {
        duration: 0.4,
        ease: [0.16, 1, 0.3, 1],
      });
      el.classList.add('is-revealed');
    }, { margin: '0px 0px -15% 0px' });
  });

  // 2. Staggered reveal groups (e.g. card grids, feature lists)
  const revealGroups = document.querySelectorAll<HTMLElement>('[data-reveal-group]');
  revealGroups.forEach((group) => {
    const items = group.querySelectorAll<HTMLElement>('[data-reveal-item]');
    if (items.length > 0) {
      inView(group, () => {
        animate(items, { opacity: [0, 1], transform: ['translateY(100px)', 'none'] }, {
          delay: stagger(0.08),
          duration: 0.4,
          ease: [0.16, 1, 0.3, 1],
        });
        items.forEach((item) => item.classList.add('is-revealed'));
      }, { margin: '0px 0px -15% 0px' });
    }
  });

  // 3. Hero Secondary Entrance on load (Headline <h1> is strictly excluded for LCP protection)
  const heroEyebrow = document.querySelector<HTMLElement>('[data-hero-eyebrow]');
  const heroLede = document.querySelector<HTMLElement>('[data-hero-lede]');
  const heroActions = document.querySelector<HTMLElement>('[data-hero-actions]');
  const heroDoodles = document.querySelectorAll<HTMLElement>('[data-hero-doodle]');

  if (heroEyebrow) {
    animate(heroEyebrow, { opacity: [0, 1], transform: ['translateY(8px)', 'none'] }, {
      duration: 0.3,
      delay: 0.06,
      ease: [0.16, 1, 0.3, 1],
    });
  }

  if (heroLede) {
    animate(heroLede, { opacity: [0, 1], transform: ['translateY(8px)', 'none'] }, {
      duration: 0.3,
      delay: 0.12,
      ease: [0.16, 1, 0.3, 1],
    });
  }

  if (heroActions) {
    const actionChildren = Array.from(heroActions.children) as HTMLElement[];
    if (actionChildren.length > 0) {
      animate(actionChildren, { opacity: [0, 1], transform: ['translateY(12px)', 'none'] }, {
        duration: 0.35,
        delay: stagger(0.1, { startDelay: 0.18 }),
        ease: [0.16, 1, 0.3, 1],
      });
    }
  }

  if (heroDoodles.length > 0) {
    animate(Array.from(heroDoodles), { opacity: [0, 1], transform: ['scale(0.9)', 'scale(1)'] }, {
      duration: 0.45,
      delay: stagger(0.08, { startDelay: 0.24 }),
      ease: [0.16, 1, 0.3, 1],
    });
  }
}

export function initMotion() {
  if (typeof window === 'undefined') return;

  const html = document.documentElement;

  if (isReducedMotion()) {
    html.classList.add('motion-reduced');
    html.classList.remove('js-motion');
    initReveals();
    return;
  }

  html.classList.remove('motion-reduced');
  html.classList.add('js-motion');

  initLenis();
  initReveals();
}

// Initial bootstrap
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMotion);
  } else {
    initMotion();
  }

  document.addEventListener('astro:page-load', initMotion);
}
