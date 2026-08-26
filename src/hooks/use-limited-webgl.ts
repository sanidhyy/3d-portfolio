import { useEffect, useState } from "react";

const MOBILE_UA = /Android|iPhone|iPad|iPod/i;

/**
 * Mobile browsers typically allow only ~8 WebGL contexts (desktop Chrome ~16).
 * Default to true so the first paint never creates extra canvases.
 */
export function useLimitedWebGL() {
  const [limited, setLimited] = useState(true);

  useEffect(() => {
    const coarseQuery = window.matchMedia("(pointer: coarse)");
    const narrowQuery = window.matchMedia("(max-width: 767px)");

    const update = () => {
      setLimited(
        coarseQuery.matches ||
          narrowQuery.matches ||
          MOBILE_UA.test(navigator.userAgent),
      );
    };

    update();
    coarseQuery.addEventListener("change", update);
    narrowQuery.addEventListener("change", update);

    return () => {
      coarseQuery.removeEventListener("change", update);
      narrowQuery.removeEventListener("change", update);
    };
  }, []);

  return limited;
}

