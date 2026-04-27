import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  // IMPORTANT:
  // Initialize from matchMedia synchronously to avoid a "desktop-first" render
  // on mobile. That initial mismatch can cause large UI tree swaps (e.g. Sidebar
  // switching between static layout and Radix Sheet portals) which in turn can
  // trigger rare DOM errors like:
  //   "Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node."
  const [isMobile, setIsMobile] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    if (typeof window.matchMedia === "function") {
      return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`).matches;
    }
    // Fallback for very old browsers
    return window.innerWidth < MOBILE_BREAKPOINT;
  });

  React.useEffect(() => {
    // Guard for non-browser environments.
    if (typeof window === "undefined") return;

    // Prefer matchMedia when available; otherwise, listen to resize.
    if (typeof window.matchMedia !== "function") {
      const onResize = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
      onResize();
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    const onChange = () => {
      // Prefer MediaQueryList.matches over window.innerWidth for consistency.
      setIsMobile(mql.matches);
    };

    // Ensure state is in sync (in case of orientation changes before effect runs).
    onChange();

    // Safari < 14 uses addListener/removeListener.
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    }

    if (typeof (mql as any).addListener === "function") {
      (mql as any).addListener(onChange);
      return () => (mql as any).removeListener(onChange);
    }
  }, []);

  return isMobile;
}
